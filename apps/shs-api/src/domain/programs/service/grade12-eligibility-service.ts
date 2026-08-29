import { query } from "../../../db/client.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isCanonicalSpecialization } from "../model/specialization-assignment.js";
import { BRANCH_REQUIREMENTS, GRADE12_POLICY_VERSION, GRADE12_PROGRAM_ID, SHARED_CORE_LESSONS } from "../model/grade12-eligibility-policy.js";

function context(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("scope_missing");
  return { userId, organizationId, tenantId };
}

export class Grade12EligibilityService {
  constructor(private dbQuery: typeof query = query) {}

  async evaluate(actor: any, learnerId = context(actor).userId, programId = GRADE12_PROGRAM_ID) {
    const current = context(actor);
    if (learnerId !== current.userId && !hasPermission(actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_READ)) throw new Error("eligibility_view_required");
    const assignment = await this.dbQuery("SELECT * FROM program_specialization_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND assignment_type='PRIMARY' AND status='ACTIVE' ORDER BY effective_from DESC LIMIT 1", [learnerId, current.organizationId, current.tenantId, programId]);
    const active = assignment.rows[0];
    const missing: Array<{ code: string; label: string; detail?: string }> = [];
    if (!active) return this.result(learnerId, null, missing.concat({ code: "NO_ACTIVE_SPECIALIZATION_ASSIGNMENT", label: "An active primary specialization assignment" }));
    if (active.grade !== 11 || active.stage !== "PREPARE_PROVE" || !isCanonicalSpecialization(active.specialization_id)) missing.push({ code: "INVALID_ASSIGNMENT_CONTEXT", label: "A valid Grade 11 PREPARE_PROVE specialization assignment" });

    const lessonIds = [...SHARED_CORE_LESSONS, ...(BRANCH_REQUIREMENTS[active.specialization_id]?.lessons || [])];
    const completions = await this.dbQuery("SELECT lesson_id FROM curriculum_lesson_completions WHERE user_id=$1 AND organization_id=$2 AND curriculum_id=$3 AND lesson_id = ANY($4::text[])", [learnerId, current.organizationId, "data-center-specialization-11", lessonIds]);
    const completed = new Set(completions.rows.map((row: any) => row.lesson_id));
    for (const lessonId of SHARED_CORE_LESSONS) if (!completed.has(lessonId)) missing.push({ code: "SHARED_CORE_REQUIREMENT_MISSING", label: "Grade 11 shared-core lesson", detail: lessonId });
    for (const lessonId of BRANCH_REQUIREMENTS[active.specialization_id]?.lessons || []) if (!completed.has(lessonId)) missing.push({ code: "SPECIALIZATION_REQUIREMENT_MISSING", label: "Assigned specialization lesson", detail: lessonId });

    const slugs = BRANCH_REQUIREMENTS[active.specialization_id]?.competencies || [];
    const decisions = await this.dbQuery(`SELECT c.slug FROM learner_competency_decisions d JOIN competency_definitions c ON c.competency_id=d.competency_id WHERE d.user_id=$1 AND d.organization_id=$2 AND d.tenant_id=$3 AND d.decision='DEMONSTRATED' AND c.slug = ANY($4::text[])`, [learnerId, current.organizationId, current.tenantId, slugs]);
    const demonstrated = new Set(decisions.rows.map((row: any) => row.slug));
    for (const slug of slugs) if (!demonstrated.has(slug)) missing.push({ code: "COMPETENCY_REQUIREMENT_MISSING", label: "Demonstrated Grade 11 entry competency", detail: slug });
    return this.result(learnerId, active, missing);
  }

  private result(learnerId: string, assignment: any, missing: Array<{ code: string; label: string; detail?: string }>) {
    return {
      status: missing.length === 0 ? "ELIGIBLE" : "NOT_ELIGIBLE",
      eligible: missing.length === 0,
      learner_id: learnerId,
      program_id: GRADE12_PROGRAM_ID,
      specialization_id: assignment?.specialization_id || null,
      policy_version: GRADE12_POLICY_VERSION,
      evaluated_at: new Date().toISOString(),
      requirements: { shared_core: SHARED_CORE_LESSONS, specialization: BRANCH_REQUIREMENTS[assignment?.specialization_id]?.lessons || [], competencies: BRANCH_REQUIREMENTS[assignment?.specialization_id]?.competencies || [] },
      missing_requirements: missing,
      note: "Grade 12 eligibility is curriculum progression status, not career readiness, credential status, or professional qualification.",
    };
  }
}
