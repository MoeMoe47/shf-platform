// Routing authority cleanup V3: live Fabric clients resolve through the
// canonical Fabric configuration (src/system/fabric/fabricConfig.js) instead of
// hard-coding the Fabric's localhost origin, and the SHF Command Center's
// ownerless event write stays disabled until a backend contract exists.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

import { FABRIC_API_BASE, fabricUrl } from '../src/system/fabric/fabricConfig.js';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
// Code only: strip block and line comments so documentation does not count.
const code = (path) => read(path).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`])\/\/.*$/gm, '$1');

const FABRIC_LOCALHOST = /(127\.0\.0\.1|localhost):8090/;
const MIGRATED = [
  ['src/pages/shf-command/SHFImpactCommandCenter.jsx', [/const SELF_AUDIT_BASE = FABRIC_API_BASE;/, /fetch\(fabricUrl\("\/simulate-outcome"\)/, /\$\{SELF_AUDIT_BASE\}\/self-audit\/latest\/brief/, /\$\{SELF_AUDIT_BASE\}\/self-audit\/run/]],
  ['src/pages/shf-command/sections/AgentSyncStatus.jsx', [/const AGENT_BASE = FABRIC_API_BASE;/, /\$\{AGENT_BASE\}\/admin\/agents\/ai_analyst_agent\/page-context-dry-run/]],
  ['src/pages/admin/reporting/reporting-actions.ts', [/const REPORT_BACKEND_BASE = FABRIC_API_BASE;/, /\$\{REPORT_BACKEND_BASE\}\/runs\/report\//]],
  ['src/pages/iep-command-v2/CountyInteractionLayer.jsx', [/fetch\(fabricUrl\("\/run"\)/]],
  ['src/pages/metaverse/BFETestPage.jsx', [/fetch\(fabricUrl\("\/bfe\/summary"\)\)/]],
  ['src/pages/metaverse/components/BFEStatusCard.jsx', [/fetch\(fabricUrl\("\/bfe\/summary"\)\)/]],
];

test('canonical Fabric base resolves the migrated paths through the same-origin proxy', () => {
  assert.equal(FABRIC_API_BASE, '/fabric-api');
  assert.equal(fabricUrl('/bfe/summary'), '/fabric-api/bfe/summary');
  assert.equal(fabricUrl('/run'), '/fabric-api/run');
  assert.equal(`${FABRIC_API_BASE}/self-audit/latest`, '/fabric-api/self-audit/latest');
});

for (const [file, expectations] of MIGRATED) {
  test(`${file} uses the canonical Fabric configuration`, () => {
    const source = code(file);
    assert.match(source, /from "@\/system\/fabric\/fabricConfig"/, 'imports fabricConfig');
    assert.doesNotMatch(source, FABRIC_LOCALHOST, 'no hard-coded Fabric localhost origin');
    assert.doesNotMatch(source, /:8000\b/, 'no port 8000');
    assert.doesNotMatch(source, /VITE_API_BASE\b|VITE_SHF_AGENT_FABRIC_BASE/, 'no ambiguous or retired Fabric variable');
    for (const pattern of expectations) assert.match(source, pattern);
    assert.doesNotMatch(source, /["'`]\/api\/(self-audit|simulate-outcome|run|bfe|runs|admin)\b/, 'no Fabric route on the SHS /api proxy');
  });
}

test('VITE_SHF_AGENT_FABRIC_BASE is retired: no live code reads it', () => {
  const live = execSync('git ls-files src', { cwd: root, encoding: 'utf8' }).split('\n')
    .filter((file) => /\.(jsx?|tsx?)$/.test(file) && !/_archive|_patchbak|hardening\//.test(file));
  const readers = live.filter((file) => /env\??\.VITE_SHF_AGENT_FABRIC_BASE/.test(code(file)));
  assert.deepEqual(readers, ['src/pages/shf-command/agents/aiAnalystContextAdapter.js'], 'only the dead adapter still references it');
});

test('SHF Command Center makes no request to the ownerless /events write', () => {
  const source = code('src/pages/shf-command/SHFImpactCommandCenter.jsx');
  assert.doesNotMatch(source, /fetch\([^)]*\/events["'`]/, 'no fetch to a bare /events');
  assert.doesNotMatch(source, /fabricUrl\("\/events/, 'not blindly re-pointed at /events/ingest or /events/normalize');
  assert.match(read('src/pages/shf-command/SHFImpactCommandCenter.jsx'), /OWNERLESS EVENT WRITE — BACKEND CONTRACT REQUIRED/);
  const events = read('services/shf-agent-fabric/routers/events_routes.py');
  assert.match(events, /APIRouter\(prefix="\/events"/);
  assert.deepEqual([...events.matchAll(/@router\.(get|post)\("([^"]*)"\)/g)].map((m) => m[2]).sort(), ['/ingest', '/normalize'], 'the Fabric has no bare POST /events');
});

test('every migrated endpoint exists in the Agent Fabric', () => {
  const selfAudit = read('services/shf-agent-fabric/app/api/routes/self_audit.py');
  assert.match(selfAudit, /prefix="\/self-audit"/);
  for (const path of ['/latest', '/latest/brief', '/run']) assert.ok(selfAudit.includes(`"${path}"`), `self-audit ${path}`);
  const runRoutes = read('services/shf-agent-fabric/routers/run_routes.py');
  for (const path of ['/run', '/simulate-outcome']) assert.ok(runRoutes.includes(`"${path}"`), `run routes ${path}`);
  const bfe = read('services/shf-agent-fabric/routers/bfe_routes.py');
  assert.match(bfe, /prefix="\/bfe"/);
  assert.ok(bfe.includes('"/summary"'));
  assert.match(read('services/shf-agent-fabric/routers/run_report_routes.py'), /\/runs\/report\//);
  assert.match(read('services/shf-agent-fabric/routers/admin_agents_routes.py'), /page-context-dry-run/);
});

test('no live compiled frontend file hard-codes the Fabric localhost origin', () => {
  const DEAD = new Set([
    'src/pages/admin/reporting/reporting-backend-adapter.ts',
    'src/pages/iep-command-v2/FloatingFranklinNode.jsx',
    'src/pages/shf-command/agents/aiAnalystContextAdapter.js',
  ]);
  const live = execSync('git ls-files src', { cwd: root, encoding: 'utf8' }).split('\n')
    .filter((file) => /\.(jsx?|tsx?)$/.test(file) && !/_archive|_patchbak|hardening\//.test(file) && !DEAD.has(file));
  const offenders = live.filter((file) => {
    const source = code(file).replace(/export const FABRIC_LOCAL_TARGET = "http:\/\/127\.0\.0\.1:8090";/, '');
    return FABRIC_LOCALHOST.test(source);
  });
  assert.deepEqual(offenders, []);
});

test('dead Fabric-localhost files remain unimported (migrate before reviving)', () => {
  const live = execSync('git ls-files src', { cwd: root, encoding: 'utf8' }).split('\n').filter((file) => /\.(jsx?|tsx?)$/.test(file));
  for (const name of ['reporting-backend-adapter', 'FloatingFranklinNode', 'aiAnalystContextAdapter']) {
    const importers = live.filter((file) => !file.includes(name) && new RegExp(`['"][^'"]*/${name}(\\.[jt]sx?)?['"]`).test(read(file)));
    assert.deepEqual(importers, [], `${name} has no importers`);
  }
});
