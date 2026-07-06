import { SHS_EVENT_CHANNELS, SHS_EVENT_DANGEROUS_CAPABILITIES } from "./shsEventBusTypes";

export function calculateEventBusReadiness({ events = [], subscribers = [], safetyResult = null } = {}) {
  let score = 100;
  const blockers = [];
  const warnings = [];
  if (SHS_EVENT_CHANNELS.length !== 10) {
    score -= 30;
    blockers.push("Event Bus must expose exactly 10 V1 channels.");
  }
  if (!subscribers.filter((subscriber) => subscriber.active).length) {
    score -= 20;
    warnings.push("No active local subscribers registered.");
  }
  if (events.some((event) => event.safety_status === "blocked")) {
    score -= 10;
    warnings.push("Blocked local events are present for review.");
  }
  if (safetyResult && !safetyResult.safe) {
    score -= 25;
    warnings.push("Latest safety scan found blocked payload markers.");
  }
  if (Object.values(SHS_EVENT_DANGEROUS_CAPABILITIES).some(Boolean)) {
    score -= 50;
    blockers.push("A dangerous Event Bus capability is enabled.");
  }
  return {
    score: Math.max(0, score),
    ready: score >= 85 && blockers.length === 0,
    blockers,
    warnings,
    dangerous_capabilities: SHS_EVENT_DANGEROUS_CAPABILITIES,
  };
}

