import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import {
  ARCADE_RUNTIME_TELEMETRY_DEFAULT_LIMIT,
  ARCADE_RUNTIME_TELEMETRY_EVENT_TYPES,
  ARCADE_RUNTIME_TELEMETRY_MAX_BYTES,
  ARCADE_RUNTIME_TELEMETRY_MAX_DEPTH,
  ARCADE_RUNTIME_TELEMETRY_MAX_FUTURE_MS,
  ARCADE_RUNTIME_TELEMETRY_MAX_LIMIT,
  type ArcadeRuntimeTelemetryEventType,
} from "../model/runtime-telemetry.js";
import { ArcadeRuntimeTelemetryRepo } from "../repo/runtime-telemetry-repo.js";
import type { ArcadeRuntimeActor } from "./runtime-session-service.js";
import { ArcadeRuntimeSessionError } from "./runtime-session-service.js";

const FORBIDDEN_KEYS = new Set([
  "password", "token", "authorization", "cookie", "clipboard", "microphone", "camera",
  "latitude", "longitude", "location", "geolocation", "gps", "keystrokes", "rawkeystrokes",
  "browserhistory", "fingerprint", "ipaddress", "message", "essay", "studentessay", "freeformtext",
  "answertext", "response", "responsecontent",
]);

function ownerScope(actor: ArcadeRuntimeActor) {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT)) {
    throw new ArcadeRuntimeSessionError("FORBIDDEN", "Missing arcade.attempt permission.", 403);
  }
  const organizationId = String(actor.organization_id || "").trim();
  const userId = String(actor.user_id || "").trim();
  if (!organizationId || !userId) throw new ArcadeRuntimeSessionError("SCOPE_MISSING", "Actor organization/user is required.", 403);
  return { organizationId, tenantId: `tenant:${organizationId}`, userId };
}

function sessionId(value: unknown) {
  const id = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(id)) {
    throw new ArcadeRuntimeSessionError("SESSION_ID_INVALID", "SESSION_ID_INVALID must be a 1-160 character identifier.");
  }
  return id;
}

function validatePayload(payload: unknown): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || Object.getPrototypeOf(payload) !== Object.prototype) {
    throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_PAYLOAD_INVALID", "payload must be a JSON object.");
  }
  const seen = new Set<object>();
  const inspect = (value: unknown, depth: number): void => {
    if (depth > ARCADE_RUNTIME_TELEMETRY_MAX_DEPTH) throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_PAYLOAD_INVALID", "payload nesting exceeds the allowed depth.");
    if (value === null || typeof value === "string" || typeof value === "boolean") return;
    if (typeof value === "number" && Number.isFinite(value)) return;
    if (typeof value !== "object") throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_PAYLOAD_INVALID", "payload must contain only JSON values.");
    if (seen.has(value)) throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_PAYLOAD_INVALID", "payload cannot contain circular references.");
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach((item) => inspect(item, depth + 1));
    } else {
      if (Object.getPrototypeOf(value) !== Object.prototype) throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_PAYLOAD_INVALID", "payload must contain only JSON objects and arrays.");
      for (const [key, item] of Object.entries(value)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (FORBIDDEN_KEYS.has(normalizedKey) || normalizedKey.includes("token")) {
          throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_SENSITIVE_FIELD", `payload key '${key}' is not permitted.`);
        }
        inspect(item, depth + 1);
      }
    }
    seen.delete(value);
  };
  inspect(payload, 0);
  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized, "utf8") > ARCADE_RUNTIME_TELEMETRY_MAX_BYTES) {
    throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_PAYLOAD_TOO_LARGE", `payload must not exceed ${ARCADE_RUNTIME_TELEMETRY_MAX_BYTES} bytes.`, 413);
  }
  return serialized;
}

function parseSequence(value: unknown, name: string, minimum: number) {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) {
    throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_SEQUENCE_INVALID", `${name} must be an integer greater than or equal to ${minimum}.`);
  }
  return Number(value);
}

function occurredAt(value: unknown): string {
  const match = typeof value === "string"
    ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value)
    : null;
  if (!match) {
    throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_OCCURRED_AT_INVALID", "occurredAt must be an ISO-8601 timestamp with timezone.");
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const offsetHour = offsetHourText == null ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText == null ? 0 : Number(offsetMinuteText);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]
    || hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59) {
    throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_OCCURRED_AT_INVALID", "occurredAt must be a valid timestamp.");
  }
  const date = new Date(value as string);
  if (!Number.isFinite(date.getTime())) throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_OCCURRED_AT_INVALID", "occurredAt must be a valid timestamp.");
  if (date.getTime() > Date.now() + ARCADE_RUNTIME_TELEMETRY_MAX_FUTURE_MS) {
    throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_OCCURRED_AT_INVALID", "occurredAt is too far in the future.");
  }
  return date.toISOString();
}

export class ArcadeRuntimeTelemetryService {
  constructor(private readonly events = new ArcadeRuntimeTelemetryRepo()) {}

  async append(actor: ArcadeRuntimeActor, rawSessionId: string, body: any) {
    const scope = ownerScope(actor);
    const id = sessionId(rawSessionId);
    const sequence = parseSequence(body?.sequence, "sequence", 1);
    const eventType = String(body?.eventType ?? "").trim().toUpperCase();
    if (!ARCADE_RUNTIME_TELEMETRY_EVENT_TYPES.includes(eventType as ArcadeRuntimeTelemetryEventType)) {
      throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_TYPE_INVALID", "eventType is not allowlisted.");
    }
    const timestamp = occurredAt(body?.occurredAt);
    const payload = validatePayload(body?.payload);
    const result = await this.events.appendForOwner({
      sessionId: id, ...scope, sequence,
      eventType: eventType as ArcadeRuntimeTelemetryEventType,
      occurredAt: timestamp,
      payload,
    });
    if (!result.sessionFound) throw new ArcadeRuntimeSessionError("SESSION_NOT_FOUND", "Runtime session not found.", 404);
    if (result.status !== "ACTIVE") {
      throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_SESSION_NOT_WRITABLE", "Telemetry is accepted only for ACTIVE runtime sessions.", 409);
    }
    if (!result.event) {
      throw new ArcadeRuntimeSessionError(
        "RUNTIME_EVENT_SEQUENCE_CONFLICT",
        `sequence must be exactly ${result.currentSequence + 1}; reload the event sequence before retrying.`,
        409,
        { currentSequence: result.currentSequence, expectedSequence: result.currentSequence + 1 },
      );
    }
    return result.event;
  }

  async list(actor: ArcadeRuntimeActor, rawSessionId: string, query: any = {}) {
    const scope = ownerScope(actor);
    const id = sessionId(rawSessionId);
    const afterSequence = query.afterSequence == null || query.afterSequence === "" ? 0 : parseSequence(Number(query.afterSequence), "afterSequence", 0);
    const limit = query.limit == null || query.limit === "" ? ARCADE_RUNTIME_TELEMETRY_DEFAULT_LIMIT : parseSequence(Number(query.limit), "limit", 1);
    if (limit > ARCADE_RUNTIME_TELEMETRY_MAX_LIMIT) {
      throw new ArcadeRuntimeSessionError("RUNTIME_EVENT_LIMIT_INVALID", `limit must not exceed ${ARCADE_RUNTIME_TELEMETRY_MAX_LIMIT}.`);
    }
    const items = await this.events.listForOwner({ sessionId: id, ...scope, afterSequence, limit });
    if (!items) throw new ArcadeRuntimeSessionError("SESSION_NOT_FOUND", "Runtime session not found.", 404);
    return { sessionId: id, items, nextAfterSequence: items.at(-1)?.sequence ?? afterSequence };
  }
}
