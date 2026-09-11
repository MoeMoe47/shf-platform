// SHF Lesson + Assignment + Curriculum — Phase 4.5A: Curriculum Import
// Job, Candidate Model, and Transaction-Safe Structured Import
// Foundation.
//
// Orchestration only. The authoritative destination for imported
// curriculum remains curriculum-catalog-service.ts's createCourse/
// createUnit/createLesson — this file never writes catalog rows by any
// other path, and it never publishes, assigns, or writes learner truth
// of any kind (Steps 24-26).
//
// Job creation performs candidate generation AND validation synchronously
// in one call — there is no async worker in this phase (Phase 4.6), so a
// separate persisted "VALIDATING" state would never be observable to a
// concurrent reader. See migration 062's header for the full lifecycle
// rationale.
import { randomBytes } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { query } from "../../../db/client.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { CurriculumImportJobRepo, newImportId } from "../repo/curriculum-import-job-repo.js";
import { CurriculumCatalogRepo } from "../repo/curriculum-catalog-repo.js";
import { createCourse, createUnit, createLesson, updateUnit, updateLesson, createResource, updateResource, attachResource, linkArcadeActivityBySlug, sanitizeStableKey, type CatalogActor, type CatalogTxContext } from "./curriculum-catalog-service.js";
import { readStructuredSource, SourceAdapterError, listImportableCurricula, type StructuredCurriculumSource } from "./curriculum-import-source-adapter.js";
import type { CurriculumImportJobRow, CurriculumImportCandidateRow, CandidateType } from "../model/curriculum-import-job.js";
import { RESOURCE_TYPE_VALUES } from "../model/curriculum-catalog.js";
import { buildStructuredSourceFromDocument, RawDocumentError } from "./raw-document-import-service.js";

export { listImportableCurricula };

const jobRepo = new CurriculumImportJobRepo();

export class ImportValidationError extends Error {
  constructor(public issues: string[]) { super(`Invalid curriculum import request: ${issues.join("; ")}`); this.name = "ImportValidationError"; }
}
export class ImportNotFoundError extends Error {
  constructor(what: string) { super(`curriculum_import_not_found: ${what}`); this.name = "ImportNotFoundError"; }
}
export class ImportInvalidTransitionError extends Error {
  constructor(message: string) { super(message); this.name = "ImportInvalidTransitionError"; }
}
export class ImportStaleRevisionError extends Error {
  constructor() { super("curriculum_import_stale_revision"); this.name = "ImportStaleRevisionError"; }
}
export class ImportExecutionError extends Error {
  constructor(message: string) { super(message); this.name = "ImportExecutionError"; }
}

async function auditImport(actor: CatalogActor, actionType: string, targetId: string, previous: unknown, next: unknown, executor: { query: (sql: string, params?: unknown[]) => Promise<any> } = { query }) {
  await writeAuditEvent({
    audit_event_id: `audit_${randomBytes(16).toString("hex")}`,
    organization_id: actor.organizationId,
    actor_user_id: actor.userId,
    target_object_type: "curriculum_import_job",
    target_object_id: targetId,
    action_type: actionType,
    previous_state_json: previous ?? null,
    new_state_json: next ?? null,
    correlation_id: `corr_${targetId}_${Date.now()}`,
    source_channel: "api",
  }, executor);
}

// ---------------- Candidate tree helpers ----------------

export interface CandidateNode extends CurriculumImportCandidateRow {
  children: CandidateNode[];
}

export function buildCandidateTree(candidates: CurriculumImportCandidateRow[]): CandidateNode[] {
  const nodes = new Map<string, CandidateNode>(candidates.map((c) => [c.importCandidateId, { ...c, children: [] }]));
  const roots: CandidateNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentCandidateId && nodes.has(node.parentCandidateId)) {
      nodes.get(node.parentCandidateId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// ---------------- Validation (Step 7) ----------------

interface DraftCandidate {
  key: string; // temp local key used only during graph construction, before DB ids exist
  candidateType: CandidateType;
  parentKey: string | null;
  stableKey: string;
  title: string;
  sequence: number;
  sourceReference: string | null;
  payload: Record<string, unknown>;
  sourceHash: string | null;
  diffStatus: "NEW" | "UNCHANGED" | "MODIFIED" | "MISSING_FROM_SOURCE" | "CONFLICT" | null;
  previousCandidateId: string | null;
  createdEntityId: string | null;
}

// Phase 4.5D (Steps 3, 8, 22-24): resolves one games[] reference against
// real arcade_activities by slug (the only deterministic key real source
// data provides) and, defensively, an explicit arcadeActivityId field if
// the source ever supplies one — never fuzzy/title matching, never AI.
// A CONFLICT is only possible if both signals resolve to DIFFERENT real
// activities; with slug alone (globally unique) that can never happen,
// so this path exists specifically to make ambiguity detectable, not to
// invent a scenario real ASL/Data Center content ever triggers today.
async function resolveArcadeMatch(catalogRepo: CurriculumCatalogRepo, gameRef: { gameId: string; raw: Record<string, unknown> }): Promise<{ status: "MATCHED" | "UNRESOLVED" | "CONFLICT"; activity: { arcadeActivityId: string; slug: string; title: string } | null }> {
  const explicitId = typeof gameRef.raw.arcadeActivityId === "string" && gameRef.raw.arcadeActivityId ? gameRef.raw.arcadeActivityId : null;
  const bySlug = await catalogRepo.findArcadeActivityBySlug(gameRef.gameId);
  const byExplicit = explicitId ? await catalogRepo.findArcadeActivityById(explicitId) : null;
  if (byExplicit && bySlug && byExplicit.arcadeActivityId !== bySlug.arcadeActivityId) return { status: "CONFLICT", activity: null };
  const activity = byExplicit || bySlug;
  return activity ? { status: "MATCHED", activity } : { status: "UNRESOLVED", activity: null };
}

async function buildDraft(
  source: StructuredCurriculumSource, existingCourse: any, existingUnits: any[], existingLessons: Map<string, any[]>,
  existingResourcesByLessonId: Map<string, any[]>, existingArcadeLinksByLessonId: Map<string, any[]>,
  previousByEntity: Map<string, CurriculumImportCandidateRow>, catalogRepo: CurriculumCatalogRepo,
): Promise<DraftCandidate[]> {
  const draft: DraftCandidate[] = [];
  const coursePrevious = existingCourse ? previousByEntity.get(`COURSE:${existingCourse.courseId}`) : null;
  const courseDiff = existingCourse
    ? (coursePrevious?.sourceHash === source.sourceHash ? "UNCHANGED" : coursePrevious ? "MODIFIED" : "CONFLICT")
    : "NEW";
  draft.push({ key: "course:root", candidateType: "COURSE", parentKey: null, stableKey: sanitizeStableKey(source.courseStableKey), title: source.courseTitle, sequence: 1, sourceReference: source.sourceKey, payload: { sourceKey: source.sourceKey }, sourceHash: source.sourceHash, diffStatus: courseDiff, previousCandidateId: coursePrevious?.importCandidateId || null, createdEntityId: existingCourse?.courseId || null });

  const seenUnitIds = new Set<string>();
  for (const unit of source.units) {
    const existingUnit = existingUnits.find((candidate) => candidate.stableKey === sanitizeStableKey(unit.stableKey));
    if (existingUnit) seenUnitIds.add(existingUnit.unitId);
    const previous = existingUnit ? previousByEntity.get(`UNIT:${existingUnit.unitId}`) : null;
    const diffStatus = existingUnit ? (previous?.sourceHash === unit.sourceHash ? "UNCHANGED" : previous ? "MODIFIED" : "CONFLICT") : "NEW";
    const unitKey = `unit:${unit.stableKey}`;
    draft.push({ key: unitKey, candidateType: "UNIT", parentKey: "course:root", stableKey: sanitizeStableKey(unit.stableKey), title: unit.title, sequence: unit.sequence, sourceReference: unit.sourceReference, payload: {}, sourceHash: unit.sourceHash, diffStatus, previousCandidateId: previous?.importCandidateId || null, createdEntityId: existingUnit?.unitId || null });
    const existingUnitLessons = existingUnit ? (existingLessons.get(existingUnit.unitId) || []) : [];
    const seenLessonIds = new Set<string>();
    for (const lesson of unit.lessons) {
      const existingLesson = existingUnitLessons.find((candidate) => candidate.stableKey === sanitizeStableKey(lesson.stableKey));
      if (existingLesson) seenLessonIds.add(existingLesson.lessonId);
      const lessonPrevious = existingLesson ? previousByEntity.get(`LESSON:${existingLesson.lessonId}`) : null;
      const lessonDiff = existingLesson ? (lessonPrevious?.sourceHash === lesson.sourceHash ? "UNCHANGED" : lessonPrevious ? "MODIFIED" : "CONFLICT") : "NEW";
      const lessonKey = `lesson:${unit.stableKey}:${lesson.stableKey}`;
      draft.push({ key: lessonKey, candidateType: "LESSON", parentKey: unitKey, stableKey: sanitizeStableKey(lesson.stableKey), title: lesson.title, sequence: lesson.sequence, sourceReference: lesson.sourceReference, payload: lesson.raw, sourceHash: lesson.sourceHash, diffStatus: lessonDiff, previousCandidateId: lessonPrevious?.importCandidateId || null, createdEntityId: existingLesson?.lessonId || null });

      // ---------------- RESOURCE candidates (Steps 2-9) ----------------
      // Identity lives entirely in the import-candidate layer's own
      // stableKey (src-derived, deterministic) — curriculum_resources has
      // no stable_key column of its own, so continuity is established by
      // looking up which PREVIOUS candidate most recently produced each
      // existing attached resource, exactly the same lineage mechanism
      // already used for Course/Unit/Lesson (Step 21).
      const existingResourcesForLesson = existingLesson ? (existingResourcesByLessonId.get(existingLesson.lessonId) || []) : [];
      const resourceMatchByStableKey = new Map<string, any>();
      for (const resource of existingResourcesForLesson) {
        const previous = previousByEntity.get(`RESOURCE:${resource.resourceId}`);
        if (previous) resourceMatchByStableKey.set(previous.stableKey, resource);
      }
      const seenResourceStableKeys = new Set<string>();
      for (const media of lesson.resources) {
        const stableKey = sanitizeStableKey(media.stableKey);
        seenResourceStableKeys.add(stableKey);
        const matched = resourceMatchByStableKey.get(stableKey);
        const previous = matched ? previousByEntity.get(`RESOURCE:${matched.resourceId}`) : null;
        const diffStatus = matched ? (previous?.sourceHash === media.sourceHash ? "UNCHANGED" : previous ? "MODIFIED" : "CONFLICT") : "NEW";
        draft.push({
          key: `resource:${lessonKey}:${stableKey}`, candidateType: "RESOURCE", parentKey: lessonKey,
          stableKey, title: media.title, sequence: media.sequence, sourceReference: media.sourceReference,
          payload: { resourceType: "MEDIA", description: media.description, externalUrl: media.externalUrl, accessibilityWarnings: media.accessibilityWarnings, media: media.raw },
          sourceHash: media.sourceHash, diffStatus, previousCandidateId: previous?.importCandidateId || null, createdEntityId: matched?.resourceId || null,
        });
      }
      for (const missing of existingResourcesForLesson) {
        const previous = previousByEntity.get(`RESOURCE:${missing.resourceId}`);
        if (!previous || seenResourceStableKeys.has(previous.stableKey)) continue;
        draft.push({
          key: `missing:resource:${missing.resourceId}`, candidateType: "RESOURCE", parentKey: lessonKey,
          stableKey: previous.stableKey, title: missing.title, sequence: 999, sourceReference: null,
          payload: { canonicalEntityId: missing.resourceId }, sourceHash: previous.sourceHash, diffStatus: "MISSING_FROM_SOURCE",
          previousCandidateId: previous.importCandidateId, createdEntityId: missing.resourceId,
        });
      }

      // ---------------- ARCADE_LINK candidates (Steps 18-24) ----------------
      const existingArcadeLinksForLesson = existingLesson ? (existingArcadeLinksByLessonId.get(existingLesson.lessonId) || []) : [];
      const arcadeMatchBySlug = new Map<string, any>();
      for (const link of existingArcadeLinksForLesson) arcadeMatchBySlug.set(link.slug, link);
      const seenArcadeSlugs = new Set<string>();
      for (const gameRef of lesson.arcadeReferences) {
        const match = await resolveArcadeMatch(catalogRepo, gameRef);
        const stableKey = sanitizeStableKey(gameRef.gameId);
        seenArcadeSlugs.add(gameRef.gameId);
        const existingLink = arcadeMatchBySlug.get(gameRef.gameId);
        const previous = existingLink ? previousByEntity.get(`ARCADE_LINK:${existingLink.id}`) : null;
        const diffStatus = existingLink ? (previous?.sourceHash === gameRef.sourceHash ? "UNCHANGED" : previous ? "MODIFIED" : "CONFLICT") : "NEW";
        draft.push({
          key: `arcade:${lessonKey}:${stableKey}`, candidateType: "ARCADE_LINK", parentKey: lessonKey,
          stableKey, title: gameRef.title, sequence: gameRef.sequence, sourceReference: gameRef.sourceReference,
          payload: { gameId: gameRef.gameId, matchStatus: match.status, matchedActivity: match.activity, source: gameRef.raw },
          sourceHash: gameRef.sourceHash, diffStatus, previousCandidateId: previous?.importCandidateId || null, createdEntityId: existingLink?.id || null,
        });
      }
      for (const missing of existingArcadeLinksForLesson) {
        const previous = previousByEntity.get(`ARCADE_LINK:${missing.id}`);
        if (!previous || seenArcadeSlugs.has(missing.slug)) continue;
        draft.push({
          key: `missing:arcade:${missing.id}`, candidateType: "ARCADE_LINK", parentKey: lessonKey,
          stableKey: previous.stableKey, title: missing.title, sequence: 999, sourceReference: null,
          payload: { canonicalEntityId: missing.id, gameId: missing.slug, matchStatus: "MATCHED" }, sourceHash: previous.sourceHash, diffStatus: "MISSING_FROM_SOURCE",
          previousCandidateId: previous.importCandidateId, createdEntityId: missing.id,
        });
      }
    }
    for (const missing of existingUnitLessons.filter((lesson) => !seenLessonIds.has(lesson.lessonId))) {
      const previous = previousByEntity.get(`LESSON:${missing.lessonId}`);
      draft.push({ key: `missing:lesson:${missing.lessonId}`, candidateType: "LESSON", parentKey: unitKey, stableKey: missing.stableKey, title: missing.title, sequence: missing.sequence, sourceReference: null, payload: { canonicalEntityId: missing.lessonId }, sourceHash: previous?.sourceHash || null, diffStatus: "MISSING_FROM_SOURCE", previousCandidateId: previous?.importCandidateId || null, createdEntityId: missing.lessonId });
    }
  }
  for (const missing of existingUnits.filter((unit) => !seenUnitIds.has(unit.unitId))) {
    const previous = previousByEntity.get(`UNIT:${missing.unitId}`);
    draft.push({ key: `missing:unit:${missing.unitId}`, candidateType: "UNIT", parentKey: "course:root", stableKey: missing.stableKey, title: missing.title, sequence: missing.sequence, sourceReference: null, payload: { canonicalEntityId: missing.unitId }, sourceHash: previous?.sourceHash || null, diffStatus: "MISSING_FROM_SOURCE", previousCandidateId: previous?.importCandidateId || null, createdEntityId: missing.unitId });
    for (const missingLesson of existingLessons.get(missing.unitId) || []) {
      const lessonPrevious = previousByEntity.get(`LESSON:${missingLesson.lessonId}`);
      draft.push({ key: `missing:lesson:${missingLesson.lessonId}`, candidateType: "LESSON", parentKey: `missing:unit:${missing.unitId}`, stableKey: missingLesson.stableKey, title: missingLesson.title, sequence: missingLesson.sequence, sourceReference: null, payload: { canonicalEntityId: missingLesson.lessonId }, sourceHash: lessonPrevious?.sourceHash || null, diffStatus: "MISSING_FROM_SOURCE", previousCandidateId: lessonPrevious?.importCandidateId || null, createdEntityId: missingLesson.lessonId });
    }
  }
  return draft;
}

function validateDraftGraph(draft: DraftCandidate[], organizationId: string, existingCourseStableKeys: Set<string>): Map<string, string[]> {
  const errorsByKey = new Map<string, string[]>();
  const addError = (key: string, message: string) => {
    const list = errorsByKey.get(key) ?? [];
    list.push(message);
    errorsByKey.set(key, list);
  };

  const roots = draft.filter((c) => c.parentKey === null);
  const courseRoots = roots.filter((c) => c.candidateType === "COURSE");
  if (courseRoots.length !== 1) {
    for (const c of roots) addError(c.key, "exactly one COURSE root candidate is required per import job");
  }

  const byParent = new Map<string | null, DraftCandidate[]>();
  for (const c of draft) {
    const list = byParent.get(c.parentKey) ?? [];
    list.push(c);
    byParent.set(c.parentKey, list);
  }

  for (const c of draft) {
    // Required title.
    if (!String(c.title || "").trim()) addError(c.key, '"title" is required');

    // Non-empty stable key. Candidates are already run through the exact
    // same sanitizeStableKey() the catalog service itself applies (Step
    // 8) at graph-construction time below, so this only guards against
    // an empty result (e.g. a filename that sanitizes to "").
    if (!c.stableKey) addError(c.key, '"stableKey" is required');

    // Missing source candidates intentionally have no current source
    // reference; they preserve the canonical entity for human review.
    if (!c.sourceReference && c.diffStatus !== "MISSING_FROM_SOURCE") addError(c.key, "source_reference is required for structured-source candidates");

    // Ambiguous continuity must never be silently executed as a new
    // canonical graph.
    if (c.diffStatus === "CONFLICT") addError(c.key, "candidate continuity is ambiguous and requires review");

    // Payload must be an object (Step 22 malformed-payload check).
    if (!c.payload || typeof c.payload !== "object" || Array.isArray(c.payload)) addError(c.key, "payload must be a JSON object");

    // Parent-type validity.
    if (c.candidateType === "UNIT") {
      const parent = draft.find((p) => p.key === c.parentKey);
      if (!parent || parent.candidateType !== "COURSE") addError(c.key, "a UNIT candidate must have a COURSE candidate as its parent");
    }
    if (c.candidateType === "LESSON") {
      const parent = draft.find((p) => p.key === c.parentKey);
      if (!parent || parent.candidateType !== "UNIT") addError(c.key, "a LESSON candidate must have a UNIT candidate as its parent");
    }
    if (c.candidateType === "RESOURCE") {
      const parent = draft.find((p) => p.key === c.parentKey);
      if (!parent || parent.candidateType !== "LESSON") addError(c.key, "a RESOURCE candidate must have a LESSON candidate as its parent");
      // URL safety (Step 10): external resource references fail closed
      // on dangerous schemes. A relative path (no scheme at all) or
      // http(s) is accepted; anything else is rejected outright.
      const externalUrl = (c.payload as any)?.externalUrl;
      if (typeof externalUrl === "string" && /^\s*(javascript|data|vbscript|file):/i.test(externalUrl)) {
        addError(c.key, `unsafe external URL scheme: "${externalUrl}"`);
      }
      // Defense-in-depth (Step 9): the adapter only ever emits MEDIA
      // today, but the candidate/catalog boundary must reject anything
      // outside the real canonical enum on principle, not by convention.
      const resourceType = (c.payload as any)?.resourceType;
      if (resourceType && !RESOURCE_TYPE_VALUES.includes(resourceType)) {
        addError(c.key, `resourceType "${resourceType}" is not a supported canonical resource type`);
      }
    }
    if (c.candidateType === "ARCADE_LINK") {
      const parent = draft.find((p) => p.key === c.parentKey);
      if (!parent || parent.candidateType !== "LESSON") addError(c.key, "an ARCADE_LINK candidate must have a LESSON candidate as its parent");
      // Step 23-24: an unresolved or ambiguous Arcade reference must never
      // silently execute as a real link — represented honestly via the
      // same validation mechanism every other candidate type already uses.
      const matchStatus = (c.payload as any)?.matchStatus;
      if (matchStatus === "UNRESOLVED") addError(c.key, `no matching canonical Arcade Activity found for game reference "${(c.payload as any)?.gameId}" — needs review`);
      if (matchStatus === "CONFLICT") addError(c.key, `ambiguous Arcade Activity match for game reference "${(c.payload as any)?.gameId}" — multiple candidate activities resolved differently, cannot execute automatically`);
    }
  }

  // Duplicate stable keys among siblings.
  for (const [, siblings] of byParent) {
    const seen = new Map<string, DraftCandidate>();
    for (const c of siblings) {
      const dupe = seen.get(c.stableKey);
      if (dupe) { addError(c.key, `duplicate stableKey "${c.stableKey}" among sibling candidates`); }
      else seen.set(c.stableKey, c);
    }
  }

  // A different course with the same stable key remains a hard conflict.
  // The existing course itself is handled by continuity-aware re-import.
  for (const c of courseRoots) if (existingCourseStableKeys.has(c.stableKey)) addError(c.key, `a different course with stable key "${c.stableKey}" already exists in this organization`);

  return errorsByKey;
}

// ---------------- Create (Step 12: generation + validation, one call) ----------------

export async function createImportJob(
  actor: CatalogActor,
  input: { importType: "STATIC_JSON"; sourceKey: string } | { importType: "RAW_DOCUMENT"; sourceDocumentVersionId: string; documentKey?: string },
): Promise<{ job: CurriculumImportJobRow; candidates: CurriculumImportCandidateRow[] }> {
  if (input.importType !== "STATIC_JSON" && input.importType !== "RAW_DOCUMENT") {
    throw new ImportValidationError([`"importType" must be one of: STATIC_JSON, RAW_DOCUMENT`]);
  }

  let source: StructuredCurriculumSource;
  let sourceKey: string;
  let sourceDocumentVersionId: string | null = null;
  if (input.importType === "STATIC_JSON") {
    sourceKey = String(input.sourceKey || "").trim();
    if (!sourceKey) throw new ImportValidationError(['"sourceKey" is required']);
    try {
      source = readStructuredSource(sourceKey);
    } catch (err: any) {
      if (err instanceof SourceAdapterError) throw new ImportValidationError([err.message]);
      throw err;
    }
  } else {
    sourceDocumentVersionId = String(input.sourceDocumentVersionId || "").trim();
    if (!sourceDocumentVersionId) throw new ImportValidationError(['"sourceDocumentVersionId" is required']);
    try {
      source = await buildStructuredSourceFromDocument({ user_id: actor.userId, organization_id: actor.organizationId }, sourceDocumentVersionId, input.documentKey);
    } catch (err: any) {
      if (err instanceof RawDocumentError) {
        // A cross-org / nonexistent Source Document Version must read as
        // 404, not a generic 422 validation failure (Step 49) — never
        // reveal via status code whether a resource exists in another org.
        if (err.code === "SOURCE_VERSION_NOT_FOUND" || err.code === "SOURCE_ASSET_NOT_FOUND") throw new ImportNotFoundError("source document version");
        throw new ImportValidationError([err.message]);
      }
      throw err;
    }
    sourceKey = source.sourceKey;
  }

  // Build the draft graph in memory first so validation can run before
  // any row — job or candidate — is persisted (Step 7: "validation
  // failure must not partially create curriculum" extends here too).
  // Every stableKey is run through the catalog service's own
  // sanitizeStableKey() here, at graph-construction time — the exact same
  // function createCourse/createUnit/createLesson apply to an explicit
  // stableKey, and the one Phase 3 fixed to preserve dots (Step 8). This
  // guarantees "student.asl-01" round-trips unchanged end to end.
  const catalogRepo = new CurriculumCatalogRepo();
  const existingCourses = await catalogRepo.listCourses(actor.organizationId);
  const existingCourse = existingCourses.find((c) => c.stableKey === sanitizeStableKey(source.courseStableKey));
  if (existingCourse && existingCourse.status === "RETIRED") {
    throw new ImportValidationError([`course "${existingCourse.stableKey}" is RETIRED and cannot be re-imported`]);
  }
  const existingUnits = existingCourse ? await catalogRepo.listUnitsForCourse(actor.organizationId, existingCourse.courseId, true) : [];
  const existingLessons = new Map<string, any[]>();
  for (const unit of existingUnits) existingLessons.set(unit.unitId, await catalogRepo.listLessonsForUnit(actor.organizationId, unit.unitId, true));
  const allExistingLessons = [...existingLessons.values()].flat();
  // Phase 4.5D: fetch each existing lesson's currently-attached resources
  // and Arcade links too, so buildDraft can diff RESOURCE/ARCADE_LINK
  // candidates against them exactly the way it already diffs Units and
  // Lessons — same lineage mechanism, one more entity type.
  const existingResourcesByLessonId = new Map<string, any[]>();
  const existingArcadeLinksByLessonId = new Map<string, any[]>();
  for (const lesson of allExistingLessons) {
    existingResourcesByLessonId.set(lesson.lessonId, await catalogRepo.listResourcesForLesson(actor.organizationId, lesson.lessonId));
    existingArcadeLinksByLessonId.set(lesson.lessonId, await catalogRepo.listArcadeLinksForLesson(actor.organizationId, lesson.lessonId));
  }
  const previousByEntity = new Map<string, CurriculumImportCandidateRow>();
  const allExistingResources = [...existingResourcesByLessonId.values()].flat();
  const allExistingArcadeLinks = [...existingArcadeLinksByLessonId.values()].flat();
  for (const entity of [
    { type: "COURSE", id: existingCourse?.courseId },
    ...existingUnits.map((u) => ({ type: "UNIT", id: u.unitId })),
    ...allExistingLessons.map((l) => ({ type: "LESSON", id: l.lessonId })),
    ...allExistingResources.map((r) => ({ type: "RESOURCE", id: r.resourceId })),
    ...allExistingArcadeLinks.map((a) => ({ type: "ARCADE_LINK", id: a.id })),
  ]) {
    if (entity.id) {
      const previous = await jobRepo.findLatestCandidateForEntity(actor.organizationId, entity.type as CandidateType, entity.id);
      if (previous) previousByEntity.set(`${entity.type}:${entity.id}`, previous);
    }
  }
  const draft = await buildDraft(source, existingCourse, existingUnits, existingLessons, existingResourcesByLessonId, existingArcadeLinksByLessonId, previousByEntity, catalogRepo);
  const existingCourseStableKeys = new Set(existingCourse ? [] : existingCourses.map((c) => c.stableKey));
  const errorsByKey = validateDraftGraph(draft, actor.organizationId, existingCourseStableKeys);
  const anyInvalid = errorsByKey.size > 0;

  const importJobId = newImportId("cimport");
  const job = await withTransaction(async (client) => {
    const txJobRepo = new CurriculumImportJobRepo(client.query.bind(client));
    const createdJob = await txJobRepo.createJob({
      importJobId, organizationId: actor.organizationId, importType: input.importType,
      sourceAssetId: null, sourceDocumentVersionId, sourceKey,
      createdByUserId: actor.userId, metadata: { candidateCount: draft.length, lessonCount: source.units.reduce((count, unit) => count + unit.lessons.length, 0), sourceHash: source.sourceHash },
    });

    const keyToId = new Map<string, string>();
    for (const c of draft) {
      const candidateId = newImportId("cimportcand");
      keyToId.set(c.key, candidateId);
      const parentCandidateId = c.parentKey ? keyToId.get(c.parentKey) ?? null : null;
      await txJobRepo.createCandidate({
        importCandidateId: candidateId, importJobId, organizationId: actor.organizationId,
        candidateType: c.candidateType, parentCandidateId, stableKey: c.stableKey, title: c.title,
        sequence: c.sequence, sourceReference: c.sourceReference, payload: c.payload, sourceHash: c.sourceHash,
        diffStatus: c.diffStatus, previousCandidateId: c.previousCandidateId, createdEntityType: c.createdEntityId ? c.candidateType : null, createdEntityId: c.createdEntityId,
      });
      const errors = errorsByKey.get(c.key);
      await txJobRepo.setCandidateValidation(actor.organizationId, candidateId, errors ? "INVALID" : "VALID", errors ?? []);
    }

  const requiresReview = anyInvalid || draft.some((candidate) => candidate.diffStatus === "MISSING_FROM_SOURCE");
  const finalStatus = requiresReview ? "NEEDS_REVIEW" : "READY";
    const updated = await txJobRepo.updateJobStatus(actor.organizationId, importJobId, createdJob.revision, { status: finalStatus });
    if (!updated) throw new ImportStaleRevisionError();
    await auditImport(actor, "curriculum_import_job.created", importJobId, null, { sourceKey, status: finalStatus }, client);
    return updated;
  });

  const candidates = await jobRepo.listCandidates(actor.organizationId, importJobId);
  return { job, candidates };
}

// ---------------- Reads ----------------

export async function getImportJob(actor: CatalogActor, importJobId: string): Promise<CurriculumImportJobRow> {
  const job = await jobRepo.findJob(actor.organizationId, importJobId);
  if (!job) throw new ImportNotFoundError("import job");
  return job;
}

export async function listImportJobs(actor: CatalogActor): Promise<CurriculumImportJobRow[]> {
  return jobRepo.listJobs(actor.organizationId);
}

// Step 11/12: read-only preview/dry-run. Never writes a catalog row —
// candidates already exist (created at job-creation time above); this
// only assembles them into the tree a future preview UI (Phase 4.5C)
// would render, plus the projected Course/Unit/Lesson shape.
export async function previewImportJob(actor: CatalogActor, importJobId: string) {
  const job = await getImportJob(actor, importJobId);
  const candidates = await jobRepo.listCandidates(actor.organizationId, importJobId);
  const tree = buildCandidateTree(candidates);
  const warnings = candidates.filter((c) => c.validationStatus === "INVALID").flatMap((c) => c.validationErrors.map((msg) => ({ candidateId: c.importCandidateId, candidateType: c.candidateType, stableKey: c.stableKey, message: msg })));
  return { job, candidateTree: tree, candidates, warnings, errorCount: warnings.length };
}

// ---------------- Execute (Steps 9, 10, 13, 17) ----------------

export async function executeImportJob(actor: CatalogActor, importJobId: string): Promise<{ job: CurriculumImportJobRow; courseId: string; unitId: string | null; lessonIds: string[]; alreadyCompleted: boolean }> {
  const job = await getImportJob(actor, importJobId);

  // Idempotency (Step 17): a completed job returns its existing result
  // rather than re-running creation logic. Derived from the candidates'
  // own created_entity_id mapping — no separate result blob needed.
  if (job.status === "COMPLETED") {
    const candidates = await jobRepo.listCandidates(actor.organizationId, importJobId);
    const courseCandidate = candidates.find((c) => c.candidateType === "COURSE" && !c.parentCandidateId);
    const unitCandidate = candidates.find((c) => c.candidateType === "UNIT");
    const lessonIds = candidates.filter((c) => c.candidateType === "LESSON" && c.createdEntityId).map((c) => c.createdEntityId!);
    if (!courseCandidate?.createdEntityId) throw new ImportExecutionError("job is COMPLETED but no course mapping was recorded — data inconsistency");
    return { job, courseId: courseCandidate.createdEntityId, unitId: unitCandidate?.createdEntityId ?? null, lessonIds, alreadyCompleted: true };
  }

  if (job.status !== "READY" && job.status !== "FAILED") {
    throw new ImportInvalidTransitionError(`cannot execute an import job in status ${job.status} (must be READY, or FAILED for retry)`);
  }

  // Mark IMPORTING on its own commit (outside the transaction below) so a
  // process crash mid-import leaves a genuinely diagnosable row rather
  // than silently rolling back to invisible (Step 18, migration 062).
  const importingJob = await jobRepo.updateJobStatus(actor.organizationId, importJobId, job.revision, { status: "IMPORTING", startedAt: new Date() });
  if (!importingJob) throw new ImportStaleRevisionError();

  try {
    const result = await withTransaction(async (client) => {
      const txCatalogRepo = new CurriculumCatalogRepo(client.query.bind(client));
      const txJobRepo = new CurriculumImportJobRepo(client.query.bind(client));
      const tx: CatalogTxContext = { repo: txCatalogRepo, executor: client };

      const candidates = await txJobRepo.listCandidates(actor.organizationId, importJobId);
      const courseCandidate = candidates.find((c) => c.candidateType === "COURSE" && !c.parentCandidateId);
      if (!courseCandidate) throw new ImportExecutionError("no COURSE root candidate found for this job");
      if (courseCandidate.validationStatus === "INVALID") throw new ImportExecutionError("course candidate failed validation and cannot be executed");

      const existingCourses = await txCatalogRepo.listCourses(actor.organizationId);
      const mappedCourse = courseCandidate.createdEntityId
        ? existingCourses.find((course) => course.courseId === courseCandidate.createdEntityId)
        : null;
      const competingCourse = existingCourses.find((course) => course.stableKey === courseCandidate.stableKey && course.courseId !== courseCandidate.createdEntityId);
      if (competingCourse) throw new ImportExecutionError(`a different course with stable key "${courseCandidate.stableKey}" already exists in this organization`);

      let createdCourse: any;
      if (mappedCourse) {
        createdCourse = mappedCourse;
        if (createdCourse.status !== "DRAFT") {
          const reopened = await txCatalogRepo.transitionCourseStatus(actor.organizationId, createdCourse.courseId, createdCourse.revision, ["IN_REVIEW", "APPROVED", "PUBLISHED"], "DRAFT", actor.userId);
          if (!reopened) throw new ImportStaleRevisionError();
          createdCourse = reopened;
        }
        if (courseCandidate.diffStatus === "MODIFIED") {
          const updated = await txCatalogRepo.updateCourseFields(actor.organizationId, createdCourse.courseId, createdCourse.revision, { title: courseCandidate.title }, actor.userId);
          if (!updated) throw new ImportStaleRevisionError();
          createdCourse = updated;
        }
      } else {
        createdCourse = await createCourse(actor, { title: courseCandidate.title, stableKey: courseCandidate.stableKey }, tx);
      }
      await txJobRepo.markCandidateCreated(actor.organizationId, courseCandidate.importCandidateId, "COURSE", createdCourse.courseId);

      let unitId: string | null = null;
      const lessonIds: string[] = [];
      const unitCandidates = candidates.filter((c) => c.candidateType === "UNIT" && c.parentCandidateId === courseCandidate.importCandidateId);
      const orderedUnitIds: string[] = [];
      for (const unitCandidate of unitCandidates) {
        if (unitCandidate.validationStatus === "INVALID") throw new ImportExecutionError(`unit candidate "${unitCandidate.stableKey}" failed validation and cannot be executed`);
        const mappedUnit = unitCandidate.createdEntityId ? await txCatalogRepo.findUnit(actor.organizationId, unitCandidate.createdEntityId) : null;
        let createdUnit: any;
        if (mappedUnit) {
          if (mappedUnit.courseId !== createdCourse.courseId) throw new ImportExecutionError(`unit candidate "${unitCandidate.stableKey}" is linked to a different course`);
          createdUnit = mappedUnit;
          if (unitCandidate.diffStatus === "MODIFIED") createdUnit = await updateUnit(actor, mappedUnit.unitId, mappedUnit.revision, { title: unitCandidate.title }, tx);
          if (!createdUnit) throw new ImportStaleRevisionError();
        } else {
          createdUnit = await createUnit(actor, createdCourse.courseId, { title: unitCandidate.title, stableKey: unitCandidate.stableKey }, tx);
        }
        await txJobRepo.markCandidateCreated(actor.organizationId, unitCandidate.importCandidateId, "UNIT", createdUnit.unitId);
        orderedUnitIds.push(createdUnit.unitId);
        unitId = createdUnit.unitId;

        const lessonCandidates = candidates.filter((c) => c.candidateType === "LESSON" && c.parentCandidateId === unitCandidate.importCandidateId);
        const orderedLessonIds: string[] = [];
        for (const lessonCandidate of lessonCandidates) {
          // Step 39/40: staff may exclude a proposed candidate before
          // execution. Exclusion only prevents NEW creation — a
          // previously-created entity is never retroactively removed
          // (the same "never silently delete" discipline MISSING_FROM_
          // SOURCE already follows).
          if (lessonCandidate.included === false && !lessonCandidate.createdEntityId) continue;
          if (lessonCandidate.validationStatus === "INVALID") throw new ImportExecutionError(`lesson candidate "${lessonCandidate.stableKey}" failed validation and cannot be executed`);
          const raw = lessonCandidate.payload as Record<string, unknown>;
          const objectives = Array.isArray(raw?.objectives) ? (raw.objectives as unknown[]).filter((o) => typeof o === "string") as string[] : [];
          const estMinutes = typeof raw?.estMinutes === "number" ? (raw.estMinutes as number) : null;
          const mappedLesson = lessonCandidate.createdEntityId ? await txCatalogRepo.findLesson(actor.organizationId, lessonCandidate.createdEntityId) : null;
          let createdLesson: any;
          if (mappedLesson) {
            if (mappedLesson.unitId !== createdUnit.unitId) throw new ImportExecutionError(`lesson candidate "${lessonCandidate.stableKey}" is linked to a different unit`);
            createdLesson = mappedLesson;
            if (lessonCandidate.diffStatus === "MODIFIED") createdLesson = await updateLesson(actor, mappedLesson.lessonId, mappedLesson.revision, { title: lessonCandidate.title, objectives, content: raw, estimatedDurationMinutes: estMinutes }, tx);
            if (!createdLesson) throw new ImportStaleRevisionError();
          } else {
            createdLesson = await createLesson(actor, createdUnit.unitId, {
              title: lessonCandidate.title, stableKey: lessonCandidate.stableKey,
              objectives, estimatedDurationMinutes: estMinutes,
              content: raw,
            }, tx);
          }
          await txJobRepo.markCandidateCreated(actor.organizationId, lessonCandidate.importCandidateId, "LESSON", createdLesson.lessonId);
          orderedLessonIds.push(createdLesson.lessonId);
          lessonIds.push(createdLesson.lessonId);

          // ---------------- RESOURCE execution (Steps 12-15) ----------------
          const resourceCandidates = candidates.filter((c) => c.candidateType === "RESOURCE" && c.parentCandidateId === lessonCandidate.importCandidateId);
          for (const resourceCandidate of resourceCandidates) {
            if (resourceCandidate.included === false && !resourceCandidate.createdEntityId) continue;
            if (resourceCandidate.validationStatus === "INVALID") throw new ImportExecutionError(`resource candidate "${resourceCandidate.stableKey}" failed validation and cannot be executed`);
            if (resourceCandidate.diffStatus === "MISSING_FROM_SOURCE") continue; // preserved, never deleted (Step 15)
            const resourcePayload = resourceCandidate.payload as Record<string, unknown>;
            let resourceId: string;
            if (resourceCandidate.createdEntityId) {
              resourceId = resourceCandidate.createdEntityId;
              if (resourceCandidate.diffStatus === "MODIFIED") {
                await updateResource(actor, resourceId, { title: resourceCandidate.title, description: resourcePayload.description as string | null, externalUrl: resourcePayload.externalUrl as string | null }, tx);
              }
            } else {
              const createdResource = await createResource(actor, {
                title: resourceCandidate.title, resourceType: (resourcePayload.resourceType as string) || "MEDIA",
                description: resourcePayload.description as string | null, externalUrl: resourcePayload.externalUrl as string | null,
              }, tx);
              resourceId = createdResource.resourceId;
            }
            await attachResource(actor, createdLesson.lessonId, resourceId, resourceCandidate.sequence, tx);
            await txJobRepo.markCandidateCreated(actor.organizationId, resourceCandidate.importCandidateId, "RESOURCE", resourceId);
          }

          // ---------------- ARCADE_LINK execution (Steps 18-24, 28) ----------------
          // Definition linkage only — never touches arcade_attempts/
          // arcade_results, never manufactures learner truth.
          const arcadeCandidates = candidates.filter((c) => c.candidateType === "ARCADE_LINK" && c.parentCandidateId === lessonCandidate.importCandidateId);
          for (const arcadeCandidate of arcadeCandidates) {
            if (arcadeCandidate.included === false && !arcadeCandidate.createdEntityId) continue;
            if (arcadeCandidate.validationStatus === "INVALID") throw new ImportExecutionError(`arcade link candidate "${arcadeCandidate.stableKey}" is unresolved or ambiguous and cannot be executed`);
            if (arcadeCandidate.diffStatus === "MISSING_FROM_SOURCE") continue; // preserved, never deleted
            const arcadePayload = arcadeCandidate.payload as Record<string, unknown>;
            const gameId = String(arcadePayload.gameId || "");
            const link = await linkArcadeActivityBySlug(actor, createdLesson.lessonId, gameId, arcadeCandidate.sequence, arcadeCandidate.sourceReference, tx);
            await txJobRepo.markCandidateCreated(actor.organizationId, arcadeCandidate.importCandidateId, "ARCADE_LINK", link.linkId);
          }
        }
        if (orderedLessonIds.length) await txCatalogRepo.reorderLessons(actor.organizationId, createdUnit.unitId, orderedLessonIds);
      }
      if (orderedUnitIds.length) await txCatalogRepo.reorderUnits(actor.organizationId, createdCourse.courseId, orderedUnitIds);

      const completedJob = await txJobRepo.updateJobStatus(actor.organizationId, importJobId, importingJob.revision, { status: "COMPLETED", completedAt: new Date() });
      if (!completedJob) throw new ImportStaleRevisionError();
      await auditImport(actor, "curriculum_import_job.executed", importJobId, { status: importingJob.status }, { status: "COMPLETED", courseId: createdCourse.courseId }, client);

      return { job: completedJob, courseId: createdCourse.courseId, unitId, lessonIds, alreadyCompleted: false };
    });
    return result;
  } catch (err: any) {
    // The catalog-creation transaction above rolled back in full — no
    // Course/Unit/Lesson row survives. This write is deliberately outside
    // that transaction (its own connection/commit) so the failure itself
    // is durably preserved even though everything else was undone
    // (Step 18: "preserve job record... not leave partial catalog graph...
    // be diagnosable").
    const message = String(err?.message || "curriculum_import_execution_failed").slice(0, 500);
    const current = await jobRepo.findJob(actor.organizationId, importJobId);
    if (current) {
      await jobRepo.updateJobStatus(actor.organizationId, importJobId, current.revision, { status: "FAILED", failedAt: new Date(), errorSummary: message });
      await auditImport(actor, "curriculum_import_job.failed", importJobId, { status: current.status }, { status: "FAILED", error: message });
    }
    // Normalize every execution-time failure — an application-level
    // check above, a raw DB constraint violation, or anything else — into
    // one error type the route layer maps to a single diagnosable
    // response, rather than leaking a raw pg error to a generic 500.
    if (err instanceof ImportExecutionError || err instanceof ImportStaleRevisionError) throw err;
    throw new ImportExecutionError(message);
  }
}

// ---------------- Cancel ----------------

export async function cancelImportJob(actor: CatalogActor, importJobId: string): Promise<CurriculumImportJobRow> {
  const job = await getImportJob(actor, importJobId);
  if (!["DRAFT", "READY", "NEEDS_REVIEW", "FAILED"].includes(job.status)) {
    throw new ImportInvalidTransitionError(`cannot cancel an import job in status ${job.status}`);
  }
  const updated = await jobRepo.updateJobStatus(actor.organizationId, importJobId, job.revision, { status: "CANCELLED" });
  if (!updated) throw new ImportStaleRevisionError();
  await auditImport(actor, "curriculum_import_job.cancelled", importJobId, { status: job.status }, { status: "CANCELLED" });
  return updated;
}

// ---------------- Candidate edits (Step 40) ----------------
// The smallest safe backend mutation contract: title, sequence, and
// inclusion only. Canonical identity/diff/provenance are never
// browser-editable (Step 20: the browser does not create canonical
// curriculum identity — nor may it alter the facts execution relies on).
export async function updateCandidate(
  actor: CatalogActor, importJobId: string, importCandidateId: string,
  fields: { title?: string; sequence?: number; included?: boolean },
): Promise<{ job: CurriculumImportJobRow; candidate: CurriculumImportCandidateRow }> {
  const job = await getImportJob(actor, importJobId);
  if (!["DRAFT", "READY", "NEEDS_REVIEW", "FAILED"].includes(job.status)) {
    throw new ImportInvalidTransitionError(`cannot edit a candidate while the job is in status ${job.status}`);
  }
  const existing = await jobRepo.findCandidate(actor.organizationId, importCandidateId);
  if (!existing || existing.importJobId !== importJobId) throw new ImportNotFoundError("import candidate");
  if (fields.title !== undefined && !String(fields.title).trim()) throw new ImportValidationError(['"title" cannot be empty']);
  if (fields.sequence !== undefined && (!Number.isInteger(fields.sequence) || fields.sequence < 1)) throw new ImportValidationError(['"sequence" must be a positive integer']);

  const updated = await jobRepo.updateCandidateFields(actor.organizationId, importCandidateId, fields);
  if (!updated) throw new ImportNotFoundError("import candidate");
  await auditImport(actor, "curriculum_import_candidate.updated", importCandidateId, existing, updated);

  // Recompute whether the job as a whole still needs review — excluding
  // the one problematic candidate a reviewer just flagged can legitimately
  // unblock execution, and re-including one can legitimately block it
  // again. Never touches candidates other than status derivation.
  const allCandidates = await jobRepo.listCandidates(actor.organizationId, importJobId);
  const anyBlockingInvalid = allCandidates.some((c) => c.included !== false && c.validationStatus === "INVALID");
  const anyMissing = allCandidates.some((c) => c.diffStatus === "MISSING_FROM_SOURCE");
  const shouldNeedReview = anyBlockingInvalid || anyMissing;
  let job2 = job;
  if (job.status === "NEEDS_REVIEW" && !shouldNeedReview) {
    job2 = (await jobRepo.updateJobStatus(actor.organizationId, importJobId, job.revision, { status: "READY" })) || job;
  } else if (job.status === "READY" && shouldNeedReview) {
    job2 = (await jobRepo.updateJobStatus(actor.organizationId, importJobId, job.revision, { status: "NEEDS_REVIEW" })) || job;
  }

  return { job: job2, candidate: updated };
}
