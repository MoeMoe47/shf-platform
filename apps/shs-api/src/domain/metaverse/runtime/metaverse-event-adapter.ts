import { emitOperationalTelemetry } from "../../../observability/operational-telemetry.js";
import {
  METAVERSE_OPERATIONAL_EVENT_BOUNDARY,
  METAVERSE_UNLOCK_OPERATIONAL_EVENTS,
} from "../unlocks/unlock-authority-adapter.js";
import type { MetaverseUnlockDecisionRecord } from "../unlocks/unlock-contract.js";

export type MetaverseOperationalEventName = (typeof METAVERSE_UNLOCK_OPERATIONAL_EVENTS)[number];

export function emitMetaverseOperationalEvent(eventName: MetaverseOperationalEventName, decision: MetaverseUnlockDecisionRecord) {
  if (!METAVERSE_UNLOCK_OPERATIONAL_EVENTS.includes(eventName)) return null;
  return emitOperationalTelemetry({
    event_name: eventName,
    severity: eventName === "metaverse.unlock.denied" ? "WARNING" : "INFO",
    component: "metaverse_runtime",
    category: "SECURITY",
    outcome: eventName === "metaverse.unlock.denied" ? "EXPECTED_DOMAIN_REJECTION" : "SUCCESS",
    metadata: {
      reason: decision.reason_code,
      status_code: decision.decision,
      component: "metaverse_runtime",
    },
  });
}

export { METAVERSE_OPERATIONAL_EVENT_BOUNDARY };
