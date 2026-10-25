import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { normalizeRegistryHome } from './registry-routing.mjs';

export const ECOSYSTEM_STATUS_PATH = '/__ecosystem/status';
export const projectId = root => createHash('sha256').update(realpathSync(root)).digest('hex');

/** Development identification only; never adds a production route or identity. */
export function ecosystemDevIdentity(root) {
  return {
    name: 'silicon-heartland-local-frontend',
    apply: 'serve',
    config() {
      return { define: {
        'import.meta.env.VITE_SHRV1_BASE_URL': 'window.location.origin',
        'import.meta.env.VITE_UNIVERSE_ORIGIN': 'window.location.origin',
        'import.meta.env.VITE_AUTONOMOUS_REGISTRY_ORIGIN': '(window.location.origin + "/autonomous-registry")',
      } };
    },
    configureServer(server) {
      // Before Vite's base/proxy handlers: exact Home only, never Universe root.
      server.middlewares.use(normalizeRegistryHome);
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== ECOSYSTEM_STATUS_PATH) return next();
        if (!['GET', 'HEAD'].includes(req.method)) {
          res.writeHead(405, { Allow: 'GET, HEAD' });
          return res.end();
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        const target = key => {
          const value = server.config.server.proxy?.[key];
          try { return new URL(typeof value === 'string' ? value : value?.target).origin; }
          catch { return null; }
        };
        res.end(JSON.stringify({
          service: 'silicon-heartland-local-frontend', projectId: projectId(root), version: 1,
          apiTarget: target('^/api(?:/|$)'), fabricTarget: target('^/fabric-api(?:/|$)'),
          registryTarget: target('^/autonomous-registry(?:/|$)'),
        }));
      });
    },
  };
}
