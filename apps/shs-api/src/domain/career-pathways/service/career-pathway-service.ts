// SHF Ecosystem Phase 5 — Program <-> Career pathway relationship and
// learner pathway derivation.
//
// Canonical boundary (see docs/SHF_CAREER_PATHWAY_INTEGRATION.md):
// Program->Career is an institutional pathway mapping (admin-managed,
// this module). A learner's own pathway Career(s) are always DERIVED from
// their ACTIVE Enrollment -> Program -> program_careers — never stored as
// a separate learner_career row, since no real learner-choice/profile
// concept exists yet to justify one (see phase brief §12).
import { randomUUID } from "crypto";
import { ProgramCareerRepo } from "../repo/program-career-repo.js";
import { EnrollmentRepo } from "../../enrollments/repo/enrollment-repo.js";
import { CareerRepo } from "../../careers/repo/career-repo.js";
import { query } from "../../../db/client.js";
import { isAdminTier, EligibilityActor } from "../../shared/audience-eligibility.js";

const programCareerRepo = new ProgramCareerRepo();
const enrollmentRepo = new EnrollmentRepo();
const careerRepo = new CareerRepo();

export class CareerPathwayError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "CareerPathwayError";
  }
}

async function assertProgramInOrganization(organizationId: string, programId: string): Promise<void> {
  const res = await query("SELECT 1 FROM programs WHERE program_id=$1 AND organization_id=$2 LIMIT 1", [programId, organizationId]);
  if (!res.rows[0]) throw new CareerPathwayError("PROGRAM_NOT_FOUND", "Program not found in organization.", 404);
}

async function assertCareerExists(careerId: string): Promise<void> {
  const res = await query("SELECT 1 FROM careers WHERE career_id=$1 LIMIT 1", [careerId]);
  if (!res.rows[0]) throw new CareerPathwayError("CAREER_NOT_FOUND", "Career not found.", 400);
}

/** Admin/program-manager only — enforced by the route's permission guard
 * (program.update), reasserted here since this is the sole write path. */
function assertCanManage(actor: EligibilityActor): void {
  if (!isAdminTier(actor.roles)) {
    throw new CareerPathwayError("FORBIDDEN", "Only an admin or program manager may manage Program-Career mappings.", 403);
  }
}

export async function linkProgramCareer(actor: EligibilityActor, programId: string, careerId: string, isPrimary = false) {
  assertCanManage(actor);
  await assertProgramInOrganization(actor.organization_id, programId);
  await assertCareerExists(careerId);
  if (await programCareerRepo.existsForProgramAndCareer(actor.organization_id, programId, careerId)) {
    throw new CareerPathwayError("DUPLICATE_MAPPING", "This Program is already linked to this Career.", 409);
  }
  return programCareerRepo.create({
    id: `program_career_${randomUUID()}`,
    organizationId: actor.organization_id,
    programId,
    careerId,
    isPrimary,
    createdByUserId: actor.user_id,
  });
}

export async function unlinkProgramCareer(actor: EligibilityActor, programId: string, careerId: string) {
  assertCanManage(actor);
  await assertProgramInOrganization(actor.organization_id, programId);
  const removed = await programCareerRepo.delete(actor.organization_id, programId, careerId);
  if (!removed) throw new CareerPathwayError("MAPPING_NOT_FOUND", "No such Program-Career mapping.", 404);
  return { removed: true };
}

/** Full Career objects (not just ids) linked to a Program, for embedding
 * in the Program API response. Multiple Careers are always returned in
 * full — never collapsed to one (phase brief §13). */
export async function listCareersForProgram(organizationId: string, programId: string) {
  const links = await programCareerRepo.listForProgram(organizationId, programId);
  if (!links.length) return [];
  const careers = await Promise.all(links.map((link) => careerRepo.getById(link.careerId)));
  return links.map((link, i) => ({ ...careers[i], isPrimary: link.isPrimary })).filter((c) => c.career_id);
}

/** Programs (within the caller's own organization only — Career is global
 * reference data, but Programs are institutionally sensitive and must
 * never leak cross-organization, per phase brief §8/§26) linked to a
 * given Career. */
export async function listProgramsForCareerInOrganization(organizationId: string, careerId: string) {
  const programIds = await programCareerRepo.listProgramIdsForCareerInOrganization(organizationId, careerId);
  if (!programIds.length) return [];
  const res = await query(
    "SELECT program_id, name, program_type, status FROM programs WHERE organization_id=$1 AND program_id = ANY($2::text[])",
    [organizationId, programIds],
  );
  return res.rows;
}

export interface LearnerPathway {
  careerIds: string[];
  careerFamilyIds: string[];
}

/** Deterministic, rules-based derivation only — no AI, no scoring (phase
 * brief §18). ACTIVE Enrollment is the only qualifying status (mirrors
 * every other Enrollment-derived entitlement in this codebase); WITHDRAWN/
 * CANCELLED/PENDING/COMPLETED enrollments do not contribute. Multiple
 * active Programs' Careers are unioned and deduplicated, never ranked. */
export async function deriveLearnerPathway(actor: { organization_id: string; user_id: string }): Promise<LearnerPathway> {
  const activeEnrollments = await enrollmentRepo.listActiveEnrollmentsForLearner(actor.organization_id, actor.user_id);
  const programIds = [...new Set(activeEnrollments.map((e) => e.programId).filter(Boolean))] as string[];
  const careerIds = await programCareerRepo.listCareerIdsForPrograms(actor.organization_id, programIds);
  if (!careerIds.length) return { careerIds: [], careerFamilyIds: [] };
  const careers = await Promise.all(careerIds.map((id) => careerRepo.getById(id)));
  const careerFamilyIds = [...new Set(careers.filter(Boolean).map((c: any) => c.career_family_id))];
  return { careerIds: [...new Set(careerIds)], careerFamilyIds };
}

/** True only when a record's own careerId/careerFamilyId is present in
 * the learner's derived pathway — never true for an unlinked record
 * (phase brief §28: "non-matching Opportunity remains available but not
 * falsely labeled relevant"). */
export function isPathwayRelevant(pathway: LearnerPathway, record: { careerId: string | null; careerFamilyId: string | null }): boolean {
  if (record.careerId && pathway.careerIds.includes(record.careerId)) return true;
  if (record.careerFamilyId && pathway.careerFamilyIds.includes(record.careerFamilyId)) return true;
  return false;
}
