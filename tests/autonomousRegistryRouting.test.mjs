import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { normalizeRegistryHome, isRegistry } from '../scripts/dev/registry-routing.mjs';

async function serve(t, handler) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('gateway normalizes only exact Registry Home GET/HEAD and preserves query encoding', async t => {
  const origin = await serve(t, (req, res) => normalizeRegistryHome(req, res, () => res.end('unchanged')));
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(`${origin}/autonomous-registry?q=one%20two`, { method, redirect: 'manual' });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), '/autonomous-registry/?q=one%20two');
  }
  for (const path of ['/', '/universe', '/autonomous-registry/', '/autonomous-registry/verify', '/autonomous-registry-other']) {
    assert.equal(await (await fetch(`${origin}${path}`)).text(), 'unchanged');
  }
  const mutation = await fetch(`${origin}/autonomous-registry`, { method: 'POST', redirect: 'manual' });
  assert.equal(mutation.status, 405);
  assert.equal(mutation.headers.get('allow'), 'GET, HEAD');
});

test('Registry readiness requires bootstrap, typed identity, implemented pages and actual App route wiring', async t => {
  const good = {
    service: 'autonomous-registry-frontend', version: 1, canonicalHome: '/autonomous-registry/',
    implementedPages: ['/autonomous-registry/', '/autonomous-registry/agents/AR-2026-0001847', '/autonomous-registry/verify/AR-2026-0001847'],
    verification: 'static-prototype'
  };
  let status = good;
  let source = '/src/routes/registryRoutes.ts registryExistingPages.agent registryExistingPages.verify';
  let html = 'Autonomous Registry /autonomous-registry/src/main.tsx';
  let contentType = 'application/json';
  const origin = await serve(t, (req, res) => {
    if (req.url.endsWith('/__registry/status')) {
      res.setHeader('Content-Type', contentType);
      return res.end(JSON.stringify(status));
    }
    res.end(req.url.endsWith('/src/App.tsx') ? source : html);
  });
  assert.equal(await isRegistry(origin), true);
  status = { ...good, implementedPages: ['/autonomous-registry/', '/autonomous-registry/register', '/autonomous-registry/standards', '/autonomous-registry/agent/AR-2026-0001847', '/autonomous-registry/verify'] };
  source = '/src/routes/registryRoutes.ts resolveRegistryCompatibility AGENT_RECORD_ROUTE REGISTRY_VERIFY';
  assert.equal(await isRegistry(origin), true, 'centralized Phase 6 routes and expanded canonical pages remain independent Registry readiness');
  const canonicalSource = source;
  source = '/src/routes/registryRoutes.ts';
  assert.equal(await isRegistry(origin), false, 'import alone without Agent Record and Verify wiring is insufficient');
  source = canonicalSource;
  status = { ...status, implementedPages: [...status.implementedPages, '/admin.html'] };
  assert.equal(await isRegistry(origin), false, 'foreign application pages cannot satisfy Registry readiness');
  status = good;
  source = '/src/routes/registryRoutes.ts registryExistingPages.agent registryExistingPages.verify';
  for (const invalid of [{ ...good, service: 'other-project' }, { ...good, version: 2 }, { ...good, implementedPages: [] }, { ...good, canonicalHome: '/' }, { ...good, verification: 'VALID' }]) {
    status = invalid;
    assert.equal(await isRegistry(origin), false);
  }
  status = good;
  contentType = 'text/html';
  assert.equal(await isRegistry(origin), false);
  contentType = 'application/json';
  source = 'a page containing /autonomous-registry/verify/AR-2026-0001847';
  assert.equal(await isRegistry(origin), false);
  source = '/src/routes/registryRoutes.ts registryExistingPages.agent registryExistingPages.verify';
  html = 'unrelated app';
  assert.equal(await isRegistry(origin), false);
});
