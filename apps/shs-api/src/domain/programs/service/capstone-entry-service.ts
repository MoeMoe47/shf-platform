import { query } from "../../../db/client.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { CAPSTONE_BRANCH_REQUIREMENTS, CAPSTONE_ENTRY_POLICY_VERSION, GRADE12_SHARED_CORE_LESSONS } from "../model/capstone-entry-policy.js";

function context(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("scope_missing");
  return { userId, organizationId, tenantId };
}

export class CapstoneEntryService {
  constructor(private dbQuery: typeof query = query) {}

  async evaluate(actor: any, learnerId = context(actor).userId, programId = "data-center-specialization-11") {
    const current = context(actor);
    if (learnerId !== current.userId && !hasPermission(actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_READ)) throw new Error("capstone_entry_view_required");
    const missing: Array<{ code: string; detail?: string }> = [];
    const assignment = await this.dbQuery("SELECT specialization_id FROM program_specialization_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND assignment_type='PRIMARY' AND status='ACTIVE' ORDER BY effective_from DESC LIMIT 1", [learnerId, current.organizationId, current.tenantId, programId]);
    const specialization = assignment.rows[0]?.specialization_id;
    const branch = CAPSTONE_BRANCH_REQUIREMENTS[specialization];
    if (!branch) return this.result(learnerId, null, missing.concat({ code: "ACTIVE_SPECIALIZATION_REQUIRED" }));
    const course = await this.dbQuery("SELECT assignment_id FROM program_course_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND course_id=$5 AND specialization_id=$6 AND status='ACTIVE'", [learnerId, current.organizationId, current.tenantId, programId, branch.courseId, specialization]);
    if (!course.rows[0]) missing.push({ code: "ACTIVE_MATCHING_GRADE12_COURSE_REQUIRED", detail: branch.courseId });
    const lessonIds = [...GRADE12_SHARED_CORE_LESSONS, ...branch.lessons];
    const completions = await this.dbQuery("SELECT lesson_id FROM curriculum_lesson_completions WHERE user_id=$1 AND organization_id=$2 AND curriculum_id=$3 AND lesson_id=ANY($4::text[])", [learnerId, current.organizationId, branch.courseId, lessonIds]);
    const completed = new Set(completions.rows.map((row: any) => row.lesson_id));
    for (const lessonId of GRADE12_SHARED_CORE_LESSONS) if (!completed.has(lessonId)) missing.push({ code: "GRADE12_SHARED_CORE_MISSING", detail: lessonId });
    for (const lessonId of branch.lessons) if (!completed.has(lessonId)) missing.push({ code: "GRADE12_BRANCH_LESSON_MISSING", detail: lessonId });
    const proof = await this.dbQuery("SELECT d.decision_id FROM prepare_prove_activity_results r JOIN prepare_prove_evidence e ON e.source_record_id=r.result_id JOIN learner_competency_decisions d ON d.evidence_id=e.evidence_id JOIN competency_definitions c ON c.competency_id=d.competency_id WHERE r.user_id=$1 AND r.organization_id=$2 AND r.tenant_id=$3 AND r.activity_id=$4 AND c.slug=$5 AND d.decision='DEMONSTRATED' ORDER BY d.reviewed_at DESC, d.decision_id DESC LIMIT 1", [learnerId, current.organizationId, current.tenantId, branch.proofActivity, branch.competencySlug]);
    if (!proof.rows[0]) missing.push({ code: "DEMONSTRATED_BRANCH_PROOF_REQUIRED", detail: branch.competencySlug });
    return this.result(learnerId, specialization, missing, branch);
  }

  private result(learnerId: string, specialization: string | null, missing: Array<{ code: string; detail?: string }>, branch?: any) {
    return { status: missing.length === 0 ? "CAPSTONE_ENTRY_ELIGIBLE" : "CAPSTONE_ENTRY_NOT_ELIGIBLE", eligible: missing.length === 0, policy_version: CAPSTONE_ENTRY_POLICY_VERSION, learner_id: learnerId, specialization_id: specialization, course_id: branch?.courseId || null, future_role: branch?.role || null, missing_requirements: missing, capstone_status: "ARCHITECTURE_DEFINED_NON_EXECUTABLE", note: "This is an educational entry evaluation, not program completion, credential, readiness, or employment status." };
  }
}
