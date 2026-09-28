// ISO 8601 duration subset accepted for Wave 3B layer policy (GEO1-WAVE3B-DEC-015):
// P[nD][T[nH][nM][nS]] with integer components only. Years, months, weeks, fractions, and signs
// are rejected because their length varies or they are not approved. Pure; no clock access.
const DURATION_PATTERN = /^P(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Returns the duration in milliseconds, or null when the value is not a positive duration in the subset.
export function parseSpatialDurationMs(value) {
  if (typeof value !== "string" || value === "P") return null;
  const match = DURATION_PATTERN.exec(value);
  if (!match) return null;
  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match;
  const ms = Number(days) * DAY_MS + Number(hours) * HOUR_MS + Number(minutes) * MINUTE_MS + Number(seconds) * SECOND_MS;
  return Number.isSafeInteger(ms) && ms > 0 ? ms : null;
}
