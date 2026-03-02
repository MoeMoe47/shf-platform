/**
 * Minimal event bus for dopamine + game signals.
 * - No deps
 * - Works across components
 * - Payload is structured + extendable
 */
const listeners = new Set();

export function emitDopamine(event) {
  for (const fn of listeners) {
    try { fn(event); } catch (e) { /* ignore */ }
  }
}

export function onDopamine(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Event shape (recommended):
 * {
 *   type: "SIGNAL" | "ATTESTED" | "WIN" | "LOSS" | "STREAK" | "LEVEL_UP",
 *   agentId?: string,
 *   points?: number,
 *   intensity?: number, // 0..1
 *   meta?: object,
 *   ts?: number
 * }
 */
