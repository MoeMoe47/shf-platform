#!/usr/bin/env node
/*
 * Phase 8 acceptance environment bootstrap.
 *
 * Prerequisites: PostgreSQL utilities (initdb, pg_ctl, psql), Node/npm, and
 * the repository dependencies. Run from the repository root:
 *   npm run test:phase8:acceptance:env
 *   npm run test:phase8:acceptance:env -- tests/phase8/acceptance.spec.mjs
 *
 * Each invocation owns an ephemeral PostgreSQL cluster, database, API, and
 * Vite process. SHS_DEV_DATABASE_IDENTITY_ENABLED is deliberately scoped to
 * the development child process; production auth code is unchanged.
 */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const apiRoot = join(root, "apps/shs-api");
const frontendRoot = process.env.SHS_ACCEPTANCE_FRONTEND_ROOT
  ? join(root, process.env.SHS_ACCEPTANCE_FRONTEND_ROOT)
  : root;
const frontendReadyPath = process.env.SHS_ACCEPTANCE_FRONTEND_READY_PATH || "/curriculum.html";
const tempRoot = await mkdtemp(join(tmpdir(), "shs-phase8-"));
const children = [];
let pgData;
let pgPort;
let database;
let databaseUrl;
let cleaned = false;
let stage = "initializing";

database = `shs_phase8_acceptance_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function command(name, args, options = {}) {
  const child = spawn(name, args, { cwd: options.cwd || root, env: { ...process.env, ...options.env }, stdio: ["pipe", "pipe", "pipe"] });
  children.push(child);
  const label = options.label || name;
  child.stdout.on("data", (chunk) => process.stdout.write(`[${label}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${label}] ${chunk}`));
  return child;
}

function run(name, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = command(name, args, options);
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`${name} exited with ${code ?? signal}`)));
    if (options.input) { child.stdin.end(options.input); } else child.stdin.end();
  });
}

function unusedPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    const timer = setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 5000);
    child.once("exit", () => { clearTimeout(timer); resolve(); });
  });
}

async function waitFor(url, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${url} process exited before readiness`);
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function cleanup() {
  if (cleaned) return;
  cleaned = true;
  for (const child of [...children].reverse()) await stop(child);
  if (database && pgPort) await run("dropdb", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", "--if-exists", database], { label: "dropdb" }).catch(() => {});
  if (pgData) await run("pg_ctl", ["-D", pgData, "-m", "fast", "stop"], { label: "postgres-stop" }).catch(() => {});
  await rm(tempRoot, { recursive: true, force: true });
  console.log("PHASE 8 ACCEPTANCE ENVIRONMENT CLEANED");
}

async function fail(error) {
  console.error("PHASE 8 ACCEPTANCE HARNESS FAILED");
  console.error(`Stage: ${stage}`);
  console.error(`Database: ${database || "not-created"}`);
  console.error(error instanceof Error ? error.stack : error);
  await cleanup();
  process.exitCode = 1;
}

process.once("SIGINT", async () => { await cleanup(); process.exitCode = 130; });
process.once("SIGTERM", async () => { await cleanup(); process.exitCode = 143; });
process.once("uncaughtException", fail);
process.once("unhandledRejection", fail);

const seedSql = String.raw`
INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES
 ('phase8_org_a','Phase 8 Organization A','Org A','nonprofit','active'),
 ('phase8_org_b','Phase 8 Organization B','Org B','nonprofit','active'),
 ('phase8_org_empty','Phase 8 Empty Organization','Org Empty','nonprofit','active') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES
 ('admin_A','phase8_org_a','admin.a@phase8.test','Admin A','active','test'),
 ('instructor_A_authorized','phase8_org_a','instructor.authorized@phase8.test','Instructor A Authorized','active','test'),
 ('instructor_A_unauthorized','phase8_org_a','instructor.unauthorized@phase8.test','Instructor A Unauthorized','active','test'),
 ('learner_A1','phase8_org_a','learner.a1@phase8.test','Learner A1','active','test'),
 ('learner_A2','phase8_org_a','learner.a2@phase8.test','Learner A2','active','test'),
 ('instructor_B','phase8_org_b','instructor.b@phase8.test','Instructor B','active','test'),
 ('admin_B','phase8_org_b','admin.b@phase8.test','Admin B','active','test'),
 ('learner_B1','phase8_org_b','learner.b1@phase8.test','Learner B1','active','test'),
 ('multi_org_staff','phase8_org_a','multi.org@phase8.test','Multi Org Staff','active','test'),
 ('admin_empty','phase8_org_empty','admin.empty@phase8.test','Admin Empty','active','test'),
 ('learner_empty','phase8_org_empty','learner.empty@phase8.test','Learner Empty','active','test') ON CONFLICT DO NOTHING;
INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role) VALUES
 ('phase8_role_admin',NULL,'org_admin','ORGANIZATION',true),
 ('phase8_role_instructor',NULL,'instructor','COHORT',true),
 ('phase8_role_student',NULL,'student','SELF',true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
 ('phase8_admin_project_create','phase8_role_admin','project.create'),('phase8_admin_project_team','phase8_role_admin','project.team.manage'),('phase8_admin_specialization','phase8_role_admin','program.specialization.assign'),('phase8_admin_credential_definition','phase8_role_admin','credential.definition.manage'),('phase8_admin_credential_issue','phase8_role_admin','credential.issue'),('phase8_admin_credential_revoke','phase8_role_admin','credential.revoke'),('phase8_admin_credential_view','phase8_role_admin','credential.view'),
 ('phase8_admin_cohort','phase8_role_admin','cohort.view'),('phase8_admin_assignment','phase8_role_admin','assignment.view'),('phase8_admin_reports','phase8_role_admin','reports.view'),('phase8_admin_project','phase8_role_admin','project.submission.review'),('phase8_admin_verify_view','phase8_role_admin','verification.view'),('phase8_admin_verify_review','phase8_role_admin','verification.review'),('phase8_admin_verify_approve','phase8_role_admin','verification.approve'),('phase8_admin_live','phase8_role_admin','liveLearning.view'),('phase8_admin_attendance','phase8_role_admin','liveLearning.join.authorize'),
 ('phase8_inst_cohort','phase8_role_instructor','cohort.view'),('phase8_inst_assignment','phase8_role_instructor','assignment.view'),('phase8_inst_project','phase8_role_instructor','project.submission.review'),('phase9_inst_queue','phase8_role_instructor','studio.review.queue.view'),('phase8_inst_verify_view','phase8_role_instructor','verification.view'),('phase8_inst_verify_review','phase8_role_instructor','verification.review'),('phase8_inst_verify_approve','phase8_role_instructor','verification.approve'),('phase8_inst_live','phase8_role_instructor','liveLearning.view'),('phase8_inst_attendance','phase8_role_instructor','liveLearning.join.authorize'),('phase8_inst_reports','phase8_role_instructor','reports.view'),
 ('phase8_student_assignment','phase8_role_student','assignment.view'),('phase8_student_enrollment','phase8_role_student','enrollment.view'),('phase8_student_live','phase8_role_student','liveLearning.view'),('phase8_student_join','phase8_role_student','liveLearning.join.request'),('phase8_student_project','phase8_role_student','project.submission.write'),('phase8_student_arcade','phase8_role_student','arcade.attempt'),('phase8_student_complete','phase8_role_student','curriculum.lesson.complete'),('phase8_student_credential_view','phase8_role_student','credential.view') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ('phase8_admin_completion_definition','phase8_role_admin','program.course.assign') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
 ('phase9_admin_route','phase8_role_admin','studio.review.route'),('phase9_admin_reassign','phase8_role_admin','studio.review.reassign'),('phase9_admin_queue','phase8_role_admin','studio.review.queue.view') ON CONFLICT DO NOTHING;
INSERT INTO memberships (membership_id,user_id,organization_id,role_id,status,effective_from) VALUES
 ('phase8_mem_admin','admin_A','phase8_org_a','phase8_role_admin','active',NOW()),
 ('phase8_mem_inst_auth','instructor_A_authorized','phase8_org_a','phase8_role_instructor','active',NOW()),
 ('phase8_mem_inst_unauth','instructor_A_unauthorized','phase8_org_a','phase8_role_student','active',NOW()),
 ('phase8_mem_learner','learner_A1','phase8_org_a','phase8_role_student','active',NOW()),
 ('phase8_mem_learner_a2','learner_A2','phase8_org_a','phase8_role_student','active',NOW()),
 ('phase8_mem_inst_b','instructor_B','phase8_org_b','phase8_role_instructor','active',NOW()),
 ('phase8_mem_learner_b','learner_B1','phase8_org_b','phase8_role_student','active',NOW()),
 ('phase8_mem_admin_b','admin_B','phase8_org_b','phase8_role_admin','active',NOW()),
 ('phase8_mem_multi_a','multi_org_staff','phase8_org_a','phase8_role_instructor','active',NOW()),
 ('phase8_mem_multi_b','multi_org_staff','phase8_org_b','phase8_role_admin','active',NOW()),
 ('phase8_mem_admin_empty','admin_empty','phase8_org_empty','phase8_role_admin','active',NOW()),
 ('phase8_mem_learner_empty','learner_empty','phase8_org_empty','phase8_role_student','active',NOW()) ON CONFLICT DO NOTHING;
INSERT INTO programs (program_id,organization_id,name,program_type,status,created_by_user_id) VALUES ('phase8_program_a','phase8_org_a','Program A','education','active','admin_A'),('phase8_program_b','phase8_org_b','Program B','education','active','admin_B') ON CONFLICT DO NOTHING;
INSERT INTO cohorts (cohort_id,organization_id,tenant_id,program_id,name,status,starts_at,created_by_user_id) VALUES ('phase8_cohort_a','phase8_org_a','tenant:phase8_org_a','phase8_program_a','Cohort A','ACTIVE',NOW(),'admin_A'),('phase8_cohort_b','phase8_org_b','tenant:phase8_org_b','phase8_program_b','Cohort B','ACTIVE',NOW(),'admin_B') ON CONFLICT DO NOTHING;
INSERT INTO cohort_staff (cohort_staff_id,organization_id,tenant_id,cohort_id,user_id,role,status,created_by_user_id) VALUES ('phase8_staff_a','phase8_org_a','tenant:phase8_org_a','phase8_cohort_a','instructor_A_authorized','INSTRUCTOR','ACTIVE','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO enrollments (enrollment_id,organization_id,tenant_id,learner_user_id,program_id,cohort_id,status,created_by_user_id) VALUES ('phase8_enrollment_a1','phase8_org_a','tenant:phase8_org_a','learner_A1','phase8_program_a','phase8_cohort_a','ACTIVE','admin_A'),('phase8_enrollment_a2','phase8_org_a','tenant:phase8_org_a','learner_A2','phase8_program_a','phase8_cohort_a','ACTIVE','admin_A'),('phase8_enrollment_b1','phase8_org_b','tenant:phase8_org_b','learner_B1','phase8_program_b','phase8_cohort_b','ACTIVE','admin_B') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_courses (course_id,organization_id,stable_key,title,status,created_by_user_id,updated_by_user_id) VALUES ('phase8_course_a','phase8_org_a','phase8-course-a','Course A','PUBLISHED','admin_A','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_units (unit_id,organization_id,course_id,stable_key,title,sequence) VALUES ('phase8_unit_a','phase8_org_a','phase8_course_a','unit-a','Unit A',1) ON CONFLICT DO NOTHING;
INSERT INTO curriculum_lessons (lesson_id,organization_id,unit_id,stable_key,title,sequence) VALUES ('phase8_lesson_a','phase8_org_a','phase8_unit_a','lesson-a','Lesson A',1) ON CONFLICT DO NOTHING;
INSERT INTO curriculum_releases (release_id,organization_id,course_id,version_number,snapshot,content_hash,status,published_by_user_id) VALUES ('phase8_release_1','phase8_org_a','phase8_course_a',1,'{"course":{"stableKey":"phase8-course-a","title":"Course A"},"units":[{"stableKey":"unit-a","title":"Unit A","lessons":[{"stableKey":"lesson-a","title":"Lesson A"}]}]}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','PUBLISHED','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_courses (course_id,organization_id,stable_key,title,status,created_by_user_id,updated_by_user_id) VALUES ('phase8_course_b','phase8_org_b','phase8-course-b','Course B','PUBLISHED','admin_B','admin_B') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_units (unit_id,organization_id,course_id,stable_key,title,sequence) VALUES ('phase8_unit_b','phase8_org_b','phase8_course_b','unit-b','Unit B',1) ON CONFLICT DO NOTHING;
INSERT INTO curriculum_lessons (lesson_id,organization_id,unit_id,stable_key,title,sequence) VALUES ('phase8_lesson_b','phase8_org_b','phase8_unit_b','lesson-b','Lesson B',1) ON CONFLICT DO NOTHING;
INSERT INTO curriculum_releases (release_id,organization_id,course_id,version_number,snapshot,content_hash,status,published_by_user_id) VALUES ('phase8_release_b1','phase8_org_b','phase8_course_b',1,'{"course":{"stableKey":"phase8-course-b","title":"Course B"},"units":[{"stableKey":"unit-b","title":"Unit B","lessons":[{"stableKey":"lesson-b","title":"Lesson B"}]}]}','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','PUBLISHED','admin_B') ON CONFLICT DO NOTHING;
INSERT INTO completion_policies (policy_id,organization_id,curriculum_release_id,assigned_content_type,assigned_content_id,status,version,created_by_user_id) VALUES ('phase8_policy_a','phase8_org_a','phase8_release_1','LESSON','unit-a:lesson-a','DRAFT',1,'admin_A') ON CONFLICT DO NOTHING;
UPDATE completion_policies SET status='ACTIVE', activated_by_user_id='admin_A', activated_at=NOW() WHERE policy_id='phase8_policy_a' AND status='DRAFT';
INSERT INTO assignments (assignment_id,organization_id,cohort_id,course_id,lesson_id,title,assignment_type,created_by,due_at,status,curriculum_release_id,assigned_content_type,assigned_content_id,visibility_scope,completion_policy_id) VALUES ('phase8_assignment_a','phase8_org_a','phase8_cohort_a','phase8_course_a','phase8_lesson_a','Assignment A','assignment','instructor_A_authorized',NOW()+INTERVAL '7 days','published','phase8_release_1','LESSON','unit-a:lesson-a','targeted','phase8_policy_a') ON CONFLICT DO NOTHING;
INSERT INTO assignment_targets (assignment_target_id,assignment_id,organization_id,target_type,user_id,created_by) VALUES ('phase8_target_a1','phase8_assignment_a','phase8_org_a','LEARNER','learner_A1','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO assignment_targets (assignment_target_id,assignment_id,organization_id,target_type,user_id,created_by) VALUES ('phase8_target_a2','phase8_assignment_a','phase8_org_a','LEARNER','learner_A2','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO assignments (assignment_id,organization_id,cohort_id,course_id,lesson_id,title,assignment_type,created_by,due_at,status,curriculum_release_id,assigned_content_type,assigned_content_id,visibility_scope,completion_policy_id) VALUES ('phase8_assignment_b','phase8_org_b','phase8_cohort_b','phase8_course_b','phase8_lesson_b','Assignment B','assignment','admin_B',NOW()+INTERVAL '7 days','published','phase8_release_b1','LESSON','unit-b:lesson-b','targeted',NULL) ON CONFLICT DO NOTHING;
INSERT INTO assignment_targets (assignment_target_id,assignment_id,organization_id,target_type,user_id,created_by) VALUES ('phase8_target_b1','phase8_assignment_b','phase8_org_b','LEARNER','learner_B1','admin_B') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_evidence_rules (evidence_rule_id,organization_id,source_type,evidence_type,truth_fact_type,competency_id,rule_version,review_required,created_by_user_id) VALUES ('phase8_rule_a','phase8_org_a','PREPARE_PROVE','COMPETENCY','COMPETENCY_DEMONSTRATED','competency_prepare_prove_monitoring_finding',1,true,'admin_A') ON CONFLICT DO NOTHING;
INSERT INTO completion_policies (policy_id,organization_id,curriculum_release_id,assigned_content_type,assigned_content_id,status,version,created_by_user_id) VALUES ('phase8_policy_b','phase8_org_b','phase8_release_b1','LESSON','unit-b:lesson-b','DRAFT',1,'admin_B') ON CONFLICT DO NOTHING;
UPDATE completion_policies SET status='ACTIVE', activated_by_user_id='admin_B', activated_at=NOW() WHERE policy_id='phase8_policy_b' AND status='DRAFT';
INSERT INTO projects (project_id,organization_id,tenant_id,course_id,title,project_type,status,created_by_user_id) VALUES ('phase8_project_a','phase8_org_a','tenant:phase8_org_a','phase8_course_a','Project A','EDUCATIONAL_PROJECT','ACTIVE','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO project_teams (team_id,project_id,organization_id,tenant_id,mode,status) VALUES ('phase8_team_a','phase8_project_a','phase8_org_a','tenant:phase8_org_a','INDIVIDUAL_INTEGRATED_MODE','ACTIVE') ON CONFLICT DO NOTHING;
INSERT INTO project_team_members (membership_id,team_id,learner_id,organization_id,tenant_id,specialization_id,role_id) VALUES ('phase8_project_member','phase8_team_a','learner_A1','phase8_org_a','tenant:phase8_org_a','general','member') ON CONFLICT DO NOTHING;
INSERT INTO project_submissions (submission_id,project_id,team_id,organization_id,tenant_id,submitted_by_user_id,version,status) VALUES ('phase8_submission_a','phase8_project_a','phase8_team_a','phase8_org_a','tenant:phase8_org_a','learner_A1',1,'SUBMITTED') ON CONFLICT DO NOTHING;
INSERT INTO projects (project_id,organization_id,tenant_id,course_id,title,project_type,status,created_by_user_id) VALUES ('phase8_project_b','phase8_org_b','tenant:phase8_org_b','phase8_course_b','Project B','EDUCATIONAL_PROJECT','ACTIVE','admin_B') ON CONFLICT DO NOTHING;
INSERT INTO project_teams (team_id,project_id,organization_id,tenant_id,mode,status) VALUES ('phase8_team_b','phase8_project_b','phase8_org_b','tenant:phase8_org_b','INDIVIDUAL_INTEGRATED_MODE','ACTIVE') ON CONFLICT DO NOTHING;
INSERT INTO project_team_members (membership_id,team_id,learner_id,organization_id,tenant_id,specialization_id,role_id) VALUES ('phase8_project_member_b','phase8_team_b','learner_B1','phase8_org_b','tenant:phase8_org_b','general','member') ON CONFLICT DO NOTHING;
INSERT INTO project_submissions (submission_id,project_id,team_id,organization_id,tenant_id,submitted_by_user_id,version,status) VALUES ('phase8_submission_b','phase8_project_b','phase8_team_b','phase8_org_b','tenant:phase8_org_b','learner_B1',1,'SUBMITTED') ON CONFLICT DO NOTHING;
INSERT INTO live_sessions (live_session_id,organization_id,provider,title,instructor_id,starts_at,ends_at,status,course_id,cohort_id,audience_scope) VALUES ('phase8_live_a','phase8_org_a','mock','Session A','instructor_A_authorized',NOW()+INTERVAL '1 hour',NOW()+INTERVAL '2 hours','scheduled','phase8_course_a','phase8_cohort_a','COHORT') ON CONFLICT DO NOTHING;
INSERT INTO live_sessions (live_session_id,organization_id,provider,title,instructor_id,starts_at,ends_at,status,course_id,cohort_id,audience_scope) VALUES ('phase8_live_b','phase8_org_b','mock','Session B','instructor_B',NOW()+INTERVAL '1 hour',NOW()+INTERVAL '2 hours','scheduled','phase8_course_b','phase8_cohort_b','COHORT') ON CONFLICT DO NOTHING;
INSERT INTO live_session_join_events (join_event_id,live_session_id,user_id,decision,attendance_status) VALUES ('phase8_join_a1','phase8_live_a','learner_A1','allow','authorized') ON CONFLICT DO NOTHING;
INSERT INTO live_session_join_events (join_event_id,live_session_id,user_id,decision,attendance_status) VALUES ('phase8_join_b1','phase8_live_b','learner_B1','allow','authorized') ON CONFLICT DO NOTHING;
INSERT INTO prepare_prove_activity_results (result_id,activity_type,activity_id,user_id,organization_id,tenant_id,result_status,result_json) VALUES ('phase8_result_a','PHASE8','phase8-activity','learner_A1','phase8_org_a','tenant:phase8_org_a','SUCCEEDED','{}') ON CONFLICT DO NOTHING;
INSERT INTO prepare_prove_evidence (evidence_id,source_domain,source_record_id,user_id,organization_id,tenant_id,activity_id,criterion,status,provenance_json,source_type,assignment_id,curriculum_release_id,release_version,course_id,unit_stable_key,lesson_stable_key,evidence_rule_id,evidence_rule_version,competency_id) VALUES ('phase8_evidence_a','phase8','phase8_result_a','learner_A1','phase8_org_a','tenant:phase8_org_a','phase8-activity','criterion','REVIEWABLE','{"fixture":"phase8","source":"prepare_prove"}','PREPARE_PROVE','phase8_assignment_a','phase8_release_1',1,'phase8_course_a','unit-a','lesson-a','phase8_rule_a',1,'competency_prepare_prove_monitoring_finding') ON CONFLICT DO NOTHING;
INSERT INTO prepare_prove_activity_results (result_id,activity_type,activity_id,user_id,organization_id,tenant_id,result_status,result_json) VALUES ('phase8_result_b','PHASE8','phase8-activity-b','learner_B1','phase8_org_b','tenant:phase8_org_b','SUCCEEDED','{}') ON CONFLICT DO NOTHING;
INSERT INTO prepare_prove_evidence (evidence_id,source_domain,source_record_id,user_id,organization_id,tenant_id,activity_id,criterion,status,provenance_json,source_type,assignment_id,curriculum_release_id,release_version,course_id,unit_stable_key,lesson_stable_key,competency_id) VALUES ('phase8_evidence_b','phase8','phase8_result_b','learner_B1','phase8_org_b','tenant:phase8_org_b','phase8-activity-b','criterion','REVIEWABLE','{"fixture":"phase8","source":"prepare_prove"}','PREPARE_PROVE','phase8_assignment_b','phase8_release_b1',1,'phase8_course_b','unit-b','lesson-b','competency_prepare_prove_monitoring_finding') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_permission_id,role_id,permission_name)
SELECT 'phase8_gpa_perm_'||md5(permission_name),'phase8_role_admin',permission_name
FROM unnest(ARRAY[
 'government.assurance.provider.view','government.assurance.program.view','government.assurance.source_scope.view','government.assurance.source_authority.view',
 'government.assurance.pilot.view','government.assurance.pilot.manage','government.assurance.monitoring.view',
 'government.assurance.monitoring.manage','government.assurance.finding.view','government.assurance.finding.determine',
 'government.assurance.corrective_action.view','government.assurance.corrective_action.manage','government.assurance.audit.view',
 'government.assurance.reconciliation.view','government.assurance.reconciliation.manage','government.assurance.reconciliation.determine',
 'government.assurance.entity_resolution.view','government.assurance.entity_resolution.determine','government.assurance.data_quality.view','government.assurance.data_quality.evaluate','government.assurance.metric.view',
 'government.assurance.verification.view','government.assurance.verification.perform','government.assurance.claim.view','government.assurance.truth.view',
 'government.assurance.lineage.view','government.assurance.funding.view','government.assurance.financial_lineage.view',
 'ai.conductor.use','ai.conductor.read','ai.governance.view','ai.governance.evaluate','ai.security.scan','ai.security.read','ai.context.evaluate',
 'reports.view','reports.export'
 ]) AS permission_name ON CONFLICT DO NOTHING;
INSERT INTO service_catalog (service_id,service_key,name,description,category,status,provider_organization_id,audience,requires_relationship_type,agreement_requirement)
VALUES ('phase8_svc_ai_governance','ai_governance','AI Governance Authority','Controlled GPA pilot AI governance service.','SHARED_TECHNOLOGY','ACTIVE','phase8_org_a','NETWORK_ORGANIZATION','NETWORK_MEMBER_OF','NO_AGREEMENT_REQUIRED')
ON CONFLICT (service_key) DO NOTHING;
INSERT INTO organization_service_entitlements (entitlement_id,organization_id,service_id,status,granted_by_user_id,reason)
SELECT 'phase8_ai_governance_entitlement','phase8_org_a',service_id,'ACTIVE','admin_A','Phase 8 controlled pilot AI governance entitlement'
FROM service_catalog WHERE service_key='ai_governance' ON CONFLICT DO NOTHING;
INSERT INTO service_catalog (service_id,service_key,name,description,category,status,provider_organization_id,audience,requires_relationship_type,agreement_requirement)
VALUES ('phase8_svc_reporting','reporting','Reporting Authority','Controlled GPA pilot reporting service.','SHARED_TECHNOLOGY','ACTIVE','phase8_org_a','NETWORK_ORGANIZATION','NETWORK_MEMBER_OF','NO_AGREEMENT_REQUIRED')
ON CONFLICT (service_key) DO NOTHING;
INSERT INTO organization_service_entitlements (entitlement_id,organization_id,service_id,status,granted_by_user_id,reason)
SELECT 'phase8_reporting_entitlement','phase8_org_a',service_id,'ACTIVE','admin_A','Phase 8 controlled pilot reporting entitlement'
FROM service_catalog WHERE service_key='reporting' ON CONFLICT DO NOTHING;
INSERT INTO gpa_jurisdictions (jurisdiction_id,organization_id,tenant_id,jurisdiction_type,canonical_name,state_country_code,effective_from,status,created_by)
VALUES ('phase8_jurisdiction_a','phase8_org_a','tenant:phase8_org_a','COUNTY','Phase 8 County','US-OH',NOW(),'ACTIVE','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_source_systems (source_system_id,organization_id,tenant_id,canonical_name,provider_vendor,source_owner_reference,jurisdiction_id,environment,system_type,data_domains,record_types,effective_from,effective_to,status,data_classification,integration_mode,last_verified_metadata_at,provenance_json,created_by)
VALUES
 ('phase8_source_finance','phase8_org_a','tenant:phase8_org_a','Phase 8 Finance Source','Test ERP','phase8_org_a','phase8_jurisdiction_a','TEST','FINANCIAL','["funding","expenditure"]','["award","obligation","payment"]',NOW(),NULL,'ACTIVE','CONFIDENTIAL','CSV',NOW(),'{"fixture":"phase8-gpa","authoritative":true}','admin_A'),
 ('phase8_source_outcomes','phase8_org_a','tenant:phase8_org_a','Phase 8 Outcomes Source','Test Workforce System','phase8_org_a','phase8_jurisdiction_a','TEST','OUTCOMES','["service","outcome"]','["service_delivery","employment_outcome"]',NOW(),NULL,'ACTIVE','CONFIDENTIAL','API',NOW(),'{"fixture":"phase8-gpa","authoritative":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_source_authorities (source_authority_id,organization_id,tenant_id,source_system_id,source_owner_reference,data_domain,record_type,jurisdiction,precedence,effective_from,status,created_by)
VALUES
 ('phase8_authority_finance','phase8_org_a','tenant:phase8_org_a','phase8_source_finance','phase8_org_a','funding','award','phase8_jurisdiction_a',100,NOW(),'ACTIVE','admin_A'),
 ('phase8_authority_outcomes','phase8_org_a','tenant:phase8_org_a','phase8_source_outcomes','phase8_org_a','outcome','employment_outcome','phase8_jurisdiction_a',100,NOW(),'ACTIVE','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_data_use_policies (policy_id,version,organization_id,tenant_id,source_system_id,allowed_purposes,allowed_actions,allowed_data_domains,allowed_record_types,allowed_fields,legal_basis_reference,effective_from,status,approved_by,created_by)
VALUES ('phase8_policy_gpa',1,'phase8_org_a','tenant:phase8_org_a','phase8_source_finance','["PROGRAM_MONITORING","PAYMENT_VALIDATION","PERFORMANCE_REPORTING"]','["read"]','["funding","expenditure"]','["award","obligation","payment"]','["amount","period","provider"]','phase8-test-authority',NOW(),'ACTIVE','admin_A','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_source_health (source_system_id,organization_id,tenant_id,last_successful_sync,last_attempted_sync,freshness_threshold_seconds,stale_after,current_freshness_state,last_schema_verification,authentication_state,degraded_state)
VALUES ('phase8_source_finance','phase8_org_a','tenant:phase8_org_a',NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day',3600,NOW()-INTERVAL '1 hour','STALE',NOW()-INTERVAL '1 day','VALID','DEGRADED') ON CONFLICT (source_system_id) DO UPDATE SET current_freshness_state=EXCLUDED.current_freshness_state;
INSERT INTO gpa_reconciliation_cases (reconciliation_case_id,organization_id,tenant_id,subject_type,subject_reference,competing_source_references,conflict_reason,source_authority_references,status,created_by,metadata,conflict_type,conflicting_record_references,current_authority_ranking,materiality,severity,assigned_reviewer,opened_at,downstream_impact_references,provenance)
VALUES ('phase8_reconciliation_case_a','phase8_org_a','tenant:phase8_org_a','PAYMENT','phase8_payment_a','["phase8_source_finance","phase8_source_outcomes"]','Competing source records require review','["phase8_authority_finance","phase8_authority_outcomes"]','OPEN','admin_A','{"fixture":"phase8-gpa","testOnly":true,"sourceRecords":{"phase8_source_finance":{"value":120,"period":"2026-Q2","freshness":"STALE","quality":"FAIL"},"phase8_source_outcomes":{"value":114,"period":"2026-Q2","freshness":"CURRENT","quality":"WARNING"}}}','VALUE_MISMATCH','["finance-payment-120","outcomes-payment-114"]','{"phase8_source_finance":100,"phase8_source_outcomes":90}','MATERIAL','HIGH','admin_A',NOW(),'["phase8_claim_placements","phase8_metric_verified_placements"]','{"fixture":"phase8-gpa","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO gpa_entity_resolution_cases (resolution_id,organization_id,tenant_id,entity_type,source_system_id,source_record_id,candidate_entity_references,match_method,match_attributes,confidence,status,provenance,created_by)
VALUES ('phase8_entity_resolution_a','phase8_org_a','tenant:phase8_org_a','PROVIDER','phase8_source_finance','provider-a','["phase8_provider_a","phase8_provider_b"]','DETERMINISTIC','{"trustedKey":"provider-a-key"}',0.72,'AMBIGUOUS','{"fixture":"phase8-gpa","testOnly":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_data_quality_rules (rule_id,version,organization_id,tenant_id,source_system_id,data_domain,record_type,dimension,severity,logic_reference,effective_from,status,owner_reference,approval_reference,provenance,created_by)
VALUES ('phase8_quality_rule_freshness',1,'phase8_org_a','tenant:phase8_org_a','phase8_source_finance','funding','payment','FRESHNESS','HIGH','phase8.rule.source-freshness.v1',NOW(),'ACTIVE','phase8_org_a','admin_A','{"fixture":"phase8-gpa","testOnly":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_data_quality_evaluations (quality_evaluation_id,organization_id,tenant_id,source_system_id,subject_type,subject_reference,dimension,rule_id,rule_version,state,score,reason_codes,evaluated_by,provenance)
VALUES ('phase8_quality_eval_case_a','phase8_org_a','tenant:phase8_org_a','phase8_source_finance','PAYMENT','phase8_payment_a','FRESHNESS','phase8_quality_rule_freshness',1,'FAIL',20,'["SOURCE_STALE","FRESHNESS_THRESHOLD_EXCEEDED"]','admin_A','{"fixture":"phase8-gpa","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO gpa_duplicate_candidates (duplicate_candidate_id,organization_id,tenant_id,subject_type,left_reference,right_reference,classification,reconciliation_case_id,evidence_references,created_by)
VALUES ('phase8_duplicate_candidate_a','phase8_org_a','tenant:phase8_org_a','PAYMENT','finance-payment-120','outcomes-payment-114','POSSIBLE_DUPLICATE','phase8_reconciliation_case_a','["phase8_evidence_a"]','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_schema_observations (observation_id,organization_id,tenant_id,source_system_id,observed_schema_version,observed_signature,expected_mapping_version,drift_classification,affected_mapping_references,status,remediation_reference,provenance,created_by)
VALUES ('phase8_schema_observation_a','phase8_org_a','tenant:phase8_org_a','phase8_source_finance','2026-09','sha256:phase8-finance-drift','v1','BREAKING','["phase8_mapping_payment"]','OPEN','phase8-remediation-1','{"fixture":"phase8-gpa","testOnly":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_rejected_records (rejected_record_id,organization_id,tenant_id,source_system_id,source_record_id,batch_reference,rule_id,failure_reason,remediation_status,provenance,created_by)
VALUES ('phase8_rejected_record_a','phase8_org_a','tenant:phase8_org_a','phase8_source_finance','payment-bad','phase8-batch-1','phase8_quality_rule_freshness','Payment record missing required effective date','OPEN','{"fixture":"phase8-gpa","testOnly":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO audit_events (audit_event_id,organization_id,actor_user_id,target_object_type,target_object_id,action_type,previous_state_json,new_state_json,reason_code,correlation_id,source_channel)
VALUES ('phase8_reconciliation_event_a','phase8_org_a','admin_A','GPA_RECONCILIATION','phase8_reconciliation_case_a','CREATED',NULL,'{"status":"OPEN"}',NULL,'phase8-reconciliation-correlation','government_assurance') ON CONFLICT DO NOTHING;
INSERT INTO gpa_monitoring_plans (monitoring_plan_id,organization_id,tenant_id,program_reference,provider_reference,funding_reference,period_start,period_end,monitoring_type,scope,objectives,control_references,planned_activities,assigned_reviewer,risk_reference,schedule,status,created_by,approved_by,provenance)
VALUES ('phase8_monitoring_plan_a','phase8_org_a','tenant:phase8_org_a','phase8_program_a','phase8_provider_a','phase8_award_a','2026-01-01','2026-06-30','COMPLIANCE_REVIEW','{"fixture":true}','["Quarterly verified outcome reporting"]','["phase8_control_outcome_reporting"]','["phase8_monitoring_activity_a"]','admin_A','phase8-risk-1','{"frequency":"QUARTERLY"}','ACTIVE','admin_A','admin_A','{"fixture":"phase8-gpa","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO gpa_monitoring_activities (activity_id,monitoring_plan_id,organization_id,tenant_id,activity_type,reviewer_reference,scheduled_at,status,control_references,evidence_references,observations,exceptions,result,provenance,created_by)
VALUES ('phase8_monitoring_activity_a','phase8_monitoring_plan_a','phase8_org_a','tenant:phase8_org_a','DESK_REVIEW','admin_A','2026-06-15T12:00:00Z','PLANNED','["phase8_control_outcome_reporting"]','["phase8_evidence_request_a"]','[]','[]','{}','{"fixture":"phase8-gpa","testOnly":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_evidence_requests (evidence_request_id,organization_id,tenant_id,monitoring_reference,provider_reference,program_reference,requirement_reference,control_reference,evidence_type,requested_by,requested_at,due_at,status,admissibility_status,escalation_state,provenance)
VALUES ('phase8_evidence_request_a','phase8_org_a','tenant:phase8_org_a','phase8_monitoring_activity_a','phase8_provider_a','phase8_program_a','phase8_requirement_outcome','phase8_control_outcome_reporting','QUARTERLY_OUTCOME_REPORT','admin_A','2026-06-01T12:00:00Z','2026-07-15T12:00:00Z','REQUESTED','PENDING','NONE','{"fixture":"phase8-gpa","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO gpa_findings (finding_id,organization_id,tenant_id,monitoring_reference,provider_reference,program_reference,requirement_reference,control_reference,finding_type,severity,materiality,description,evidence_references,verification_references,reconciliation_references,detected_at,status,provider_response_state,corrective_action_required,provenance,created_by)
VALUES ('phase8_finding_a','phase8_org_a','tenant:phase8_org_a','phase8_monitoring_plan_a','phase8_provider_a','phase8_program_a','phase8_requirement_outcome','phase8_control_outcome_reporting','EVIDENCE_DEFICIENCY','MEDIUM','MATERIAL','Quarterly outcome report requires remediation','["phase8_evidence_request_a"]','[]','[]','2026-06-30T12:00:00Z','PROPOSED','PENDING',true,'{"fixture":"phase8-gpa","testOnly":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_provider_responses (response_id,finding_id,organization_id,tenant_id,provider_reference,responder_reference,response_type,narrative_reference,supporting_evidence_references,submitted_at,status,provenance,created_by)
VALUES ('phase8_provider_response_a','phase8_finding_a','phase8_org_a','tenant:phase8_org_a','phase8_provider_a','admin_A','REMEDIATION_PLAN','phase8-provider-response','["phase8_evidence_a"]','2026-07-05T12:00:00Z','SUBMITTED','{"fixture":"phase8-gpa","testOnly":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_corrective_actions (corrective_action_id,finding_id,organization_id,tenant_id,provider_reference,program_reference,required_action,action_owner,due_at,milestones,required_evidence,submitted_by,status,escalation_state,provenance,created_by)
VALUES ('phase8_corrective_action_a','phase8_finding_a','phase8_org_a','tenant:phase8_org_a','phase8_provider_a','phase8_program_a','Submit and validate the quarterly outcome report','phase8_provider_a','2026-08-15T12:00:00Z','[{"name":"Submit report","status":"PENDING"}]','["QUARTERLY_OUTCOME_REPORT"]','phase8_provider_a','RETEST_PENDING','NONE','{"fixture":"phase8-gpa","testOnly":true,"retestReady":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_metrics (metric_id,version,organization_id,tenant_id,program_reference,canonical_name,definition,unit_value_type,effective_from,authority_owner_reference,status,created_by)
VALUES ('phase8_metric_verified_placements',1,'phase8_org_a','tenant:phase8_org_a','phase8_program_a','Verified Placements','Participants with verified qualifying placement during the reporting period','COUNT',NOW(),'phase8_org_a','ACTIVE','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_metric_results (metric_result_id,metric_id,metric_version,organization_id,tenant_id,program_reference,provider_reference,reporting_period_start,reporting_period_end,numerator,calculated_value,unit_value_type,input_references,input_verification_levels,calculation_version,calculation_hash,calculated_by,status,provenance)
VALUES ('phase8_metric_result_placements','phase8_metric_verified_placements',1,'phase8_org_a','tenant:phase8_org_a','phase8_program_a','phase8_provider_a','2026-01-01','2026-06-30',120,'{"value":120}','placements','[{"claimId":"phase8_claim_placements","verificationId":"phase8_verification_placements","evidenceReferences":["phase8_source_outcomes"],"sourceProvenanceReference":"phase8_source_outcomes","sourceAuthorityReference":"phase8_authority_outcomes"}]','["V4"]','phase8-fixture-v1','phase8-fixture-hash','admin_A','ACCEPTED','{"fixture":"phase8-gpa","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO gpa_verification_methods (method_id,version,organization_id,tenant_id,method_type,description,required_evidence_types,effective_from,status,created_by)
VALUES ('phase8_method_authoritative',1,'phase8_org_a','tenant:phase8_org_a','SOURCE_SYSTEM_VALIDATION','Controlled authoritative source validation','["SOURCE_RECORD","PROVIDER_SUBMISSION"]',NOW(),'ACTIVE','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_funding_references (funding_reference_id,organization_id,tenant_id,canonical_record_type,canonical_record_id,funder_organization_reference,recipient_organization_reference,provider_organization_reference,program_reference,amount,currency,period_start,period_end,status,source_system_id,source_record_id,provenance_reference,created_by)
VALUES
 ('phase8_award_a','phase8_org_a','tenant:phase8_org_a','AWARD','phase8-award','phase8_org_a','phase8_org_a',NULL,'phase8_program_a',1000000,'USD','2026-01-01','2026-12-31','VERIFIED','phase8_source_finance','award-1','phase8_policy_gpa','admin_A'),
 ('phase8_obligation_a','phase8_org_a','tenant:phase8_org_a','OBLIGATION','phase8-obligation-a','phase8_org_a','phase8_org_a','phase8_provider_a','phase8_program_a',600000,'USD','2026-01-01','2026-12-31','VERIFIED','phase8_source_finance','obligation-a','phase8_policy_gpa','admin_A'),
 ('phase8_obligation_b','phase8_org_a','tenant:phase8_org_a','OBLIGATION','phase8-obligation-b','phase8_org_a','phase8_org_a','phase8_provider_b','phase8_program_a',400000,'USD','2026-01-01','2026-12-31','VERIFIED','phase8_source_finance','obligation-b','phase8_policy_gpa','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_claims (claim_id,organization_id,tenant_id,claimant_reference,program_reference,claim_type,reporting_period_start,reporting_period_end,asserted_value,asserted_unit,status,created_by)
VALUES ('phase8_claim_placements','phase8_org_a','tenant:phase8_org_a','phase8_provider_a','phase8_program_a','PROVIDER_PERFORMANCE','2026-01-01','2026-06-30','{"value":120}','placements','VERIFIED','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_verification_records (verification_id,organization_id,tenant_id,claim_id,subject_type,subject_reference,method_id,method_version,verifier_reference,status,result,evidence_references,created_by,completed_at)
VALUES ('phase8_verification_placements','phase8_org_a','tenant:phase8_org_a','phase8_claim_placements','CLAIM','phase8_claim_placements','phase8_method_authoritative',1,'admin_A','PASSED','{"level":"V4","fixture":true}','["phase8_source_outcomes"]','admin_A',NOW()) ON CONFLICT DO NOTHING;
INSERT INTO gpa_truth_facts (truth_fact_id,organization_id,tenant_id,fact_type,subject_type,subject_reference,claim_id,verification_id,source_references,fact_value,status,provenance,determined_by,created_by,public_approval_status,verification_level)
VALUES ('phase8_truth_placements','phase8_org_a','tenant:phase8_org_a','VERIFIED_PLACEMENTS','METRIC','phase8_metric_verified_placements','phase8_claim_placements','phase8_verification_placements','["phase8_source_outcomes"]','{"value":120}','ACCEPTED','{"fixture":"phase8-gpa","canonical":true}','admin_A','admin_A','PUBLIC_APPROVED','V4') ON CONFLICT DO NOTHING;
UPDATE gpa_truth_facts SET metric_result_id='phase8_metric_result_placements' WHERE truth_fact_id='phase8_truth_placements' AND organization_id='phase8_org_a' AND tenant_id='tenant:phase8_org_a';
INSERT INTO gpa_audit_engagements (audit_engagement_id,organization_id,tenant_id,audit_type,authority_reference,scope,period_start,period_end,objectives,population,methodology,assigned_auditors,independence_requirements,status,approval_reference,provenance,created_by)
VALUES ('phase8_audit_a','phase8_org_a','tenant:phase8_org_a','PERFORMANCE_REVIEW','phase8_authority_finance','{"programReference":"phase8_program_a","providerReference":"phase8_provider_a"}','2026-01-01','2026-06-30','["Verify reported placements"]','{"definition":"verified placements","size":120}','{"method":"RANDOM","version":"1"}','["admin_A"]','{"independentReviewer":true}','FIELDWORK','phase8-audit-approval','{"fixture":"phase8-gpa","testOnly":true}','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO gpa_audit_workpapers (workpaper_id,audit_engagement_id,organization_id,tenant_id,audit_step,preparer_reference,reviewer_reference,evidence_references,procedures,conclusion,review_notes,status,provenance)
VALUES ('phase8_workpaper_a','phase8_audit_a','phase8_org_a','tenant:phase8_org_a','Placement verification','admin_A','admin_A','["phase8_evidence_a"]','["Compare source outcome to claim"]','Evidence supports the sampled placement claim.','[]','REVIEWED','{"fixture":"phase8-gpa","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO gpa_samples (sample_id,organization_id,tenant_id,audit_engagement_id,population_definition,population_size,method,random_seed,strata,risk_criteria,sample_size,selected_record_references,methodology_version,created_by,provenance)
VALUES ('phase8_sample_a','phase8_org_a','tenant:phase8_org_a','phase8_audit_a','{"definition":"verified placements"}',120,'RANDOM','phase8-seed-1','[]','{"materiality":"HIGH"}',1,'["phase8_claim_placements"]','1','admin_A','{"fixture":"phase8-gpa","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO gpa_sample_results (sample_result_id,sample_id,organization_id,tenant_id,selected_record_reference,evidence_references,test_performed,result,exception,finding_reference,reviewer_reference,provenance)
VALUES ('phase8_sample_result_a','phase8_sample_a','phase8_org_a','tenant:phase8_org_a','phase8_claim_placements','["phase8_evidence_a"]','Verify placement evidence','PASS',NULL,NULL,'admin_A','{"fixture":"phase8-gpa","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO gpa_pilot_configurations (pilot_configuration_id,organization_id,tenant_id,agency_organization_reference,pilot_name,status,pilot_start,pilot_end,program_references,provider_references,funding_references,source_system_references,allowed_purposes,required_roles,public_disclosure_profile_reference,created_by,approved_by,provenance)
VALUES ('phase8_pilot_gpa','phase8_org_a','tenant:phase8_org_a','phase8_org_a','Controlled County Assurance Pilot','READY_FOR_ACCEPTANCE','2026-01-01','2026-12-31','["phase8_program_a"]','["phase8_provider_a","phase8_provider_b"]','["phase8_award_a","phase8_obligation_a","phase8_obligation_b"]','["phase8_source_finance","phase8_source_outcomes"]','["PROGRAM_MONITORING","CLAIM_VERIFICATION","PAYMENT_VALIDATION","PUBLIC_REPORTING"]','["Executive","Program Administrator","Program Monitor","Auditor"]','phase8-public-safe','admin_A','admin_A','{"fixture":"phase8-gpa","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO ai_delegated_authorities (delegation_id,principal_user_id,agent_identifier,organization_id,tenant_id,purpose,resource_scope,allowed_actions,forbidden_actions,autonomy_profile,restricted_resource_access,valid_from,expires_at,created_by)
VALUES ('phase8_gpa_ai_delegation','admin_A','gpa-governed-assistant','phase8_org_a','tenant:phase8_org_a','GOVERNMENT_PROGRAM_ASSURANCE','{"all":true,"allowRestricted":false}',ARRAY['agent.session.open','gpa.assistant.answer'],ARRAY['gpa.truth.determine','gpa.finding.issue','gpa.reconciliation.resolve','gpa.decision.finalize','gpa.sanction.execute'], 'LEVEL_1_RECOMMEND',false,NOW()-INTERVAL '1 minute',NOW()+INTERVAL '1 day','admin_A') ON CONFLICT DO NOTHING;
`;

const u6bCertificateFixtureSql = String.raw`
-- U6B opt-in fixture. These are canonical learner facts; completion is
-- intentionally evaluated by ProgramCompletionService during acceptance.
INSERT INTO programs (program_id, organization_id, name, program_type, status, created_by_user_id)
VALUES ('data-center-specialization-11','phase8_org_a','Data Center & AI Infrastructure Pathway','education','active','admin_A')
ON CONFLICT (program_id) DO NOTHING;
INSERT INTO program_specialization_assignments
  (assignment_id, learner_id, organization_id, tenant_id, program_id, specialization_id, grade, stage, assignment_type, status, assigned_by_user_id, assignment_source)
VALUES ('u6b_dc_assignment_a','learner_A1','phase8_org_a','tenant:phase8_org_a','data-center-specialization-11','technical-operations',11,'PREPARE_PROVE','PRIMARY','ACTIVE','admin_A','PROGRAM_ASSIGNMENT')
ON CONFLICT (assignment_id) DO NOTHING;
INSERT INTO program_specialization_assignments
  (assignment_id, learner_id, organization_id, tenant_id, program_id, specialization_id, grade, stage, assignment_type, status, assigned_by_user_id, assignment_source)
VALUES ('u6b_dc_assignment_incomplete','learner_A2','phase8_org_a','tenant:phase8_org_a','data-center-specialization-11','technical-operations',11,'PREPARE_PROVE','PRIMARY','ACTIVE','admin_A','PROGRAM_ASSIGNMENT')
ON CONFLICT (assignment_id) DO NOTHING;

INSERT INTO curriculum_lesson_completions
  (completion_id, user_id, organization_id, curriculum_id, lesson_id, completed_at, idempotency_key)
SELECT 'u6b_dc_completion_' || md5(lesson_id), 'learner_A1', 'phase8_org_a', 'data-center-specialization-11', lesson_id, NOW(), 'u6b:dc:lesson:' || lesson_id
FROM unnest(ARRAY[
  'data-center-specialization-11-safety-professional-practice',
  'data-center-specialization-11-technical-communication',
  'data-center-specialization-11-reliability-systems-thinking',
  'data-center-specialization-11-evidence-and-feedback',
  'data-center-specialization-11-career-transition-planning',
  'data-center-specialization-11-monitoring-proof',
  'data-center-specialization-11-linux-inspection',
  'data-center-specialization-11-telemetry-troubleshooting'
]) AS required(lesson_id)
ON CONFLICT DO NOTHING;

INSERT INTO competency_definitions
  (competency_id, slug, title, description, domain, version, criteria_json, evidence_requirements_json, status)
VALUES
 ('u6b_comp_monitoring','interpret-monitoring-data-and-document-safe-finding','Interpret monitoring data and document a safe finding','U6B canonical acceptance competency.','data-center-technical-operations',1,'{"criteria":["records observations accurately"]}','{"source":"u6b-canonical-fixture"}','ACTIVE'),
 ('u6b_comp_linux','inspect-linux-system-state-safely','Inspect Linux system state safely','U6B canonical acceptance competency.','data-center-technical-operations',1,'{"criteria":["uses safe inspection"]}','{"source":"u6b-canonical-fixture"}','ACTIVE'),
 ('u6b_comp_troubleshooting','document-structured-infrastructure-troubleshooting','Document structured infrastructure troubleshooting','U6B canonical acceptance competency.','data-center-technical-operations',1,'{"criteria":["documents a bounded finding"]}','{"source":"u6b-canonical-fixture"}','ACTIVE')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO prepare_prove_activity_results
  (result_id, activity_type, activity_id, user_id, organization_id, tenant_id, result_status, result_json)
VALUES ('u6b_dc_result','U6B_DATA_CENTER','u6b-data-center-proof','learner_A1','phase8_org_a','tenant:phase8_org_a','SUCCEEDED','{"fixture":"u6b","canonical":true}')
ON CONFLICT (result_id) DO NOTHING;
INSERT INTO prepare_prove_evidence
  (evidence_id, source_domain, source_record_id, user_id, organization_id, tenant_id, activity_id, criterion, status, provenance_json)
VALUES ('u6b_dc_evidence','u6b-data-center','u6b_dc_result','learner_A1','phase8_org_a','tenant:phase8_org_a','u6b-data-center-proof','pathway-competencies','REVIEWED','{"fixture":"u6b","authority":"prepare-prove"}')
ON CONFLICT (evidence_id) DO NOTHING;
INSERT INTO learner_competency_decisions
  (decision_id, competency_id, evidence_id, user_id, organization_id, tenant_id, decision, criteria_version, reviewer_user_id, reviewer_authority, provenance_json)
SELECT 'u6b_dc_decision_' || c.competency_id, c.competency_id, 'u6b_dc_evidence', 'learner_A1', 'phase8_org_a', 'tenant:phase8_org_a', 'DEMONSTRATED', 1, 'admin_A', 'U6B_CANONICAL_ACCEPTANCE', '{"fixture":"u6b","source":"reviewed-evidence"}'
FROM competency_definitions c
WHERE c.slug IN ('interpret-monitoring-data-and-document-safe-finding','inspect-linux-system-state-safely','document-structured-infrastructure-troubleshooting')
ON CONFLICT DO NOTHING;
`;

const u6bCertificateManifest = {
  orgA: "phase8_org_a", orgB: "phase8_org_b", adminA: "admin_A", adminB: "admin_B",
  learnerA1: "learner_A1", incompleteLearner: "learner_A2", learnerB1: "learner_B1",
  dataCenterProgram: "data-center-specialization-11", dataCenterAssignment: "u6b_dc_assignment_a",
  dataCenterBranch: "technical-operations"
};

const phase9MasterFixtureSql = String.raw`
-- Phase 9 master-journey fixture. This is deliberately additive to the
-- Phase 8 base fixture so the immutable Phase 8 release remains untouched.
INSERT INTO curriculum_courses (course_id,organization_id,stable_key,title,status,created_by_user_id,updated_by_user_id)
VALUES ('phase9_course_a','phase8_org_a','phase9-course-a','Course A','PUBLISHED','admin_A','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_units (unit_id,organization_id,course_id,stable_key,title,sequence)
VALUES ('phase9_unit_a','phase8_org_a','phase9_course_a','unit-a','Unit A',1) ON CONFLICT DO NOTHING;
INSERT INTO curriculum_lessons (lesson_id,organization_id,unit_id,stable_key,title,summary,objectives,sequence,status)
VALUES
 ('phase9_lesson_a','phase8_org_a','phase9_unit_a','lesson-a','Lesson A','Prepare, practice, and demonstrate a safe finding.','["Complete the canonical learning activities."]',1,'ACTIVE'),
 ('phase9_lesson_b','phase8_org_a','phase9_unit_a','lesson-b','Lesson B','Continue the canonical learning sequence.','["Apply the next lesson."]',2,'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO curriculum_assessment_definitions (assessment_definition_id,organization_id,lesson_id,items,source_reference,created_by_user_id)
VALUES ('phase9_assessment_a','phase8_org_a','phase9_lesson_a','[{"itemId":"assessment-item-a","type":"mcq","prompt":"Which response is safest?","choices":["Record evidence and escalate","Make an unapproved change"],"correctIndex":0}]','phase9-master-fixture','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_reflection_definitions (reflection_definition_id,organization_id,lesson_id,items,source_reference,created_by_user_id)
VALUES ('phase9_reflection_a','phase8_org_a','phase9_lesson_a','[{"itemId":"reflection-item-a","prompt":"What was known, uncertain, and subject to authorization?"}]','phase9-master-fixture','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_practice_definitions (practice_definition_id,organization_id,lesson_id,title,instructions,completion_mode,completion_action_label,items,source_reference,created_by_user_id)
VALUES ('phase9_practice_a','phase8_org_a','phase9_lesson_a','Practice A','Submit one safe operational observation.','COMPLETION','Submit observation','[{"itemId":"practice-item-a","prompt":"Record one observation."}]','phase9-master-fixture','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO arcade_activities (arcade_activity_id,slug,title,activity_type,lesson_id,mastery_rule,max_score,pass_threshold_score,status,created_by_user_id)
VALUES ('phase9_arcade_a','phase9-safe-finding','Safe Finding Arcade','SCENARIO','phase9_lesson_a','PASSED_FLAG',NULL,NULL,'active','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_lesson_arcade_activities (curriculum_lesson_arcade_activity_id,organization_id,curriculum_lesson_id,arcade_activity_id,sequence,source_reference)
VALUES ('phase9_arcade_link_a','phase8_org_a','phase9_lesson_a','phase9_arcade_a',1,'phase9-master-fixture') ON CONFLICT DO NOTHING;

INSERT INTO curriculum_releases (release_id,organization_id,course_id,version_number,snapshot,content_hash,status,published_by_user_id)
VALUES ('phase9_release_1','phase8_org_a','phase9_course_a',1,
'{"course":{"stableKey":"phase9-course-a","title":"Course A","shortDescription":"A canonical master journey course.","fullDescription":null,"estimatedDurationMinutes":90},"units":[{"stableKey":"unit-a","title":"Unit A","description":null,"sequence":1,"lessons":[{"stableKey":"lesson-a","title":"Lesson A","summary":"Prepare, practice, and demonstrate a safe finding.","objectives":["Complete the canonical learning activities."],"estimatedDurationMinutes":45,"sequence":1,"resources":[],"arcadeLinks":[{"arcadeActivityId":"phase9_arcade_a","slug":"phase9-safe-finding","title":"Safe Finding Arcade"}],"assessmentDefinition":{"assessmentDefinitionId":"phase9_assessment_a","items":[{"itemId":"assessment-item-a","type":"mcq","prompt":"Which response is safest?","choices":["Record evidence and escalate","Make an unapproved change"],"correctIndex":0}]},"reflectionDefinition":{"reflectionDefinitionId":"phase9_reflection_a","items":[{"itemId":"reflection-item-a","prompt":"What was known, uncertain, and subject to authorization?"}]},"practiceDefinition":{"practiceDefinitionId":"phase9_practice_a","title":"Practice A","instructions":"Submit one safe operational observation.","completionMode":"COMPLETION","completionActionLabel":"Submit observation","items":[{"itemId":"practice-item-a","prompt":"Record one observation."}]}},{"stableKey":"lesson-b","title":"Lesson B","summary":"Continue the canonical learning sequence.","objectives":["Apply the next lesson."],"estimatedDurationMinutes":45,"sequence":2,"resources":[],"arcadeLinks":[],"assessmentDefinition":null,"reflectionDefinition":null,"practiceDefinition":null}]}]}',
'9999999999999999999999999999999999999999999999999999999999999999','PUBLISHED','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO completion_policies (policy_id,organization_id,curriculum_release_id,assigned_content_type,assigned_content_id,status,version,created_by_user_id)
VALUES ('phase9_policy_a','phase8_org_a','phase9_release_1','LESSON','unit-a:lesson-a','DRAFT',1,'admin_A') ON CONFLICT DO NOTHING;
INSERT INTO completion_policy_requirements (requirement_id,policy_id,organization_id,requirement_type,target_reference,configuration,required,sequence) VALUES
 ('phase9_req_content','phase9_policy_a','phase8_org_a','CONTENT',NULL,'{}',true,1),
 ('phase9_req_assessment','phase9_policy_a','phase8_org_a','ASSESSMENT',NULL,'{"passThresholdPercent":100}',true,2),
 ('phase9_req_practice','phase9_policy_a','phase8_org_a','PRACTICE',NULL,'{}',true,3),
 ('phase9_req_reflection','phase9_policy_a','phase8_org_a','REFLECTION',NULL,'{}',true,4),
 ('phase9_req_arcade','phase9_policy_a','phase8_org_a','ARCADE','phase9_arcade_a','{}',true,5),
 ('phase9_req_project','phase9_policy_a','phase8_org_a','PROJECT','phase9_project_a','{}',true,6),
 ('phase9_req_live','phase9_policy_a','phase8_org_a','LIVE_ATTENDANCE','phase9_live_a','{}',true,7),
 ('phase9_req_verification','phase9_policy_a','phase8_org_a','INSTRUCTOR_VERIFICATION','competency_prepare_prove_monitoring_finding','{}',true,8)
ON CONFLICT DO NOTHING;
UPDATE completion_policies SET status='ACTIVE',activated_by_user_id='admin_A',activated_at=NOW() WHERE policy_id='phase9_policy_a' AND status='DRAFT';
INSERT INTO assignments (assignment_id,organization_id,cohort_id,course_id,lesson_id,title,assignment_type,created_by,due_at,status,curriculum_release_id,assigned_content_type,assigned_content_id,visibility_scope,completion_policy_id)
VALUES ('phase9_assignment_a','phase8_org_a','phase8_cohort_a','phase9_course_a','phase9_lesson_a','Assignment A','assignment','admin_A',NOW()+INTERVAL '14 days','published','phase9_release_1','LESSON','unit-a:lesson-a','targeted','phase9_policy_a') ON CONFLICT DO NOTHING;
INSERT INTO assignment_targets (assignment_target_id,assignment_id,organization_id,target_type,user_id,created_by)
VALUES ('phase9_target_a1','phase9_assignment_a','phase8_org_a','LEARNER','learner_A1','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO projects (project_id,organization_id,tenant_id,course_id,title,project_type,status,created_by_user_id)
VALUES ('phase9_project_a','phase8_org_a','tenant:phase8_org_a','phase9_course_a','Project A','EDUCATIONAL_PROJECT','ACTIVE','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO project_teams (team_id,project_id,organization_id,tenant_id,mode,status)
VALUES ('phase9_team_a','phase9_project_a','phase8_org_a','tenant:phase8_org_a','INDIVIDUAL_INTEGRATED_MODE','ACTIVE') ON CONFLICT DO NOTHING;
INSERT INTO project_team_members (membership_id,team_id,learner_id,organization_id,tenant_id,specialization_id,role_id)
VALUES ('phase9_project_member_a','phase9_team_a','learner_A1','phase8_org_a','tenant:phase8_org_a','general','member') ON CONFLICT DO NOTHING;
INSERT INTO prepare_prove_activity_results (result_id,activity_type,activity_id,user_id,organization_id,tenant_id,result_status,result_json)
VALUES ('phase9_result_a','PHASE9','phase9-project-proof','learner_A1','phase8_org_a','tenant:phase8_org_a','SUCCEEDED','{}') ON CONFLICT DO NOTHING;
INSERT INTO prepare_prove_evidence (evidence_id,source_domain,source_record_id,user_id,organization_id,tenant_id,activity_id,criterion,status,provenance_json,source_type,assignment_id,curriculum_release_id,release_version,course_id,unit_stable_key,lesson_stable_key,evidence_rule_id,evidence_rule_version,competency_id)
VALUES ('phase9_evidence_a','phase9','phase9_result_a','learner_A1','phase8_org_a','tenant:phase8_org_a','phase9-project-proof','safe-finding','REVIEWABLE','{"fixture":"phase9-master","source":"prepare_prove"}','PREPARE_PROVE','phase9_assignment_a','phase9_release_1',1,'phase9_course_a','unit-a','lesson-a','phase8_rule_a',1,'competency_prepare_prove_monitoring_finding') ON CONFLICT DO NOTHING;
INSERT INTO live_sessions (live_session_id,organization_id,provider,title,instructor_id,starts_at,ends_at,status,course_id,cohort_id,audience_scope)
VALUES ('phase9_live_a','phase8_org_a','mock','Session A','instructor_A_authorized',NOW()-INTERVAL '5 minutes',NOW()+INTERVAL '55 minutes','scheduled','phase9_course_a','phase8_cohort_a','COHORT') ON CONFLICT DO NOTHING;
UPDATE live_sessions SET provider_session_id='phase9-provider-session-a' WHERE live_session_id='phase9_live_a' AND provider_session_id IS NULL;
INSERT INTO live_session_join_events (join_event_id,live_session_id,user_id,decision,attendance_status)
VALUES ('phase9_join_a1','phase9_live_a','learner_A1','allow','authorized') ON CONFLICT DO NOTHING;
INSERT INTO program_careers (program_career_id,organization_id,program_id,career_id,is_primary,created_by_user_id)
VALUES ('phase9_program_career_a','phase8_org_a','phase8_program_a','career_data_center_technician',true,'admin_A') ON CONFLICT DO NOTHING;
INSERT INTO curriculum_releases (release_id,organization_id,course_id,version_number,snapshot,content_hash,status,published_by_user_id)
VALUES ('phase9_release_2','phase8_org_a','phase9_course_a',2,
'{"course":{"stableKey":"phase9-course-a","title":"Course A","shortDescription":"A canonical master journey course.","fullDescription":null,"estimatedDurationMinutes":95},"units":[{"stableKey":"unit-a","title":"Unit A","description":null,"sequence":1,"lessons":[{"stableKey":"lesson-a","title":"Lesson A","summary":"Prepare, practice, and demonstrate a safe finding.","objectives":["Complete the canonical learning activities."],"estimatedDurationMinutes":45,"sequence":1,"resources":[],"arcadeLinks":[{"arcadeActivityId":"phase9_arcade_a","slug":"phase9-safe-finding","title":"Safe Finding Arcade"}],"assessmentDefinition":{"assessmentDefinitionId":"phase9_assessment_a","items":[{"itemId":"assessment-item-a","type":"mcq","prompt":"Which response is safest?","choices":["Record evidence and escalate","Make an unapproved change"],"correctIndex":0}]},"reflectionDefinition":{"reflectionDefinitionId":"phase9_reflection_a","items":[{"itemId":"reflection-item-a","prompt":"What was known, uncertain, and subject to authorization?"}]},"practiceDefinition":{"practiceDefinitionId":"phase9_practice_a","title":"Practice A","instructions":"Submit one safe operational observation.","completionMode":"COMPLETION","completionActionLabel":"Submit observation","items":[{"itemId":"practice-item-a","prompt":"Record one observation."}]}},{"stableKey":"lesson-b","title":"Lesson B","summary":"Continue the canonical learning sequence.","objectives":["Apply the next lesson."],"estimatedDurationMinutes":45,"sequence":2,"resources":[],"arcadeLinks":[],"assessmentDefinition":null,"reflectionDefinition":null,"practiceDefinition":null}]}]}',
'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','PUBLISHED','admin_A') ON CONFLICT DO NOTHING;
INSERT INTO completion_policies (policy_id,organization_id,curriculum_release_id,assigned_content_type,assigned_content_id,status,version,created_by_user_id)
VALUES ('phase9_policy_b','phase8_org_a','phase9_release_2','LESSON','unit-a:lesson-a','DRAFT',1,'admin_A') ON CONFLICT DO NOTHING;
UPDATE completion_policies SET status='ACTIVE',activated_by_user_id='admin_A',activated_at=NOW() WHERE policy_id='phase9_policy_b' AND status='DRAFT';
INSERT INTO assignments (assignment_id,organization_id,cohort_id,course_id,lesson_id,title,assignment_type,created_by,due_at,status,curriculum_release_id,assigned_content_type,assigned_content_id,visibility_scope,completion_policy_id)
VALUES ('phase9_assignment_b','phase8_org_a','phase8_cohort_a','phase9_course_a','phase9_lesson_a','Assignment B','assignment','admin_A',NOW()+INTERVAL '21 days','published','phase9_release_2','LESSON','unit-a:lesson-a','targeted','phase9_policy_b') ON CONFLICT DO NOTHING;
INSERT INTO assignment_targets (assignment_target_id,assignment_id,organization_id,target_type,user_id,created_by)
VALUES ('phase9_target_b1','phase9_assignment_b','phase8_org_a','LEARNER','learner_A2','admin_A') ON CONFLICT DO NOTHING;
`;

const phase9MasterManifest = {
  orgA: "phase8_org_a", orgB: "phase8_org_b", orgEmpty: "phase8_org_empty",
  adminA: "admin_A", authorizedInstructorA: "instructor_A_authorized", unauthorizedInstructorA: "instructor_A_unauthorized",
  learnerA1: "learner_A1", learnerA2: "learner_A2", instructorB: "instructor_B", learnerB1: "learner_B1", learnerEmpty: "learner_empty", multiOrgStaff: "multi_org_staff",
  programA: "phase8_program_a", cohortA: "phase8_cohort_a", courseA: "phase9_course_a", unitA: "phase9_unit_a", lessonA: "phase9_lesson_a", lessonB: "phase9_lesson_b",
  release1: "phase9_release_1", release2: "phase9_release_2", assignmentA: "phase9_assignment_a", assignmentB: "phase9_assignment_b", policyA: "phase9_policy_a",
  assessment: "phase9_assessment_a", practice: "phase9_practice_a", arcadeActivity: "phase9_arcade_a", reflection: "phase9_reflection_a",
  project: "phase9_project_a", projectTeam: "phase9_team_a", projectSubmission: null, evidence: "phase9_evidence_a", verification: "phase9_evidence_a",
  liveSession: "phase9_live_a", joinEvent: "phase9_join_a1", competency: "competency_prepare_prove_monitoring_finding",
  career: "career_data_center_technician", programCareer: "phase9_program_career_a", reportKey: "curriculum.learning_progress"
};

const phase9MasterValidationSql = String.raw`
DO $$
DECLARE req_count INTEGER; lesson_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM curriculum_courses WHERE course_id='phase9_course_a' AND organization_id='phase8_org_a') THEN RAISE EXCEPTION 'Course A missing'; END IF;
  SELECT COUNT(*) INTO lesson_count FROM curriculum_lessons WHERE unit_id='phase9_unit_a' AND status='ACTIVE';
  IF lesson_count <> 2 THEN RAISE EXCEPTION 'LESSON_A_READY/LESSON_B_READY require exactly two active lessons'; END IF;
  IF NOT EXISTS (SELECT 1 FROM curriculum_releases WHERE release_id='phase9_release_1' AND status='PUBLISHED') THEN RAISE EXCEPTION 'Release 1 missing'; END IF;
  IF jsonb_array_length((SELECT snapshot->'units'->0->'lessons' FROM curriculum_releases WHERE release_id='phase9_release_1')) <> 2 THEN RAISE EXCEPTION 'Release 1 does not contain two lessons'; END IF;
  IF NOT EXISTS (SELECT 1 FROM curriculum_assessment_definitions WHERE assessment_definition_id='phase9_assessment_a' AND lesson_id='phase9_lesson_a') THEN RAISE EXCEPTION 'ASSESSMENT_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM curriculum_practice_definitions WHERE practice_definition_id='phase9_practice_a' AND lesson_id='phase9_lesson_a') THEN RAISE EXCEPTION 'PRACTICE_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM curriculum_lesson_arcade_activities WHERE curriculum_lesson_id='phase9_lesson_a' AND arcade_activity_id='phase9_arcade_a') OR EXISTS (SELECT 1 FROM arcade_results WHERE arcade_activity_id='phase9_arcade_a' AND learner_user_id='learner_A1') THEN RAISE EXCEPTION 'ARCADE_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM curriculum_reflection_definitions WHERE reflection_definition_id='phase9_reflection_a' AND lesson_id='phase9_lesson_a') OR EXISTS (SELECT 1 FROM reflection_submissions WHERE reflection_definition_id='phase9_reflection_a' AND learner_user_id='learner_A1') THEN RAISE EXCEPTION 'REFLECTION_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM project_team_members WHERE team_id='phase9_team_a' AND learner_id='learner_A1') OR EXISTS (SELECT 1 FROM project_submissions WHERE project_id='phase9_project_a') THEN RAISE EXCEPTION 'PROJECT_SUBMISSION_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM live_sessions WHERE live_session_id='phase9_live_a' AND course_id='phase9_course_a') OR NOT EXISTS (SELECT 1 FROM live_session_join_events WHERE join_event_id='phase9_join_a1' AND attendance_status='authorized') THEN RAISE EXCEPTION 'ATTENDANCE_PRECONDITION_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM prepare_prove_evidence WHERE evidence_id='phase9_evidence_a' AND status='REVIEWABLE') OR EXISTS (SELECT 1 FROM learner_competency_decisions WHERE evidence_id='phase9_evidence_a') THEN RAISE EXCEPTION 'VERIFICATION_PRECONDITION_READY failed'; END IF;
  SELECT COUNT(*) INTO req_count FROM completion_policy_requirements WHERE policy_id='phase9_policy_a' AND required;
  IF req_count <> 8 THEN RAISE EXCEPTION 'COMPLETION_POLICY_READY expected 8 supported requirements'; END IF;
  IF EXISTS (SELECT 1 FROM curriculum_lesson_completions WHERE organization_id='phase8_org_a' AND user_id='learner_A1' AND lesson_id='phase9_lesson_a') OR EXISTS (SELECT 1 FROM assessment_results WHERE assignment_id='phase9_assignment_a') OR EXISTS (SELECT 1 FROM practice_results WHERE assignment_id='phase9_assignment_a') THEN RAISE EXCEPTION 'INITIAL_COMPLETION_STATE must be UNSATISFIED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM curriculum_releases WHERE release_id='phase9_release_2' AND status='PUBLISHED') OR NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id='phase9_assignment_a' AND curriculum_release_id='phase9_release_1') OR NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id='phase9_assignment_b' AND curriculum_release_id='phase9_release_2') THEN RAISE EXCEPTION 'RELEASE_2_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM program_careers WHERE program_career_id='phase9_program_career_a') THEN RAISE EXCEPTION 'CAREER_CONNECTION_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cohort_staff WHERE cohort_id='phase8_cohort_a' AND user_id='instructor_A_authorized' AND status='ACTIVE') OR NOT EXISTS (SELECT 1 FROM enrollments WHERE cohort_id='phase8_cohort_a' AND learner_user_id='learner_A1' AND status='ACTIVE') THEN RAISE EXCEPTION 'STAFF_RECONCILIATION_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE organization_id='phase8_org_b') OR NOT EXISTS (SELECT 1 FROM curriculum_courses WHERE organization_id='phase8_org_b') THEN RAISE EXCEPTION 'CROSS_ORG_FIXTURE_READY failed'; END IF;
END $$;
`;

const fixtureManifest = {
  orgA: "phase8_org_a", orgB: "phase8_org_b", orgEmpty: "phase8_org_empty",
  adminA: "admin_A", adminB: "admin_B", adminEmpty: "admin_empty", learnerEmpty: "learner_empty",
  authorizedInstructorA: "instructor_A_authorized", unauthorizedInstructorA: "instructor_A_unauthorized",
  learnerA1: "learner_A1", learnerA2: "learner_A2", instructorB: "instructor_B", learnerB1: "learner_B1",
  multiOrgStaff: "multi_org_staff", programA: "phase8_program_a", cohortA: "phase8_cohort_a",
  gpaClaim: "phase8_claim_placements", gpaVerification: "phase8_verification_placements", gpaPilotConfiguration: "phase8_pilot_gpa", gpaProviderA: "phase8_provider_a", gpaProviderB: "phase8_provider_b", gpaAward: "phase8_award_a",
  gpaMonitoringPlan: "phase8_monitoring_plan_a", gpaMonitoringActivity: "phase8_monitoring_activity_a", gpaEvidenceRequest: "phase8_evidence_request_a",
  gpaFinding: "phase8_finding_a", gpaProviderResponse: "phase8_provider_response_a", gpaCorrectiveAction: "phase8_corrective_action_a",
  gpaReconciliationCase: "phase8_reconciliation_case_a", gpaEntityResolution: "phase8_entity_resolution_a", gpaQualityRule: "phase8_quality_rule_freshness", gpaQualityEvaluation: "phase8_quality_eval_case_a", gpaDuplicateCandidate: "phase8_duplicate_candidate_a", gpaSchemaObservation: "phase8_schema_observation_a", gpaRejectedRecord: "phase8_rejected_record_a", gpaSourceSystem: "phase8_source_finance", gpaSourceAuthority: "phase8_authority_finance", gpaDataUsePolicy: "phase8_policy_gpa", gpaAuditEngagement: "phase8_audit_a", gpaWorkpaper: "phase8_workpaper_a", gpaSample: "phase8_sample_a", gpaSampleResult: "phase8_sample_result_a", gpaMetricResult: "phase8_metric_result_placements", gpaTruthFact: "phase8_truth_placements",
  programB: "phase8_program_b", cohortB: "phase8_cohort_b", courseA: "phase8_course_a", courseB: "phase8_course_b",
  unitA: "phase8_unit_a", lessonA: "phase8_lesson_a", unitB: "phase8_unit_b", lessonB: "phase8_lesson_b",
  releaseA1: "phase8_release_1", releaseB1: "phase8_release_b1", policyA: "phase8_policy_a",
  assignmentA: "phase8_assignment_a", assignmentB: "phase8_assignment_b", projectReviewA: "phase8_submission_a",
  projectReviewB: "phase8_submission_b", evidenceReviewA: "phase8_evidence_a", evidenceReviewB: "phase8_evidence_b",
  verificationA: "phase8_evidence_a", competencyA: "competency_prepare_prove_monitoring_finding",
  liveSessionA: "phase8_live_a", liveSessionB: "phase8_live_b", joinEventA1: "phase8_join_a1",
  joinEventB1: "phase8_join_b1", metricKey: "curriculum.learning_progress", reportKey: "curriculum.learning_progress",
};

const fixtureValidationSql = String.raw`
DO $$
DECLARE n INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE organization_id='phase8_org_empty') THEN RAISE EXCEPTION 'EMPTY_ORG_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM curriculum_courses WHERE course_id='phase8_course_a' AND organization_id='phase8_org_a') THEN RAISE EXCEPTION 'Course A missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM curriculum_releases WHERE release_id='phase8_release_1' AND organization_id='phase8_org_a' AND status='PUBLISHED') THEN RAISE EXCEPTION 'Release A1 invalid'; END IF;
  IF NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id='phase8_assignment_a' AND organization_id='phase8_org_a' AND curriculum_release_id='phase8_release_1') THEN RAISE EXCEPTION 'Assignment A lineage invalid'; END IF;
  IF NOT EXISTS (SELECT 1 FROM enrollments WHERE enrollment_id='phase8_enrollment_a1' AND organization_id='phase8_org_a' AND learner_user_id='learner_A1' AND status='ACTIVE') THEN RAISE EXCEPTION 'Learner A1 enrollment missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cohort_staff WHERE cohort_staff_id='phase8_staff_a' AND organization_id='phase8_org_a' AND user_id='instructor_A_authorized' AND status='ACTIVE') THEN RAISE EXCEPTION 'authorized instructor scope missing'; END IF;
  IF EXISTS (SELECT 1 FROM cohort_staff WHERE organization_id='phase8_org_a' AND user_id='instructor_A_unauthorized' AND status='ACTIVE') THEN RAISE EXCEPTION 'unauthorized instructor unexpectedly scoped'; END IF;
  IF NOT EXISTS (SELECT 1 FROM project_submissions WHERE submission_id='phase8_submission_a' AND organization_id='phase8_org_a' AND submitted_by_user_id='learner_A1' AND status='SUBMITTED') THEN RAISE EXCEPTION 'PROJECT_REVIEW_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM prepare_prove_evidence WHERE evidence_id='phase8_evidence_a' AND organization_id='phase8_org_a' AND user_id='learner_A1' AND status='REVIEWABLE' AND assignment_id='phase8_assignment_a' AND curriculum_release_id='phase8_release_1' AND competency_id IS NOT NULL) THEN RAISE EXCEPTION 'EVIDENCE_REVIEW_READY failed'; END IF;
  IF EXISTS (SELECT 1 FROM learner_competency_decisions WHERE evidence_id='phase8_evidence_a') THEN RAISE EXCEPTION 'INSTRUCTOR_VERIFICATION_READY requires an actionable undecided evidence item'; END IF;
  IF NOT EXISTS (SELECT 1 FROM live_sessions WHERE live_session_id='phase8_live_a' AND organization_id='phase8_org_a' AND cohort_id='phase8_cohort_a') THEN RAISE EXCEPTION 'ATTENDANCE_READY session missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM live_session_join_events WHERE join_event_id='phase8_join_a1' AND live_session_id='phase8_live_a' AND user_id='learner_A1' AND decision='allow' AND attendance_status='authorized') THEN RAISE EXCEPTION 'ATTENDANCE_READY join state invalid'; END IF;
  IF NOT EXISTS (SELECT 1 FROM completion_policies WHERE policy_id='phase8_policy_a' AND status='ACTIVE' AND assigned_content_id='unit-a:lesson-a') THEN RAISE EXCEPTION 'COMPLETION_READY policy missing'; END IF;
  IF EXISTS (SELECT 1 FROM curriculum_lesson_completions WHERE organization_id='phase8_org_a' AND user_id='learner_A1' AND lesson_id='phase8_lesson_a') THEN RAISE EXCEPTION 'COMPLETION_READY must start incomplete'; END IF;
  IF NOT EXISTS (SELECT 1 FROM curriculum_courses WHERE course_id='phase8_course_b' AND organization_id='phase8_org_b') OR NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id='phase8_assignment_b' AND organization_id='phase8_org_b') OR NOT EXISTS (SELECT 1 FROM live_sessions WHERE live_session_id='phase8_live_b' AND organization_id='phase8_org_b') THEN RAISE EXCEPTION 'CROSS_ORG_FIXTURE_READY failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM memberships WHERE user_id='multi_org_staff' AND organization_id='phase8_org_a') OR NOT EXISTS (SELECT 1 FROM memberships WHERE user_id='multi_org_staff' AND organization_id='phase8_org_b') THEN RAISE EXCEPTION 'ORG_SWITCH_FIXTURE_READY failed'; END IF;
  SELECT COUNT(*) INTO n FROM organizations WHERE organization_id='phase8_org_empty';
  IF n <> 1 OR EXISTS (SELECT 1 FROM curriculum_courses WHERE organization_id='phase8_org_empty') OR EXISTS (SELECT 1 FROM assignments WHERE organization_id='phase8_org_empty') OR EXISTS (SELECT 1 FROM live_sessions WHERE organization_id='phase8_org_empty') THEN RAISE EXCEPTION 'EMPTY_ORG_READY contains curriculum state'; END IF;
END $$;
`;

const masterFixture = process.argv.includes("--phase9-master-fixture");
const u6bFixture = process.argv.includes("--u6b-certificate-fixture");
const validationOnly = process.argv.includes("--validate-fixture");
const activeManifest = masterFixture ? phase9MasterManifest : u6bFixture ? u6bCertificateManifest : fixtureManifest;
const activeSeedSql = masterFixture ? `${seedSql}\n${phase9MasterFixtureSql}` : u6bFixture ? `${seedSql}\n${u6bCertificateFixtureSql}` : seedSql;
const activeValidationSql = masterFixture ? phase9MasterValidationSql : fixtureValidationSql;
const manifestPath = join(tempRoot, masterFixture ? "phase9-master-fixture-manifest.json" : u6bFixture ? "u6b-certificate-fixture-manifest.json" : "phase8-fixture-manifest.json");

try {
  stage = "creating disposable PostgreSQL";
  pgPort = await unusedPort();
  pgData = join(tempRoot, "postgres");
  await run("initdb", ["-D", pgData, "-A", "trust", "-U", "postgres"], { label: "initdb" });
  const pg = command("pg_ctl", ["-D", pgData, "-o", `-p ${pgPort} -h 127.0.0.1`, "-w", "start"], { label: "postgres" });
  await new Promise((resolve, reject) => { pg.once("error", reject); setTimeout(resolve, 1000); });
  databaseUrl = `postgres://postgres@127.0.0.1:${pgPort}/${database}`;
  await run("createdb", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", database], { label: "createdb" });
  stage = "replaying migrations";
  await run("npm", ["run", "db:migrate"], { cwd: apiRoot, label: "migrate", env: { DATABASE_URL: databaseUrl } });
  stage = "seeding acceptance fixture";
  await run("psql", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", "-c", activeSeedSql], { label: "seed" });
  await writeFile(manifestPath, `${JSON.stringify(activeManifest, null, 2)}\n`, "utf8");
  if (process.env.SHS_PHASE8_ACCEPTANCE_FORCE_FAILURE === "1") {
    stage = "intentional failure cleanup check";
    throw new Error("intentional acceptance harness failure");
  }
  stage = "checking fixture";
  await run("psql", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", "-c", activeValidationSql], { label: "fixture-check" });
  if (masterFixture) {
    console.log("PHASE 9 MASTER FIXTURE READY");
    for (const line of ["LESSON_A_READY", "LESSON_B_READY", "ASSESSMENT_READY", "PRACTICE_READY", "ARCADE_READY", "REFLECTION_READY", "PROJECT_SUBMISSION_READY", "LIVE_READY", "ATTENDANCE_PRECONDITION_READY", "VERIFICATION_PRECONDITION_READY", "COMPLETION_POLICY_READY", "RELEASE_2_READY", "PORTFOLIO_RECONCILIATION_READY", "CAREER_CONNECTION_READY", "STAFF_RECONCILIATION_READY", "REPORT_RECONCILIATION_READY"]) console.log(`${line} = PASS`);
    console.log("INITIAL_COMPLETION_STATE = UNSATISFIED");
    console.log(`Lesson A/B: ${activeManifest.lessonA} -> ${activeManifest.lessonB}`);
    console.log("NEXT_LESSON_A = Lesson B");
    console.log(`Assessment/Practice/Arcade/Reflection: ${activeManifest.assessment} / ${activeManifest.practice} / ${activeManifest.arcadeActivity} / ${activeManifest.reflection}`);
    console.log(`Project/Evidence/Verification: ${activeManifest.project} / ${activeManifest.evidence} / ${activeManifest.verification}`);
    console.log(`Live/Attendance: ${activeManifest.liveSession} / ${activeManifest.joinEvent}`);
    console.log(`Completion requirements: CONTENT, ASSESSMENT, PRACTICE, REFLECTION, ARCADE, PROJECT, LIVE_ATTENDANCE, INSTRUCTOR_VERIFICATION; initial state UNSATISFIED`);
    console.log(`Fixture manifest: ${manifestPath}`);
  } else {
    console.log("PHASE 8 ACCEPTANCE FIXTURE READY");
    for (const line of ["PROJECT_REVIEW_READY", "EVIDENCE_REVIEW_READY", "INSTRUCTOR_VERIFICATION_READY", "ATTENDANCE_READY", "COMPLETION_READY", "INSTRUCTOR_REPORT_READY", "ADMIN_REPORT_READY", "PERMISSION_FIXTURE_READY", "CROSS_ORG_FIXTURE_READY", "ORG_SWITCH_FIXTURE_READY", "EMPTY_ORG_READY"]) console.log(`${line} = PASS`);
    console.log(`Project review ID: ${fixtureManifest.projectReviewA}`);
    console.log(`Evidence review ID: ${fixtureManifest.evidenceReviewA}`);
    console.log(`Instructor verification evidence ID: ${fixtureManifest.verificationA}`);
    console.log(`Attendance session/join: ${fixtureManifest.liveSessionA} / ${fixtureManifest.joinEventA1}`);
    console.log("Completion requirements: CONTENT for LESSON unit-a:lesson-a; initial state UNSATISFIED");
    console.log(`Report metric/key: ${fixtureManifest.metricKey}; initial category: NO_DATA until canonical Truth exists`);
    console.log(`Fixture manifest: ${manifestPath}`);
  }
  if (!(masterFixture && validationOnly)) {
  stage = "starting API";
  const apiPort = await unusedPort();
  const api = command("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(apiPort)], { cwd: apiRoot, label: "api", env: { DATABASE_URL: databaseUrl, PORT: String(apiPort), SHS_AUTH_ENV: "development", SHS_DEV_DATABASE_IDENTITY_ENABLED: "1", SHS_RATE_LIMIT_AUTHENTICATED_USER_MAX: "5000", SHS_RATE_LIMIT_AUTHENTICATED_USER_WINDOW_SECONDS: "60" } });
  await waitFor(`http://127.0.0.1:${apiPort}/health`, api);
  stage = "starting frontend";
  const frontendPort = await unusedPort();
  const frontend = command("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(frontendPort), "--strictPort"], { cwd: frontendRoot, label: "frontend", env: { SHS_VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`, VITE_SHS_API_BASE: `http://127.0.0.1:${apiPort}`, VITE_API_BASE: `http://127.0.0.1:${apiPort}`, VITE_DEV_USER_ID: "instructor_A_authorized", VITE_LIVE_LEARNING_API_BASE: `http://127.0.0.1:${apiPort}` } });
  await waitFor(`http://127.0.0.1:${frontendPort}${frontendReadyPath}`, frontend);
  stage = "readiness assertions";
  const auth = { Authorization: "Bearer dev-token:instructor_A_authorized" };
  const overview = await (await fetch(`http://127.0.0.1:${apiPort}/operations/overview`, { headers: auth })).json();
  const course = await (await fetch(`http://127.0.0.1:${apiPort}/operations/courses/phase8_course_a`, { headers: auth })).json();
  const assignmentResponse = await fetch(`http://127.0.0.1:${apiPort}/assignments/phase8_assignment_a`, { headers: { Authorization: "Bearer dev-token:admin_A" } });
  const assignment = await assignmentResponse.json();
  const admin = await fetch(`http://127.0.0.1:${apiPort}/operations/overview`, { headers: { Authorization: "Bearer dev-token:admin_A" } });
  const learner = await fetch(`http://127.0.0.1:${apiPort}/operations/overview`, { headers: { Authorization: "Bearer dev-token:learner_A1" } });
  const unknown = await fetch(`http://127.0.0.1:${apiPort}/operations/overview`, { headers: { Authorization: "Bearer dev-token:unknown_disposable_identity" } });
  if (!overview.ok || !course.ok || course.data?.course?.course_id !== "phase8_course_a" || !assignment.ok || assignment.data?.id !== "phase8_assignment_a" || !admin.ok || learner.status !== 403 || unknown.status !== 401) {
    throw new Error(`API readiness assertion failed (course=${JSON.stringify(course)}, assignment=${JSON.stringify(assignment)}, admin=${admin.status}, learner=${learner.status}, unknown=${unknown.status})`);
  }
  const orgB = await fetch(`http://127.0.0.1:${apiPort}/operations/courses/phase8_course_a`, { headers: { Authorization: "Bearer dev-token:instructor_B" } });
  if (orgB.status !== 404) throw new Error(`cross-organization readiness assertion failed: ${orgB.status}`);
  console.log("PHASE 8 ACCEPTANCE ENVIRONMENT READY");
  console.log(`Database: ${database}`);
  console.log(`API: http://127.0.0.1:${apiPort}`);
  console.log(`Frontend: http://127.0.0.1:${frontendPort}`);
  console.log("Verified identities: admin_A, instructor_A_authorized, instructor_A_unauthorized, learner_A1, instructor_B, learner_B1");
  console.log("Verified canonical fixture: Course A (phase8_course_a), Release 1 (phase8_release_1), Assignment A (phase8_assignment_a)");
  const handoff = process.argv.slice(2).filter((argument) => argument !== "--validate-fixture" && argument !== "--phase9-master-fixture" && argument !== "--u6b-certificate-fixture");
  if (handoff.length) {
    const handoffKind = process.env.SHS_ACCEPTANCE_HANDOFF_KIND || "playwright";
    if (handoffKind === "api-test") {
      stage = "API test handoff";
      await run("npx", ["tsx", "--test", ...handoff], { cwd: apiRoot, env: { DATABASE_URL: databaseUrl, SHS_TEST_DATABASE_URL: databaseUrl, SHS_API_TEST_BASE_URL: `http://127.0.0.1:${apiPort}` }, label: "api-test" });
    } else if (handoffKind === "api-command") {
      stage = "API command handoff";
      await run("npx", ["tsx", ...handoff], { cwd: apiRoot, env: { DATABASE_URL: databaseUrl, SHS_TEST_DATABASE_URL: databaseUrl, SHS_API_TEST_BASE_URL: `http://127.0.0.1:${apiPort}` }, label: "api-command" });
    } else {
      stage = "Playwright handoff";
      await run("npx", ["playwright", "test", ...handoff], { env: { SHS_TEST_FRONTEND_URL: `http://127.0.0.1:${frontendPort}`, SHS_TEST_API_URL: `http://127.0.0.1:${apiPort}`, SHS_TEST_DATABASE_URL: databaseUrl, SHS_PHASE8_FIXTURE_MANIFEST: manifestPath, VITE_DEV_USER_ID: "instructor_A_authorized" }, label: "playwright" });
    }
  }
  }
  await cleanup();
} catch (error) {
  await fail(error);
}
