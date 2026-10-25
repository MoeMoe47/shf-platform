// Gateway boundary contract only. Registry page/navigation definitions remain
// in the independent Registry's src/routes/registryRoutes.ts.
export const REGISTRY_HOME = '/autonomous-registry/';
const registryBase = REGISTRY_HOME.slice(0, -1);
export const REGISTRY_DEV_STATUS_PATH = `${registryBase}/__registry/status`;

export function normalizeRegistryHome(req, res, next) {
  if (req.url?.split('?')[0] !== registryBase) return next();
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  res.writeHead(308, { Location: REGISTRY_HOME + req.url.slice(registryBase.length) });
  res.end();
}

/** Development transport readiness, not proof of Registry identity verification. */
export async function isRegistry(origin) {
  try {
    const options = { signal: AbortSignal.timeout(2000), redirect: 'error' };
    const response = await fetch(`${origin}${REGISTRY_HOME}`, options);
    const html = await response.text();
    if (!response.ok || !html.includes('Autonomous Registry') || !html.includes(`${REGISTRY_HOME}src/main.tsx`)) return false;
    const identity = await fetch(`${origin}${REGISTRY_DEV_STATUS_PATH}`, { ...options, signal: AbortSignal.timeout(2000) });
    if (!identity.ok || !identity.headers.get('content-type')?.includes('application/json')) return false;
    const status = await identity.json();
    if (status.service !== 'autonomous-registry-frontend' || status.version !== 1 ||
        status.canonicalHome !== REGISTRY_HOME || status.verification !== 'static-prototype' ||
        !Array.isArray(status.implementedPages) ||
        !status.implementedPages.every(page => typeof page === 'string' && page.startsWith(REGISTRY_HOME)) ||
        !status.implementedPages.includes(REGISTRY_HOME) ||
        !status.implementedPages.some(page => page.startsWith(`${registryBase}/agent/`) || page.startsWith(`${registryBase}/agents/`)) ||
        !status.implementedPages.some(page => page === `${registryBase}/verify` || page.startsWith(`${registryBase}/verify/`))) return false;
    // Retain the pre-existing source-wiring assertion, but follow centralized
    // definitions instead of searching App source for one obsolete literal URL.
    const source = await fetch(`${origin}${REGISTRY_HOME}src/App.tsx`, { ...options, signal: AbortSignal.timeout(2000) });
    const app = await source.text();
    const legacyWiring = app.includes('registryExistingPages.agent') && app.includes('registryExistingPages.verify');
    const canonicalWiring = app.includes('AGENT_RECORD_ROUTE') && app.includes('REGISTRY_VERIFY') && app.includes('resolveRegistryCompatibility');
    return source.ok && app.includes('/src/routes/registryRoutes') && (legacyWiring || canonicalWiring);
  } catch { return false; }
}
