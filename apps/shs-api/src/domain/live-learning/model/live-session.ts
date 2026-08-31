// Phase 2A Secure Live Learning — provider-neutral domain model.
// The canonical identity is the SHF LiveSession (live_session_id), never a
// provider meeting URL or provider session id. "provider" is a column
// value, not a separate schema — Zoom is provider #1, not the domain.

export const LIVE_SESSION_STATUSES = [
  "draft",
  "scheduled",
  "open",
  "in_progress",
  "completed",
  "cancelled",
  "expired",
] as const;
export type LiveSessionStatus = typeof LIVE_SESSION_STATUSES[number];

export const LIVE_LEARNING_PROVIDERS = ["mock", "zoom"] as const;
export type LiveLearningProviderName = typeof LIVE_LEARNING_PROVIDERS[number];

export const LIVE_SESSION_AUDIENCE_SCOPES = ["ORGANIZATION", "COHORT"] as const;
export type LiveSessionAudienceScope = typeof LIVE_SESSION_AUDIENCE_SCOPES[number];

export const ATTENDANCE_STATUSES = [
  "registered",
  "authorized",
  "joined",
  "attended",
  "completed",
  "absent",
  "excused",
] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

export interface AccessPolicy {
  /** Minutes before startsAt a join request may be authorized. */
  joinWindowMinutesBefore: number;
  /** Minutes after endsAt a join request may still be authorized. */
  joinGraceMinutesAfterEnd: number;
}

export const DEFAULT_ACCESS_POLICY: AccessPolicy = {
  joinWindowMinutesBefore: 15,
  joinGraceMinutesAfterEnd: 5,
};

export interface RecordingPolicy {
  autoRecord: boolean;
  /** Must always be false in Phase 2A — recordings are never
   * auto-published. See getRecordingMetadata() in the provider contract;
   * publishing is explicitly out of scope until a later phase. */
  autoPublish: boolean;
}

export const DEFAULT_RECORDING_POLICY: RecordingPolicy = {
  autoRecord: false,
  autoPublish: false,
};

export interface LiveSession {
  id: string;
  organizationId: string;
  provider: LiveLearningProviderName;
  providerSessionId: string | null;
  title: string;
  description: string | null;
  courseId: string | null;
  moduleId: string | null;
  lessonId: string | null;
  instructorId: string;
  cohortId: string | null;
  audienceScope: LiveSessionAudienceScope;
  startsAt: string; // ISO 8601, UTC
  endsAt: string;   // ISO 8601, UTC
  timezone: string;
  status: LiveSessionStatus;
  accessPolicy: AccessPolicy;
  recordingPolicy: RecordingPolicy;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** What a student is allowed to see — never the full row (no provider
 * metadata, no other participants). See §28 privacy requirement. */
export interface StudentFacingLiveSession {
  id: string;
  provider: LiveLearningProviderName;
  title: string;
  description: string | null;
  courseId: string | null;
  moduleId: string | null;
  lessonId: string | null;
  instructorId: string;
  audienceScope: LiveSessionAudienceScope;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: LiveSessionStatus;
}

export function toStudentFacing(s: LiveSession): StudentFacingLiveSession {
  return {
    id: s.id,
    provider: s.provider,
    title: s.title,
    description: s.description,
    courseId: s.courseId,
    moduleId: s.moduleId,
    lessonId: s.lessonId,
    instructorId: s.instructorId,
    audienceScope: s.audienceScope,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    timezone: s.timezone,
    status: s.status,
  };
}
