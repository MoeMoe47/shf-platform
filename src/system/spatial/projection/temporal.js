const UTC_SUFFIX = /(Z|[+-]\d\d:\d\d)$/;

function partsFor(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function localFields(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!match) return null;
  return { year: match[1], month: match[2], day: match[3], hour: match[4], minute: match[5], second: match[6] || "00", millisecond: Number(`${match[7] || "0"}`.padEnd(3, "0")) };
}

function sameFields(parts, fields) {
  return parts.year === fields.year && parts.month === fields.month && parts.day === fields.day && parts.hour === fields.hour && parts.minute === fields.minute && parts.second === fields.second;
}

export function parseTemporalInstant(value, timeZone) {
  if (typeof value !== "string" || !value.trim()) return null;
  if (UTC_SUFFIX.test(value)) {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : new Date(timestamp);
  }
  const fields = localFields(value);
  if (!fields || !timeZone) return null;
  const naive = Date.UTC(Number(fields.year), Number(fields.month) - 1, Number(fields.day), Number(fields.hour), Number(fields.minute), Number(fields.second), fields.millisecond);
  const matches = [];
  for (let offset = -14 * 60; offset <= 14 * 60; offset += 1) {
    const candidate = new Date(naive - offset * 60_000);
    if (sameFields(partsFor(candidate, timeZone), fields)) matches.push(candidate.getTime());
  }
  if (matches.length === 0) return null;
  return new Date(Math.max(...matches));
}

export function evaluateTemporal(temporal = {}, layer, now) {
  const start = temporal.effectiveStart ? parseTemporalInstant(temporal.effectiveStart, temporal.timezone) : null;
  const end = temporal.effectiveEnd ? parseTemporalInstant(temporal.effectiveEnd, temporal.timezone) : null;
  const hasInvalidTime = (temporal.effectiveStart && !start) || (temporal.effectiveEnd && !end);
  const diagnostics = hasInvalidTime ? ["INVALID_TEMPORAL_SOURCE"] : [];
  if (!start) return { state: null, diagnostics, start, end };
  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end?.getTime();
  if (startMs <= nowMs && endMs !== undefined && nowMs < endMs) return { state: "live", diagnostics, start, end };
  if (endMs !== undefined && endMs <= nowMs) return { state: "ended", diagnostics, start, end };
  if (startMs > nowMs) {
    if (temporal.soonFlag === true) return { state: "soon", diagnostics, start, end };
    if (layer?.timeAwareCapability === true && layer.soonThreshold) {
      const threshold = parseDuration(layer.soonThreshold);
      if (threshold !== null && nowMs >= startMs - threshold && nowMs < startMs) return { state: "soon", diagnostics, start, end };
    }
    return { state: "upcoming", diagnostics, start, end };
  }
  return { state: null, diagnostics, start, end };
}

function parseDuration(value) {
  const match = /^P(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value || "");
  if (!match) return null;
  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  const result = (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
  return result > 0 ? result : null;
}
