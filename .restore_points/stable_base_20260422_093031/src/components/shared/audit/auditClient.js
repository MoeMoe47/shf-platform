// src/shared/audit/auditClient.js
export const audit = {
    recordAction(action, payload = {}) {
      try {
        const evt = { action, payload, at: new Date().toISOString() };
        // TODO: swap to POST /api/audit
        console.info("[audit]", evt);
      } catch (e) {
        console.warn("[audit] failed", e);
      }
    },
  };
  