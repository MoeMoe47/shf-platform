// src/lib/calendarFeed/api.js
//
// SHF Ecosystem Phase 12 — client for the private ICS/webcal subscription
// feed (see apps/shs-api/src/domain/calendar-feed/). This module never
// sees a "connected external account" — there is no OAuth here. It only
// manages this learner's one self-issued feed token (status/rotate/
// revoke) and never persists the raw token itself (the backend returns it
// exactly once per rotate call; this module hands that value straight to
// the caller and keeps nothing).
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const CALENDAR_FEED_API_BASE = "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Calendar feed request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function getFeedStatus(role) {
  const res = await fetch(`${CALENDAR_FEED_API_BASE}/calendar/feed-token/me`, { headers: authHeaders(role) });
  return parseJson(res);
}

export async function rotateFeedToken(role) {
  const res = await fetch(`${CALENDAR_FEED_API_BASE}/calendar/feed-token/rotate`, { method: "POST", headers: authHeaders(role) });
  return parseJson(res);
}

export async function revokeFeedToken(role) {
  const res = await fetch(`${CALENDAR_FEED_API_BASE}/calendar/feed-token/me`, { method: "DELETE", headers: authHeaders(role) });
  return parseJson(res);
}

export function feedUrlForToken(token) {
  return `${CALENDAR_FEED_API_BASE}/calendar/feed.ics?token=${encodeURIComponent(token)}`;
}

export default { getFeedStatus, rotateFeedToken, revokeFeedToken, feedUrlForToken };
