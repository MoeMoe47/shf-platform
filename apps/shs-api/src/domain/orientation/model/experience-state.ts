export const EXPERIENCE_STATUSES = ["OFFERED", "STARTED", "PAUSED", "SKIPPED", "DISMISSED", "COMPLETED"] as const;
export type ExperienceStatus = typeof EXPERIENCE_STATUSES[number];

export type ExperienceAction = "OFFER" | "START" | "PROGRESS" | "PAUSE" | "RESUME" | "SKIP" | "DISMISS" | "COMPLETE" | "RESTART" | "WHATS_CHANGED_SEEN";

export interface ExperienceState {
  experienceStateId: string;
  userId: string;
  organizationId: string;
  tenantId: string;
  orientationId: string;
  orientationVersion: number;
  tourId: string | null;
  tourVersion: number | null;
  status: ExperienceStatus;
  currentStepId: string | null;
  lastRoute: string | null;
  lastDestinationId: string | null;
  firstOfferedAt: string | null;
  startedAt: string | null;
  updatedAt: string;
  completedAt: string | null;
  skippedAt: string | null;
  dismissedAt: string | null;
  whatsChangedSeenAt: string | null;
  replayCount: number;
}

export interface ExperienceStateInput {
  orientationId: string;
  orientationVersion: number;
  tourId?: string | null;
  tourVersion?: number | null;
  currentStepId?: string | null;
  lastRoute?: string | null;
  lastDestinationId?: string | null;
}
