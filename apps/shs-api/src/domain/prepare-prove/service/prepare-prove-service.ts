import { createHash } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { query } from "../../../db/client.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";

const PROOF_ACTIVITY_TYPE = "SIMULATED_INFRASTRUCTURE_PROOF";
const PROOF_ACTIVITY_ID = "grade11-technical-operations-monitoring-proof";
const PROOF_COMPETENCY_SLUG = "interpret-monitoring-data-and-document-safe-finding";
const GRADE12_PROOF_ACTIVITY_ID = "grade12-technical-operations-multi-system-operations-analysis";
const GRADE12_COURSE_BY_DOMAIN: Record<string, string> = {
  "technical-operations": "data-center-technical-operations-12",
  "networking-fiber": "data-center-networking-fiber-12",
  "electrical-infrastructure": "data-center-electrical-infrastructure-12",
  "mechanical-hvac": "data-center-mechanical-hvac-12",
  "cybersecurity-security": "data-center-cybersecurity-security-12",
  "ai-cloud-infrastructure": "data-center-ai-cloud-infrastructure-12",
};
const PROOF_CONFIGS: Record<string, { slug: string; activityType: string; domain: string; title: string; description: string; criteria: string[] }> = {
  "grade11-technical-operations-monitoring-proof": { slug: PROOF_COMPETENCY_SLUG, activityType: PROOF_ACTIVITY_TYPE, domain: "technical-operations", title: "Interpret monitoring data and document a safe technical finding", description: "Interpret synthetic infrastructure observations, distinguish evidence from assumptions, identify an affected system, and recommend a safe escalation or next step.", criteria: ["records observations accurately", "identifies a plausible affected system", "separates evidence from uncertainty", "recommends a safe next step"] },
  "grade11-technical-operations-linux-inspection": { slug: "inspect-linux-system-state-safely", activityType: PROOF_ACTIVITY_TYPE, domain: "technical-operations", title: "Inspect Linux system state safely", description: "Use an approved sandbox observation to identify relevant system state and document it without unsafe changes.", criteria: ["uses approved inspection evidence", "identifies relevant system state", "avoids unsupported conclusions", "documents a safe next step"] },
  "grade11-technical-operations-troubleshooting-documentation": { slug: "document-structured-infrastructure-troubleshooting", activityType: PROOF_ACTIVITY_TYPE, domain: "technical-operations", title: "Document structured infrastructure troubleshooting", description: "Use synthetic evidence to identify a likely subsystem, select a low-risk action, verify the result, and document escalation.", criteria: ["defines the symptom", "uses relevant evidence", "selects a low-risk action", "documents verification or escalation"] },
  "grade11-networking-fiber-topology-interpretation": { slug: "interpret-network-topology", activityType: PROOF_ACTIVITY_TYPE, domain: "networking-fiber", title: "Interpret a synthetic network topology", description: "Trace a synthetic network path, identify dependencies, and document evidence without claiming unsupported network access.", criteria: ["identifies major devices and relevant path", "uses topology and status evidence", "distinguishes observation from assumption", "documents safe escalation and uncertainty"] },
  "grade11-networking-fiber-connectivity-troubleshooting": { slug: "network-connectivity-troubleshooting", activityType: PROOF_ACTIVITY_TYPE, domain: "networking-fiber", title: "Troubleshoot a simulated network connectivity fault", description: "Use synthetic topology and connectivity evidence to identify a reasonable fault domain and recommend a safe next action.", criteria: ["confirms the reported symptom", "uses relevant topology and connectivity evidence", "identifies a reasonable fault domain", "recommends a safe next action and escalation"] },
  "grade11-networking-fiber-connectivity-troubleshooting-reassessment": { slug: "network-connectivity-troubleshooting", activityType: PROOF_ACTIVITY_TYPE, domain: "networking-fiber", title: "Troubleshoot a simulated network connectivity fault", description: "Use synthetic topology and connectivity evidence to identify a reasonable fault domain and recommend a safe next action.", criteria: ["confirms the reported symptom", "uses relevant topology and connectivity evidence", "identifies a reasonable fault domain", "recommends a safe next action and escalation"] },
  "grade11-networking-fiber-cabling-documentation": { slug: "structured-cabling-fiber-documentation", activityType: PROOF_ACTIVITY_TYPE, domain: "networking-fiber", title: "Document structured cabling and fiber safely", description: "Interpret synthetic source, destination, port, and fiber records and identify when qualified handling is required.", criteria: ["interprets source and destination correctly", "identifies relevant labels and ports", "documents the path accurately", "respects live-fiber safety and escalation"] },
  "grade11-electrical-power-path-interpretation": { slug: "electrical-power-path-interpretation", activityType: PROOF_ACTIVITY_TYPE, domain: "electrical-infrastructure", title: "Interpret a synthetic electrical power path", description: "Trace a simplified power path, identify dependencies and redundancy, and document assumptions without performing electrical work.", criteria: ["traces the modeled power path", "identifies dependencies and redundancy", "distinguishes evidence from assumptions", "communicates clearly and safely"] },
  "grade11-electrical-load-capacity-reasoning": { slug: "electrical-load-capacity-reasoning", activityType: PROOF_ACTIVITY_TYPE, domain: "electrical-infrastructure", title: "Reason about synthetic load and capacity", description: "Calculate modeled power, compare load with stated capacity, and document units and assumptions safely.", criteria: ["uses the correct formula", "handles units correctly", "compares modeled load with capacity", "states assumptions and implications"] },
  "grade11-electrical-infrastructure-incident-analysis": { slug: "electrical-infrastructure-incident-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "electrical-infrastructure", title: "Analyze a simulated electrical infrastructure incident", description: "Interpret synthetic power telemetry, respect safety boundaries, identify an affected path, and document escalation.", criteria: ["identifies observed condition", "interprets relevant monitoring", "avoids unsafe action and chooses escalation", "documents affected path and uncertainty"] },
  "grade11-electrical-infrastructure-incident-analysis-reassessment": { slug: "electrical-infrastructure-incident-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "electrical-infrastructure", title: "Analyze a simulated electrical infrastructure incident", description: "Interpret synthetic power telemetry, respect safety boundaries, identify an affected path, and document escalation.", criteria: ["identifies observed condition", "interprets relevant monitoring", "avoids unsafe action and chooses escalation", "documents affected path and uncertainty"] },
  "grade11-mechanical-hvac-thermal-airflow-interpretation": { slug: "mechanical-hvac-thermal-airflow-interpretation", activityType: PROOF_ACTIVITY_TYPE, domain: "mechanical-hvac", title: "Interpret synthetic thermal and airflow evidence", description: "Interpret modeled temperatures and airflow clues, distinguish evidence from assumptions, and document a safe escalation.", criteria: ["identifies intake and exhaust relationships", "uses relevant temperature and airflow evidence", "distinguishes evidence from assumption", "communicates a safe escalation"] },
  "grade11-mechanical-hvac-cooling-capacity-reliability": { slug: "mechanical-hvac-cooling-capacity-reliability", activityType: PROOF_ACTIVITY_TYPE, domain: "mechanical-hvac", title: "Reason about synthetic cooling capacity and reliability", description: "Compare modeled thermal load and cooling capacity, interpret redundancy, and state assumptions safely.", criteria: ["compares modeled load and capacity", "interprets redundancy evidence", "states assumptions", "explains safe operational implications"] },
  "grade11-mechanical-hvac-cooling-incident-analysis": { slug: "mechanical-hvac-cooling-incident-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "mechanical-hvac", title: "Analyze a simulated cooling incident", description: "Interpret synthetic environmental telemetry, recognize uncertainty and professional boundaries, and document safe escalation.", criteria: ["uses relevant telemetry and trend evidence", "identifies an affected thermal domain", "recognizes sensor and causal uncertainty", "avoids professional service and escalates safely", "documents findings clearly"] },
  "grade11-mechanical-hvac-cooling-incident-analysis-reassessment": { slug: "mechanical-hvac-cooling-incident-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "mechanical-hvac", title: "Analyze a simulated cooling incident", description: "Interpret synthetic environmental telemetry, recognize uncertainty and professional boundaries, and document safe escalation.", criteria: ["uses relevant telemetry and trend evidence", "identifies an affected thermal domain", "recognizes sensor and causal uncertainty", "avoids professional service and escalates safely", "documents findings clearly"] },
  "grade11-security-access-control-analysis": { slug: "security-access-control-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "cybersecurity-security", title: "Analyze synthetic access control", description: "Interpret synthetic identities, roles, and permissions using least-privilege and authorization reasoning.", criteria: ["distinguishes authentication and authorization", "identifies excessive or missing access", "applies least-privilege reasoning", "avoids unauthorized action and documents a recommendation"] },
  "grade11-security-log-alert-interpretation": { slug: "security-log-alert-interpretation", activityType: PROOF_ACTIVITY_TYPE, domain: "cybersecurity-security", title: "Interpret synthetic security logs and alerts", description: "Correlate synthetic security events while distinguishing observations from unsupported conclusions.", criteria: ["identifies relevant events and timestamps", "correlates evidence appropriately", "distinguishes event from confirmed incident", "preserves uncertainty and communicates clearly"] },
  "grade11-security-incident-documentation-escalation": { slug: "security-incident-documentation-escalation", activityType: PROOF_ACTIVITY_TYPE, domain: "cybersecurity-security", title: "Document and escalate a simulated security incident", description: "Correlate synthetic cyber and physical evidence, preserve uncertainty, and recommend authorized escalation.", criteria: ["records known facts accurately", "references relevant evidence and timestamps", "preserves uncertainty and evidence", "chooses authorized next steps and escalation", "documents clearly without unsupported accusation"] },
  "grade11-security-incident-documentation-escalation-reassessment": { slug: "security-incident-documentation-escalation", activityType: PROOF_ACTIVITY_TYPE, domain: "cybersecurity-security", title: "Document and escalate a simulated security incident", description: "Correlate synthetic cyber and physical evidence, preserve uncertainty, and recommend authorized escalation.", criteria: ["records known facts accurately", "references relevant evidence and timestamps", "preserves uncertainty and evidence", "chooses authorized next steps and escalation", "documents clearly without unsupported accusation"] },
  "grade11-ai-cloud-workload-analysis": { slug: "ai-cloud-workload-infrastructure-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "ai-cloud-infrastructure", title: "Analyze AI/cloud workload infrastructure requirements", description: "Map synthetic workload requirements to compute, memory, storage, networking, power, and cooling considerations without unsupported assumptions.", criteria: ["identifies major workload requirements", "distinguishes CPU and GPU roles appropriately", "includes memory, storage, and network needs", "states power/cooling implications and uncertainty"] },
  "grade11-ai-cloud-capacity-bottleneck-analysis": { slug: "ai-cloud-capacity-bottleneck-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "ai-cloud-infrastructure", title: "Analyze AI/cloud resource capacity and bottlenecks", description: "Interpret multi-domain synthetic telemetry and identify a plausible constrained resource while documenting uncertainty.", criteria: ["interprets utilization in context", "compares multiple resource signals", "identifies a plausible bottleneck from evidence", "documents uncertainty and assumptions"] },
  "grade11-ai-cloud-reliability-operations-analysis": { slug: "ai-cloud-reliability-operations-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "ai-cloud-infrastructure", title: "Analyze AI infrastructure reliability and operations", description: "Evaluate synthetic availability, redundancy, failure-domain, power, cooling, and monitoring evidence and recommend a safe operational response.", criteria: ["identifies availability and failure-domain considerations", "uses compute, storage, network, power, and cooling evidence", "recommends a safe operational response", "states assumptions and escalates where necessary"] },
  "grade11-ai-cloud-reliability-operations-analysis-reassessment": { slug: "ai-cloud-reliability-operations-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "ai-cloud-infrastructure", title: "Analyze AI infrastructure reliability and operations", description: "Evaluate synthetic availability, redundancy, failure-domain, power, cooling, and monitoring evidence and recommend a safe operational response.", criteria: ["identifies availability and failure-domain considerations", "uses compute, storage, network, power, and cooling evidence", "recommends a safe operational response", "states assumptions and escalates where necessary"] },
  "grade12-technical-operations-multi-system-operations-analysis": { slug: "grade12-technical-operations-multi-system-operations-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "technical-operations", title: "Analyze a simulated multi-system operation", description: "Map synthetic service dependencies, distinguish symptoms from causes, and document a safe authorized operational response.", criteria: ["interprets multiple evidence sources", "maps system dependencies", "preserves uncertainty", "chooses a safe authorized next step", "documents clearly"] },
  "grade12-technical-operations-change-incident-coordination": { slug: "grade12-technical-operations-change-incident-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "technical-operations", title: "Coordinate a simulated operational change and incident", description: "Use a sandbox change sequence, validate outcomes, communicate status, and escalate safely.", criteria: ["identifies change risk", "follows an authorized sequence", "verifies the simulated result", "coordinates handoff and escalation", "documents rollback considerations"] },
  "grade12-technical-operations-change-incident-coordination-reassessment": { slug: "grade12-technical-operations-change-incident-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "technical-operations", title: "Coordinate a simulated operational change and incident", description: "Use a sandbox change sequence, validate outcomes, communicate status, and escalate safely.", criteria: ["identifies change risk", "follows an authorized sequence", "verifies the simulated result", "coordinates handoff and escalation", "documents rollback considerations"] },
  "grade12-networking-fiber-resilient-network-path-analysis": { slug: "grade12-networking-fiber-resilient-network-path-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "networking-fiber", title: "Analyze a resilient network path", description: "Interpret a synthetic topology and performance signals, identify a plausible failure domain, and document a safe authorized response.", criteria: ["interprets complex topology", "uses latency, loss, and path evidence", "evaluates redundancy and failure domains", "preserves uncertainty", "documents a safe next step"] },
  "grade12-networking-fiber-change-incident-coordination": { slug: "grade12-networking-fiber-change-incident-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "networking-fiber", title: "Coordinate a simulated network change and incident", description: "Plan and validate a simulated network change with rollback, handoff, and escalation boundaries.", criteria: ["identifies change scope and risk", "defines validation evidence", "considers rollback", "coordinates handoff and escalation", "documents clearly"] },
  "grade12-networking-fiber-change-incident-coordination-reassessment": { slug: "grade12-networking-fiber-change-incident-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "networking-fiber", title: "Coordinate a simulated network change and incident", description: "Plan and validate a simulated network change with rollback, handoff, and escalation boundaries.", criteria: ["identifies change scope and risk", "defines validation evidence", "considers rollback", "coordinates handoff and escalation", "documents clearly"] },
  "grade12-electrical-infrastructure-critical-power-reliability-analysis": { slug: "grade12-electrical-infrastructure-critical-power-reliability-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "electrical-infrastructure", title: "Analyze critical power reliability", description: "Interpret a synthetic critical-power architecture, A/B states, capacity, and failure-domain evidence without performing electrical work.", criteria: ["interprets the modeled power path", "evaluates A/B redundancy and shared dependencies", "uses load and telemetry evidence", "preserves uncertainty", "documents safe escalation"] },
  "grade12-electrical-infrastructure-change-incident-coordination": { slug: "grade12-electrical-infrastructure-change-incident-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "electrical-infrastructure", title: "Coordinate a simulated electrical change and incident", description: "Reason through a simulation-only electrical change or incident with safety boundaries, validation, handoff, and escalation.", criteria: ["identifies change and incident risk", "respects the electrical safety boundary", "evaluates downstream dependencies", "defines validation and escalation", "documents clearly"] },
  "grade12-electrical-infrastructure-change-incident-coordination-reassessment": { slug: "grade12-electrical-infrastructure-change-incident-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "electrical-infrastructure", title: "Coordinate a simulated electrical change and incident", description: "Reason through a simulation-only electrical change or incident with safety boundaries, validation, handoff, and escalation.", criteria: ["identifies change and incident risk", "respects the electrical safety boundary", "evaluates downstream dependencies", "defines validation and escalation", "documents clearly"] },
  "grade12-mechanical-hvac-thermal-capacity-reliability-analysis": { slug: "grade12-mechanical-hvac-thermal-capacity-reliability-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "mechanical-hvac", title: "Analyze thermal capacity and cooling reliability", description: "Interpret synthetic thermal load, capacity, telemetry, and redundancy evidence without performing industrial HVAC work.", criteria: ["interprets thermal architecture and telemetry", "evaluates load, capacity, and headroom", "identifies a cooling failure domain", "preserves uncertainty", "documents safe escalation"] },
  "grade12-mechanical-hvac-cooling-incident-change-coordination": { slug: "grade12-mechanical-hvac-cooling-incident-change-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "mechanical-hvac", title: "Coordinate a simulated cooling incident and change", description: "Reason through a simulation-only cooling change or incident with safety boundaries, dependencies, validation, and escalation.", criteria: ["identifies cooling change and incident risk", "respects the professional service boundary", "evaluates cross-domain dependencies", "defines validation and escalation", "documents clearly"] },
  "grade12-mechanical-hvac-cooling-incident-change-coordination-reassessment": { slug: "grade12-mechanical-hvac-cooling-incident-change-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "mechanical-hvac", title: "Coordinate a simulated cooling incident and change", description: "Reason through a simulation-only cooling change or incident with safety boundaries, dependencies, validation, and escalation.", criteria: ["identifies cooling change and incident risk", "respects the professional service boundary", "evaluates cross-domain dependencies", "defines validation and escalation", "documents clearly"] },
  "grade12-ai-cloud-infrastructure-capacity-bottleneck-analysis": { slug: "grade12-ai-cloud-infrastructure-capacity-bottleneck-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "ai-cloud-infrastructure", title: "Analyze AI infrastructure capacity and bottlenecks", description: "Interpret synthetic multi-node compute, storage, network, power, and thermal signals to identify a limiting resource and document safe infrastructure tradeoffs.", criteria: ["interprets multi-node infrastructure", "evaluates capacity and headroom", "identifies a limiting resource from evidence", "uses compute, storage, and network signals", "recognizes power and thermal dependencies", "preserves uncertainty", "documents tradeoffs"] },
  "grade12-ai-cloud-infrastructure-distributed-reliability-incident-coordination": { slug: "grade12-ai-cloud-infrastructure-distributed-reliability-incident-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "ai-cloud-infrastructure", title: "Coordinate a simulated distributed infrastructure incident", description: "Combine synthetic compute, storage, network, power, and cooling evidence to identify a degraded domain and recommend a safe authorized response.", criteria: ["identifies a degraded or failed domain", "evaluates reliability and redundancy", "combines compute, storage, network, power, and cooling signals", "selects a safe authorized next step", "coordinates a cross-team handoff", "defines validation evidence", "documents recovery reasoning"] },
  "grade12-ai-cloud-infrastructure-distributed-reliability-incident-coordination-reassessment": { slug: "grade12-ai-cloud-infrastructure-distributed-reliability-incident-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "ai-cloud-infrastructure", title: "Coordinate a simulated distributed infrastructure incident", description: "Combine synthetic compute, storage, network, power, and cooling evidence to identify a degraded domain and recommend a safe authorized response.", criteria: ["identifies a degraded or failed domain", "evaluates reliability and redundancy", "combines compute, storage, network, power, and cooling signals", "selects a safe authorized next step", "coordinates a cross-team handoff", "defines validation evidence", "documents recovery reasoning"] },
  "grade12-cybersecurity-security-access-governance-analysis": { slug: "grade12-cybersecurity-security-access-governance-analysis", activityType: PROOF_ACTIVITY_TYPE, domain: "cybersecurity-security", title: "Analyze defensive access governance", description: "Interpret synthetic identities, roles, permissions, and lifecycle records using least-privilege and separation-of-duties reasoning without changing real accounts.", criteria: ["interprets identity, role, and permission relationships", "identifies stale or excessive access", "applies least-privilege and separation-of-duties reasoning", "preserves uncertainty", "documents an authorized recommendation"] },
  "grade12-cybersecurity-security-defensive-incident-correlation-coordination": { slug: "grade12-cybersecurity-security-defensive-incident-correlation-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "cybersecurity-security", title: "Coordinate a simulated defensive security incident", description: "Correlate synthetic physical and cyber events, preserve source records, distinguish alerts from confirmed incidents, and recommend safe escalation.", criteria: ["correlates synthetic events and chronology", "distinguishes an alert from a confirmed incident", "identifies missing evidence and uncertainty", "preserves source records", "coordinates safe authorized escalation"] },
  "grade12-cybersecurity-security-defensive-incident-correlation-coordination-reassessment": { slug: "grade12-cybersecurity-security-defensive-incident-correlation-coordination", activityType: PROOF_ACTIVITY_TYPE, domain: "cybersecurity-security", title: "Coordinate a simulated defensive security incident", description: "Reassess a synthetic defensive security incident while preserving source records, uncertainty, and safe escalation boundaries.", criteria: ["correlates synthetic events and chronology", "distinguishes an alert from a confirmed incident", "identifies missing evidence and uncertainty", "preserves source records", "coordinates safe authorized escalation"] },
};

function scope(actor: any) {
  const userId = String(actor?.user_id || actor?.id || "").trim();
  const organizationId = String(actor?.organization_id || actor?.active_organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("scope_missing");
  return { userId, organizationId, tenantId };
}

function stableId(...parts: string[]) {
  return createHash("sha256").update(parts.join("|"), "utf8").digest("hex").slice(0, 32);
}

export class PrepareProveService {
  constructor(private outbox = new IntegrationOutboxRepo(), private transaction = withTransaction, private dbQuery: typeof query = query) {}

  async getProofDefinition(activityId = PROOF_ACTIVITY_ID) {
    const config = PROOF_CONFIGS[activityId] || PROOF_CONFIGS[PROOF_ACTIVITY_ID];
    await this.dbQuery(`INSERT INTO competency_definitions (competency_id, slug, title, description, domain, version, criteria_json, evidence_requirements_json, status) VALUES ($1,$2,$3,$4,$5,1,$6,$7,'ACTIVE') ON CONFLICT (slug) DO UPDATE SET domain=EXCLUDED.domain`, [`competency_prepare_prove_${config.slug.replace(/[^a-z0-9]+/gi, "_")}`, config.slug, config.title, config.description, config.domain, JSON.stringify({ criteria: config.criteria }), JSON.stringify({ source_activity_type: config.activityType, review_required: true })]);
    const result = await this.dbQuery(`SELECT * FROM competency_definitions WHERE slug = $1`, [config.slug]);
    return result.rows[0] || null;
  }

  async submitProofResult(input: { actor: any; result: Record<string, unknown> }) {
    if (!hasPermission(input.actor?.permissions, SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE)) throw new Error("activity_submit_permission_required");
    const { userId, organizationId, tenantId } = scope(input.actor);
    const activityId = String(input.result.activity_id || PROOF_ACTIVITY_ID);
    const config = PROOF_CONFIGS[activityId];
    if (!config) throw new Error("unknown_proof_activity");
    const assignment = await this.dbQuery("SELECT specialization_id FROM program_specialization_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND assignment_type='PRIMARY' AND status='ACTIVE'", [userId, organizationId, tenantId, "data-center-specialization-11"]);
    if (assignment.rows[0] && assignment.rows[0].specialization_id !== config.domain) throw new Error("specialization_assignment_required");
    if (activityId.startsWith("grade12-")) {
      const courseId = GRADE12_COURSE_BY_DOMAIN[config.domain];
      const course = await this.dbQuery("SELECT assignment_id FROM program_course_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id='data-center-specialization-11' AND course_id=$4 AND specialization_id=$5 AND status='ACTIVE'", [userId, organizationId, tenantId, courseId, config.domain]);
      if (!course.rows[0]) throw new Error("grade12_course_assignment_required");
    }
    const resultId = `activity_result_${stableId(organizationId, userId, config.activityType, activityId)}`;
    const result = await this.dbQuery(
      `INSERT INTO prepare_prove_activity_results
       (result_id, activity_type, activity_id, user_id, organization_id, tenant_id, result_status, result_json)
       VALUES ($1,$2,$3,$4,$5,$6,'SUCCEEDED',$7)
       ON CONFLICT (organization_id, user_id, activity_type, activity_id)
       DO UPDATE SET result_json = prepare_prove_activity_results.result_json
       RETURNING *`,
      [resultId, config.activityType, activityId, userId, organizationId, tenantId, JSON.stringify(input.result)],
    );
    return result.rows[0];
  }

  async createEvidence(input: { actor: any; sourceResultId: string; criterion: string }) {
    if (!hasPermission(input.actor?.permissions, SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE)) throw new Error("evidence_create_permission_required");
    const { userId, organizationId, tenantId } = scope(input.actor);
    const result = await this.dbQuery(`SELECT * FROM prepare_prove_activity_results WHERE result_id=$1 AND user_id=$2 AND organization_id=$3 AND tenant_id=$4`, [input.sourceResultId, userId, organizationId, tenantId]);
    if (!result.rows[0]) throw new Error("source_result_not_found");
    const evidenceId = `evidence_${stableId(organizationId, input.sourceResultId, input.criterion)}`;
    const evidence = await this.dbQuery(
      `INSERT INTO prepare_prove_evidence
       (evidence_id, source_domain, source_record_id, user_id, organization_id, tenant_id, activity_id, criterion, status, provenance_json)
       VALUES ($1,'prepare_prove_activity',$2,$3,$4,$5,$6,$7,'REVIEWABLE',$8)
       ON CONFLICT (organization_id, source_domain, source_record_id, criterion)
       DO UPDATE SET status = prepare_prove_evidence.status
       RETURNING *`,
      [evidenceId, input.sourceResultId, userId, organizationId, tenantId, result.rows[0].activity_id, input.criterion, JSON.stringify({ source_result_id: input.sourceResultId, created_by: userId })],
    );
    return evidence.rows[0];
  }

  async getProofStatus(actor: any, activityId = PROOF_ACTIVITY_ID) {
    const { userId, organizationId, tenantId } = scope(actor);
    const result = await this.dbQuery(`SELECT * FROM prepare_prove_activity_results WHERE user_id=$1 AND organization_id=$2 AND tenant_id=$3 AND activity_id=$4`, [userId, organizationId, tenantId, activityId]);
    const source = result.rows[0] || null;
    const evidence = source ? await this.dbQuery(`SELECT * FROM prepare_prove_evidence WHERE source_record_id=$1 AND user_id=$2 AND organization_id=$3 AND tenant_id=$4 ORDER BY created_at DESC, evidence_id DESC LIMIT 1`, [source.result_id, userId, organizationId, tenantId]) : { rows: [] };
    const evidenceRow = evidence.rows[0] || null;
    const decision = evidenceRow ? await this.dbQuery(`SELECT d.*, c.slug AS competency_slug, c.title AS competency_title FROM learner_competency_decisions d JOIN competency_definitions c ON c.competency_id=d.competency_id WHERE d.evidence_id=$1 AND d.user_id=$2 AND d.organization_id=$3 AND d.tenant_id=$4 ORDER BY d.reviewed_at DESC, d.decision_id DESC LIMIT 1`, [evidenceRow.evidence_id, userId, organizationId, tenantId]) : { rows: [] };
    return { result: source, evidence: evidenceRow, decision: decision.rows[0] || null };
  }

  async getReviewPackage(actor: any, evidenceId: string) {
    const reviewer = scope(actor);
    const evidence = await this.dbQuery(`SELECT * FROM prepare_prove_evidence WHERE evidence_id=$1 AND organization_id=$2 AND tenant_id=$3`, [evidenceId, reviewer.organizationId, reviewer.tenantId]);
    if (!evidence.rows[0]) throw new Error("evidence_not_found");
    const source = await this.dbQuery(`SELECT * FROM prepare_prove_activity_results WHERE result_id=$1 AND organization_id=$2 AND tenant_id=$3`, [evidence.rows[0].source_record_id, reviewer.organizationId, reviewer.tenantId]);
    const competency = await this.getProofDefinition(evidence.rows[0].activity_id);
    return { evidence: evidence.rows[0], result: source.rows[0] || null, competency };
  }

  async reviewEvidence(input: { actor: any; evidenceId: string; decision: "DEMONSTRATED" | "EVIDENCE_INSUFFICIENT" | "NEEDS_REVIEW" }) {
    if (!hasPermission(input.actor?.permissions, SHS_SECURITY_PERMISSIONS.VERIFICATION_REVIEW)) throw new Error("verification_review_required");
    if (!hasPermission(input.actor?.permissions, SHS_SECURITY_PERMISSIONS.VERIFICATION_APPROVE)) throw new Error("verification_approve_required");
    const reviewer = scope(input.actor);
    const evidence = await this.dbQuery(`SELECT * FROM prepare_prove_evidence WHERE evidence_id=$1 AND organization_id=$2 AND tenant_id=$3`, [input.evidenceId, reviewer.organizationId, reviewer.tenantId]);
    if (!evidence.rows[0]) throw new Error("evidence_not_found");
    if (evidence.rows[0].user_id === reviewer.userId) throw new Error("reviewer_must_differ_from_learner");
    const competency = await this.getProofDefinition(evidence.rows[0].activity_id);
    if (!competency) throw new Error("competency_definition_not_found");
    const decisionId = `competency_decision_${stableId(reviewer.organizationId, competency.competency_id, input.evidenceId, String(competency.version))}`;
    return this.transaction(async (db: any) => {
      const inserted = await db.query(
        `INSERT INTO learner_competency_decisions
         (decision_id, competency_id, evidence_id, user_id, organization_id, tenant_id, decision, criteria_version, reviewer_user_id, reviewer_authority, provenance_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'verification.review+verification.approve',$10)
         ON CONFLICT (organization_id, competency_id, evidence_id, criteria_version)
         DO UPDATE SET decision_id = learner_competency_decisions.decision_id
         RETURNING *`,
        [decisionId, competency.competency_id, input.evidenceId, evidence.rows[0].user_id, reviewer.organizationId, reviewer.tenantId, input.decision, competency.version, reviewer.userId, JSON.stringify({ evidence_id: input.evidenceId, criteria_version: competency.version })],
      );
      await db.query(`UPDATE prepare_prove_evidence SET status=$2 WHERE evidence_id=$1`, [input.evidenceId, input.decision === "DEMONSTRATED" ? "REVIEWED" : "INSUFFICIENT"]);
      await this.outbox.enqueue({
        producer_id: "prepare-prove.competency-review",
        event_type: "competency.reviewed",
        schema_version: "1.0",
        subject_type: "competency_decision",
        subject_id: decisionId,
        organization_id: reviewer.organizationId,
        originating_actor_id: reviewer.userId,
        originating_actor_type: "user",
        tenant_id: reviewer.tenantId,
        occurred_at: new Date().toISOString(),
        idempotency_key: `competency.reviewed:${decisionId}`,
        correlation_id: `prepare-prove:${decisionId}`,
        payload: { decision_id: decisionId, competency_id: competency.competency_id, evidence_id: input.evidenceId, learner_id: evidence.rows[0].user_id, decision: input.decision, criteria_version: competency.version },
        destination: "agent-fabric",
      }, db);
      return inserted.rows[0];
    });
  }
}

export { PROOF_ACTIVITY_ID, PROOF_COMPETENCY_SLUG, GRADE12_PROOF_ACTIVITY_ID };
