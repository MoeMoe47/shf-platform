// Phase 4F.5 — MOL local event bus (in-process, deterministic).
//
// No broker: the repo's realtime audit (METAVERSE_REALTIME_REPOSITORY_AUDIT)
// found no WebSocket/SSE/Redis, and 4F.5 producers are all client-side
// simulated providers. The bus keeps an immutable ordered log for replay,
// rejects invalid or unauthorized events into a bounded dead-letter list, and
// never retries without an explicit, capped request.

import { MOL_EVENT_TYPES, createMolEvent, deepFreeze, validateMolEvent } from "./molEventContract.js";
import { MOL_HEALTH_STATES, checkMolEventAuthority, getMolSystem, listMolSystems } from "./molSystemRegistry.js";

export const MOL_PUBLISH_OUTCOMES = Object.freeze(["ACCEPTED", "DUPLICATE", "REJECTED"]);
export const MOL_DEAD_LETTER_KINDS = Object.freeze(["REJECTED", "FAILED_PROCESSING"]);
export const MOL_BUS_LIMITS = Object.freeze({ maxLog: 2000, maxDeadLetters: 200, maxProcessingAttempts: 3, maxErrorChars: 200 });

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function boundedMessage(error) {
  return String(error?.message || error || "handler failed").slice(0, MOL_BUS_LIMITS.maxErrorChars);
}

// Health is derived from SYSTEM_HEALTH_CHANGED events in the log, so replay reconstructs it.
export function deriveMolSystemHealth(log) {
  const health = Object.fromEntries(listMolSystems().map((system) => [system.systemId, system.mode === "UNAVAILABLE" ? "UNAVAILABLE" : "HEALTHY"]));
  for (const entry of log) {
    if (entry.event.eventType !== MOL_EVENT_TYPES.SYSTEM_HEALTH_CHANGED) continue;
    // A system with no provider stays UNAVAILABLE; MOL never fabricates availability.
    if (getMolSystem(entry.event.payload.systemId)?.mode === "UNAVAILABLE") continue;
    health[entry.event.payload.systemId] = entry.event.payload.health;
  }
  return health;
}

export function createMolEventBus({ now = () => Date.now(), replay = false, limits = MOL_BUS_LIMITS } = {}) {
  const log = [];
  const byId = new Map();
  const deadLetters = [];
  const subscribers = new Map();
  const metrics = { published: 0, accepted: 0, duplicates: 0, rejected: 0, delivered: 0, failedProcessing: 0, retried: 0, deadLettersDropped: 0 };
  let deadLetterSeq = 0;
  let healthSeq = 0;

  function addDeadLetter(entry) {
    deadLetterSeq += 1;
    const record = { deadLetterId: `dlq-${deadLetterSeq}`, attempts: 1, exhausted: false, recordedAt: now(), ...entry };
    deadLetters.push(record);
    // Bounded: the oldest inspection records drop first, and the drop is counted, never silent.
    while (deadLetters.length > limits.maxDeadLetters) { deadLetters.shift(); metrics.deadLettersDropped += 1; }
    return record;
  }

  function deliver(entry, subscriber) {
    if (subscriber.processed.has(entry.event.eventId)) return { subscriberId: subscriber.subscriberId, status: "ALREADY_PROCESSED" };
    const started = now();
    try {
      subscriber.handler(entry.event, { replay });
      subscriber.processed.add(entry.event.eventId);
      subscriber.latency.count += 1;
      const elapsed = Math.max(0, now() - started);
      subscriber.latency.totalMs += elapsed;
      subscriber.latency.maxMs = Math.max(subscriber.latency.maxMs, elapsed);
      metrics.delivered += 1;
      return { subscriberId: subscriber.subscriberId, status: "DELIVERED" };
    } catch (error) {
      metrics.failedProcessing += 1;
      const record = addDeadLetter({ kind: "FAILED_PROCESSING", eventId: entry.event.eventId, eventType: entry.event.eventType, subscriberId: subscriber.subscriberId, reasons: [boundedMessage(error)] });
      return { subscriberId: subscriber.subscriberId, status: "FAILED", deadLetterId: record.deadLetterId };
    }
  }

  function matching(eventType) {
    return [...subscribers.values()].filter((subscriber) => (subscriber.eventTypes === "*" || subscriber.eventTypes.includes(eventType))
      // Replay never re-runs side-effecting subscribers.
      && !(replay && subscriber.sideEffects));
  }

  function publish(input) {
    metrics.published += 1;
    const validation = validateMolEvent(input);
    const eventId = typeof input?.eventId === "string" ? input.eventId : null;
    if (!validation.valid) {
      metrics.rejected += 1;
      addDeadLetter({ kind: "REJECTED", eventId, eventType: input?.eventType ?? null, reasons: [...validation.errors], unsupportedVersion: validation.unsupportedVersion });
      return Object.freeze({ outcome: "REJECTED", eventId, reasons: validation.errors });
    }
    const previous = byId.get(input.eventId);
    if (previous) {
      // Idempotent consumption: an identical re-publish is a no-op; a different body under the same ID is rejected.
      if (stableJson(previous.event) === stableJson(input)) { metrics.duplicates += 1; return Object.freeze({ outcome: "DUPLICATE", eventId, sequence: previous.sequence }); }
      metrics.rejected += 1;
      addDeadLetter({ kind: "REJECTED", eventId, eventType: input.eventType, reasons: ["EVENT_ID_CONFLICT"] });
      return Object.freeze({ outcome: "REJECTED", eventId, reasons: ["EVENT_ID_CONFLICT"] });
    }
    const authority = checkMolEventAuthority(input, { health: deriveMolSystemHealth(log) });
    if (!authority.ok) {
      metrics.rejected += 1;
      addDeadLetter({ kind: "REJECTED", eventId, eventType: input.eventType, reasons: [authority.reason] });
      return Object.freeze({ outcome: "REJECTED", eventId, reasons: [authority.reason] });
    }
    if (log.length >= limits.maxLog) {
      metrics.rejected += 1;
      addDeadLetter({ kind: "REJECTED", eventId, eventType: input.eventType, reasons: ["LOG_CAPACITY_REACHED"] });
      return Object.freeze({ outcome: "REJECTED", eventId, reasons: ["LOG_CAPACITY_REACHED"] });
    }
    const entry = { sequence: log.length + 1, event: deepFreeze(structuredClone(input)), acceptedAt: now(), deliveries: [] };
    log.push(entry);
    byId.set(entry.event.eventId, entry);
    metrics.accepted += 1;
    for (const subscriber of matching(entry.event.eventType)) entry.deliveries.push(deliver(entry, subscriber));
    return Object.freeze({ outcome: "ACCEPTED", eventId, sequence: entry.sequence, deliveries: Object.freeze([...entry.deliveries]) });
  }

  function subscribe({ subscriberId, eventTypes = "*", handler, sideEffects = false }) {
    if (typeof subscriberId !== "string" || !subscriberId) throw new Error("subscriberId is required");
    if (subscribers.has(subscriberId)) throw new Error(`duplicate subscriber ${subscriberId}`);
    if (typeof handler !== "function") throw new Error("handler must be a function");
    if (eventTypes !== "*" && (!Array.isArray(eventTypes) || !eventTypes.length)) throw new Error("eventTypes must be '*' or a non-empty array");
    subscribers.set(subscriberId, { subscriberId, eventTypes, handler, sideEffects, processed: new Set(), latency: { count: 0, totalMs: 0, maxMs: 0 } });
    return () => subscribers.delete(subscriberId);
  }

  // Explicit, capped retry of a failed delivery. Never automatic, never unbounded.
  function retryDeadLetter(deadLetterId) {
    const record = deadLetters.find((item) => item.deadLetterId === deadLetterId);
    if (!record || record.kind !== "FAILED_PROCESSING") return { status: "NOT_RETRYABLE" };
    if (record.exhausted || record.attempts >= limits.maxProcessingAttempts) { record.exhausted = true; return { status: "EXHAUSTED" }; }
    const subscriber = subscribers.get(record.subscriberId);
    const entry = byId.get(record.eventId);
    if (!subscriber || !entry) return { status: "NOT_RETRYABLE" };
    record.attempts += 1;
    metrics.retried += 1;
    const started = now();
    try {
      subscriber.handler(entry.event, { replay });
      subscriber.processed.add(entry.event.eventId);
      subscriber.latency.count += 1;
      subscriber.latency.totalMs += Math.max(0, now() - started);
      metrics.delivered += 1;
      record.resolved = true;
      return { status: "DELIVERED" };
    } catch (error) {
      record.reasons = [...record.reasons, boundedMessage(error)].slice(-limits.maxProcessingAttempts);
      if (record.attempts >= limits.maxProcessingAttempts) record.exhausted = true;
      return { status: record.exhausted ? "EXHAUSTED" : "FAILED" };
    }
  }

  // MOL-owned operational transition: recorded as an attributable event, never a silent flag.
  function setSystemHealth(systemId, health, reason) {
    if (!getMolSystem(systemId)) return Object.freeze({ outcome: "REJECTED", reasons: ["UNKNOWN_SOURCE_SYSTEM"] });
    if (!MOL_HEALTH_STATES.includes(health)) return Object.freeze({ outcome: "REJECTED", reasons: ["INVALID_HEALTH_STATE"] });
    if (getMolSystem(systemId).mode === "UNAVAILABLE") return Object.freeze({ outcome: "REJECTED", reasons: ["SYSTEM_HAS_NO_PROVIDER"] });
    healthSeq += 1;
    return publish(createMolEvent({
      eventId: `mol:health:${systemId}:${healthSeq}:${log.length + 1}`,
      eventType: MOL_EVENT_TYPES.SYSTEM_HEALTH_CHANGED,
      occurredAt: new Date(now()).toISOString(),
      sourceSystem: "mol",
      authority: "ORCHESTRATION",
      providerMode: "TEST",
      severity: health === "HEALTHY" ? "INFO" : "MAJOR",
      correlationId: `mol:health:${systemId}`,
      status: health === "HEALTHY" ? "RESOLVED" : "ACTIVE",
      entities: [{ entityType: "SYSTEM", entityRef: systemId, role: "SUBJECT" }],
      payload: { systemId, health, reason: String(reason || "operator-marked").slice(0, 120) },
    }));
  }

  return Object.freeze({
    publish,
    subscribe,
    retryDeadLetter,
    setSystemHealth,
    isReplay: replay,
    getLog: () => log.map((entry) => ({ ...entry, deliveries: [...entry.deliveries] })),
    getEvents: () => log.map((entry) => entry.event),
    getDeadLetters: () => deadLetters.map((record) => ({ ...record, reasons: [...record.reasons] })),
    getHealth: () => deriveMolSystemHealth(log),
    getMetrics: () => ({
      ...metrics,
      subscribers: [...subscribers.values()].map((subscriber) => ({
        subscriberId: subscriber.subscriberId,
        sideEffects: subscriber.sideEffects,
        processed: subscriber.processed.size,
        latency: { ...subscriber.latency, avgMs: subscriber.latency.count ? subscriber.latency.totalMs / subscriber.latency.count : 0 },
      })),
    }),
  });
}
