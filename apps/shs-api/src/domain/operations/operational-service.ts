import { query } from "../../db/client.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../auth/security-permissions.js";

type Actor = {
  user_id: string;
  organization_id?: string;
  active_organization_id?: string;
  tenant_id?: string;
  roles?: string[];
  permissions?: string[];
};

const ADMIN_ROLES = new Set(["super_admin", "shs_admin", "shf_admin", "org_admin", "program_manager"]);

function scope(actor: Actor) {
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!actor.user_id || !organizationId || tenantId !== `tenant:${organizationId}`) {
    const error: any = new Error("ORG_CONTEXT_REQUIRED");
    error.statusCode = 403;
    throw error;
  }
  return { organizationId, tenantId, userId: actor.user_id };
}

function isAdmin(actor: Actor) {
  return (actor.roles || []).some((role) => ADMIN_ROLES.has(role));
}

function canView(actor: Actor) {
  return hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.COHORT_VIEW) ||
    hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW);
}

export async function getOperationalOverview(actor: Actor, input: { cohortId?: string; limit?: number } = {}) {
  if (!canView(actor)) {
    const error: any = new Error("FORBIDDEN");
    error.statusCode = 403;
    throw error;
  }
  const { organizationId, userId } = scope(actor);
  const limit = Math.min(Math.max(Number(input.limit) || 25, 1), 100);
  const cohortParam = isAdmin(actor) ? 2 : 3;
  const cohortFilter = input.cohortId ? ` AND c.cohort_id=$${cohortParam}` : "";
  const staffFilter = isAdmin(actor) ? "" : " AND EXISTS (SELECT 1 FROM cohort_staff cs WHERE cs.organization_id=$1 AND cs.cohort_id=c.cohort_id AND cs.user_id=$2 AND cs.status='ACTIVE')";
  const cohortParams = isAdmin(actor)
    ? (input.cohortId ? [organizationId, input.cohortId] : [organizationId])
    : (input.cohortId ? [organizationId, userId, input.cohortId] : [organizationId, userId]);

  const [cohorts, roster, assignments, reviews, live, summary] = await Promise.all([
    query(`SELECT c.cohort_id, c.name, c.program_id, c.status, COUNT(e.enrollment_id)::int AS learner_count
      FROM cohorts c LEFT JOIN enrollments e ON e.organization_id=c.organization_id AND e.cohort_id=c.cohort_id AND e.status IN ('PENDING','ACTIVE','COMPLETED')
      WHERE c.organization_id=$1${staffFilter}${cohortFilter}
      GROUP BY c.cohort_id ORDER BY c.name ASC LIMIT ${limit}`, cohortParams),
    query(`SELECT e.enrollment_id, e.cohort_id, e.program_id, e.learner_user_id, e.status,
      u.full_name, u.email, c.name AS cohort_name,
      COUNT(DISTINCT lf.truth_fact_id) FILTER (WHERE lf.fact_type='LESSON_COMPLETED')::int AS lessons_completed,
      MAX(lf.occurred_at) AS last_activity_at
      FROM enrollments e JOIN users u ON u.user_id=e.learner_user_id AND u.organization_id=e.organization_id
      LEFT JOIN cohorts c ON c.cohort_id=e.cohort_id AND c.organization_id=e.organization_id
      LEFT JOIN curriculum_truth_facts lf ON lf.organization_id=e.organization_id AND lf.learner_user_id=e.learner_user_id
      WHERE e.organization_id=$1 AND e.status IN ('PENDING','ACTIVE','COMPLETED')${staffFilter.replaceAll("c.cohort_id", "e.cohort_id")}${input.cohortId ? ` AND e.cohort_id=$${cohortParam}` : ""}
      GROUP BY e.enrollment_id, c.name, u.full_name, u.email ORDER BY last_activity_at NULLS FIRST, u.full_name ASC LIMIT ${limit}`, cohortParams),
    query(`SELECT a.assignment_id, a.title, a.assignment_type, a.cohort_id, a.course_id, a.lesson_id, a.due_at, a.status, c.name AS cohort_name
      FROM assignments a LEFT JOIN cohorts c ON c.cohort_id=a.cohort_id AND c.organization_id=a.organization_id
      WHERE a.organization_id=$1 AND a.status NOT IN ('cancelled','retired')${isAdmin(actor) ? "" : " AND (a.cohort_id IS NULL OR EXISTS (SELECT 1 FROM cohort_staff cs WHERE cs.organization_id=$1 AND cs.cohort_id=a.cohort_id AND cs.user_id=$2 AND cs.status='ACTIVE'))"}${input.cohortId ? ` AND a.cohort_id=$${cohortParam}` : ""}
      ORDER BY a.due_at ASC LIMIT ${limit}`, cohortParams),
    query(`SELECT * FROM (
      SELECT 'PROJECT_REVIEW' AS review_type, ps.submission_id AS source_id, ps.submitted_by_user_id AS learner_user_id, ps.submitted_at, ps.status, p.title
      FROM project_submissions ps JOIN projects p ON p.project_id=ps.project_id AND p.organization_id=ps.organization_id
      WHERE ps.organization_id=$1 AND ps.status IN ('SUBMITTED','NEEDS_REVISION')
      UNION ALL
      SELECT 'EVIDENCE_REVIEW', evidence_id, user_id, created_at, status, criterion
      FROM prepare_prove_evidence WHERE organization_id=$1 AND status IN ('CANDIDATE','REVIEWABLE')
    ) pending ORDER BY submitted_at ASC LIMIT ${limit}`, [organizationId]),
    query(`SELECT live_session_id, title, cohort_id, course_id, lesson_id, starts_at, ends_at, status, instructor_id
      FROM live_sessions WHERE organization_id=$1 AND status NOT IN ('cancelled','cancelled_by_host')${input.cohortId ? " AND cohort_id=$2" : ""}
      ORDER BY starts_at ASC LIMIT ${limit}`, input.cohortId ? [organizationId, input.cohortId] : [organizationId]),
    query(`SELECT
      (SELECT COUNT(*)::int FROM cohorts WHERE organization_id=$1${isAdmin(actor) ? "" : " AND EXISTS (SELECT 1 FROM cohort_staff cs WHERE cs.organization_id=$1 AND cs.cohort_id=cohorts.cohort_id AND cs.user_id=$2 AND cs.status='ACTIVE')"}) AS cohort_count,
      (SELECT COUNT(*)::int FROM enrollments WHERE organization_id=$1 AND status IN ('PENDING','ACTIVE')) AS learner_count,
      (SELECT COUNT(*)::int FROM assignments WHERE organization_id=$1 AND status NOT IN ('cancelled','retired')) AS active_assignment_count,
      (SELECT COUNT(*)::int FROM project_submissions WHERE organization_id=$1 AND status IN ('SUBMITTED','NEEDS_REVISION')) +
      (SELECT COUNT(*)::int FROM prepare_prove_evidence WHERE organization_id=$1 AND status IN ('CANDIDATE','REVIEWABLE')) AS review_count,
      (SELECT COUNT(*)::int FROM live_sessions WHERE organization_id=$1 AND starts_at >= NOW() AND status NOT IN ('cancelled','cancelled_by_host')) AS upcoming_live_count`, isAdmin(actor) ? [organizationId] : [organizationId, userId]),
  ]);

  return {
    scope: { organizationId },
    summary: summary.rows[0] || { cohort_count: 0, learner_count: 0, active_assignment_count: 0, review_count: 0, upcoming_live_count: 0 },
    cohorts: cohorts.rows,
    roster: roster.rows,
    assignments: assignments.rows,
    reviewQueue: reviews.rows,
    liveSessions: live.rows,
    generatedAt: new Date().toISOString(),
  };
}

function requireScopedStaff(actor: Actor) {
  if (!canView(actor)) {
    const error: any = new Error("FORBIDDEN"); error.statusCode = 403; throw error;
  }
  return scope(actor);
}

export async function getLearnerDetail(actor: Actor, learnerId: string) {
  const { organizationId, userId } = requireScopedStaff(actor);
  const learner = await query(`SELECT user_id, full_name, email, status FROM users WHERE organization_id=$1 AND user_id=$2`, [organizationId, learnerId]);
  if (!learner.rows[0]) return null;
  if (!isAdmin(actor)) {
    const access = await query(`SELECT 1 FROM enrollments e JOIN cohort_staff cs ON cs.organization_id=e.organization_id AND cs.cohort_id=e.cohort_id AND cs.user_id=$2 AND cs.status='ACTIVE' WHERE e.organization_id=$1 AND e.learner_user_id=$3 AND e.status IN ('PENDING','ACTIVE','COMPLETED') LIMIT 1`, [organizationId, userId, learnerId]);
    if (!access.rows[0]) return null;
  }
  const [enrollments, assignments, facts, evidence, projects, attendance] = await Promise.all([
    query(`SELECT e.enrollment_id, e.program_id, e.cohort_id, e.status, c.name AS cohort_name FROM enrollments e LEFT JOIN cohorts c ON c.organization_id=e.organization_id AND c.cohort_id=e.cohort_id WHERE e.organization_id=$1 AND e.learner_user_id=$2 ORDER BY e.starts_at DESC`, [organizationId, learnerId]),
    query(`SELECT a.assignment_id, a.title, a.assignment_type, a.due_at, a.status, a.cohort_id FROM assignments a WHERE a.organization_id=$1 AND (a.visibility_scope='organization' OR EXISTS (SELECT 1 FROM assignment_targets t WHERE t.assignment_id=a.assignment_id AND t.organization_id=$1 AND t.user_id=$2)) ORDER BY a.due_at ASC`, [organizationId, learnerId]),
    query(`SELECT truth_fact_id, fact_type, source_type, source_record_id, assignment_id, curriculum_release_id, competency_id, occurred_at FROM curriculum_truth_facts WHERE organization_id=$1 AND learner_user_id=$2 ORDER BY occurred_at DESC LIMIT 100`, [organizationId, learnerId]),
    query(`SELECT evidence_id, source_type, status, assignment_id, curriculum_release_id, competency_id, verifier_user_id, created_at FROM prepare_prove_evidence WHERE organization_id=$1 AND user_id=$2 AND status <> 'SUPERSEDED' ORDER BY created_at DESC LIMIT 100`, [organizationId, learnerId]),
    query(`SELECT ps.submission_id, ps.project_id, ps.status, ps.submitted_at, p.title FROM project_submissions ps JOIN projects p ON p.organization_id=ps.organization_id AND p.project_id=ps.project_id WHERE ps.organization_id=$1 AND ps.submitted_by_user_id=$2 ORDER BY ps.submitted_at DESC LIMIT 100`, [organizationId, learnerId]),
    query(`SELECT e.join_event_id, e.live_session_id, e.attendance_status, e.created_at, s.title, s.starts_at FROM live_session_join_events e JOIN live_sessions s ON s.organization_id=$1 AND s.live_session_id=e.live_session_id WHERE s.organization_id=$1 AND e.user_id=$2 ORDER BY e.created_at DESC LIMIT 100`, [organizationId, learnerId]),
  ]);
  return { learner: learner.rows[0], enrollments: enrollments.rows, assignments: assignments.rows, truthFacts: facts.rows, evidence: evidence.rows, projects: projects.rows, attendance: attendance.rows };
}

export async function getAssignmentDetail(actor: Actor, assignmentId: string) {
  const { organizationId, userId } = requireScopedStaff(actor);
  const assignment = await query(`SELECT a.*, c.name AS cohort_name FROM assignments a LEFT JOIN cohorts c ON c.organization_id=a.organization_id AND c.cohort_id=a.cohort_id WHERE a.organization_id=$1 AND a.assignment_id=$2`, [organizationId, assignmentId]);
  if (!assignment.rows[0]) return null;
  if (!isAdmin(actor) && assignment.rows[0].created_by !== userId) {
    const access = await query(`SELECT 1 FROM assignment_targets t JOIN cohort_staff cs ON cs.organization_id=t.organization_id AND cs.cohort_id=t.cohort_id AND cs.user_id=$2 AND cs.status='ACTIVE' WHERE t.organization_id=$1 AND t.assignment_id=$3 LIMIT 1`, [organizationId, userId, assignmentId]);
    if (!access.rows[0]) return null;
  }
  const [targets, facts] = await Promise.all([
    query(`SELECT t.assignment_target_id, t.target_type, t.user_id, t.cohort_id, t.program_id, u.full_name, u.email FROM assignment_targets t JOIN users u ON u.organization_id=$1 AND u.user_id=t.user_id WHERE t.organization_id=$1 AND t.assignment_id=$2 ORDER BY u.full_name ASC`, [organizationId, assignmentId]),
    query(`SELECT fact_type, learner_user_id, curriculum_release_id, occurred_at FROM curriculum_truth_facts WHERE organization_id=$1 AND assignment_id=$2 ORDER BY occurred_at DESC`, [organizationId, assignmentId]),
  ]);
  return { assignment: assignment.rows[0], targets: targets.rows, truthFacts: facts.rows };
}

export async function getCourseDetail(actor: Actor, courseId: string) {
  const { organizationId, userId } = requireScopedStaff(actor);
  const course = await query(`SELECT course_id, title, short_description, status
    FROM curriculum_courses WHERE organization_id=$1 AND course_id=$2`, [organizationId, courseId]);
  if (!course.rows[0]) return null;
  const courseParam = isAdmin(actor) ? 2 : 3;

  const scopeFilter = isAdmin(actor)
    ? ""
    : " AND (a.created_by = $2 OR EXISTS (SELECT 1 FROM cohort_staff cs WHERE cs.organization_id=a.organization_id AND cs.cohort_id=a.cohort_id AND cs.user_id=$2 AND cs.status='ACTIVE'))";
  const params = isAdmin(actor) ? [organizationId, courseId] : [organizationId, userId, courseId];
  const releaseParams = [organizationId, courseId];
  const [release, assignments, learners, reviews, live, progress] = await Promise.all([
    query(`SELECT release_id, version_number, status, published_at
      FROM curriculum_releases WHERE organization_id=$1 AND course_id=$2
      ORDER BY version_number DESC LIMIT 1`, releaseParams),
    query(`SELECT a.assignment_id, a.title, a.assignment_type, a.cohort_id, a.lesson_id, a.curriculum_release_id, a.due_at, a.status
      FROM assignments a WHERE a.organization_id=$1 AND a.course_id=$${courseParam} AND a.status NOT IN ('cancelled','retired')${scopeFilter}
      ORDER BY a.due_at ASC NULLS LAST`, params),
    query(`SELECT COUNT(DISTINCT e.learner_user_id)::int AS learner_count
      FROM enrollments e JOIN assignments a ON a.organization_id=e.organization_id AND a.cohort_id=e.cohort_id
      WHERE e.organization_id=$1 AND a.course_id=$${courseParam} AND e.status IN ('PENDING','ACTIVE','COMPLETED') AND a.status NOT IN ('cancelled','retired')${scopeFilter}`, params),
    query(`SELECT COUNT(*)::int AS review_count FROM (
      SELECT ps.submission_id FROM project_submissions ps JOIN projects p ON p.organization_id=ps.organization_id AND p.project_id=ps.project_id
        WHERE ps.organization_id=$1 AND p.course_id=$${courseParam} AND ps.status IN ('SUBMITTED','NEEDS_REVISION')${isAdmin(actor) ? "" : " AND p.created_by_user_id=$2"}
      UNION ALL
      SELECT e.evidence_id FROM prepare_prove_evidence e JOIN assignments a ON a.organization_id=e.organization_id AND a.assignment_id=e.assignment_id
        WHERE e.organization_id=$1 AND a.course_id=$${courseParam} AND e.status IN ('CANDIDATE','REVIEWABLE')${scopeFilter}
    ) pending`, params),
    query(`SELECT live_session_id, title, starts_at, status, cohort_id FROM live_sessions
      WHERE organization_id=$1 AND course_id=$2 AND status NOT IN ('cancelled','cancelled_by_host') ORDER BY starts_at ASC LIMIT 5`, [organizationId, courseId]),
    query(`WITH eligible AS (
        SELECT DISTINCT e.learner_user_id FROM enrollments e JOIN assignments a ON a.organization_id=e.organization_id AND a.cohort_id=e.cohort_id
        WHERE e.organization_id=$1 AND a.course_id=$${courseParam} AND e.status IN ('PENDING','ACTIVE','COMPLETED') AND a.status NOT IN ('cancelled','retired')${scopeFilter}
      ), completed AS (
        SELECT DISTINCT f.learner_user_id FROM curriculum_truth_facts f JOIN assignments a ON a.organization_id=f.organization_id AND a.assignment_id=f.assignment_id
        WHERE f.organization_id=$1 AND a.course_id=$${courseParam} AND f.fact_type='LESSON_COMPLETED'${scopeFilter}
      ) SELECT (SELECT COUNT(*)::int FROM completed WHERE learner_user_id IN (SELECT learner_user_id FROM eligible)) AS numerator,
        (SELECT COUNT(*)::int FROM eligible) AS denominator`, params),
  ]);
  const numerator = Number(progress.rows[0]?.numerator || 0);
  const denominator = Number(progress.rows[0]?.denominator || 0);
  return {
    course: course.rows[0],
    release: release.rows[0] || null,
    assignments: assignments.rows,
    learnerCount: Number(learners.rows[0]?.learner_count || 0),
    reviewCount: Number(reviews.rows[0]?.review_count || 0),
    liveSessions: live.rows,
    progress: { value: denominator ? Math.round((numerator / denominator) * 100) : null, numerator, denominator, status: denominator ? "OK" : "NO_DATA", calculated_at: new Date().toISOString() },
    scope: { organizationId, courseId },
  };
}

export { canView, isAdmin };
