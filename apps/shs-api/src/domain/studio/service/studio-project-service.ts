import { createHash, randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isAdminTier, isStudentOnly } from "../../shared/audience-eligibility.js";
import { getAssignmentForActor, type ActorUser } from "../../assignments/service/assignment-service.js";
import { AssignmentRepo } from "../../assignments/repo/assignment-repo.js";
import { EnrollmentRepo } from "../../enrollments/repo/enrollment-repo.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import {
  canTransitionStudioProject,
  STUDIO_DESTINATIONS,
  STUDIO_PROJECT_ORIGINS,
  STUDIO_PROJECT_TYPES,
  type StudioDestination,
  type StudioProjectOrigin,
  type StudioProjectType,
  type StudioProjectStatus,
} from "../model/studio-lifecycle.js";
import { validateStudioWorkspaceWork, workspaceFromRow } from "../model/studio-workspace.js";
import { evaluateStudioQa, rowToStudioQaRun, STUDIO_QA_RULESET_VERSION } from "../model/studio-qa.js";
import { rowToStudioReviewSubmission, STUDIO_REVIEW_DECISIONS, type StudioReviewDecision } from "../model/studio-review.js";

type DbExecutor = { query: (sql: string, params?: unknown[]) => Promise<any> };
const assignmentRepo = new AssignmentRepo();
const enrollmentRepo = new EnrollmentRepo();
const ADMIN_ROLES = ["shf_admin", "shs_admin", "org_admin", "super_admin", "program_manager"];

function scope(actor: any) {
  const userId = String(actor?.user_id || actor?.id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId, roles: actor?.roles || [], permissions: actor?.permissions || [] };
}

function stable(...parts: string[]) {
  return createHash("sha256").update(parts.join("|"), "utf8").digest("hex").slice(0, 32);
}

function requiredString(value: unknown, field: string) {
  const result = String(value || "").trim();
  if (!result) throw new Error(`${field}_required`);
  return result;
}

function validEnum<T extends readonly string[]>(value: unknown, values: T, field: string): T[number] {
  if (!values.includes(value as T[number])) throw new Error(`invalid_${field}`);
  return value as T[number];
}

function rowToProject(row: any) {
  return {
    projectId: row.project_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    learnerId: row.studio_learner_id,
    projectType: row.studio_project_type,
    origin: row.studio_origin,
    originReferenceId: row.studio_origin_reference_id,
    assignmentId: row.studio_assignment_id,
    curriculumReleaseId: row.studio_curriculum_release_id,
    completionPolicyId: row.studio_completion_policy_id,
    status: row.studio_status,
    currentVersionId: null,
    destination: row.studio_destination,
    qaStatus: row.studio_qa_status,
    reviewStatus: row.studio_review_status,
    deliveryStatus: row.studio_delivery_status,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class StudioProjectService {
  constructor(
    private dbQuery: typeof query = query,
    private transaction: typeof withTransaction = withTransaction,
    private outbox = new IntegrationOutboxRepo(),
    private assignmentLookup: typeof getAssignmentForActor = getAssignmentForActor,
    private assignments: Pick<AssignmentRepo, "hasEntitlementTarget"> = assignmentRepo,
    private enrollments: Pick<EnrollmentRepo, "listActiveEnrollmentsForLearner"> = enrollmentRepo,
  ) {}

  private requirePermission(actor: any, permission: string) {
    if (!hasPermission(actor?.permissions || [], permission)) throw new Error(`${permission.replaceAll(".", "_")}_required`);
  }

  private async assertLearnerInOrganization(learnerId: string, organizationId: string) {
    const result = await this.dbQuery("SELECT user_id FROM users WHERE user_id=$1 AND organization_id=$2 AND status IN ('active','ACTIVE')", [learnerId, organizationId]);
    if (!result.rows[0]) throw new Error("LEARNER_NOT_FOUND");
  }

  private async assertAssignmentLearnerEligible(assignment: any, learnerId: string, organizationId: string) {
    await this.assertLearnerInOrganization(learnerId, organizationId);
    const active = await this.enrollments.listActiveEnrollmentsForLearner(organizationId, learnerId);
    const eligible = await this.assignments.hasEntitlementTarget({
      assignmentId: assignment.id,
      organizationId,
      userId: learnerId,
      programIds: Array.from(new Set(active.map((item) => item.programId))),
      cohortIds: Array.from(new Set(active.map((item) => item.cohortId).filter(Boolean))) as string[],
    });
    if (!eligible) throw new Error("LEARNER_NOT_ELIGIBLE_FOR_ASSIGNMENT");
  }

  private async authorizeProject(actor: any, row: any) {
    const s = scope(actor);
    if (row.organization_id !== s.organizationId || row.tenant_id !== s.tenantId) throw new Error("PROJECT_NOT_FOUND");
    if (isAdminTier(s.roles) || row.studio_learner_id === s.userId) return s;
    if (!row.studio_assignment_id) throw new Error("PROJECT_NOT_FOUND");
    const assignment = await this.assignmentLookup(row.studio_assignment_id, actor as ActorUser);
    if (!assignment) throw new Error("PROJECT_NOT_FOUND");
    return s;
  }

  async createStudentIdea(actor: any, input: any) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE);
    const s = scope(actor);
    if (!isStudentOnly(s.roles)) throw new Error("STUDENT_IDEA_STUDENT_REQUIRED");
    const projectType = validEnum(input?.projectType || input?.project_type, STUDIO_PROJECT_TYPES, "project_type") as StudioProjectType;
    const requestedDestination = input?.destination || "STUDENT";
    if (requestedDestination !== "STUDENT") throw new Error("STUDENT_DESTINATION_REQUIRED");
    const destination: StudioDestination = "STUDENT";
    const title = requiredString(input?.title, "title").slice(0, 200);
    const projectId = `studio_project_${randomUUID()}`;
    const handoffId = `studio_handoff_${randomUUID()}`;
    return this.createFromValidatedHandoff(actor, {
      handoffId, projectId, title, projectType, destination, origin: "STUDENT_IDEA",
      learnerId: s.userId, organizationId: s.organizationId, tenantId: s.tenantId,
      originReferenceId: null, assignment: null, requirements: input?.requirements || {}, dueAt: input?.dueAt || null,
    });
  }

  async createFromAssignment(actor: any, input: any) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE);
    const s = scope(actor);
    const assignmentId = requiredString(input?.assignmentId || input?.assignment_id, "assignment_id");
    const assignment = await this.assignmentLookup(assignmentId, actor as ActorUser);
    if (!assignment || assignment.status !== "published") throw new Error("ASSIGNMENT_NOT_FOUND");
    const learnerId = String(input?.learnerId || input?.learner_id || s.userId);
    if (isStudentOnly(s.roles) && learnerId !== s.userId) throw new Error("LEARNER_SCOPE_FORBIDDEN");
    await this.assertAssignmentLearnerEligible(assignment, learnerId, s.organizationId);
    if (!assignment.curriculumReleaseId) throw new Error("ASSIGNMENT_RELEASE_REQUIRED");
    const projectType = validEnum(input?.projectType || input?.project_type, STUDIO_PROJECT_TYPES, "project_type") as StudioProjectType;
    const requestedDestination = input?.destination || "STUDENT";
    const destination = validEnum(requestedDestination, STUDIO_DESTINATIONS, "destination") as StudioDestination;
    if (destination === "COMMERCIAL" && !hasPermission(s.permissions, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_COMMERCIAL)) throw new Error("COMMERCIAL_DESTINATION_FORBIDDEN");
    if (isStudentOnly(s.roles) && destination !== "STUDENT") throw new Error("STUDENT_DESTINATION_REQUIRED");
    const title = requiredString(input?.title || assignment.title, "title").slice(0, 200);
    const projectId = `studio_project_${stable(s.organizationId, learnerId, assignment.id, projectType)}`;
    const handoffId = `studio_handoff_${stable(s.organizationId, learnerId, assignment.id, projectType)}`;
    const [unitKey, lessonKey] = String(assignment.assignedContentId || "").split(":");
    return this.transaction(async (db: DbExecutor) => {
      const inserted = await db.query(
        `INSERT INTO studio_handoffs (handoff_id, organization_id, tenant_id, learner_id, origin, project_type, destination, assignment_id, cohort_id, course_id, unit_key, lesson_key, curriculum_release_id, completion_policy_id, due_at, requirements_json, created_by_user_id)
         VALUES ($1,$2,$3,$4,'ASSIGNMENT',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (organization_id, tenant_id, learner_id, assignment_id, project_type) WHERE assignment_id IS NOT NULL DO NOTHING
         RETURNING *`,
        [handoffId, s.organizationId, s.tenantId, learnerId, projectType, destination, assignment.id, assignment.cohortId, assignment.courseId, unitKey || null, lessonKey || null, assignment.curriculumReleaseId, assignment.completionPolicyId, assignment.dueAt, JSON.stringify(input?.requirements || {}), s.userId],
      );
      if (!inserted.rows[0]) {
        const existing = await db.query("SELECT p.* FROM studio_handoffs h JOIN projects p ON p.project_id=h.project_id WHERE h.organization_id=$1 AND h.tenant_id=$2 AND h.learner_id=$3 AND h.assignment_id=$4 AND h.project_type=$5 FOR SHARE", [s.organizationId, s.tenantId, learnerId, assignment.id, projectType]);
        if (!existing.rows[0]) throw new Error("HANDOFF_IN_PROGRESS");
        return rowToProject(existing.rows[0]);
      }
      return this.createProjectAndEvents(db, { actor: s, organizationId: s.organizationId, tenantId: s.tenantId, handoffId, projectId, title, projectType, destination, origin: "ASSIGNMENT", originReferenceId: assignment.id, learnerId, assignment, requirements: input?.requirements || {}, dueAt: assignment.dueAt });
    });
  }

  private async createFromValidatedHandoff(actor: any, data: any) {
    data = { ...data, actor: scope(actor) };
    return this.transaction(async (db: DbExecutor) => {
      // The handoff FK points at the project created below. Keep both writes
      // in this transaction and attach the reference after the project exists.
      await db.query(`INSERT INTO studio_handoffs (handoff_id, project_id, organization_id, tenant_id, learner_id, origin, project_type, destination, requirements_json, due_at, created_by_user_id) VALUES ($1,NULL,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [data.handoffId, data.organizationId, data.tenantId, data.learnerId, data.origin, data.projectType, data.destination, JSON.stringify(data.requirements), data.dueAt, data.actor.userId]);
      return this.createProjectAndEvents(db, data);
    });
  }

  private async createProjectAndEvents(db: DbExecutor, data: any) {
    const result = await db.query(
      `INSERT INTO projects (project_id, organization_id, tenant_id, course_id, title, project_type, status, created_by_user_id, studio_origin, studio_origin_reference_id, studio_learner_id, studio_project_type, studio_destination, studio_assignment_id, studio_curriculum_release_id, studio_completion_policy_id, studio_status, studio_qa_status, studio_review_status, studio_delivery_status)
       VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$8,$9,$10,$11,$12,$13,$14,$15,'DRAFT','NOT_RUN','NOT_REQUESTED','NOT_READY') RETURNING *`,
      [data.projectId, data.organizationId, data.tenantId, data.assignment?.courseId || null, data.title, data.projectType, data.actor.userId, data.origin, data.originReferenceId || null, data.learnerId, data.projectType, data.destination, data.assignment?.id || null, data.assignment?.curriculumReleaseId || null, data.assignment?.completionPolicyId || null],
    );
    const project = rowToProject(result.rows[0]);
    const eventBase = { organization_id: data.organizationId, originating_actor_id: data.actor.userId, occurred_at: new Date().toISOString(), correlation_id: `studio_${data.projectId}` };
    await this.outbox.enqueue({ ...eventBase, producer_id: "shs-api.studio", event_type: "studio.handoff.created", subject_type: "studio_handoff", subject_id: data.handoffId, idempotency_key: data.handoffId, destination: "shs-studio" }, db);
    await db.query("UPDATE studio_handoffs SET project_id=$1 WHERE handoff_id=$2", [data.projectId, data.handoffId]);
    await this.outbox.enqueue({ ...eventBase, producer_id: "shs-api.studio", event_type: "studio.project.created", subject_type: "project", subject_id: data.projectId, idempotency_key: data.projectId, destination: "shs-studio" }, db);
    return project;
  }

  async get(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const row = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL", [requiredString(projectId, "project_id")])).rows[0];
    if (!row) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, row);
    return rowToProject(row);
  }

  // Project Resources are a read-only projection of the learner-visible
  // curriculum release snapshot. Independent projects intentionally have no
  // assignment lineage and therefore no assignment resources to inherit.
  async getResources(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const projectRow = (await this.dbQuery(
      "SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL",
      [id],
    )).rows[0];
    if (!projectRow) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, projectRow);

    if (projectRow.studio_origin !== "ASSIGNMENT" || !projectRow.studio_assignment_id || !projectRow.studio_curriculum_release_id) {
      return { projectId: id, resources: [] };
    }

    const handoff = (await this.dbQuery(
      `SELECT unit_key, lesson_key
       FROM studio_handoffs
       WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND origin='ASSIGNMENT'`,
      [id, s.organizationId, s.tenantId],
    )).rows[0];
    if (!handoff?.lesson_key) return { projectId: id, resources: [] };

    const release = (await this.dbQuery(
      `SELECT snapshot
       FROM curriculum_releases
       WHERE release_id=$1 AND organization_id=$2`,
      [projectRow.studio_curriculum_release_id, s.organizationId],
    )).rows[0];
    if (!release?.snapshot || !Array.isArray(release.snapshot.units)) return { projectId: id, resources: [] };

    const unit = release.snapshot.units.find((item: any) => item?.stableKey === handoff.unit_key);
    const lesson = unit?.lessons?.find((item: any) => item?.stableKey === handoff.lesson_key);
    const resources = Array.isArray(lesson?.resources) ? lesson.resources.map((resource: any) => ({
      id: resource.resourceId,
      title: resource.title,
      description: resource.description ?? null,
      type: resource.resourceType,
      href: resource.externalUrl ?? null,
      origin: "ASSIGNMENT",
      sourceLabel: "From your assignment",
    })) : [];
    return { projectId: id, resources };
  }

  // Derived builder context. This is intentionally not persisted: the
  // project, handoff, release snapshot, and resource projection remain the
  // sources of truth for their respective domains.
  async getBuildPacket(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const projectRow = (await this.dbQuery(
      "SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL",
      [id],
    )).rows[0];
    if (!projectRow) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, projectRow);

    let lineage: any = {
      assignmentId: null,
      curriculumReleaseId: null,
      unitKey: null,
      lessonKey: null,
    };
    let requirements: unknown = {};
    if (projectRow.studio_origin === "ASSIGNMENT") {
      const handoff = (await this.dbQuery(
        `SELECT assignment_id, curriculum_release_id, unit_key, lesson_key, requirements_json
         FROM studio_handoffs
         WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND origin='ASSIGNMENT'`,
        [id, s.organizationId, s.tenantId],
      )).rows[0];
      if (!handoff?.assignment_id || !handoff.curriculum_release_id) throw new Error("STUDIO_LINEAGE_INVALID");
      lineage = {
        assignmentId: handoff.assignment_id,
        curriculumReleaseId: handoff.curriculum_release_id,
        unitKey: handoff.unit_key || null,
        lessonKey: handoff.lesson_key || null,
      };
      requirements = handoff.requirements_json || {};
    }

    return {
      packetId: `build_packet_${id}_v1`,
      version: 1,
      project: {
        id,
        type: projectRow.studio_project_type,
        title: projectRow.title,
        lifecycleStatus: projectRow.studio_status,
      },
      lineage,
      requirements,
      deliverables: [],
      resources: (await this.getResources(actor, id)).resources,
      templates: [],
      tools: [],
      artifactReferences: [],
    };
  }

  // Builder work is durable project state, but it is intentionally not a
  // lifecycle, QA, review, delivery, Evidence, or completion decision.
  async getWorkspace(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const projectRow = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL", [id])).rows[0];
    if (!projectRow) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, projectRow);
    const result = await this.dbQuery(
      "SELECT * FROM studio_builder_workspaces WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3",
      [id, s.organizationId, s.tenantId],
    );
    return workspaceFromRow(result.rows[0] || { project_id: id, project_type: projectRow.studio_project_type, work_json: null }, projectRow.studio_project_type);
  }

  async getCurrentQa(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const projectRow = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL", [id])).rows[0];
    if (!projectRow) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, projectRow);
    const workspace = (await this.dbQuery(
      "SELECT * FROM studio_builder_workspaces WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3",
      [id, s.organizationId, s.tenantId],
    )).rows[0];
    const currentRevision = Number(workspace?.revision || 0);
    const run = (await this.dbQuery(
      "SELECT * FROM studio_qa_runs WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY created_at DESC LIMIT 1",
      [id, s.organizationId, s.tenantId],
    )).rows[0];
    if (!run) return { projectId: id, workspaceRevision: currentRevision, status: "NOT_CHECKED", run: null };
    const mapped = rowToStudioQaRun(run);
    return { projectId: id, workspaceRevision: currentRevision, status: mapped.workspaceRevision === currentRevision ? mapped.status : "STALE", run: mapped };
  }

  async runQa(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const projectRow = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL", [id])).rows[0];
    if (!projectRow) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, projectRow);
    const workspaceRow = (await this.dbQuery(
      "SELECT * FROM studio_builder_workspaces WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3",
      [id, s.organizationId, s.tenantId],
    )).rows[0];
    const workspace = workspaceFromRow(workspaceRow || { project_id: id, project_type: projectRow.studio_project_type, work_json: null }, projectRow.studio_project_type);
    await this.getBuildPacket(actor, id);
    const evaluation = evaluateStudioQa(projectRow.studio_project_type, workspace.work, Boolean(workspaceRow));
    const now = new Date().toISOString();
    const runId = `studio_qa_${randomUUID()}`;
    const row = {
      qa_run_id: runId,
      project_id: id,
      organization_id: s.organizationId,
      tenant_id: s.tenantId,
      project_type: projectRow.studio_project_type,
      workspace_revision: workspace.revision,
      status: evaluation.status,
      ruleset_version: STUDIO_QA_RULESET_VERSION,
      summary_json: evaluation.summary,
      findings_json: evaluation.findings,
      created_by_user_id: s.userId,
      started_at: now,
      completed_at: now,
      created_at: now,
    };
    await this.dbQuery(
      `INSERT INTO studio_qa_runs (qa_run_id, project_id, organization_id, tenant_id, project_type, workspace_revision, status, ruleset_version, summary_json, findings_json, created_by_user_id, started_at, completed_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [row.qa_run_id, row.project_id, row.organization_id, row.tenant_id, row.project_type, row.workspace_revision, row.status, row.ruleset_version, JSON.stringify(row.summary_json), JSON.stringify(row.findings_json), row.created_by_user_id, row.started_at, row.completed_at, row.created_at],
    );
    await this.outbox.enqueue({
      producer_id: "shs-api.studio", event_type: "studio.qa.completed", subject_type: "studio_qa_run", subject_id: runId,
      organization_id: s.organizationId, originating_actor_id: s.userId, occurred_at: now,
      idempotency_key: runId, correlation_id: `studio:${id}:qa:${workspace.revision}`, destination: "shs-studio",
      payload: { project_id: id, workspace_revision: workspace.revision, status: evaluation.status },
    });
    return rowToStudioQaRun(row);
  }

  private async authorizeReviewProject(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW);
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const row = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL AND organization_id=$2 AND tenant_id=$3", [id, s.organizationId, s.tenantId])).rows[0];
    if (!row) throw new Error("PROJECT_NOT_FOUND");
    return { scope: s, row };
  }

  private async reviewSubmissionRow(actor: any, projectId: string, submissionId: string, reviewer = false) {
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    if (reviewer) await this.authorizeReviewProject(actor, id);
    else {
      const project = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL", [id])).rows[0];
      if (!project) throw new Error("PROJECT_NOT_FOUND");
      await this.authorizeProject(actor, project);
    }
    const result = await this.dbQuery(
      `SELECT s.*, d.review_decision_id, d.decision, d.feedback, d.reviewed_by_user_id, d.reviewed_at
       FROM studio_review_submissions s
       LEFT JOIN studio_review_decisions d ON d.review_submission_id=s.review_submission_id
       WHERE s.review_submission_id=$1 AND s.project_id=$2 AND s.organization_id=$3 AND s.tenant_id=$4`,
      [requiredString(submissionId, "submission_id"), id, s.organizationId, s.tenantId],
    );
    if (!result.rows[0]) throw new Error("REVIEW_SUBMISSION_NOT_FOUND");
    const row = result.rows[0];
    const workspace = (await this.dbQuery("SELECT revision FROM studio_builder_workspaces WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, s.organizationId, s.tenantId])).rows[0];
    const decision = row.review_decision_id ? row : null;
    return { row, decision, currentWorkspaceRevision: workspace ? Number(workspace.revision) : 0 };
  }

  async getCurrentReview(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const project = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL", [id])).rows[0];
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, project);
    const workspace = (await this.dbQuery("SELECT revision FROM studio_builder_workspaces WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, s.organizationId, s.tenantId])).rows[0];
    const currentRevision = Number(workspace?.revision || 0);
    const result = await this.dbQuery(
      `SELECT s.*, d.review_decision_id, d.decision, d.feedback, d.reviewed_by_user_id, d.reviewed_at
       FROM studio_review_submissions s
       LEFT JOIN studio_review_decisions d ON d.review_submission_id=s.review_submission_id
       WHERE s.project_id=$1 AND s.organization_id=$2 AND s.tenant_id=$3
       ORDER BY s.created_at DESC LIMIT 1`, [id, s.organizationId, s.tenantId],
    );
    if (!result.rows[0]) return { projectId: id, currentWorkspaceRevision: currentRevision, submission: null };
    const row = result.rows[0];
    return { projectId: id, currentWorkspaceRevision: currentRevision, submission: rowToStudioReviewSubmission(row, row.review_decision_id ? row : null, currentRevision) };
  }

  async submitForReview(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE);
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const project = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL", [id])).rows[0];
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, project);
    if (project.studio_learner_id !== s.userId && !isAdminTier(s.roles)) throw new Error("REVIEW_SUBMISSION_FORBIDDEN");
    const workspace = (await this.dbQuery("SELECT * FROM studio_builder_workspaces WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, s.organizationId, s.tenantId])).rows[0];
    if (!workspace) throw new Error("WORKSPACE_REQUIRED_FOR_REVIEW");
    const qa = (await this.dbQuery("SELECT * FROM studio_qa_runs WHERE qa_run_id IN (SELECT qa_run_id FROM studio_qa_runs WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND workspace_revision=$4 AND status='PASSED' ORDER BY created_at DESC LIMIT 1)", [id, s.organizationId, s.tenantId, workspace.revision])).rows[0];
    if (!qa) throw new Error("CURRENT_QA_REQUIRED");
    const existing = (await this.dbQuery("SELECT * FROM studio_review_submissions WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND workspace_revision=$4 ORDER BY created_at DESC LIMIT 1", [id, s.organizationId, s.tenantId, workspace.revision])).rows[0];
    if (existing) {
      const decision = (await this.dbQuery("SELECT * FROM studio_review_decisions WHERE review_submission_id=$1", [existing.review_submission_id])).rows[0] || null;
      return rowToStudioReviewSubmission(existing, decision, Number(workspace.revision));
    }
    const submissionId = `studio_review_submission_${randomUUID()}`;
    const now = new Date().toISOString();
    const row = {
      review_submission_id: submissionId, project_id: id, organization_id: s.organizationId, tenant_id: s.tenantId,
      project_type: project.studio_project_type, workspace_revision: Number(workspace.revision), qa_run_id: qa.qa_run_id,
      submitted_work_json: workspace.work_json, status: "SUBMITTED", submitted_by_user_id: s.userId, submitted_at: now, created_at: now,
    };
    const inserted = await this.dbQuery(
      `INSERT INTO studio_review_submissions (review_submission_id, project_id, organization_id, tenant_id, project_type, workspace_revision, qa_run_id, submitted_work_json, status, submitted_by_user_id, submitted_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (project_id, workspace_revision) DO NOTHING
       RETURNING *`,
      [row.review_submission_id, row.project_id, row.organization_id, row.tenant_id, row.project_type, row.workspace_revision, row.qa_run_id, JSON.stringify(row.submitted_work_json), row.status, row.submitted_by_user_id, row.submitted_at, row.created_at],
    );
    if (!inserted.rows[0]) {
      const existingAfterRace = (await this.dbQuery("SELECT * FROM studio_review_submissions WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 AND workspace_revision=$4 ORDER BY created_at DESC LIMIT 1", [id, s.organizationId, s.tenantId, workspace.revision])).rows[0];
      if (!existingAfterRace) throw new Error("REVIEW_SUBMISSION_CONFLICT");
      const decision = (await this.dbQuery("SELECT * FROM studio_review_decisions WHERE review_submission_id=$1", [existingAfterRace.review_submission_id])).rows[0] || null;
      return rowToStudioReviewSubmission(existingAfterRace, decision, Number(workspace.revision));
    }
    await this.outbox.enqueue({ producer_id: "shs-api.studio", event_type: "studio.review.submitted", subject_type: "studio_review_submission", subject_id: submissionId, organization_id: s.organizationId, originating_actor_id: s.userId, occurred_at: now, idempotency_key: submissionId, correlation_id: `studio:${id}:review:${submissionId}`, destination: "shs-studio", payload: { project_id: id, workspace_revision: row.workspace_revision, qa_run_id: row.qa_run_id } });
    return rowToStudioReviewSubmission(row, null, Number(workspace.revision));
  }

  async getReviewSubmission(actor: any, projectId: string, submissionId: string) {
    const { row, decision, currentWorkspaceRevision } = await this.reviewSubmissionRow(actor, projectId, submissionId, true);
    const qa = (await this.dbQuery("SELECT * FROM studio_qa_runs WHERE qa_run_id=$1 AND project_id=$2 AND organization_id=$3 AND tenant_id=$4", [row.qa_run_id, row.project_id, row.organization_id, row.tenant_id])).rows[0];
    return { project: { projectId: row.project_id, type: row.project_type }, submission: rowToStudioReviewSubmission(row, decision, currentWorkspaceRevision), work: row.submitted_work_json, qaRun: qa ? rowToStudioQaRun(qa) : null, currentWorkspaceRevision };
  }

  async decideReview(actor: any, projectId: string, submissionId: string, input: any) {
    const { scope: s } = await this.authorizeReviewProject(actor, projectId);
    const found = await this.reviewSubmissionRow(actor, projectId, submissionId, true);
    if (found.row.submitted_by_user_id === s.userId) throw new Error("REVIEW_SELF_APPROVAL_FORBIDDEN");
    if (found.decision) throw new Error("REVIEW_ALREADY_DECIDED");
    const decision = validEnum(input?.decision, STUDIO_REVIEW_DECISIONS, "review_decision") as StudioReviewDecision;
    const feedback = String(input?.feedback || "").trim();
    if (feedback.length > 10000) throw new Error("REVIEW_FEEDBACK_TOO_LONG");
    const decisionId = `studio_review_decision_${randomUUID()}`;
    const now = new Date().toISOString();
    await this.dbQuery(
      `INSERT INTO studio_review_decisions (review_decision_id, review_submission_id, project_id, organization_id, tenant_id, decision, feedback, reviewed_by_user_id, reviewed_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [decisionId, found.row.review_submission_id, found.row.project_id, s.organizationId, s.tenantId, decision, feedback, s.userId, now, now],
    );
    await this.dbQuery("UPDATE studio_review_submissions SET status=$1 WHERE review_submission_id=$2 AND organization_id=$3 AND tenant_id=$4", [decision, found.row.review_submission_id, s.organizationId, s.tenantId]);
    await this.outbox.enqueue({ producer_id: "shs-api.studio", event_type: "studio.review.decision_recorded", subject_type: "studio_review_decision", subject_id: decisionId, organization_id: s.organizationId, originating_actor_id: s.userId, occurred_at: now, idempotency_key: decisionId, correlation_id: `studio:${found.row.project_id}:review:${found.row.review_submission_id}`, destination: "shs-studio", payload: { project_id: found.row.project_id, submission_id: found.row.review_submission_id, decision, workspace_revision: found.row.workspace_revision } });
    return { submissionId: found.row.review_submission_id, decisionId, decision, feedback, reviewedByUserId: s.userId, reviewedAt: now };
  }

  private async eligibleDelivery(actor: any, projectId: string) {
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const project = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL", [id])).rows[0];
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, project);
    const workspace = (await this.dbQuery("SELECT * FROM studio_builder_workspaces WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, s.organizationId, s.tenantId])).rows[0];
    if (!workspace) return { scope: s, project, workspace: null, eligible: null };
    const result = await this.dbQuery(
      `SELECT s.*, d.review_decision_id, d.decision, d.feedback, d.reviewed_by_user_id, d.reviewed_at, q.qa_run_id AS matched_qa_run_id, q.status AS qa_status
       FROM studio_review_submissions s
       JOIN studio_review_decisions d ON d.review_submission_id=s.review_submission_id AND d.decision='APPROVED'
       JOIN studio_qa_runs q ON q.qa_run_id=s.qa_run_id AND q.project_id=s.project_id AND q.workspace_revision=s.workspace_revision AND q.status='PASSED'
       WHERE s.project_id=$1 AND s.organization_id=$2 AND s.tenant_id=$3 AND s.workspace_revision=$4 AND s.status='APPROVED'
       ORDER BY s.created_at DESC LIMIT 1`, [id, s.organizationId, s.tenantId, workspace.revision],
    );
    return { scope: s, project, workspace, eligible: result.rows[0] || null };
  }

  async getDelivery(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const found = await this.eligibleDelivery(actor, projectId);
    const currentRevision = Number(found.workspace?.revision || 0);
    const delivery = (await this.dbQuery(
      "SELECT * FROM studio_delivery_records WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY created_at DESC LIMIT 1",
      [found.project.project_id, found.scope.organizationId, found.scope.tenantId],
    )).rows[0] || null;
    if (!delivery) return { projectId: found.project.project_id, currentWorkspaceRevision: currentRevision, eligible: Boolean(found.eligible), status: "NOT_READY", record: null };
    return { projectId: found.project.project_id, currentWorkspaceRevision: currentRevision, eligible: Boolean(found.eligible), status: delivery.workspace_revision === currentRevision ? delivery.status : "STALE", record: {
      deliveryRecordId: delivery.delivery_record_id, projectId: delivery.project_id, submissionId: delivery.submission_id, reviewDecisionId: delivery.review_decision_id, qaRunId: delivery.qa_run_id, workspaceRevision: Number(delivery.workspace_revision), projectType: delivery.project_type, destination: delivery.destination, status: delivery.status, requestedByUserId: delivery.requested_by_user_id, requestedAt: delivery.requested_at, finalizedByUserId: delivery.finalized_by_user_id, finalizedAt: delivery.finalized_at, isCurrent: Number(delivery.workspace_revision) === currentRevision,
    } };
  }

  async finalizeProject(actor: any, projectId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_FINALIZE);
    const found = await this.eligibleDelivery(actor, projectId);
    if (found.project.studio_learner_id !== found.scope.userId && !isAdminTier(found.scope.roles)) throw new Error("DELIVERY_FINALIZE_FORBIDDEN");
    if (!found.workspace) throw new Error("WORKSPACE_REQUIRED_FOR_DELIVERY");
    if (!found.eligible) throw new Error("DELIVERY_NOT_ELIGIBLE");
    const existing = (await this.dbQuery("SELECT * FROM studio_delivery_records WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3", [found.eligible.review_submission_id, found.scope.organizationId, found.scope.tenantId])).rows[0];
    if (existing) return { deliveryRecordId: existing.delivery_record_id, projectId: existing.project_id, submissionId: existing.submission_id, reviewDecisionId: existing.review_decision_id, qaRunId: existing.qa_run_id, workspaceRevision: Number(existing.workspace_revision), projectType: existing.project_type, destination: existing.destination, status: existing.status, requestedByUserId: existing.requested_by_user_id, requestedAt: existing.requested_at, finalizedByUserId: existing.finalized_by_user_id, finalizedAt: existing.finalized_at, isCurrent: true };
    const now = new Date().toISOString();
    const row = { delivery_record_id: `studio_delivery_${randomUUID()}`, project_id: found.project.project_id, organization_id: found.scope.organizationId, tenant_id: found.scope.tenantId, submission_id: found.eligible.review_submission_id, review_decision_id: found.eligible.review_decision_id, qa_run_id: found.eligible.qa_run_id, workspace_revision: Number(found.workspace.revision), project_type: found.project.studio_project_type, destination: found.project.studio_destination, status: "FINALIZED", requested_by_user_id: found.scope.userId, requested_at: now, finalized_by_user_id: found.scope.userId, finalized_at: now, created_at: now };
    const inserted = await this.dbQuery(
      `INSERT INTO studio_delivery_records (delivery_record_id, project_id, organization_id, tenant_id, submission_id, review_decision_id, qa_run_id, workspace_revision, project_type, destination, status, requested_by_user_id, requested_at, finalized_by_user_id, finalized_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (submission_id) DO NOTHING RETURNING *`,
      [row.delivery_record_id, row.project_id, row.organization_id, row.tenant_id, row.submission_id, row.review_decision_id, row.qa_run_id, row.workspace_revision, row.project_type, row.destination, row.status, row.requested_by_user_id, row.requested_at, row.finalized_by_user_id, row.finalized_at, row.created_at],
    );
    if (!inserted.rows[0]) return this.finalizeProject(actor, projectId);
    await this.outbox.enqueue({ producer_id: "shs-api.studio", event_type: "studio.delivery.finalized", subject_type: "studio_delivery_record", subject_id: row.delivery_record_id, organization_id: found.scope.organizationId, originating_actor_id: found.scope.userId, occurred_at: now, idempotency_key: row.delivery_record_id, correlation_id: `studio:${row.project_id}:delivery:${row.delivery_record_id}`, destination: "shs-studio", payload: { project_id: row.project_id, submission_id: row.submission_id, workspace_revision: row.workspace_revision, destination: row.destination } });
    return { deliveryRecordId: row.delivery_record_id, projectId: row.project_id, submissionId: row.submission_id, reviewDecisionId: row.review_decision_id, qaRunId: row.qa_run_id, workspaceRevision: row.workspace_revision, projectType: row.project_type, destination: row.destination, status: row.status, requestedByUserId: row.requested_by_user_id, requestedAt: row.requested_at, finalizedByUserId: row.finalized_by_user_id, finalizedAt: row.finalized_at, isCurrent: true };
  }

  async updateWorkspace(actor: any, projectId: string, input: any) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE);
    const s = scope(actor);
    const id = requiredString(projectId, "project_id");
    const projectRow = (await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND studio_origin IS NOT NULL", [id])).rows[0];
    if (!projectRow) throw new Error("PROJECT_NOT_FOUND");
    await this.authorizeProject(actor, projectRow);
    if (!isAdminTier(s.roles) && projectRow.studio_learner_id !== s.userId) throw new Error("PROJECT_UPDATE_FORBIDDEN");
    const projectType = projectRow.studio_project_type as StudioProjectType;
    const work = validateStudioWorkspaceWork(projectType, input?.work);
    if (!Number.isInteger(input?.revision) || input.revision < 0) throw new Error("WORKSPACE_REVISION_REQUIRED");

    return this.transaction(async (db: DbExecutor) => {
      const currentResult = await db.query(
        "SELECT * FROM studio_builder_workspaces WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 FOR UPDATE",
        [id, s.organizationId, s.tenantId],
      );
      const current = currentResult.rows[0];
      if (current && Number(input.revision) !== Number(current.revision)) throw new Error("WORKSPACE_REVISION_CONFLICT");
      if (!current && input.revision !== 0) throw new Error("WORKSPACE_REVISION_CONFLICT");
      const nextRevision = current ? Number(current.revision) + 1 : 1;
      const workspaceId = current?.workspace_id || `studio_workspace_${randomUUID()}`;
      const result = current
        ? await db.query(
          "UPDATE studio_builder_workspaces SET work_json=$1, revision=$2, updated_at=NOW() WHERE workspace_id=$3 AND organization_id=$4 AND tenant_id=$5 RETURNING *",
          [JSON.stringify(work), nextRevision, workspaceId, s.organizationId, s.tenantId],
        )
        : await db.query(
          "INSERT INTO studio_builder_workspaces (workspace_id, project_id, organization_id, tenant_id, project_type, work_json, revision, created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
          [workspaceId, id, s.organizationId, s.tenantId, projectType, JSON.stringify(work), nextRevision, s.userId],
        );
      if (!result.rows[0]) throw new Error("PROJECT_NOT_FOUND");
      const eventBase = { organization_id: s.organizationId, originating_actor_id: s.userId, occurred_at: new Date().toISOString(), correlation_id: `studio_workspace_${id}` };
      await this.outbox.enqueue({ ...eventBase, producer_id: "shs-api.studio", event_type: "studio.workspace.updated", subject_type: "studio_builder_workspace", subject_id: workspaceId, idempotency_key: `${workspaceId}:${nextRevision}`, destination: "shs-studio" }, db);
      return workspaceFromRow(result.rows[0]);
    });
  }

  async list(actor: any) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const s = scope(actor);
    const result = isStudentOnly(s.roles)
      ? await this.dbQuery("SELECT * FROM projects WHERE organization_id=$1 AND tenant_id=$2 AND created_by_user_id=$3 AND studio_origin IS NOT NULL ORDER BY created_at DESC", [s.organizationId, s.tenantId, s.userId])
      : isAdminTier(s.roles)
        ? await this.dbQuery("SELECT * FROM projects WHERE organization_id=$1 AND tenant_id=$2 AND studio_origin IS NOT NULL ORDER BY created_at DESC", [s.organizationId, s.tenantId])
        : await this.dbQuery("SELECT p.* FROM projects p WHERE p.organization_id=$1 AND p.tenant_id=$2 AND p.studio_origin IS NOT NULL AND (p.created_by_user_id=$3 OR EXISTS (SELECT 1 FROM assignments a WHERE a.assignment_id=p.studio_assignment_id AND (a.created_by=$3 OR EXISTS (SELECT 1 FROM assignment_targets at JOIN cohort_staff cs ON cs.cohort_id=at.cohort_id AND cs.organization_id=at.organization_id AND cs.user_id=$3 AND cs.status='ACTIVE' WHERE at.assignment_id=a.assignment_id AND at.target_type='COHORT' AND at.organization_id=a.organization_id)))) ORDER BY p.created_at DESC", [s.organizationId, s.tenantId, s.userId]);
    return result.rows.map(rowToProject);
  }

  // Instructor-facing projection over Assignment targets and canonical Studio
  // facts. This deliberately persists no teacher-owned status; every row is
  // derived from the current project/workspace/review/delivery records.
  async getAssignmentProgress(actor: any, assignmentId: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW);
    const s = scope(actor);
    const assignment = await this.assignmentLookup(requiredString(assignmentId, "assignment_id"), actor as ActorUser);
    if (!assignment) throw new Error("ASSIGNMENT_NOT_FOUND");
    const requirement = (await this.dbQuery(
      `SELECT requirement_id, target_reference, configuration, required
       FROM completion_policy_requirements
       WHERE organization_id=$1 AND policy_id=$2 AND requirement_type='STUDIO_PROJECT'
       ORDER BY sequence ASC LIMIT 1`,
      [s.organizationId, assignment.completionPolicyId],
    )).rows[0] || null;
    const eligible = (await this.dbQuery(
      `WITH eligible AS (
        SELECT DISTINCT u.user_id, u.full_name, u.email
        FROM users u
        JOIN assignment_targets t ON t.organization_id=$1 AND t.assignment_id=$2
        WHERE u.organization_id=$1 AND u.status IN ('active','ACTIVE')
          AND (
            t.target_type='ORGANIZATION'
            OR (t.target_type='LEARNER' AND t.user_id=u.user_id)
            OR (t.target_type='COHORT' AND EXISTS (
              SELECT 1 FROM enrollments e
              WHERE e.organization_id=$1 AND e.learner_user_id=u.user_id AND e.cohort_id=t.cohort_id AND e.status IN ('PENDING','ACTIVE','COMPLETED')
            ))
            OR (t.target_type='PROGRAM' AND EXISTS (
              SELECT 1 FROM enrollments e
              WHERE e.organization_id=$1 AND e.learner_user_id=u.user_id AND e.program_id=t.program_id AND e.status IN ('PENDING','ACTIVE','COMPLETED')
            ))
          )
      )
      SELECT e.user_id, e.full_name, e.email,
        p.project_id, p.title AS project_title, p.studio_project_type, p.studio_status,
        w.revision AS workspace_revision,
        qa.status AS qa_status, qa.workspace_revision AS qa_revision,
        rs.review_submission_id, rs.status AS review_status, rs.workspace_revision AS review_revision,
        d.status AS delivery_status, d.workspace_revision AS delivery_revision,
        d.delivery_record_id
      FROM eligible e
      LEFT JOIN LATERAL (
        SELECT p.* FROM projects p
        WHERE p.organization_id=$1 AND p.tenant_id=$3 AND p.studio_assignment_id=$2 AND p.studio_learner_id=e.user_id
        ORDER BY p.created_at DESC LIMIT 1
      ) p ON true
      LEFT JOIN studio_builder_workspaces w ON w.project_id=p.project_id AND w.organization_id=$1 AND w.tenant_id=$3
      LEFT JOIN LATERAL (
        SELECT q.status, q.workspace_revision FROM studio_qa_runs q
        WHERE q.project_id=p.project_id AND q.organization_id=$1 AND q.tenant_id=$3
        ORDER BY q.created_at DESC LIMIT 1
      ) qa ON true
      LEFT JOIN LATERAL (
        SELECT r.review_submission_id, r.status, r.workspace_revision FROM studio_review_submissions r
        WHERE r.project_id=p.project_id AND r.organization_id=$1 AND r.tenant_id=$3
        ORDER BY r.created_at DESC LIMIT 1
      ) rs ON true
      LEFT JOIN LATERAL (
        SELECT d.status, d.workspace_revision, d.delivery_record_id FROM studio_delivery_records d
        WHERE d.project_id=p.project_id AND d.organization_id=$1 AND d.tenant_id=$3
        ORDER BY d.created_at DESC LIMIT 1
      ) d ON true
      ORDER BY e.full_name ASC, e.user_id ASC`,
      [s.organizationId, assignment.id, s.tenantId],
    )).rows;
    const [unitKey, lessonKey] = String(assignment.assignedContentId || "").split(":");
    const completionByLearner = new Map<string, boolean | null>();
    if (assignment.completionPolicyId && unitKey && lessonKey) {
      await Promise.all(eligible.map(async (row: any) => {
        try {
          const result = await (await import("../../completion-policy/service/completion-evaluator.js")).evaluateAssignmentCompletion(
            { user_id: row.user_id, organization_id: s.organizationId, roles: ["student"] },
            assignment.id, unitKey, lessonKey,
          );
          completionByLearner.set(row.user_id, result.eligible);
        } catch {
          completionByLearner.set(row.user_id, null);
        }
      }));
    }
    const rows = eligible.map((row: any) => {
      const currentRevision = Number(row.workspace_revision || 0);
      const reviewCurrent = row.review_revision != null && Number(row.review_revision) === currentRevision;
      const deliveryCurrent = row.delivery_revision != null && Number(row.delivery_revision) === currentRevision;
      let state = "NOT_STARTED";
      if (row.project_id) state = row.workspace_revision == null ? "STARTED" : "BUILDING";
      if (reviewCurrent && row.review_status === "SUBMITTED") state = "READY_FOR_REVIEW";
      if (reviewCurrent && row.review_status === "CHANGES_REQUESTED") state = "CHANGES_REQUESTED";
      if (reviewCurrent && row.review_status === "APPROVED") state = "APPROVED";
      if (deliveryCurrent && row.delivery_status === "FINALIZED") state = "FINALIZED";
      const assignmentComplete = completionByLearner.get(row.user_id) ?? null;
      return {
        learner: { id: row.user_id, name: row.full_name, email: row.email },
        state,
        project: row.project_id ? { id: row.project_id, title: row.project_title, type: row.studio_project_type } : null,
        workspaceRevision: currentRevision || null,
        qa: row.qa_revision != null && Number(row.qa_revision) === currentRevision ? row.qa_status : "STALE_OR_NOT_RUN",
        review: reviewCurrent ? row.review_status : "STALE_OR_NOT_SUBMITTED",
        delivery: deliveryCurrent ? row.delivery_status : "STALE_OR_NOT_FINALIZED",
        studioRequirementSatisfied: Boolean(deliveryCurrent && row.delivery_status === "FINALIZED" && (!requirement?.target_reference || requirement.target_reference === row.project_id)),
        assignmentComplete,
        reviewUrl: row.project_id && row.review_submission_id && row.review_status === "SUBMITTED" && row.delivery_revision == null ? `/studio/review/${encodeURIComponent(row.project_id)}/${encodeURIComponent(row.review_submission_id)}` : null,
      };
    });
    return {
      assignment: { id: assignment.id, title: assignment.title, dueAt: assignment.dueAt, completionPolicyId: assignment.completionPolicyId },
      studioRequirement: requirement ? { id: requirement.requirement_id, required: requirement.required, projectType: (requirement.configuration as any)?.projectType || (requirement.configuration as any)?.allowedProjectType || null } : null,
      learners: rows,
    };
  }

  async updateStatus(actor: any, projectId: string, nextStatus: string) {
    this.requirePermission(actor, SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE);
    const s = scope(actor);
    const current = await this.get(actor, projectId);
    const next = validEnum(nextStatus, ["DRAFT", "PLANNING", "BUILDING", "READY_FOR_CHECK", "CHANGES_REQUIRED", "READY_FOR_REVIEW", "APPROVED", "DELIVERY_READY", "DELIVERED"] as const, "status") as StudioProjectStatus;
    if (!canTransitionStudioProject(current.status as StudioProjectStatus, next)) throw new Error("INVALID_STUDIO_LIFECYCLE_TRANSITION");
    if (!isAdminTier(actor.roles || []) && current.learnerId !== String(actor.user_id || actor.id)) throw new Error("PROJECT_UPDATE_FORBIDDEN");
    if (isStudentOnly(actor.roles || []) && !["PLANNING", "BUILDING", "READY_FOR_CHECK", "CHANGES_REQUIRED"].includes(next)) throw new Error("STUDENT_STATUS_UPDATE_FORBIDDEN");
    const result = await this.dbQuery("UPDATE projects SET studio_status=$1, updated_at=NOW() WHERE project_id=$2 AND organization_id=$3 AND tenant_id=$4 RETURNING *", [next, projectId, s.organizationId, s.tenantId]);
    if (!result.rows[0]) throw new Error("PROJECT_NOT_FOUND");
    return rowToProject(result.rows[0]);
  }
}
