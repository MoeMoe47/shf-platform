import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { ECOSYSTEM_STATUS_PATH, projectId } from './ecosystem-vite.mjs';
import { isRegistry } from './registry-routing.mjs';
export { isRegistry } from './registry-routing.mjs';

export const root = fileURLToPath(new URL('../../', import.meta.url));

export function portNumber(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 65535) throw new Error(`Invalid ${label} port`);
  return number;
}

export function localTarget(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Local startup accepts only explicit loopback HTTP backend origins');
  }
  return url.origin;
}

export async function portOccupied(port, host = '127.0.0.1') {
  return new Promise((accept, reject) => {
    const server = createServer();
    server.once('error', error => error.code === 'EADDRINUSE' ? accept(true) : reject(error));
    server.listen(port, host, () => server.close(() => accept(false)));
  });
}

export async function readStatus(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500), redirect: 'error' });
    const body = await response.json();
    return { status: response.status, body };
  } catch {
    return null;
  }
}

export async function isFrontend(origin, expectedRoot = root) {
  const result = await readStatus(`${origin}${ECOSYSTEM_STATUS_PATH}`);
  return result?.status === 200 && result.body.service === 'silicon-heartland-local-frontend' &&
    result.body.version === 1 && result.body.projectId === projectId(expectedRoot);
}

export async function isShsApi(origin) {
  const result = await readStatus(`${origin}/health`);
  return result?.status === 200 && result.body.service === 'shs-api' && result.body.ok === true;
}

function backendEnv() {
  try { return parseEnv(readFileSync(resolve(root, 'apps/shs-api/.env'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
}

export async function launch({ check = false, log = console.log } = {}) {
  const configured = backendEnv();
  const frontendPort = portNumber(process.env.SILICON_HEARTLAND_PORT || 5173, 'frontend');
  const apiPort = portNumber(process.env.PORT || configured.PORT || 8091, 'SHS API');
  const origin = `http://127.0.0.1:${frontendPort}`;
  const apiOrigin = localTarget(process.env.SHS_VITE_API_PROXY_TARGET || `http://127.0.0.1:${apiPort}`);
  const fabricOrigin = localTarget(process.env.SHS_VITE_FABRIC_PROXY_TARGET || 'http://127.0.0.1:8090');
  const registryOrigin = localTarget(process.env.SHS_VITE_REGISTRY_PROXY_TARGET || 'http://127.0.0.1:5176');
  const origins = [origin, apiOrigin, fabricOrigin, registryOrigin].map(value => new URL(value).port || '80');
  if (new Set(origins).size !== origins.length) {
    throw new Error('Frontend, SHS API, Fabric and Registry must use distinct ports');
  }
  const children = [];
  let stopping = false;
  let resolveStopped;
  const stopped = new Promise(accept => { resolveStopped = accept; });

  const stop = async () => {
    if (stopping) return stopped;
    stopping = true;
    log('Stopping owned processes; reused servers remain running.');
    // npm can exit before its watch/server descendants. Track the detached groups
    // we created, rather than treating the npm leader's exit as group cleanup.
    const groups = children.filter(child => Number.isInteger(child.pid)).map(child => child.pid);
    const signalGroup = (pid, signal) => {
      try { process.kill(-pid, signal); return true; }
      catch (error) {
        if (error.code !== 'ESRCH') log(`Shutdown error: ${error.message}`);
        return error.code !== 'ESRCH';
      }
    };
    for (const pid of groups) signalGroup(pid, 'SIGTERM');
    const deadline = Date.now() + 4000;
    while (groups.some(pid => signalGroup(pid, 0)) && Date.now() < deadline) await delay(50);
    for (const pid of groups) {
      if (signalGroup(pid, 0)) signalGroup(pid, 'SIGKILL');
    }
    resolveStopped();
  };
  const onSignal = () => { void stop(); };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  function start(name, cwd, args, env = {}) {
    const child = spawn('npm', args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    children.push(child);
    // Do not repeat child output: backend diagnostics can contain connection details.
    // The health/readiness checks below are the source of startup status.
    child.stdout.resume();
    child.stderr.resume();
    child.once('error', () => log(`${name}: unavailable (could not launch existing npm command).`));
    child.once('exit', code => {
      if (!stopping) log(`${name}: exited (${code ?? child.signalCode}); unavailable until restarted.`);
    });
    return child;
  }

  async function waitFor(probe, child) {
    const deadline = Date.now() + 30000;
    while (!stopping && Date.now() < deadline) {
      if (await probe()) return true;
      if (child.exitCode !== null || child.signalCode !== null) return false;
      await delay(300);
    }
    return false;
  }

  try {
    let frontend = await isFrontend(origin);
    if (!frontend && await portOccupied(frontendPort)) {
      throw new Error(`Port ${frontendPort} is occupied by an unverified server. No process was stopped. Use the correct checkout's Vite server or free this port yourself.`);
    }
    if (!frontend && !check) {
      const child = start('Frontend', root, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'], {
        SHS_VITE_API_PROXY_TARGET: apiOrigin,
        SHS_VITE_FABRIC_PROXY_TARGET: fabricOrigin,
        SHS_VITE_REGISTRY_PROXY_TARGET: registryOrigin,
        VITE_UNIVERSE_ORIGIN: origin,
        VITE_SHRV1_BASE_URL: origin,
      });
      frontend = await waitFor(() => isFrontend(origin), child);
      if (!frontend) throw new Error('Frontend failed to start. Run npm run dev directly to inspect its existing predev/configuration checks.');
      log(`Frontend: started on ${origin}`);
    } else log(`Frontend: ${frontend ? 'verified existing server (reused)' : 'unavailable'}`);

    let api = await isShsApi(apiOrigin);
    if (!api && !check) {
      const targetPort = Number(new URL(apiOrigin).port || 80);
      if (await portOccupied(targetPort, new URL(apiOrigin).hostname.replace(/^\[|\]$/g, ''))) {
        log(`SHS API: port ${targetPort} conflict; occupant was not reused or stopped.`);
      } else if (targetPort !== apiPort) {
        log('SHS API: configured proxy target differs from its existing PORT; not changing backend ports or starting a duplicate.');
      } else {
        const child = start('SHS API', resolve(root, 'apps/shs-api'), ['run', 'dev'], { HOST: '127.0.0.1' });
        api = await waitFor(() => isShsApi(apiOrigin), child);
        log(`SHS API: ${api ? 'started' : 'unavailable (existing command failed or timed out)'} on ${apiOrigin}`);
      }
    } else log(`SHS API: ${api ? 'verified existing server (reused)' : 'unavailable'}`);

    const readiness = api ? await readStatus(`${apiOrigin}/health/ready`) : null;
    const ready = readiness?.status === 200 && readiness.body.status === 'READY';
    log(`SHS API database readiness: ${ready ? 'READY' : 'UNAVAILABLE — data features are not verified; no migrations or seeds were run.'}`);
    const auth = api ? await readStatus(`${apiOrigin}/auth/me`) : null;
    log(`Anonymous SHS session: ${auth?.status === 401 ? '401 (authentication required)' : 'not verified; inspect existing identity configuration'}`);
    const fabric = await readStatus(`${fabricOrigin}/openapi.json`);
    const fabricAvailable = fabric?.status === 200 && fabric.body.info?.title === 'SHF Agent Fabric';
    log(`Agent Fabric: ${fabricAvailable ? 'identified existing service' : 'unavailable'} on ${fabricOrigin}; never auto-started because its startup can create schema.`);
    log('Audit service: not started (schema-creating bootstrap); no new proxy exposed.');
    let registry = await isRegistry(registryOrigin);
    if (!registry && !check) {
      const registryPort = Number(new URL(registryOrigin).port || 80);
      const registryRoot = process.env.SILICON_HEARTLAND_REGISTRY_ROOT || resolve(homedir(), 'Desktop/autonomous-registry');
      if (await portOccupied(registryPort)) log(`Autonomous Registry: internal port ${registryPort} conflict; occupant left untouched.`);
      else if (!existsSync(resolve(registryRoot, 'node_modules/vite/bin/vite.js'))) log('Autonomous Registry: checkout/dependencies unavailable; no install or substitute performed.');
      else {
        const child = start('Autonomous Registry', registryRoot, ['run', 'dev', '--', '--port', String(registryPort), '--base', '/autonomous-registry/']);
        registry = await waitFor(() => isRegistry(registryOrigin), child);
        log(`Autonomous Registry: ${registry ? 'started' : 'unavailable (startup failed)'} on ${registryOrigin}`);
      }
    } else log(`Autonomous Registry: ${registry ? 'verified existing server (reused)' : 'unavailable'}`);
    const nextOccupied = await portOccupied(5175);
    log(`Independent apps: shf-next :5175 ${nextOccupied ? 'occupied/unverified' : 'not listening'}; not managed.`);
    let proxyMatches = false;
    if (frontend) {
      const proxy = await readStatus(`${origin}/api/health`);
      const frontendStatus = await readStatus(`${origin}${ECOSYSTEM_STATUS_PATH}`);
      proxyMatches = proxy?.status === 200 && proxy.body.service === 'shs-api' && frontendStatus?.body.apiTarget === apiOrigin;
      if (api && !proxyMatches) log('WARNING: frontend API proxy does not match the verified SHS backend.');
      if (registry && (!await isRegistry(origin) || frontendStatus?.body.registryTarget !== registryOrigin)) {
        registry = false;
        log('Autonomous Registry: frontend proxy mismatch; unified access unavailable.');
      }
      log(`ENTRY URL: ${origin}/universe/directory`);
      log(`Metaverse: ${origin}/metaverse`);
      if (registry) log(`Autonomous Registry: ${origin}/autonomous-registry/`);
      log(`SHF: ${origin}/foundation.html | SHS: ${origin}/solutions.html#/home`);
      log(`SHU: ${origin}/curriculum.html#/ | Career: ${origin}/career.html#/ | Arcade: ${origin}/arcade.html#/`);
    }
    const healthy = frontend && api && ready && auth?.status === 401 && proxyMatches;
    log(`Core status: ${healthy ? 'frontend and SHS API ready' : 'PARTIAL — see unavailable/conflicting services above'}. Registry: ${registry ? 'ready' : 'unavailable'}. Fabric and legacy shf-next availability is separate.`);
    if (check) return { healthy, frontend, api, ready, registry, fabricAvailable, origin };
    log('Press Ctrl+C to stop processes started by this command. Existing processes are left running.');
    // Signal listeners alone need not keep Node alive when every server was reused.
    const keepAlive = setInterval(() => {}, 60000);
    try { await stopped; } finally { clearInterval(keepAlive); }
    return { healthy, frontend, api, ready, registry, fabricAvailable, origin };
  } catch (error) {
    await stop();
    throw error;
  } finally {
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const unknown = process.argv.slice(2).filter(arg => arg !== '--check');
  if (unknown.length) { console.error('Usage: npm run dev:ecosystem -- [--check]'); process.exitCode = 1; }
  else launch({ check: process.argv.includes('--check') }).then(result => {
    if (process.argv.includes('--check') && !result.healthy) process.exitCode = 1;
  }).catch(error => { console.error(`Ecosystem startup: ${error.message}`); process.exitCode = 1; });
}
