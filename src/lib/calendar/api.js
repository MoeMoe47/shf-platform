// src/lib/calendar/api.js
//
// SHF Ecosystem Phase 9 — client for the canonical backend Calendar
// Projection Service. The backend now owns all cross-domain schedule
// orchestration (reading Assignments/Live Learning/Career Events/
// Opportunities/Projects/Credentials, applying each domain's own
// entitlement, deduping, and ordering) that useLearningCalendarEvents.js
// previously performed client-side across six separate fetches. This
// module fetches the one aggregated, already-entitled result — it does
// not re-derive entitlement or truth of any kind.
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const CALENDAR_API_BASE = "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Calendar request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function listCalendarEvents(role) {
  const res = await fetch(`${CALENDAR_API_BASE}/calendar/events/me`, { headers: authHeaders(role) });
  return parseJson(res);
}

// SHF Ecosystem Phase 10 — Calendar Intelligence client. Derived advice
// only (weekly load, conflicts, deadline concentration, recommendations) —
// see apps/shs-api/src/domain/calendar/service/calendar-intelligence-service.ts's
// own non-ownership header. This module does not compute anything itself.
export async function getCalendarIntelligence(role) {
  const res = await fetch(`${CALENDAR_API_BASE}/calendar/intelligence/me`, { headers: authHeaders(role) });
  return parseJson(res);
}

export default { listCalendarEvents, getCalendarIntelligence };
