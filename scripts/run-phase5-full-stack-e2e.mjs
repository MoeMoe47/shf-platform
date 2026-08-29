import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { createRequire } from "node:module";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const apiRoot = join(root, "apps/shs-api");
const tempRoot = await mkdtemp(join(tmpdir(), "shs-phase5-"));
const children = [];
let pgPort;
let apiPort;
let frontendPort;
let pgData;
let pgStarted = false;
let receiver;
let assertionPool;
let apiPool;
const receivedEvents = [];
const completionLessons = JSON.parse(process.env.SHS_TEST_COMPLETION_LESSONS || process.env.SHS_TEST_GRADE6_COMPLETION_LESSONS || JSON.stringify([
  "data-center-foundations-digital-world",
  "data-center-foundations-electricity",
  "data-center-foundations-design-project",
]));
const completionCurriculum = process.env.SHS_TEST_COMPLETION_CURRICULUM || "data-center-foundations";
const browserSpec = process.env.SHS_TEST_BROWSER_SPEC || "tests/ui/phase5-full-stack.spec.mjs";
const phase18 = browserSpec.includes("phase18");
const phase19 = browserSpec.includes("phase19");
const phase20 = browserSpec.includes("phase20");
const phase20b = browserSpec.includes("phase20b");
const phase21 = browserSpec.includes("phase21");
const phase22 = browserSpec.includes("phase22");
const phase23 = browserSpec.includes("phase23");
const phase24 = browserSpec.includes("phase24");
const phase25 = browserSpec.includes("phase25");
const phase26 = browserSpec.includes("phase26");
const phase27 = browserSpec.includes("phase27");
const phase28 = browserSpec.includes("phase28");
  const phase31 = browserSpec.includes("phase31");
const phase32 = browserSpec.includes("phase32");
const phase33 = browserSpec.includes("phase33");
const phase34 = browserSpec.includes("phase34");
const phase35 = browserSpec.includes("phase35");
const phase36 = browserSpec.includes("phase36");
const phase37 = browserSpec.includes("phase37");
const phase38 = browserSpec.includes("phase38");
const phase40 = browserSpec.includes("phase40");
const phase41 = browserSpec.includes("phase41");
const phase42 = browserSpec.includes("phase42");
const phase43 = browserSpec.includes("phase43");
const phase43a = browserSpec.includes("phase43a");
const phase43b = browserSpec.includes("phase43b");
const testGrep = process.env.SHS_TEST_GREP;
if (!Array.isArray(completionLessons) || completionLessons.length === 0 || completionLessons.some((id) => typeof id !== "string" || !id)) {
  throw new Error("SHS_TEST_COMPLETION_LESSONS must be a non-empty JSON array of lesson IDs");
}

function command(name, args, options = {}) {
  const child = spawn(name, args, { cwd: options.cwd || root, env: { ...process.env, ...options.env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  child.stdout.on("data", (chunk) => process.stdout.write(`[${options.label || name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${options.label || name}] ${chunk}`));
  return child;
}

function run(name, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = command(name, args, options);
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`${name} exited ${code ?? signal}`)));
  });
}

async function unusedPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function waitFor(url, child, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) throw new Error(`Process exited before readiness: ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startHttpProcess(name, args, options, healthPath) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const port = await unusedPort();
    const child = command(name, args(port), { ...options, env: { ...options.env, PORT: String(port) } });
    try {
      await waitFor(`http://127.0.0.1:${port}${healthPath}`, child);
      return { child, port };
    } catch (error) {
      await stop(child);
      if (attempt === 4) throw error;
    }
  }
  throw new Error(`${name} did not start`);
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    const timer = setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 5_000);
    child.once("exit", () => { clearTimeout(timer); resolve(); });
  });
}

async function cleanup() {
  if (receiver) await new Promise((resolve) => receiver.close(resolve));
  if (assertionPool) await assertionPool.end().catch(() => {});
  if (apiPool) await apiPool.end().catch(() => {});
  for (const child of [...children].reverse()) await stop(child);
  if (pgStarted) {
    await run("pg_ctl", ["-D", pgData, "-m", "fast", "stop"], { label: "postgres-stop" }).catch(() => {});
    pgStarted = false;
  }
  await rm(tempRoot, { recursive: true, force: true });
}

process.once("SIGINT", async () => { await cleanup(); process.exit(130); });
process.once("SIGTERM", async () => { await cleanup(); process.exit(143); });

try {
  pgPort = await unusedPort();
  apiPort = await unusedPort();
  frontendPort = await unusedPort();
  pgData = join(tempRoot, "postgres");
  await run("initdb", ["-D", pgData, "-A", "trust", "-U", "postgres"], { label: "initdb" });
  pgStarted = true;
  command("pg_ctl", ["-D", pgData, "-o", `-p ${pgPort} -h 127.0.0.1`, "-w", "start"], { label: "postgres" });
  let postgresReady = false;
  for (let attempt = 0; attempt < 60 && !postgresReady; attempt += 1) {
    try {
      await run("psql", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", "-d", "postgres", "-c", "SELECT 1"], { label: "psql" });
      postgresReady = true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  if (!postgresReady) throw new Error("PostgreSQL did not become ready");
  const databaseUrl = `postgres://postgres@127.0.0.1:${pgPort}/postgres`;
  await run("npm", ["run", "db:migrate"], { cwd: apiRoot, label: "migrate", env: { DATABASE_URL: databaseUrl } });
  await run("psql", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", "-d", "postgres", "-c", "INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ('shs-core','Silicon Heartland Foundation','Silicon Heartland Foundation','SHF','active') ON CONFLICT DO NOTHING;"], { label: "seed-org" });
  await run("psql", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", "-d", "postgres", "-c", "INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ('demo-user-1','shs-core','admin@shs.local','SHS Admin','active','test') ON CONFLICT DO NOTHING;"], { label: "seed-user" });
  if (phase18 || phase19 || phase20 || phase20b || phase21 || phase22 || phase23 || phase24 || phase25 || phase26 || phase27 || phase28 || phase31 || phase32 || phase33 || phase34 || phase35 || phase36 || phase37 || phase38 || phase40 || phase41 || phase42 || phase43 || phase43a || phase43b) {
    await run("psql", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", "-d", "postgres", "-c", "INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ('org_shf_001','Silicon Heartland Foundation','Silicon Heartland Foundation','SHF','active'),('org_other','Other Test Organization','Other Test Organization','Partner','active') ON CONFLICT DO NOTHING; INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ('user_admin_001','org_shf_001','admin@siliconheartland.org','SHF Program Administrator','active','test'),('user_student_001','org_shf_001','student@siliconheartland.org','SHF Demo Student','active','test'),('user_no_assignment_001','org_shf_001','no-assignment@test.invalid','No Assignment Learner','active','test'),('user_reviewer_001','org_shf_001','reviewer@siliconheartland.org','SHF Proof Reviewer','active','test'),('user_operator_001','org_shf_001','operator@siliconheartland.org','SHF Operator','active','test'),('user_assignment_technical_001','org_shf_001','technical@test.invalid','Technical Learner','active','test'),('user_assignment_networking_001','org_shf_001','networking@test.invalid','Networking Learner','active','test'),('user_assignment_electrical_001','org_shf_001','electrical@test.invalid','Electrical Learner','active','test'),('user_assignment_mechanical_001','org_shf_001','mechanical@test.invalid','Mechanical Learner','active','test'),('user_assignment_security_001','org_shf_001','security@test.invalid','Security Learner','active','test'),('user_assignment_ai_001','org_shf_001','ai@test.invalid','AI Learner','active','test') ON CONFLICT DO NOTHING; INSERT INTO programs (program_id, organization_id, name, program_type, status, created_by_user_id) VALUES ('data-center-specialization-11','org_shf_001','Data Center Grade 11','curriculum','active','user_admin_001') ON CONFLICT DO NOTHING;"], { label: "seed-phase18-identities" });
  }
  if (phase43b) {
    await run("psql", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", "-d", "postgres", "-c", "INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ('user_phase43b_staff_001','org_shf_001','phase43b-staff@test.invalid','Phase 43B Staff','active','test'),('user_phase43b_course_001','org_shf_001','phase43b-course@test.invalid','Phase 43B Course Assigner','active','test'),('user_phase43b_manager_001','org_shf_001','phase43b-manager@test.invalid','Phase 43B Project Manager','active','test'),('user_phase43b_project_reviewer_001','org_shf_001','phase43b-project-reviewer@test.invalid','Phase 43B Project Reviewer','active','test'),('user_phase43b_competency_reviewer_001','org_shf_001','phase43b-competency-reviewer@test.invalid','Phase 43B Competency Reviewer','active','test'),('user_phase43b_academic_001','org_shf_001','phase43b-academic@test.invalid','Phase 43B Academic Actor','active','test') ON CONFLICT DO NOTHING;"], { label: "seed-phase43b-identities" });
  }
  if (phase32 || phase36 || phase37 || phase38 || phase40 || phase41 || phase42 || phase43) {
    await run("psql", ["-h", "127.0.0.1", "-p", String(pgPort), "-U", "postgres", "-d", "postgres", "-c", "INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ('user_other_admin_001','org_other','admin@other.test','Other Organization Program Staff','active','test'),('user_employer_001','org_shf_001','employer@partner.test','Partner Organization Member','active','test') ON CONFLICT DO NOTHING;"], { label: "seed-phase32-identities" });
  }
  const api = await startHttpProcess("node", (port) => ["--import", "tsx", "src/server.ts"], { cwd: apiRoot, label: "api", env: { DATABASE_URL: databaseUrl, SHS_AUTH_ENV: "development", AUTH_DEMO_IDENTITY_ENABLED: "1", SHS_RATE_LIMIT_AUTHENTICATED_USER_MAX: "1000", SHS_RATE_LIMIT_AUTHENTICATED_USER_WINDOW_SECONDS: "60" } }, "/health");
  apiPort = api.port;
  receiver = createHttpServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/shf/internal/ingestion/events") { res.statusCode = 404; return res.end(); }
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => { receivedEvents.push(JSON.parse(body)); res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ ok: true, event_id: `accepted-${receivedEvents.length}` })); });
  });
  await new Promise((resolve) => receiver.listen(0, "127.0.0.1", resolve));
  const receiverPort = receiver.address().port;
  const frontend = await startHttpProcess("npm", (port) => ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { label: "frontend", env: { VITE_API_BASE: `http://127.0.0.1:${apiPort}`, SHS_VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` } }, "/career.html");
  frontendPort = frontend.port;
  await run("npx", ["playwright", "test", browserSpec, "--reporter=line", ...(testGrep ? ["--grep", testGrep] : [])], { label: "playwright", env: { SHS_TEST_FRONTEND_URL: `http://127.0.0.1:${frontendPort}`, SHS_TEST_API_URL: `http://127.0.0.1:${apiPort}`, ...(phase43a || phase43b ? { SHS_TEST_DATABASE_URL: databaseUrl } : {}), SHS_TEST_COMPLETION_LESSONS: JSON.stringify(completionLessons), SHS_TEST_COMPLETION_CURRICULUM: completionCurriculum, SHS_TEST_GRADE6_COMPLETION_LESSONS: JSON.stringify(completionLessons) } });
  const { Pool } = createRequire(join(apiRoot, "package.json"))("pg");
  assertionPool = new Pool({ connectionString: databaseUrl });
  const counts = await assertionPool.query(
    `SELECT lesson_id,
       (SELECT COUNT(*) FROM curriculum_lesson_completions c WHERE c.lesson_id = lessons.lesson_id AND c.curriculum_id = $2) AS completions,
       (SELECT COUNT(*) FROM integration_outbox o WHERE o.event_type='lesson.completed' AND o.subject_id = lessons.lesson_id AND o.payload_json->'payload'->>'curriculum' = $2) AS outbox
     FROM unnest($1::text[]) AS lessons(lesson_id)
     ORDER BY lesson_id`,
    [completionLessons, completionCurriculum],
  );
  if (!phase18 && !phase19 && !phase20 && !phase20b && !phase21 && !phase22 && !phase23 && !phase24 && !phase25 && !phase26 && !phase27 && !phase28 && !phase31 && !phase32 && !phase33 && !phase34 && !phase35 && !phase36 && !phase37 && !phase38 && !phase40 && !phase41 && !phase42 && !phase43 && counts.rows.some((row) => row.completions !== "1" || row.outbox !== "1")) throw new Error(`Unexpected institutional counts: ${JSON.stringify(counts.rows)}`);
  if (phase18 || phase20b || phase21 || phase22 || phase23 || phase24 || phase28) {
    const proof = await assertionPool.query(
      `SELECT
         (SELECT COUNT(*) FROM prepare_prove_activity_results WHERE activity_id ${phase28 ? "IN ('grade11-networking-fiber-topology-interpretation','grade11-networking-fiber-connectivity-troubleshooting','grade11-networking-fiber-cabling-documentation','grade11-networking-fiber-connectivity-troubleshooting-reassessment')" : phase24 ? "IN ('grade11-ai-cloud-workload-analysis','grade11-ai-cloud-capacity-bottleneck-analysis','grade11-ai-cloud-reliability-operations-analysis','grade11-ai-cloud-reliability-operations-analysis-reassessment')" : phase23 ? "IN ('grade11-security-access-control-analysis','grade11-security-log-alert-interpretation','grade11-security-incident-documentation-escalation','grade11-security-incident-documentation-escalation-reassessment')" : phase22 ? "IN ('grade11-mechanical-hvac-thermal-airflow-interpretation','grade11-mechanical-hvac-cooling-capacity-reliability','grade11-mechanical-hvac-cooling-incident-analysis','grade11-mechanical-hvac-cooling-incident-analysis-reassessment')" : phase21 ? "IN ('grade11-electrical-power-path-interpretation','grade11-electrical-load-capacity-reasoning','grade11-electrical-infrastructure-incident-analysis','grade11-electrical-infrastructure-incident-analysis-reassessment')" : phase20b ? "IN ('grade11-networking-fiber-connectivity-troubleshooting','grade11-networking-fiber-connectivity-troubleshooting-reassessment')" : "= 'grade11-technical-operations-monitoring-proof'"} AND organization_id='org_shf_001') AS results,
         (SELECT COUNT(*) FROM prepare_prove_evidence WHERE organization_id='org_shf_001') AS evidence,
         (SELECT COUNT(*) FROM learner_competency_decisions WHERE organization_id='org_shf_001') AS decisions,
         (SELECT COUNT(*) FROM integration_outbox WHERE organization_id='org_shf_001' AND event_type='competency.reviewed') AS competency_events`,
    );
    const row = proof.rows[0];
    const expectedProofCount = phase28 ? "4" : phase24 ? "4" : phase23 ? "4" : phase22 ? "4" : phase21 ? "4" : phase20b ? "2" : phase20 ? "3" : phase19 ? "3" : "1";
    const expectedEvidenceCount = phase28 ? "20" : phase24 ? "4" : phase23 ? "4" : phase22 ? "4" : phase21 ? "4" : phase20b ? "2" : phase20 ? "3" : phase19 ? "3" : "2";
    const expectedDecisionCount = phase28 ? "20" : expectedEvidenceCount;
    if (row.results !== expectedProofCount || row.evidence !== expectedEvidenceCount || row.decisions !== expectedDecisionCount || row.competency_events !== expectedDecisionCount) {
      throw new Error(`Unexpected Phase 18 proof counts: ${JSON.stringify(row)}`);
    }
    if (phase28) {
      const history = await assertionPool.query(`SELECT r.activity_id, d.decision FROM learner_competency_decisions d JOIN prepare_prove_evidence e ON e.evidence_id=d.evidence_id JOIN prepare_prove_activity_results r ON r.result_id=e.source_record_id WHERE d.organization_id='org_shf_001' AND r.activity_id IN ('grade11-networking-fiber-connectivity-troubleshooting','grade11-networking-fiber-connectivity-troubleshooting-reassessment') ORDER BY r.activity_id`);
      const expectedHistory = [{ activity_id: "grade11-networking-fiber-connectivity-troubleshooting", decision: "EVIDENCE_INSUFFICIENT" }, { activity_id: "grade11-networking-fiber-connectivity-troubleshooting-reassessment", decision: "DEMONSTRATED" }];
      if (JSON.stringify(history.rows) !== JSON.stringify(expectedHistory)) throw new Error(`Unexpected Phase 28 decision history: ${JSON.stringify(history.rows)}`);
      console.log(`[phase28] decision history ${JSON.stringify(history.rows)}`);
    } else if (phase20b) {
      const history = await assertionPool.query(`SELECT r.activity_id, d.decision FROM learner_competency_decisions d JOIN prepare_prove_evidence e ON e.evidence_id=d.evidence_id JOIN prepare_prove_activity_results r ON r.result_id=e.source_record_id WHERE d.organization_id='org_shf_001' AND r.activity_id IN ('grade11-networking-fiber-connectivity-troubleshooting','grade11-networking-fiber-connectivity-troubleshooting-reassessment') ORDER BY r.activity_id`);
      const expectedHistory = [
        { activity_id: "grade11-networking-fiber-connectivity-troubleshooting", decision: "EVIDENCE_INSUFFICIENT" },
        { activity_id: "grade11-networking-fiber-connectivity-troubleshooting-reassessment", decision: "DEMONSTRATED" },
      ];
      if (JSON.stringify(history.rows) !== JSON.stringify(expectedHistory)) throw new Error(`Unexpected Networking decision history: ${JSON.stringify(history.rows)}`);
      console.log(`[phase20b] decision history ${JSON.stringify(history.rows)}`);
    }
    if (phase21) {
      const history = await assertionPool.query(`SELECT r.activity_id, d.decision FROM learner_competency_decisions d JOIN prepare_prove_evidence e ON e.evidence_id=d.evidence_id JOIN prepare_prove_activity_results r ON r.result_id=e.source_record_id WHERE d.organization_id='org_shf_001' AND r.activity_id IN ('grade11-electrical-infrastructure-incident-analysis','grade11-electrical-infrastructure-incident-analysis-reassessment') ORDER BY r.activity_id`);
      const expectedHistory = [{ activity_id: "grade11-electrical-infrastructure-incident-analysis", decision: "EVIDENCE_INSUFFICIENT" }, { activity_id: "grade11-electrical-infrastructure-incident-analysis-reassessment", decision: "DEMONSTRATED" }];
      if (JSON.stringify(history.rows) !== JSON.stringify(expectedHistory)) throw new Error(`Unexpected Electrical decision history: ${JSON.stringify(history.rows)}`);
      console.log(`[phase21] decision history ${JSON.stringify(history.rows)}`);
    }
    if (phase22) {
      const history = await assertionPool.query(`SELECT r.activity_id, d.decision FROM learner_competency_decisions d JOIN prepare_prove_evidence e ON e.evidence_id=d.evidence_id JOIN prepare_prove_activity_results r ON r.result_id=e.source_record_id WHERE d.organization_id='org_shf_001' AND r.activity_id IN ('grade11-mechanical-hvac-cooling-incident-analysis','grade11-mechanical-hvac-cooling-incident-analysis-reassessment') ORDER BY r.activity_id`);
      const expectedHistory = [{ activity_id: "grade11-mechanical-hvac-cooling-incident-analysis", decision: "EVIDENCE_INSUFFICIENT" }, { activity_id: "grade11-mechanical-hvac-cooling-incident-analysis-reassessment", decision: "DEMONSTRATED" }];
      if (JSON.stringify(history.rows) !== JSON.stringify(expectedHistory)) throw new Error(`Unexpected Mechanical/HVAC decision history: ${JSON.stringify(history.rows)}`);
      console.log(`[phase22] decision history ${JSON.stringify(history.rows)}`);
    }
    if (phase23) {
      const history = await assertionPool.query(`SELECT r.activity_id, d.decision FROM learner_competency_decisions d JOIN prepare_prove_evidence e ON e.evidence_id=d.evidence_id JOIN prepare_prove_activity_results r ON r.result_id=e.source_record_id WHERE d.organization_id='org_shf_001' AND r.activity_id IN ('grade11-security-incident-documentation-escalation','grade11-security-incident-documentation-escalation-reassessment') ORDER BY r.activity_id`);
      const expectedHistory = [{ activity_id: "grade11-security-incident-documentation-escalation", decision: "EVIDENCE_INSUFFICIENT" }, { activity_id: "grade11-security-incident-documentation-escalation-reassessment", decision: "DEMONSTRATED" }];
      if (JSON.stringify(history.rows) !== JSON.stringify(expectedHistory)) throw new Error(`Unexpected Security decision history: ${JSON.stringify(history.rows)}`);
      console.log(`[phase23] decision history ${JSON.stringify(history.rows)}`);
    }
    if (phase24) {
      const history = await assertionPool.query(`SELECT r.activity_id, d.decision FROM learner_competency_decisions d JOIN prepare_prove_evidence e ON e.evidence_id=d.evidence_id JOIN prepare_prove_activity_results r ON r.result_id=e.source_record_id WHERE d.organization_id='org_shf_001' AND r.activity_id IN ('grade11-ai-cloud-reliability-operations-analysis','grade11-ai-cloud-reliability-operations-analysis-reassessment') ORDER BY r.activity_id`);
      const expectedHistory = [{ activity_id: "grade11-ai-cloud-reliability-operations-analysis", decision: "EVIDENCE_INSUFFICIENT" }, { activity_id: "grade11-ai-cloud-reliability-operations-analysis-reassessment", decision: "DEMONSTRATED" }];
      if (JSON.stringify(history.rows) !== JSON.stringify(expectedHistory)) throw new Error(`Unexpected AI/Cloud decision history: ${JSON.stringify(history.rows)}`);
      console.log(`[phase24] decision history ${JSON.stringify(history.rows)}`);
    }
    console.log(`[phase18] proof counts ${JSON.stringify(row)}`);
  }
  process.env.DATABASE_URL = databaseUrl;
  process.env.SHF_AGENT_FABRIC_INTERNAL_URL = `http://127.0.0.1:${receiverPort}`;
  process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID = "phase5";
  process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = JSON.stringify({ phase5: "phase5-disposable-secret" });
  const expectedDelivered = phase31 ? Number(process.env.SHS_EXPECTED_DELIVERED || 0) : phase40 || phase41 || phase42 || phase43 ? 0 : phase38 ? 17 : phase37 ? 17 : phase36 ? 17 : phase35 ? 17 : phase34 ? 17 : phase33 ? 17 : phase32 ? 12 : phase25 || phase26 ? 0 : phase28 ? 76 : phase27 ? 20 : phase24 ? 4 : phase23 ? 4 : phase22 ? 4 : phase21 ? 4 : phase20b ? 2 : phase20 ? 3 : phase19 ? 3 : phase18 ? 2 : completionLessons.length;
  const dispatchLimit = phase28 || phase31 || phase32 || phase33 || phase34 || phase35 || phase36 || phase37 || phase38 || phase40 || phase41 || phase42 || phase43 ? 200 : 20;
  const dispatchScript = `(async () => { const { dispatchPendingIntegrationEvents } = await import('./src/domain/trusted-reporting/dispatcher.ts'); const result = await dispatchPendingIntegrationEvents({ limit: ${dispatchLimit}, workerId: '${phase18 ? "phase18-test-worker" : "phase5-test-worker"}', config: { requestTimeoutMs: 2000 } }); if (!${phase40 || phase41 || phase42 || phase43 ? "true" : "false"} && result.filter((item) => item.status === 'DELIVERED').length !== Number(process.env.SHS_EXPECTED_DELIVERED)) process.exit(1); console.log(JSON.stringify(result)); })();`;
  await run("npx", ["tsx", "-e", dispatchScript], { cwd: apiRoot, label: "trusted-reporting-dispatch", env: { DATABASE_URL: databaseUrl, SHF_AGENT_FABRIC_INTERNAL_URL: `http://127.0.0.1:${receiverPort}`, SHF_INTERNAL_SERVICE_ACTIVE_KID: "phase5", SHF_INTERNAL_SERVICE_KEYS_JSON: JSON.stringify({ phase5: "phase5-disposable-secret" }), SHS_EXPECTED_DELIVERED: String(expectedDelivered) } });
  if (!phase40 && !phase41 && !phase42 && !phase43 && receivedEvents.length !== expectedDelivered) throw new Error(`Reporting dispatch was not accepted: ${JSON.stringify({ receivedEvents })}`);
  await assertionPool.end();
  assertionPool = null;
  console.log(JSON.stringify({ ports: { postgres: pgPort, api: apiPort, frontend: frontendPort }, curriculum: completionCurriculum, lessons: completionLessons, completion: counts.rows, reportingDelivered: receivedEvents.length }));
} finally {
  await cleanup();
}
