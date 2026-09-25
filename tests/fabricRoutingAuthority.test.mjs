// Fabric routing authority: Fabric-owned surfaces resolve to the Agent Fabric
// (canonical base -> same-origin /fabric-api proxy -> :8090) and SHS-owned
// surfaces stay on the SHS API ("/api" -> :8091). Mocked-network tests capture
// the real request URLs; JSX pages are asserted from source.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function captureFetch(respond = () => ({})) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET', credentials: options.credentials, headers: options.headers || {} });
    const body = JSON.stringify(respond(String(url)));
    return { ok: true, status: 200, statusText: 'OK', text: async () => body, json: async () => JSON.parse(body) };
  };
  return calls;
}

globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem: () => {} };

test('Growth Market requests go to the Fabric growth routes, never the SHS /api proxy', async () => {
  const calls = captureFetch((url) => (url.endsWith('/claims') ? { items: [] } : { ok: true }));
  const growth = await import('../src/shared/api/growthMarket.js');
  await growth.getGrowthDashboard();
  await growth.listGrowthClaims();
  await growth.supportClaim('c-1', { actorId: 'a', confidence: 0.5, stake: 1 });
  assert.deepEqual(calls.map((call) => call.url), [
    '/fabric-api/api/growth/dashboard',
    '/fabric-api/api/growth/claims',
    '/fabric-api/api/growth/claims/c-1/support',
  ]);
  assert.ok(calls.every((call) => call.credentials === 'include'), 'cookie semantics preserved');
});

test('Registry admin requests go to the Fabric /admin/registry routes', async () => {
  const calls = captureFetch(() => ({ items: [] }));
  const registry = await import('../src/apps/manifest/registry_admin_api.js');
  await registry.listRegistry();
  await registry.getRegistryEntity('shs/core');
  await registry.upsertRegistryEntity({ id: 'x' });
  assert.deepEqual(calls.map((call) => `${call.method} ${call.url}`), [
    'GET /fabric-api/admin/registry',
    'GET /fabric-api/admin/registry/shs%2Fcore',
    'POST /fabric-api/admin/registry/upsert',
  ]);
});

test('Capital operator requests still go to the Fabric operator routes', async () => {
  const calls = captureFetch(() => ({ events: [] }));
  const operator = await import('../src/lib/operatorApi.js').catch(() => null);
  if (operator?.fetchOperatorEvents) {
    await operator.fetchOperatorEvents(5);
    assert.equal(calls[0].url, '/fabric-api/api/v1/operator/events?limit=5');
  }
  const capital = read('src/lib/capital/operatorApi.js');
  assert.match(capital, /fabricUrl\(path\)/);
  assert.match(capital, /new URL\(fabricUrl\(path\), origin\)\.href/, 'absolute URL so apiClient does not prefix the SHS /api base');
  assert.match(capital, /fabricGet\("\/api\/v1\/operator\/summary"\)/);
});

const FABRIC_PAGES = [
  ['Truth Spine', 'src/pages/admin/truth-spine/TruthSpinePage.jsx', 'fabricUrl("/truth")', '/api/truth'],
  ['Game Theory', 'src/pages/admin/game-theory/GameTheoryPage.jsx', 'fabricUrl("/game-theory")', '/api/game-theory'],
  ['AI Guardrails', 'src/pages/admin/ai-guardrails/AIGuardrailsPage.jsx', 'fabricUrl("/ai-guardrails")', '/api/ai-guardrails'],
  ['Oracle cases', 'src/pages/admin/oracle/OraclePage.jsx', 'fabricUrl("/oracle")', '/api/oracle'],
];

for (const [name, file, root, stale] of FABRIC_PAGES) {
  test(`${name} admin page resolves through the canonical Fabric config`, () => {
    const source = read(file);
    assert.match(source, /from "@\/system\/fabric\/fabricConfig"/);
    assert.ok(source.includes(`const API_ROOT = ${root};`), `${file} API_ROOT is ${root}`);
    assert.ok(!source.includes(`"${stale}"`), `${file} no longer uses relative ${stale}`);
  });
}

test('Agent Fabric admin page targets Fabric /admin routes', () => {
  const source = read('src/pages/admin/agent-fabric/AgentFabricPage.jsx');
  assert.match(source, /const API_ROOT = FABRIC_API_BASE;/);
  assert.ok(!source.includes('const API_ROOT = "/api"'));
  for (const route of ['/admin/agents', '/admin/agents/summary/health', '/admin/agents/verify', '/admin/layers/gate/status']) {
    assert.ok(source.includes(`"${route}`) || source.includes(`\`${route}`), `calls ${route}`);
  }
});

test('Oracle is split by endpoint: admin cases -> Fabric, oracle truth -> SHS API', () => {
  const page = read('src/pages/admin/oracle/OraclePage.jsx');
  for (const path of ['/health', '/cases', '/rulings']) assert.ok(page.includes(`"${path}`) || page.includes(`\`${path}`), `Oracle page calls ${path}`);
  assert.doesNotMatch(page, /\/truth\/|\/compare|\/priority/, 'Oracle page does not call SHS-owned oracle endpoints');
  const truthSpineApi = read('src/shared/truth-spine/truthSpineApi.js');
  assert.match(truthSpineApi, /requestJson\(`\/api\/oracle\/truth\//, 'oracle truth stays on the SHS API proxy');
  const shsOracle = read('apps/shs-api/src/oracle/routes/oracle.routes.ts');
  assert.match(shsOracle, /"\/oracle\/truth\/:entityId"/);
  const fabricOracle = read('services/shf-agent-fabric/routers/oracle_routes.py');
  assert.match(fabricOracle, /prefix="\/oracle"/);
  assert.match(fabricOracle, /@router\.get\("\/cases"\)/);
  assert.doesNotMatch(fabricOracle, /"\/truth\//);
});

test('Fabric route prefixes match what the frontend appends', () => {
  const expect = [
    ['services/shf-agent-fabric/routers/truth_routes.py', 'prefix="/truth"'],
    ['services/shf-agent-fabric/routers/game_theory_routes.py', 'prefix="/game-theory"'],
    ['services/shf-agent-fabric/routers/ai_guardrails_routes.py', 'prefix="/ai-guardrails"'],
    ['services/shf-agent-fabric/app/api/routes/growth.py', 'prefix="/api/growth"'],
    ['services/shf-agent-fabric/routers/admin_registry_routes.py', 'prefix="/admin/registry"'],
    ['services/shf-agent-fabric/routers/admin_agents_routes.py', 'prefix="/admin/agents"'],
  ];
  for (const [file, prefix] of expect) assert.ok(read(file).includes(prefix), `${file} declares ${prefix}`);
});

test('Career and Opportunities stay on the SHS API client', () => {
  for (const file of ['src/lib/career/api.js', 'src/lib/opportunities/api.js']) {
    const source = read(file);
    assert.match(source, /from "@\/lib\/apiClient(\.js)?"/, `${file} uses the shared SHS client`);
    assert.doesNotMatch(source, /fabric/i, `${file} has no Fabric routing`);
  }
});

test('no live frontend source routes the Fabric-only families through the SHS /api proxy', () => {
  const offenders = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true }); } catch { return; } // unreadable/broken entries
    for (const entry of entries) {
      const path = `${dir}/${entry.name}`;
      if (/_archive|_patchbak|\/dev$|hardening/.test(path)) continue;
      if (entry.isDirectory()) walk(path);
      else if (/\.(jsx?|tsx?)$/.test(entry.name) && !/\.bak/.test(entry.name)) {
        const source = read(path);
        if (/["'`]\/api\/(truth|game-theory|ai-guardrails|admin)\b/.test(source)) offenders.push(path);
      }
    }
  };
  walk('src');
  assert.deepEqual(offenders, []);
});
