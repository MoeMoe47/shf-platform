// SHF Lesson + Assignment + Curriculum Ingestion — Phase 2.
//
// Business logic and lifecycle enforcement. Permission checks happen at
// the route layer (api/routes.ts); this layer enforces the domain's own
// invariants — status-gated editability, revision CAS, same-organization
// verification for resource source lineage, and the deterministic
// canonical-snapshot/hash computation a release is built from.
//
// This service NEVER writes to Truth Spine, Operational Events, Evidence,
// or curriculum_lesson_completions (learner completion tracking — a
// separate, unrelated domain). Publishing a curriculum release creates no
// learner-facing fact of any kind.
import { randomBytes, createHash } from "node:crypto";
import { query } from "../../../db/client.js";
import { CurriculumCatalogRepo } from "../repo/curriculum-catalog-repo.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import {
  COURSE_STATUS_VALUES,
  RESOURCE_TYPE_VALUES,
  type CourseStatus,
  type CurriculumReleaseSnapshot,
} from "../model/curriculum-catalog.js";

const repo = new CurriculumCatalogRepo();

export interface CatalogActor {
  userId: string;
  organizationId: string;
}

export class CatalogValidationError extends Error {
  constructor(public issues: string[]) {
    super(`Invalid curriculum catalog request: ${issues.join("; ")}`);
    this.name = "CatalogValidationError";
  }
}
export class StaleRevisionError extends Error {
  constructor() { super("curriculum_catalog_stale_revision"); this.name = "StaleRevisionError"; }
}
export class NotFoundError extends Error {
  constructor(what: string) { super(`curriculum_catalog_not_found: ${what}`); this.name = "NotFoundError"; }
}
export class InvalidTransitionError extends Error {
  constructor(message: string) { super(message); this.name = "InvalidTransitionError"; }
}
export class NotEditableError extends Error {
  constructor() { super("course is not editable in its current status (reopen to DRAFT first)"); this.name = "NotEditableError"; }
}

function newId(prefix: string) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function slugify(value: string): string {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "item";
}

// SHF Lesson + Assignment + Curriculum Phase 3 fix: an EXPLICITLY-supplied
// stableKey is caller-controlled identity, not free text to derive a slug
// from — slugify() must only ever run against a title we're deriving a
// default FROM. Every create*() below already only calls slugify() on a
// title fallback; this sanitizer is what an explicit stableKey passes
// through instead. Critically, it preserves ".", which real static
// lesson filenames use throughout (e.g. "student.asl-01") — Phase 2's own
// static-content importer (curriculum-import-service.ts) sets
// stableKey = <filename> and documented that curriculum_lesson_
// completions/Phase 3's release-aware lesson routing depend on that
// value round-tripping unchanged. Before this fix, createLesson()/
// createUnit()/createCourse() silently ran every explicit stableKey
// through slugify() too, turning "student.asl-01" into "student-asl-01"
// and breaking that exact bridge for all 72 real imported lessons.
export function sanitizeStableKey(value: string): string {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 80) || "item";
}

// Phase 4.5A: an optional transaction context lets createCourse/
// createUnit/createLesson/createResource below run inside a caller-
// supplied transaction (e.g. the curriculum-import-job service's
// executeImportJob, which must create Course+Unit+Lesson rows and their
// audit events atomically) without duplicating any of their validation
// or business logic. Every call site that omits `tx` gets the exact
// prior behavior (module-level repo, default autocommitting query) —
// this is purely additive.
export interface CatalogTxContext {
  repo: CurriculumCatalogRepo;
  executor: { query: (sql: string, params?: unknown[]) => Promise<any> };
}
function defaultTx(): CatalogTxContext {
  return { repo, executor: { query } };
}

async function audit(actor: CatalogActor, actionType: string, targetType: string, targetId: string, previous: unknown, next: unknown, executor: { query: (sql: string, params?: unknown[]) => Promise<any> } = { query }) {
  await writeAuditEvent({
    audit_event_id: `audit_${randomBytes(16).toString("hex")}`,
    organization_id: actor.organizationId,
    actor_user_id: actor.userId,
    target_object_type: targetType,
    target_object_id: targetId,
    action_type: actionType,
    previous_state_json: previous ?? null,
    new_state_json: next ?? null,
    correlation_id: `corr_${targetId}_${Date.now()}`,
    source_channel: "api",
  }, executor);
}

// ---------------- Course ----------------
export async function createCourse(actor: CatalogActor, input: { title: string; stableKey?: string; shortDescription?: string | null; fullDescription?: string | null; estimatedDurationMinutes?: number | null }, tx: CatalogTxContext = defaultTx()) {
  const title = String(input.title || "").trim();
  if (!title) throw new CatalogValidationError(['"title" is required']);
  const stableKey = input.stableKey ? sanitizeStableKey(input.stableKey) : slugify(title);
  const course = await tx.repo.createCourse({
    courseId: newId("course"),
    organizationId: actor.organizationId,
    stableKey,
    title,
    shortDescription: input.shortDescription ?? null,
    fullDescription: input.fullDescription ?? null,
    estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
    actorUserId: actor.userId,
  });
  await audit(actor, "curriculum_course.created", "curriculum_course", course.courseId, null, { title, stableKey }, tx.executor);
  return course;
}

export async function getCourse(actor: CatalogActor, courseId: string) {
  const course = await repo.findCourse(actor.organizationId, courseId);
  if (!course) throw new NotFoundError("course");
  return course;
}

export async function listCourses(actor: CatalogActor) {
  return repo.listCourses(actor.organizationId);
}

export async function updateCourse(actor: CatalogActor, courseId: string, expectedRevision: number, fields: { title?: string; shortDescription?: string | null; fullDescription?: string | null; estimatedDurationMinutes?: number | null }) {
  const existing = await repo.findCourse(actor.organizationId, courseId);
  if (!existing) throw new NotFoundError("course");
  if (existing.status !== "DRAFT") throw new NotEditableError();
  if (fields.title !== undefined && !String(fields.title).trim()) throw new CatalogValidationError(['"title" cannot be empty']);
  const updated = await repo.updateCourseFields(actor.organizationId, courseId, expectedRevision, fields, actor.userId);
  if (!updated) throw new StaleRevisionError();
  await audit(actor, "curriculum_course.updated", "curriculum_course", courseId, existing, updated);
  return updated;
}

const TRANSITIONS: Record<string, { from: CourseStatus[]; to: CourseStatus }> = {
  submitForReview: { from: ["DRAFT"], to: "IN_REVIEW" },
  approve: { from: ["IN_REVIEW"], to: "APPROVED" },
  reopen: { from: ["IN_REVIEW", "APPROVED", "PUBLISHED"], to: "DRAFT" },
  retireCourse: { from: ["PUBLISHED"], to: "RETIRED" },
};

async function transition(actor: CatalogActor, courseId: string, expectedRevision: number, action: keyof typeof TRANSITIONS) {
  const spec = TRANSITIONS[action];
  const existing = await repo.findCourse(actor.organizationId, courseId);
  if (!existing) throw new NotFoundError("course");
  if (!spec.from.includes(existing.status)) {
    throw new InvalidTransitionError(`cannot ${action} a course in status ${existing.status}`);
  }
  const updated = await repo.transitionCourseStatus(actor.organizationId, courseId, expectedRevision, spec.from, spec.to, actor.userId);
  if (!updated) throw new StaleRevisionError();
  await audit(actor, `curriculum_course.${action}`, "curriculum_course", courseId, { status: existing.status }, { status: updated.status });
  return updated;
}

export const submitForReview = (actor: CatalogActor, courseId: string, expectedRevision: number) => transition(actor, courseId, expectedRevision, "submitForReview");
export const approveCourse = (actor: CatalogActor, courseId: string, expectedRevision: number) => transition(actor, courseId, expectedRevision, "approve");
export const reopenCourse = (actor: CatalogActor, courseId: string, expectedRevision: number) => transition(actor, courseId, expectedRevision, "reopen");

// ---------------- Unit ----------------
export async function createUnit(actor: CatalogActor, courseId: string, input: { title: string; stableKey?: string; description?: string | null }, tx: CatalogTxContext = defaultTx()) {
  const course = await tx.repo.findCourse(actor.organizationId, courseId);
  if (!course) throw new NotFoundError("course");
  if (course.status !== "DRAFT") throw new NotEditableError();
  const title = String(input.title || "").trim();
  if (!title) throw new CatalogValidationError(['"title" is required']);
  const sequence = await tx.repo.nextUnitSequence(actor.organizationId, courseId);
  const unit = await tx.repo.createUnit({
    unitId: newId("unit"), organizationId: actor.organizationId, courseId,
    stableKey: input.stableKey ? sanitizeStableKey(input.stableKey) : slugify(title), title,
    description: input.description ?? null, sequence,
  });
  await audit(actor, "curriculum_unit.created", "curriculum_unit", unit.unitId, null, { courseId, title }, tx.executor);
  return unit;
}

export async function listUnits(actor: CatalogActor, courseId: string) {
  const course = await repo.findCourse(actor.organizationId, courseId);
  if (!course) throw new NotFoundError("course");
  return repo.listUnitsForCourse(actor.organizationId, courseId, true);
}

export async function updateUnit(actor: CatalogActor, unitId: string, expectedRevision: number, fields: { title?: string; description?: string | null; status?: string }, tx: CatalogTxContext = defaultTx()) {
  const existing = await tx.repo.findUnit(actor.organizationId, unitId);
  if (!existing) throw new NotFoundError("unit");
  const course = await tx.repo.findCourse(actor.organizationId, existing.courseId);
  if (!course || course.status !== "DRAFT") throw new NotEditableError();
  if (fields.status && !["ACTIVE", "ARCHIVED"].includes(fields.status)) throw new CatalogValidationError(['"status" must be ACTIVE or ARCHIVED']);
  const updated = await tx.repo.updateUnit(actor.organizationId, unitId, expectedRevision, fields);
  if (!updated) throw new StaleRevisionError();
  await audit(actor, "curriculum_unit.updated", "curriculum_unit", unitId, existing, updated, tx.executor);
  return updated;
}

export async function reorderUnits(actor: CatalogActor, courseId: string, orderedUnitIds: string[]) {
  const course = await repo.findCourse(actor.organizationId, courseId);
  if (!course) throw new NotFoundError("course");
  if (course.status !== "DRAFT") throw new NotEditableError();
  const existingUnits = await repo.listUnitsForCourse(actor.organizationId, courseId, true);
  const existingIds = new Set(existingUnits.map((u) => u.unitId));
  if (orderedUnitIds.length !== existingUnits.length || !orderedUnitIds.every((id) => existingIds.has(id))) {
    throw new CatalogValidationError(["order must contain exactly the course's existing unit ids"]);
  }
  await repo.reorderUnits(actor.organizationId, courseId, orderedUnitIds);
  await audit(actor, "curriculum_unit.reordered", "curriculum_course", courseId, null, { order: orderedUnitIds });
  return repo.listUnitsForCourse(actor.organizationId, courseId, true);
}

// ---------------- Lesson ----------------
export async function createLesson(actor: CatalogActor, unitId: string, input: { title: string; stableKey?: string; summary?: string | null; objectives?: string[]; estimatedDurationMinutes?: number | null }, tx: CatalogTxContext = defaultTx()) {
  const unit = await tx.repo.findUnit(actor.organizationId, unitId);
  if (!unit) throw new NotFoundError("unit");
  const course = await tx.repo.findCourse(actor.organizationId, unit.courseId);
  if (!course || course.status !== "DRAFT") throw new NotEditableError();
  const title = String(input.title || "").trim();
  if (!title) throw new CatalogValidationError(['"title" is required']);
  if (input.objectives !== undefined && (!Array.isArray(input.objectives) || input.objectives.some((o) => typeof o !== "string"))) {
    throw new CatalogValidationError(['"objectives" must be an array of strings']);
  }
  const sequence = await tx.repo.nextLessonSequence(actor.organizationId, unitId);
  const lesson = await tx.repo.createLesson({
    lessonId: newId("lesson"), organizationId: actor.organizationId, unitId,
    stableKey: input.stableKey ? sanitizeStableKey(input.stableKey) : slugify(title), title,
    summary: input.summary ?? null, objectives: input.objectives ?? [],
    estimatedDurationMinutes: input.estimatedDurationMinutes ?? null, sequence,
  });
  await audit(actor, "curriculum_lesson.created", "curriculum_lesson", lesson.lessonId, null, { unitId, title }, tx.executor);
  return lesson;
}

export async function listLessons(actor: CatalogActor, unitId: string) {
  const unit = await repo.findUnit(actor.organizationId, unitId);
  if (!unit) throw new NotFoundError("unit");
  return repo.listLessonsForUnit(actor.organizationId, unitId, true);
}

export async function updateLesson(actor: CatalogActor, lessonId: string, expectedRevision: number, fields: { title?: string; summary?: string | null; objectives?: string[]; estimatedDurationMinutes?: number | null; status?: string }, tx: CatalogTxContext = defaultTx()) {
  const existing = await tx.repo.findLesson(actor.organizationId, lessonId);
  if (!existing) throw new NotFoundError("lesson");
  const unit = await tx.repo.findUnit(actor.organizationId, existing.unitId);
  const course = unit ? await tx.repo.findCourse(actor.organizationId, unit.courseId) : null;
  if (!course || course.status !== "DRAFT") throw new NotEditableError();
  if (fields.status && !["ACTIVE", "ARCHIVED"].includes(fields.status)) throw new CatalogValidationError(['"status" must be ACTIVE or ARCHIVED']);
  if (fields.objectives !== undefined && (!Array.isArray(fields.objectives) || fields.objectives.some((o) => typeof o !== "string"))) {
    throw new CatalogValidationError(['"objectives" must be an array of strings']);
  }
  const updated = await tx.repo.updateLesson(actor.organizationId, lessonId, expectedRevision, fields);
  if (!updated) throw new StaleRevisionError();
  await audit(actor, "curriculum_lesson.updated", "curriculum_lesson", lessonId, existing, updated, tx.executor);
  return updated;
}

export async function reorderLessons(actor: CatalogActor, unitId: string, orderedLessonIds: string[]) {
  const unit = await repo.findUnit(actor.organizationId, unitId);
  if (!unit) throw new NotFoundError("unit");
  const course = await repo.findCourse(actor.organizationId, unit.courseId);
  if (!course || course.status !== "DRAFT") throw new NotEditableError();
  const existingLessons = await repo.listLessonsForUnit(actor.organizationId, unitId, true);
  const existingIds = new Set(existingLessons.map((l) => l.lessonId));
  if (orderedLessonIds.length !== existingLessons.length || !orderedLessonIds.every((id) => existingIds.has(id))) {
    throw new CatalogValidationError(["order must contain exactly the unit's existing lesson ids"]);
  }
  await repo.reorderLessons(actor.organizationId, unitId, orderedLessonIds);
  await audit(actor, "curriculum_lesson.reordered", "curriculum_unit", unitId, null, { order: orderedLessonIds });
  return repo.listLessonsForUnit(actor.organizationId, unitId, true);
}

// ---------------- Resource ----------------
export async function createResource(actor: CatalogActor, input: { title: string; resourceType: string; sourceAssetId?: string | null; sourceDocumentVersionId?: string | null; description?: string | null; externalUrl?: string | null }, tx: CatalogTxContext = defaultTx()) {
  const title = String(input.title || "").trim();
  if (!title) throw new CatalogValidationError(['"title" is required']);
  if (!RESOURCE_TYPE_VALUES.includes(input.resourceType as any)) throw new CatalogValidationError([`"resourceType" must be one of: ${RESOURCE_TYPE_VALUES.join(", ")}`]);

  let sourceAssetId: string | null = input.sourceAssetId ?? null;
  let sourceDocumentVersionId: string | null = input.sourceDocumentVersionId ?? null;

  if (sourceAssetId) {
    const asset = await tx.repo.findSourceAsset(actor.organizationId, sourceAssetId);
    if (!asset) throw new CatalogValidationError(["sourceAssetId does not exist in your organization"]);
  }
  if (sourceDocumentVersionId) {
    const version = await tx.repo.findSourceDocumentVersion(sourceDocumentVersionId);
    // Cross-organization source linkage rejected here (application layer)
    // because migration 058's source_document_versions table has no
    // (id, organization_id) composite unique to FK against — see
    // migration 059's header note. This check is load-bearing, not
    // decorative: never trust the caller's own organization claim.
    if (!version || version.organizationId !== actor.organizationId) {
      throw new CatalogValidationError(["sourceDocumentVersionId does not exist in your organization"]);
    }
  }

  const resource = await tx.repo.createResource({
    resourceId: newId("resource"), organizationId: actor.organizationId,
    sourceAssetId, sourceDocumentVersionId, title,
    resourceType: input.resourceType, description: input.description ?? null, externalUrl: input.externalUrl ?? null,
    actorUserId: actor.userId,
  });
  await audit(actor, "curriculum_resource.created", "curriculum_resource", resource.resourceId, null, { title, resourceType: input.resourceType, sourceAssetId, sourceDocumentVersionId }, tx.executor);
  return resource;
}

export async function listResources(actor: CatalogActor) {
  return repo.listResources(actor.organizationId);
}

// Phase 4.5D: needed for re-import MODIFIED handling — Phase 2 never
// built this because nothing before the importer needed to edit a
// resource's title/description/URL after creation. No expectedRevision
// parameter because curriculum_resources has no revision column (see
// the repo method's own comment).
export async function updateResource(actor: CatalogActor, resourceId: string, fields: { title?: string; description?: string | null; externalUrl?: string | null }, tx: CatalogTxContext = defaultTx()) {
  const existing = await tx.repo.findResource(actor.organizationId, resourceId);
  if (!existing) throw new NotFoundError("resource");
  if (fields.title !== undefined && !String(fields.title).trim()) throw new CatalogValidationError(['"title" cannot be empty']);
  const updated = await tx.repo.updateResource(actor.organizationId, resourceId, fields);
  if (!updated) throw new NotFoundError("resource");
  await audit(actor, "curriculum_resource.updated", "curriculum_resource", resourceId, existing, updated, tx.executor);
  return updated;
}

export async function attachResource(actor: CatalogActor, lessonId: string, resourceId: string, sequence = 1, tx: CatalogTxContext = defaultTx()) {
  const lesson = await tx.repo.findLesson(actor.organizationId, lessonId);
  if (!lesson) throw new NotFoundError("lesson");
  const resource = await tx.repo.findResource(actor.organizationId, resourceId);
  if (!resource) throw new NotFoundError("resource");
  const unit = await tx.repo.findUnit(actor.organizationId, lesson.unitId);
  const course = unit ? await tx.repo.findCourse(actor.organizationId, unit.courseId) : null;
  if (!course || course.status !== "DRAFT") throw new NotEditableError();
  await tx.repo.attachResourceToLesson(actor.organizationId, lessonId, resourceId, sequence);
  await audit(actor, "curriculum_lesson_resource.attached", "curriculum_lesson", lessonId, null, { resourceId }, tx.executor);
}

export async function detachResource(actor: CatalogActor, lessonId: string, resourceId: string, tx: CatalogTxContext = defaultTx()) {
  const lesson = await tx.repo.findLesson(actor.organizationId, lessonId);
  if (!lesson) throw new NotFoundError("lesson");
  const unit = await tx.repo.findUnit(actor.organizationId, lesson.unitId);
  const course = unit ? await tx.repo.findCourse(actor.organizationId, unit.courseId) : null;
  if (!course || course.status !== "DRAFT") throw new NotEditableError();
  await tx.repo.detachResourceFromLesson(actor.organizationId, lessonId, resourceId);
  await audit(actor, "curriculum_lesson_resource.detached", "curriculum_lesson", lessonId, { resourceId }, null, tx.executor);
}

// ---------------- Arcade linkage (Phase 4.5D, Step 19) ----------------
// Definition linkage ONLY. Never reads or writes arcade_attempts/
// arcade_results — this asserts "this Lesson's curriculum references
// this Arcade Activity," nothing about any learner ever having played
// it. The Completion Policy Engine's ARCADE requirement adapter is
// entirely independent of this table (see migration 064's header).
export class ArcadeActivityNotFoundError extends Error {
  constructor() { super("arcade_activity_not_found"); this.name = "ArcadeActivityNotFoundError"; }
}

export async function linkArcadeActivityBySlug(actor: CatalogActor, lessonId: string, slug: string, sequence = 1, sourceReference: string | null = null, tx: CatalogTxContext = defaultTx()) {
  const lesson = await tx.repo.findLesson(actor.organizationId, lessonId);
  if (!lesson) throw new NotFoundError("lesson");
  const unit = await tx.repo.findUnit(actor.organizationId, lesson.unitId);
  const course = unit ? await tx.repo.findCourse(actor.organizationId, unit.courseId) : null;
  if (!course || course.status !== "DRAFT") throw new NotEditableError();
  const activity = await tx.repo.findArcadeActivityBySlug(slug);
  if (!activity) throw new ArcadeActivityNotFoundError();
  const link = await tx.repo.createLessonArcadeLink({
    id: newId("cimlink"), organizationId: actor.organizationId, curriculumLessonId: lessonId,
    arcadeActivityId: activity.arcadeActivityId, sequence, sourceReference,
  });
  await audit(actor, "curriculum_lesson_arcade_activity.linked", "curriculum_lesson", lessonId, null, { arcadeActivityId: activity.arcadeActivityId, slug }, tx.executor);
  return { linkId: link.id, arcadeActivityId: activity.arcadeActivityId, slug: activity.slug, title: activity.title };
}

export async function listArcadeLinksForLesson(actor: CatalogActor, lessonId: string) {
  return repo.listArcadeLinksForLesson(actor.organizationId, lessonId);
}

// ---------------- Publish / Release ----------------
// Deterministic canonical snapshot: stable_key-ordered content only, no
// DB-internal ids/timestamps that aren't part of instructional identity
// (Step 14 of the phase brief). Resource entries keep resourceId since a
// resource genuinely IS identified by that id (no other stable key
// exists for it), but never include created_at/status/actor fields.
async function buildReleaseSnapshot(organizationId: string, courseId: string): Promise<CurriculumReleaseSnapshot> {
  const course = await repo.findCourse(organizationId, courseId);
  if (!course) throw new NotFoundError("course");
  const units = await repo.listUnitsForCourse(organizationId, courseId, false);
  const unitSnapshots = [];
  for (const unit of units) {
    const lessons = await repo.listLessonsForUnit(organizationId, unit.unitId, false);
    const lessonSnapshots = [];
    for (const lesson of lessons) {
      const resources = await repo.listResourcesForLesson(organizationId, lesson.lessonId);
      const arcadeLinks = await repo.listArcadeLinksForLesson(organizationId, lesson.lessonId);
      const assessmentDefinition = await repo.findAssessmentDefinitionByLesson(organizationId, lesson.lessonId);
      const reflectionDefinition = await repo.findReflectionDefinitionByLesson(organizationId, lesson.lessonId);
      const practiceDefinition = await repo.findPracticeDefinitionByLesson(organizationId, lesson.lessonId);
      lessonSnapshots.push({
        stableKey: lesson.stableKey, title: lesson.title, summary: lesson.summary,
        objectives: lesson.objectives, estimatedDurationMinutes: lesson.estimatedDurationMinutes, sequence: lesson.sequence,
        // Phase 4.5D: externalUrl/description were missing from this
        // snapshot before this phase (confirmed by fresh audit) — a
        // resource's URL or description could be edited post-publish
        // without changing the release's content hash or being detected
        // as drift. Both are now captured so historical link CONTENT,
        // not just identity, is frozen at publish time.
        resources: resources.map((r) => ({ resourceId: r.resourceId, title: r.title, resourceType: r.resourceType, description: r.description, externalUrl: r.externalUrl, sourceAssetId: r.sourceAssetId, sourceDocumentVersionId: r.sourceDocumentVersionId })),
        // Snapshots slug/title at publish time, not just the FK id — the
        // live arcade_activities row is a separate domain's mutable
        // record; capturing its identity fields here means a later edit
        // to that row can never silently rewrite what THIS release says
        // was linked (Step 32).
        arcadeLinks: arcadeLinks.map((l) => ({ arcadeActivityId: l.arcadeActivityId, slug: l.slug, title: l.title })),
        assessmentDefinition: assessmentDefinition ? { assessmentDefinitionId: assessmentDefinition.assessmentDefinitionId, items: assessmentDefinition.items } : null,
        reflectionDefinition: reflectionDefinition ? { reflectionDefinitionId: reflectionDefinition.reflectionDefinitionId, items: reflectionDefinition.items } : null,
        practiceDefinition: practiceDefinition ? {
          practiceDefinitionId: practiceDefinition.practiceDefinitionId,
          title: practiceDefinition.title,
          instructions: practiceDefinition.instructions,
          completionMode: practiceDefinition.completionMode,
          completionActionLabel: practiceDefinition.completionActionLabel,
          items: practiceDefinition.items,
        } : null,
      });
    }
    unitSnapshots.push({ stableKey: unit.stableKey, title: unit.title, description: unit.description, sequence: unit.sequence, lessons: lessonSnapshots });
  }
  return {
    course: { stableKey: course.stableKey, title: course.title, shortDescription: course.shortDescription, fullDescription: course.fullDescription, estimatedDurationMinutes: course.estimatedDurationMinutes },
    units: unitSnapshots,
  };
}

// Exported for Phase 4.5B's structured source adapter, which hashes
// source lesson payloads for re-import diffing (Step 9/16) using this
// exact same deterministic key-ordering — one canonicalization rule for
// the whole domain, not two independently-maintained copies.
export function canonicalJsonStringify(value: unknown): string {
  // Deterministic key ordering so the hash is stable regardless of
  // JS object insertion order.
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val).sort().reduce((acc: Record<string, unknown>, k) => { acc[k] = (val as any)[k]; return acc; }, {});
    }
    return val;
  });
}

export async function publishCourse(actor: CatalogActor, courseId: string, expectedRevision: number) {
  const course = await repo.findCourse(actor.organizationId, courseId);
  if (!course) throw new NotFoundError("course");
  if (course.status !== "APPROVED") throw new InvalidTransitionError(`cannot publish a course in status ${course.status} (must be APPROVED)`);
  if (course.revision !== expectedRevision) throw new StaleRevisionError();

  const snapshot = await buildReleaseSnapshot(actor.organizationId, courseId);
  const canonical = canonicalJsonStringify(snapshot);
  const contentHash = createHash("sha256").update(canonical).digest("hex");
  const versionNumber = await repo.nextReleaseVersion(actor.organizationId, courseId);

  const release = await repo.createRelease({
    releaseId: newId("release"), organizationId: actor.organizationId, courseId,
    versionNumber, snapshot, contentHash, publishedByUserId: actor.userId,
  });

  const updatedCourse = await repo.transitionCourseStatus(actor.organizationId, courseId, expectedRevision, ["APPROVED"], "PUBLISHED", actor.userId);
  if (!updatedCourse) throw new StaleRevisionError();

  await audit(actor, "curriculum_release.published", "curriculum_release", release.releaseId, null, { courseId, versionNumber, contentHash });
  return { release, course: updatedCourse };
}

export async function retireRelease(actor: CatalogActor, courseId: string, releaseId: string) {
  const release = await repo.findRelease(actor.organizationId, releaseId);
  if (!release || release.courseId !== courseId) throw new NotFoundError("release");
  const updated = await repo.retireRelease(actor.organizationId, releaseId, actor.userId);
  if (!updated) throw new InvalidTransitionError("release is not PUBLISHED");
  await audit(actor, "curriculum_release.retired", "curriculum_release", releaseId, { status: release.status }, { status: updated.status });
  return updated;
}

export async function retireCourse(actor: CatalogActor, courseId: string, expectedRevision: number) {
  return transition(actor, courseId, expectedRevision, "retireCourse");
}

export async function listReleases(actor: CatalogActor, courseId: string) {
  const course = await repo.findCourse(actor.organizationId, courseId);
  if (!course) throw new NotFoundError("course");
  return repo.listReleasesForCourse(actor.organizationId, courseId);
}

export async function getRelease(actor: CatalogActor, releaseId: string) {
  const release = await repo.findRelease(actor.organizationId, releaseId);
  if (!release) throw new NotFoundError("release");
  return release;
}
