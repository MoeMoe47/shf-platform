import { query } from "../../db/client.js";
import { isAdminTier } from "../shared/audience-eligibility.js";
import { createAuthorizedReportProjection, type AuthorizedReportProjection, type ProductReportProjectionAdapter } from "./product-report-contract.js";

const FAMILIES = new Set([
  "program-impact", "grant-funder", "cohort-outcome", "community-impact",
  "curriculum-student-progress", "curriculum-course-completion", "curriculum-assessment-evidence",
  "curriculum-instructor-class", "curriculum-cohort-learning",
  "career-readiness", "career-skill-profile", "career-credential-evidence",
  "career-pathway-outcome", "career-employer-partner-outcome",
]);

const REPORT_TYPES: Record<string, string> = {
  "program-impact": "FOUNDATION_PROGRAM_IMPACT",
  "grant-funder": "FOUNDATION_GRANT_FUNDER",
  "cohort-outcome": "FOUNDATION_COHORT_OUTCOME",
  "community-impact": "FOUNDATION_COMMUNITY_IMPACT",
  "curriculum-student-progress": "CURRICULUM_STUDENT_PROGRESS",
  "curriculum-course-completion": "CURRICULUM_COURSE_COMPLETION",
  "curriculum-assessment-evidence": "CURRICULUM_ASSESSMENT_EVIDENCE",
  "curriculum-instructor-class": "CURRICULUM_INSTRUCTOR_CLASS",
  "curriculum-cohort-learning": "CURRICULUM_COHORT_LEARNING",
  "career-readiness": "CAREER_READINESS",
  "career-skill-profile": "CAREER_SKILL_PROFILE",
  "career-credential-evidence": "CAREER_CREDENTIAL_EVIDENCE",
  "career-pathway-outcome": "CAREER_PATHWAY_OUTCOME",
  "career-employer-partner-outcome": "CAREER_EMPLOYER_PARTNER_OUTCOME",
};

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || actor?.tenant || `tenant:${organizationId}`).trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  if (!organizationId || !tenantId || !userId) throw new Error("REPORT_SCOPE_REQUIRED");
  return { organizationId, tenantId, userId, admin: isAdminTier(actor?.roles || []) };
}

function required(value: unknown, code: string) {
  const result = String(value || "").trim();
  if (!result) throw new Error(code);
  return result;
}

function ref(type: string, id: string, label = id) { return { type, id, label }; }

function period(input: any) {
  const value = input?.reportingPeriod || input?.reporting_period;
  return value && typeof value === "object" ? value : { label: String(value || "Current state") };
}

function brand(family: string) {
  const curriculum = family.startsWith("curriculum-");
  const career = family.startsWith("career-");
  return curriculum
    ? { displayName: "Silicon Heartland Foundation", shortName: "Curriculum", headerLabel: "Curriculum", subtitle: "Educational reporting", category: "Curriculum Reporting", attribution: "Silicon Heartland Foundation" }
    : career
      ? { displayName: "Silicon Heartland Foundation", shortName: "Career", headerLabel: "Career", subtitle: "Workforce and pathway reporting", category: "Career Reporting", attribution: "Silicon Heartland Foundation" }
      : { displayName: "Silicon Heartland Foundation", shortName: "Foundation", headerLabel: "Foundation", subtitle: "Community impact reporting", category: "Foundation Reporting", attribution: "Silicon Heartland Foundation" };
}

function presentation(family: string, subject: string, generatedAt: string, rows: any[], references: any[], notes: string[] = []) {
  const title = family.replace(/(^|-)([a-z])/g, (_m, _p, c) => ` ${String(c).toUpperCase()}`).trim();
  return {
    brand: brand(family), reportTitle: `${title} Report`, subjectLabel: subject,
    reportingPeriod: "Current state", generatedAt, classification: "INTERNAL",
    summary: { subject, status: "CANONICAL_DATA", privacy: "Authorized projection; no unsupported inference" },
    sections: [{ title: "Report Summary", tables: [{ headers: ["Measure", "Value", "Authority"], rows }], notes },
      { title: "Items Requiring Attention", notes: ["Only canonical records are included. Missing or unresolved links are not inferred."] }],
    methodology: { source_authority: "Foundation, Curriculum, Career, Evidence, Credential, Metric, and verified outcome authorities where applicable", privacy: "Learner-level protected data, accommodations, raw assessment responses, and restricted notes are omitted unless separately authorized.", publication: "Generation does not publish or release this report." },
    references, metadata: { product: "Silicon Heartland Foundation", reportFamily: family, generatedAt, canonicalReferenceCount: references.length, aiInvolvement: "No" },
  };
}

async function one(executor: typeof query, sql: string, params: unknown[]) { const result = await executor(sql, params); return result.rows[0] || null; }

export class FoundationCurriculumCareerReportAdapter implements ProductReportProjectionAdapter {
  productKey = "foundation" as const;
  constructor(private dbQuery = query) {}
  supports(reportFamily: string) { return FAMILIES.has(reportFamily); }

  private async learnerAccess(learnerId: string, actor: any, s: ReturnType<typeof scope>) {
    if (s.admin || learnerId === s.userId) return;
    if (!actor?.roles?.includes("instructor")) throw new Error("REPORT_SUBJECT_FORBIDDEN");
    const visible = await this.dbQuery("SELECT 1 FROM enrollments e JOIN cohort_staff cs ON cs.organization_id=e.organization_id AND cs.tenant_id=e.tenant_id AND cs.cohort_id=e.cohort_id AND cs.user_id=$4 AND cs.status='ACTIVE' WHERE e.organization_id=$1 AND e.tenant_id=$2 AND e.learner_user_id=$3 AND e.status IN ('PENDING','ACTIVE','COMPLETED') LIMIT 1", [s.organizationId, s.tenantId, learnerId, s.userId]);
    if (!visible.rows[0]) throw new Error("REPORT_SUBJECT_FORBIDDEN");
  }

  private async projection(family: string, input: any, s: ReturnType<typeof scope>, generatedAt: string) {
    const references: any[] = [];
    const rows: any[] = [];
    const subject = String(input?.subjectReference || input?.subject_reference || input?.programId || input?.program_id || input?.cohortId || input?.cohort_id || input?.learnerId || input?.learner_id || input?.careerId || input?.career_id || input?.grantId || input?.grant_id || "").trim();
    const learnerFamily = family.startsWith("curriculum-") || family.startsWith("career-");

    if (["program-impact", "community-impact"].includes(family)) {
      const programId = family === "program-impact" ? required(input?.programId || input?.program_id || subject, "FOUNDATION_PROGRAM_REQUIRED") : null;
      const program = programId ? await one(this.dbQuery, "SELECT program_id, name, status FROM programs WHERE organization_id=$1 AND program_id=$2", [s.organizationId, programId]) : null;
      if (programId && !program) throw new Error("FOUNDATION_PROGRAM_NOT_FOUND");
      if (program) references.push(ref("FOUNDATION_PROGRAM", program.program_id, program.name));
      const enrollmentWhere = programId ? " AND e.program_id=$3" : "";
      const params = programId ? [s.organizationId, s.tenantId, programId] : [s.organizationId, s.tenantId];
      const counts = await one(this.dbQuery, `SELECT COUNT(*)::int AS participants, COUNT(*) FILTER (WHERE e.status='COMPLETED')::int AS completed FROM enrollments e WHERE e.organization_id=$1 AND e.tenant_id=$2${enrollmentWhere}`, params);
      rows.push(["Participants", counts?.participants || 0, "Foundation enrollments"]);
      rows.push(["Completed", counts?.completed || 0, "Foundation enrollments"]);
      const facts = await one(this.dbQuery, `SELECT COUNT(*)::int AS count FROM curriculum_truth_facts f JOIN enrollments e ON e.organization_id=f.organization_id AND e.learner_user_id=f.learner_user_id WHERE f.organization_id=$1${programId ? " AND e.program_id=$3" : ""}`, programId ? [s.organizationId, s.tenantId, programId] : [s.organizationId]);
      rows.push(["Verified facts", facts?.count || 0, "Curriculum Truth projection"]);
      if (!program) references.push(ref("FOUNDATION_ORGANIZATION", s.organizationId, "Authorized organization aggregate"));
    } else if (family === "grant-funder") {
      const grantId = required(input?.grantId || input?.grant_id || subject, "FOUNDATION_GRANT_REQUIRED");
      const grant = await one(this.dbQuery, "SELECT grant_id, grant_number, title, status, award_amount, currency FROM funding_grants WHERE grant_id=$1 AND (funder_organization_id=$2 OR recipient_organization_id=$2 OR reporting_organization_id=$2)", [grantId, s.organizationId]);
      if (!grant) throw new Error("FOUNDATION_GRANT_NOT_FOUND");
      references.push(ref("FOUNDATION_GRANT", grant.grant_id, grant.title || grant.grant_number));
      rows.push(["Grant", grant.title || grant.grant_number, "Funding Grant authority"]);
      rows.push(["Awarded", grant.award_amount ?? "Not reported", "Funding Grant authority"]);
      rows.push(["Status", grant.status, "Funding Grant authority"]);
      const allocations = await one(this.dbQuery, "SELECT COUNT(*)::int AS count, COALESCE(SUM(allocated_amount),0) AS amount FROM grant_program_allocations WHERE grant_id=$1", [grantId]);
      rows.push(["Program allocations", allocations?.count || 0, "Grant allocation authority"]);
      rows.push(["Allocated amount", allocations?.amount || 0, "Grant allocation authority"]);
    } else if (["cohort-outcome", "curriculum-instructor-class", "curriculum-cohort-learning"].includes(family)) {
      const cohortId = required(input?.cohortId || input?.cohort_id || subject, "FOUNDATION_COHORT_REQUIRED");
      const cohort = await one(this.dbQuery, "SELECT cohort_id, name, program_id, status FROM cohorts WHERE organization_id=$1 AND tenant_id=$2 AND cohort_id=$3", [s.organizationId, s.tenantId, cohortId]);
      if (!cohort) throw new Error("FOUNDATION_COHORT_NOT_FOUND");
      if (!s.admin) {
        const staff = await one(this.dbQuery, "SELECT 1 FROM cohort_staff WHERE organization_id=$1 AND tenant_id=$2 AND cohort_id=$3 AND user_id=$4 AND status='ACTIVE'", [s.organizationId, s.tenantId, cohortId, s.userId]);
        if (!staff) throw new Error("REPORT_SUBJECT_FORBIDDEN");
      }
      references.push(ref("FOUNDATION_COHORT", cohort.cohort_id, cohort.name));
      const counts = await one(this.dbQuery, "SELECT COUNT(*)::int AS enrolled, COUNT(*) FILTER (WHERE status='COMPLETED')::int AS completed FROM enrollments WHERE organization_id=$1 AND tenant_id=$2 AND cohort_id=$3", [s.organizationId, s.tenantId, cohortId]);
      rows.push(["Learners", counts?.enrolled || 0, "Enrollment authority"]);
      rows.push(["Completed enrollments", counts?.completed || 0, "Enrollment authority"]);
      rows.push(["Privacy", "Aggregate only", "No learner rows emitted"]);
    } else if (learnerFamily) {
      const learnerId = required(input?.learnerId || input?.learner_id || input?.subjectReference || input?.subject_reference, "LEARNER_REQUIRED");
      await this.learnerAccess(learnerId, input?.actor, s);
      references.push(ref("LEARNER", learnerId, "Authorized learner"));
      if (family === "curriculum-course-completion") {
        const courseId = required(input?.courseId || input?.course_id, "CURRICULUM_COURSE_REQUIRED");
        const course = await one(this.dbQuery, "SELECT course_id, stable_key, title, status FROM curriculum_courses WHERE organization_id=$1 AND (course_id=$2 OR stable_key=$2)", [s.organizationId, courseId]);
        if (!course) throw new Error("CURRICULUM_COURSE_NOT_FOUND");
        references.push(ref("CURRICULUM_COURSE", course.course_id, course.title));
        rows.push(["Course", course.title, "Curriculum catalog authority"]);
        rows.push(["Course status", course.status, "Curriculum catalog authority"]);
      }
      if (family === "career-credential-evidence" && (input?.credentialId || input?.credential_id)) {
        const credentialId = String(input.credentialId || input.credential_id).trim();
        const credential = await one(this.dbQuery, "SELECT learner_credential_id, verification_id, status FROM learner_credentials WHERE organization_id=$1 AND tenant_id=$2 AND learner_user_id=$3 AND learner_credential_id=$4", [s.organizationId, s.tenantId, learnerId, credentialId]);
        if (!credential) throw new Error("CREDENTIAL_NOT_FOUND");
        references.push(ref("LEARNER_CREDENTIAL", credential.learner_credential_id, credential.verification_id));
        rows.push(["Credential", credential.status, "Credential authority"]);
      }
      const completion = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM curriculum_lesson_completions WHERE organization_id=$1 AND user_id=$2", [s.organizationId, learnerId]);
      const evidence = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM prepare_prove_evidence WHERE organization_id=$1 AND tenant_id=$2 AND user_id=$3", [s.organizationId, s.tenantId, learnerId]);
      const credentials = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM learner_credentials WHERE organization_id=$1 AND tenant_id=$2 AND learner_user_id=$3 AND status='ISSUED'", [s.organizationId, s.tenantId, learnerId]);
      rows.push(["Lesson completions", completion?.count || 0, "Curriculum completion authority"]);
      rows.push(["Evidence records", evidence?.count || 0, "Prepare/Prove evidence authority"]);
      rows.push(["Issued credentials", credentials?.count || 0, "Credential authority"]);
      if (family === "career-skill-profile") {
        const skills = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM learner_competency_decisions WHERE organization_id=$1 AND tenant_id=$2 AND user_id=$3 AND decision='DEMONSTRATED'", [s.organizationId, s.tenantId, learnerId]);
        rows.push(["Verified skills", skills?.count || 0, "Competency decision authority"]);
      }
      if (family === "career-readiness") rows.push(["Readiness", "Not scored", "No canonical readiness score exists"]);
      if (family === "career-credential-evidence") rows.push(["Credential action", "Report only", "Reporting cannot issue or revoke credentials"]);
    } else if (family === "career-pathway-outcome") {
      const careerId = required(input?.careerId || input?.career_id || subject, "CAREER_REQUIRED");
      const career = await one(this.dbQuery, "SELECT career_id, title, status FROM careers WHERE career_id=$1 AND status='active'", [careerId]);
      if (!career) throw new Error("CAREER_NOT_FOUND");
      references.push(ref("CAREER", career.career_id, career.title));
      const linked = await one(this.dbQuery, "SELECT COUNT(*)::int AS programs FROM program_careers pc JOIN programs p ON p.organization_id=pc.organization_id AND p.program_id=pc.program_id WHERE pc.organization_id=$1 AND pc.career_id=$2", [s.organizationId, careerId]);
      rows.push(["Linked programs", linked?.programs || 0, "Program-Career authority"]);
      const outcomes = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM workforce_employment_outcomes WHERE organization_id=$1 AND tenant_id=$2 AND lifecycle_status='verified' AND program_id IN (SELECT program_id FROM program_careers WHERE organization_id=$1 AND career_id=$3)", [s.organizationId, s.tenantId, careerId]);
      rows.push(["Verified employment outcomes", outcomes?.count || 0, "Workforce outcome authority"]);
    } else if (family === "career-employer-partner-outcome") {
      const partnerId = required(input?.partnerOrganizationId || input?.partner_organization_id || subject, "CAREER_PARTNER_REQUIRED");
      const partner = await one(this.dbQuery, "SELECT organization_id, name FROM organizations WHERE organization_id=$1", [partnerId]);
      if (!partner) throw new Error("CAREER_PARTNER_NOT_FOUND");
      references.push(ref("PARTNER_ORGANIZATION", partner.organization_id, partner.name));
      const events = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM career_events WHERE organization_id=$1 AND tenant_id=$2 AND host_organization_id=$3 AND status IN ('PUBLISHED','COMPLETED')", [s.organizationId, s.tenantId, partnerId]);
      rows.push(["Partner activities", events?.count || 0, "Career event authority"]);
      rows.push(["Learner detail", "Omitted", "Partner projection is aggregate and privacy bounded"]);
    } else {
      throw new Error("REPORT_FAMILY_NOT_SUPPORTED");
    }
    return { subject: subject || "Authorized organization scope", rows, references };
  }

  async project(input: any, actor: any): Promise<AuthorizedReportProjection> {
    const family = required(input?.reportFamily || input?.report_family, "REPORT_FAMILY_REQUIRED");
    if (!this.supports(family)) throw new Error("REPORT_FAMILY_NOT_SUPPORTED");
    const s = scope(actor);
    const generatedAt = new Date().toISOString();
    const data = await this.projection(family, { ...input, actor }, s, generatedAt);
    const reportPeriod = period(input);
    const reportType = REPORT_TYPES[family];
    const reportPresentation = presentation(family, data.subject, generatedAt, data.rows, data.references);
    const safeJurisdiction = family.startsWith("curriculum-") || family.startsWith("career-") ? "Authorized-Scope" : (input?.jurisdiction || null);
    return createAuthorizedReportProjection({
      productKey: "foundation", reportFamily: family, subject: data.subject,
      scope: { organizationId: s.organizationId, tenantId: s.tenantId, subjectReference: data.subject, jurisdiction: safeJurisdiction },
      reportingPeriod: reportPeriod, classification: "INTERNAL", generatedAt,
      canonicalReferences: data.references, sourceVersions: [{ authority: "foundation-curriculum-career", generatedAt }],
      provenance: { adapter: "foundation-curriculum-career-reporting", sourceAuthority: "Product-owned Foundation, Curriculum, Career, Evidence, Credential, and Outcome authorities", reportType },
      payload: { reportType, reportVersion: 1, scope: { subjectReference: data.subject, jurisdiction: safeJurisdiction, reportingPeriod: reportPeriod }, classification: "INTERNAL", generatedAt, canonicalReferences: data.references, presentation: { ...reportPresentation, reportingPeriod: reportPeriod }, foundation: { reportFamily: family, subject: data.subject, rows: data.rows } },
    });
  }
}

export const foundationCurriculumCareerAdapter = new FoundationCurriculumCareerReportAdapter();
