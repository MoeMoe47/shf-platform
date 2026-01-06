/**
 * @typedef {Object} LayerContext
 * @property {string} app            // current app name (treasury, civic, etc.)
 * @property {string} userId         // optional current user id
 * @property {string} sessionId      // session id for audit
 * @property {Object} storage        // simple storage interface
 * @property {Object} bus            // event bus (publish/subscribe)
 * @property {Object} policy         // policy guard (rules)
 * @property {Object} telemetry      // telemetry/audit logger
 * @property {Object} services       // shared services (http, predictions, etc.)
 */

/**
 * @typedef {Object} LayerModule
 * @property {string} id
 * @property {string} name
 * @property {number} order
 * @property {(ctx: LayerContext) => Promise<void> | void} init
 * @property {(ctx: LayerContext) => Promise<Object> | Object} [health]
 */
export {};
