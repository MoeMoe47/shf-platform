// SHF Lesson + Assignment + Curriculum Ingestion — Phase 2.
//
// Canonical Curriculum Catalog types. This domain is distinct from
// ../../curriculum/ (curriculum_lesson_completions — learner completion
// tracking against free-text ids) and from AIEL's accessibility-profile/
// authorized-accommodations domains. It owns instructional structure and
// its immutable published history only — never learner completion,
// assessment result, Truth Spine, or Evidence.

export const COURSE_STATUS_VALUES = ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "RETIRED"] as const;
export type CourseStatus = typeof COURSE_STATUS_VALUES[number];

export const ENTITY_STATUS_VALUES = ["ACTIVE", "ARCHIVED"] as const;
export type EntityStatus = typeof ENTITY_STATUS_VALUES[number];

export const RESOURCE_TYPE_VALUES = ["DOCUMENT", "LINK", "MEDIA", "OTHER"] as const;
export type ResourceType = typeof RESOURCE_TYPE_VALUES[number];

export const RELEASE_STATUS_VALUES = ["PUBLISHED", "RETIRED"] as const;
export type ReleaseStatus = typeof RELEASE_STATUS_VALUES[number];

export interface CurriculumCourseRow {
  courseId: string;
  organizationId: string;
  stableKey: string;
  title: string;
  shortDescription: string | null;
  fullDescription: string | null;
  status: CourseStatus;
  estimatedDurationMinutes: number | null;
  createdByUserId: string;
  updatedByUserId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumUnitRow {
  unitId: string;
  organizationId: string;
  courseId: string;
  stableKey: string;
  title: string;
  description: string | null;
  sequence: number;
  status: EntityStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumLessonRow {
  lessonId: string;
  organizationId: string;
  unitId: string;
  stableKey: string;
  title: string;
  summary: string | null;
  objectives: string[];
  estimatedDurationMinutes: number | null;
  sequence: number;
  status: EntityStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumResourceRow {
  resourceId: string;
  organizationId: string;
  sourceAssetId: string | null;
  sourceDocumentVersionId: string | null;
  title: string;
  resourceType: ResourceType;
  description: string | null;
  externalUrl: string | null;
  status: EntityStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

// Phase 5 — Authoritative Activity Domains. Curriculum-owned definition
// content for a lesson's Assessment/Reflection/Practice, mirroring
// CurriculumResourceRow's shape and lifecycle exactly (one row per
// lesson; mutable while the owning course is DRAFT; frozen into the
// release snapshot at publish time — see buildReleaseSnapshot).
export interface AssessmentItem {
  itemId: string;
  type: "mcq" | "short";
  prompt: string;
  choices?: string[];
  correctIndex?: number; // present only on the server-held definition row, never in a snapshot served to a learner taking the assessment
  explain?: string | null;
}
export interface CurriculumAssessmentDefinitionRow {
  assessmentDefinitionId: string;
  organizationId: string;
  lessonId: string;
  items: AssessmentItem[];
  sourceReference: string | null;
  sourceHash: string | null;
  status: EntityStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionItem {
  itemId: string;
  prompt: string;
}
export interface CurriculumReflectionDefinitionRow {
  reflectionDefinitionId: string;
  organizationId: string;
  lessonId: string;
  items: ReflectionItem[];
  sourceReference: string | null;
  sourceHash: string | null;
  status: EntityStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export const PRACTICE_COMPLETION_MODE_VALUES = ["OBJECTIVE", "COMPLETION"] as const;
export type PracticeCompletionMode = typeof PRACTICE_COMPLETION_MODE_VALUES[number];
// Real source content (Data Center lesson JSON's `practice` array, 167/168
// files) is open-ended guided-reasoning: a scenario prompt plus a model
// answer for comparison, never objectively mcq-gradable — so the item
// shape is generic prompt+modelAnswer, not multiple-choice. `type: "mcq"`
// remains supported for a hypothetical future OBJECTIVE-mode definition,
// but no real content uses it today (Step 20/23: evidence-based, not
// invented).
export interface PracticeItem {
  itemId: string;
  type: "mcq" | "guided";
  prompt: string;
  choices?: string[];
  correctIndex?: number;
  modelAnswer?: string | null; // instructor-facing reference only, never served as a scoring key
}
export interface CurriculumPracticeDefinitionRow {
  practiceDefinitionId: string;
  organizationId: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  completionMode: PracticeCompletionMode;
  completionActionLabel: string | null;
  items: PracticeItem[];
  sourceReference: string | null;
  sourceHash: string | null;
  status: EntityStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumReleaseRow {
  releaseId: string;
  organizationId: string;
  courseId: string;
  versionNumber: number;
  snapshot: unknown;
  contentHash: string;
  status: ReleaseStatus;
  publishedByUserId: string;
  publishedAt: string;
  retiredByUserId: string | null;
  retiredAt: string | null;
  createdAt: string;
}

// The exact shape hashed and stored in curriculum_releases.snapshot.
// Deliberately excludes DB-internal ids/timestamps that are not part of
// instructional identity (see buildReleaseSnapshot in the service).
export interface CurriculumReleaseSnapshot {
  course: {
    stableKey: string;
    title: string;
    shortDescription: string | null;
    fullDescription: string | null;
    estimatedDurationMinutes: number | null;
  };
  units: Array<{
    stableKey: string;
    title: string;
    description: string | null;
    sequence: number;
    lessons: Array<{
      stableKey: string;
      title: string;
      summary: string | null;
      objectives: string[];
      estimatedDurationMinutes: number | null;
      sequence: number;
      resources: Array<{
        resourceId: string;
        title: string;
        resourceType: ResourceType;
        description: string | null;
        externalUrl: string | null;
        sourceAssetId: string | null;
        sourceDocumentVersionId: string | null;
      }>;
      // Phase 4.5D: snapshotted at publish time (slug/title captured
      // alongside the id) so a later edit to the live, separately-owned
      // arcade_activities row can never rewrite what a past release says
      // was linked.
      arcadeLinks: Array<{
        arcadeActivityId: string;
        slug: string;
        title: string;
      }>;
      // Phase 5: frozen at publish time exactly like resources/
      // arcadeLinks above — null when the lesson has no such content.
      // correctIndex may exist in the immutable snapshot so the backend
      // can score against the assigned release, but learner APIs strip it.
      assessmentDefinition: { assessmentDefinitionId: string; items: AssessmentItem[] } | null;
      reflectionDefinition: { reflectionDefinitionId: string; items: ReflectionItem[] } | null;
      practiceDefinition: { practiceDefinitionId: string; title: string; instructions: string | null; completionMode: PracticeCompletionMode; completionActionLabel: string | null; items: PracticeItem[] } | null;
    }>;
  }>;
}
