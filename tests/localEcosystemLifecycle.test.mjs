import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { root, portOccupied } from '../scripts/dev/ecosystem.mjs';
import { projectId } from '../scripts/dev/ecosystem-vite.mjs';

async function server(t, handler) {
  const listener = createServer(handler);
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  t.after(() => new Promise(resolve => listener.close(resolve)));
  return { listener, port: listener.address().port, origin: `http://127.0.0.1:${listener.address().port}` };
}
function json(res, body, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
function registryResponse(req, res) {
  if (req.url.endsWith('/__registry/status')) return json(res, {
    service: 'autonomous-registry-frontend', version: 1, canonicalHome: '/autonomous-registry/',
    implementedPages: ['/autonomous-registry/', '/autonomous-registry/agents/AR-2026-0001847', '/autonomous-registry/verify/AR-2026-0001847'],
    verification: 'static-prototype'
  });
  res.end(req.url.includes('App.tsx')
    ? '/src/routes/registryRoutes.ts registryExistingPages.agent registryExistingPages.verify'
    : 'Autonomous Registry /autonomous-registry/src/main.tsx');
}
async function until(predicate, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await predicate()) return; await delay(50); }
  throw new Error('Timed out waiting for lifecycle condition');
}

async function fixture(t, { ownApi = false, missingRegistry = false, unknownApi = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'sh-ecosystem-lifecycle-'));
  const api = await server(t, (req, res) => {
    if (unknownApi) return json(res, { ok: true, service: 'unrelated-project' });
    if (req.url === '/auth/me') return json(res, { error: 'Authentication required' }, 401);
    json(res, { ok: true, service: 'shs-api', status: 'READY' });
  });
  if (ownApi) await new Promise(resolve => api.listener.close(resolve));
  const registry = await server(t, (req, res) => {
    if (missingRegistry) { res.writeHead(404); return res.end(); }
    registryResponse(req, res);
  });
  if (missingRegistry) await new Promise(resolve => registry.listener.close(resolve));
  const fabric = await server(t, (_, res) => json(res, {}, 404));
  const front = await server(t, (req, res) => {
    if (req.url === '/__ecosystem/status') return json(res, { service: 'silicon-heartland-local-frontend', projectId: projectId(root), version: 1, apiTarget: api.origin, registryTarget: registry.origin });
    if (req.url.startsWith('/autonomous-registry')) return registryResponse(req, res);
    json(res, { ok: true, service: 'shs-api' });
  });
  const pidFile = join(dir, 'owned-group.json');
  const worker = join(dir, 'worker.mjs');
  await writeFile(worker, `import {createServer} from 'node:http';
process.on('SIGTERM',()=>{});
createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.statusCode=req.url==='/auth/me'?401:200;res.end(JSON.stringify({ok:true,service:'shs-api',status:'READY'}));}).listen(Number(process.env.PORT),'127.0.0.1');
setInterval(()=>{},1000);`);
  await writeFile(join(dir, 'npm'), `#!/usr/bin/env node
import {spawn} from 'node:child_process';import {writeFileSync} from 'node:fs';
const child=spawn(process.execPath,[${JSON.stringify(worker)}],{stdio:'ignore'});
writeFileSync(${JSON.stringify(pidFile)},JSON.stringify({leader:process.pid,worker:child.pid}));
process.on('SIGTERM',()=>process.exit(0));
`, { mode: 0o755 });
  const child = spawn(process.execPath, ['scripts/dev/ecosystem.mjs'], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, PORT: String(api.port), SILICON_HEARTLAND_PORT: String(front.port), SHS_VITE_API_PROXY_TARGET: api.origin, SHS_VITE_FABRIC_PROXY_TARGET: fabric.origin, SHS_VITE_REGISTRY_PROXY_TARGET: registry.origin, SILICON_HEARTLAND_REGISTRY_ROOT: join(dir, 'missing-checkout') },
  });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const exited = once(child, 'exit');
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    try { const pids = JSON.parse(await readFile(pidFile)); process.kill(-pids.leader, 'SIGKILL'); } catch {}
    await rm(dir, { recursive: true, force: true });
  });
  return { api, registry, front, child, exited, pidFile, output: () => output };
}

test('SIGINT preserves reused services without creating child servers', async t => {
  const f = await fixture(t);
  await until(() => f.output().includes('Press Ctrl+C'));
  assert.match(f.output(), /verified existing server \(reused\)/);
  assert.doesNotMatch(f.output(), /SHS API: started|Autonomous Registry: started/);
  f.child.kill('SIGINT');
  const [code] = await f.exited;
  assert.equal(code, 0);
  assert.equal(await portOccupied(f.api.port), true);
  assert.equal(await portOccupied(f.registry.port), true);
  assert.equal(await portOccupied(f.front.port), true);
});

test('SIGINT removes owned descendants even when npm exits before a SIGTERM-resistant worker', async t => {
  const f = await fixture(t, { ownApi: true });
  await until(() => f.output().includes('Press Ctrl+C'));
  assert.match(f.output(), /SHS API: started/);
  const pids = JSON.parse(await readFile(f.pidFile));
  f.child.kill('SIGINT');
  const [code] = await f.exited;
  assert.equal(code, 0);
  await until(async () => !await portOccupied(f.api.port), 1500);
  assert.throws(() => process.kill(pids.worker, 0), /ESRCH/);
  assert.equal(await portOccupied(f.front.port), true);
  assert.equal(await portOccupied(f.registry.port), true);
});

test('unknown API occupant and missing Registry dependencies are reported without taking ownership', async t => {
  const f = await fixture(t, { unknownApi: true, missingRegistry: true });
  await until(() => f.output().includes('Press Ctrl+C'));
  assert.match(f.output(), /port \d+ conflict/);
  assert.match(f.output(), /checkout\/dependencies unavailable/);
  assert.match(f.output(), /Core status: PARTIAL/);
  f.child.kill('SIGINT');
  await f.exited;
  assert.equal(await portOccupied(f.api.port), true);
  assert.equal(await portOccupied(f.registry.port), false);
});
