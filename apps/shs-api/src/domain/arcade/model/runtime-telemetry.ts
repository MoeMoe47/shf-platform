export const ARCADE_RUNTIME_TELEMETRY_EVENT_TYPES = [
  "SESSION_STARTED",
  "SESSION_RESUMED",
  "SESSION_PAUSED",
  "CHECKPOINT_REACHED",
  "LEVEL_STARTED",
  "LEVEL_COMPLETED",
  "INTERACTION",
  "SESSION_COMPLETED",
  "SESSION_ABANDONED",
] as const;

export type ArcadeRuntimeTelemetryEventType = typeof ARCADE_RUNTIME_TELEMETRY_EVENT_TYPES[number];

export const ARCADE_RUNTIME_TELEMETRY_MAX_BYTES = 16 * 1024;
export const ARCADE_RUNTIME_TELEMETRY_MAX_DEPTH = 12;
export const ARCADE_RUNTIME_TELEMETRY_MAX_FUTURE_MS = 5 * 60 * 1000;
export const ARCADE_RUNTIME_TELEMETRY_DEFAULT_LIMIT = 100;
export const ARCADE_RUNTIME_TELEMETRY_MAX_LIMIT = 200;

export interface ArcadeRuntimeTelemetryEvent {
  id: string;
  sessionId: string;
  sequence: number;
  eventType: ArcadeRuntimeTelemetryEventType;
  occurredAt: string;
  serverReceivedAt: string;
  payload: Record<string, unknown>;
}
