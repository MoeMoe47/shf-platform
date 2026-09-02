// SHF Lesson + Assignment + Curriculum — Phase 4.5A: Curriculum Import
// Job, Candidate Model, and Transaction-Safe Structured Import
// Foundation.
//
// See migration 062's header comment for the full status-lifecycle
// rationale (why VALIDATING was dropped and IMPORTING was kept).

export const IMPORT_JOB_STATUS_VALUES = [
  "DRAFT",
  "READY",
  "NEEDS_REVIEW",
  "IMPORTING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;
export type ImportJobStatus = typeof IMPORT_JOB_STATUS_VALUES[number];

export const IMPORT_TYPE_VALUES = ["STATIC_JSON"] as const;
export type ImportType = typeof IMPORT_TYPE_VALUES[number];

// Phase 4.5D: ARCADE_LINK is a proposed Lesson <-> Arcade Activity
// definition link — deliberately its own candidate type, not folded into
// RESOURCE (Step 19 calls for a dedicated relationship; a game reference
// is not curriculum media, it is a link to a *different* domain's
// existing definition).
export const CANDIDATE_TYPE_VALUES = ["COURSE", "UNIT", "LESSON", "RESOURCE", "ARCADE_LINK"] as const;
export type CandidateType = typeof CANDIDATE_TYPE_VALUES[number];

export const CANDIDATE_VALIDATION_STATUS_VALUES = ["PENDING", "VALID", "INVALID"] as const;
export type CandidateValidationStatus = typeof CANDIDATE_VALIDATION_STATUS_VALUES[number];

// Phase 4.5B: only set when a candidate was generated as part of a
// re-import against an already-existing DRAFT course (null for a
// first-time import — see migration 063's header).
export const CANDIDATE_DIFF_STATUS_VALUES = ["NEW", "UNCHANGED", "MODIFIED", "MISSING_FROM_SOURCE", "CONFLICT"] as const;
export type CandidateDiffStatus = typeof CANDIDATE_DIFF_STATUS_VALUES[number];

export interface CurriculumImportJobRow {
  importJobId: string;
  organizationId: string;
  importType: ImportType;
  sourceAssetId: string | null;
  sourceDocumentVersionId: string | null;
  sourceKey: string | null;
  status: ImportJobStatus;
  createdByUserId: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  errorSummary: string | null;
  metadata: Record<string, unknown>;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumImportCandidateRow {
  importCandidateId: string;
  importJobId: string;
  organizationId: string;
  candidateType: CandidateType;
  parentCandidateId: string | null;
  stableKey: string;
  title: string;
  sequence: number;
  sourceReference: string | null;
  payload: Record<string, unknown>;
  validationStatus: CandidateValidationStatus;
  validationErrors: string[];
  included: boolean;
  createdEntityType: CandidateType | null;
  createdEntityId: string | null;
  sourceHash: string | null;
  diffStatus: CandidateDiffStatus | null;
  previousCandidateId: string | null;
  createdAt: string;
  updatedAt: string;
}
