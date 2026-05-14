import rules from "@/data/rules.json";
import { appendEvent } from "@/shared/ledger/ledgerClient.js";

// Call this *after* you append a new event, if you want automatic rewards.
export async function applyRules(triggerEvent, ctx = {}) {
  for (const r of rules) {
    if (matches(r.when, triggerEvent, ctx)) {
      for (const out of r.then) {
        appendEvent({
          actorId: triggerEvent.actorId || "system",
          ts: new Date().toISOString(),
          ...out,
        });
      }
    }
  }
}

function matches(when, ev, ctx) {
  // simple exact + tag contains
  if (when.app && ev.app !== when.app) return false;
  if (when.type && ev.type !== when.type) return false;
  if (when.tags && when.tags.length) {
    const tags = ev.tags || [];
    for (const t of when.tags) if (!tags.includes(t)) return false;
  }
  // optional: streaks, totals could read from ctx
  return true;
}
