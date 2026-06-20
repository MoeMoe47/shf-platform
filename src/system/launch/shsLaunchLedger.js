export const SHS_LAUNCH_LEDGER_STORAGE_KEY = "shs.launch.ledger.v1";
export const SHS_LAUNCH_LEDGER_VERSION = "v1";

const LAUNCH_STATUSES = new Set([
  "draft",
  "qa_review",
  "delivery_ready",
  "launch_ready",
  "launched",
  "blocked",
]);

const COMPLETE_STATUSES = new Set([
  "approved",
  "approved_with_exceptions",
  "complete",
  "completed",
  "signed",
  "signed_off",
  "ready",
]);

function nowIso() {
  return new Date().toISOString();
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cleanString(value) {
  return String(value || "").trim();
}

function cleanArray(value) {
  return Array.isArray(value) ? value.map(cleanString).filter(Boolean) : [];
}

function createId(prefix, seed) {
  const normalizedSeed = cleanString(seed)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}_${normalizedSeed || Date.now().toString(36)}`;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStatus(status, fallback = "draft") {
  const value = cleanString(status);
  return LAUNCH_STATUSES.has(value) ? value : fallback;
}

function normalizeSafetyFlags() {
  return {
    public_approved: false,
    mutated_shf_impact_data: false,
    published_report: false,
  };
}

function isComplete(value) {
  if (!isObject(value)) return false;
  if (value.completed === true || value.signed === true || value.approved === true) return true;
  return COMPLETE_STATUSES.has(cleanString(value.status).toLowerCase());
}

function normalizeSignoff(input = {}, type = "signoff") {
  const source = isObject(input) ? input : {};
  const signedAt = source.signed_at || source.completed_at || source.approved_at || "";
  return {
    signoff_id: cleanString(source.signoff_id) || createId(`shs_${type}`, `${source.owner || type}-${signedAt || nowIso()}`),
    type,
    status: cleanString(source.status) || "pending",
    owner: cleanString(source.owner || source.approved_by || source.signed_by),
    role: cleanString(source.role),
    notes: cleanString(source.notes),
    exceptions: cleanArray(source.exceptions),
    signed_at: cleanString(signedAt),
  };
}

function normalizeVersionRecord(input = {}) {
  const source = isObject(input) ? input : {};
  return {
    version_id: cleanString(source.version_id) || cleanString(source.id),
    version_label: cleanString(source.version_label || source.version),
    launch_date: cleanString(source.launch_date || source.released_at || source.releasedAt),
    summary: cleanString(source.summary),
    active_modules: cleanArray(source.active_modules || source.activeModules),
    active_routes: cleanArray(source.active_routes || source.activeRoutes),
    included_reports: cleanArray(source.included_reports || source.includedReports),
    known_exceptions: cleanArray(source.known_exceptions || source.knownExceptions),
    rollback_note: cleanString(source.rollback_note || source.rollbackNote),
    approval_reference: cleanString(source.approval_reference || source.approvalReference),
    owner: cleanString(source.owner || source.launch_owner || source.launchOwner),
  };
}

function normalizeRollbackPlan(input = {}) {
  const source = isObject(input) ? input : {};
  return {
    owner: cleanString(source.owner || source.rollback_owner || source.rollbackOwner),
    trigger_conditions: cleanArray(source.trigger_conditions || source.triggerConditions),
    last_known_good_version: cleanString(source.last_known_good_version || source.lastKnownGoodVersion),
    affected_routes: cleanArray(source.affected_routes || source.affectedRoutes),
    preservation_note: cleanString(source.preservation_note || source.preservationNote),
    client_communication_note: cleanString(source.client_communication_note || source.clientCommunicationNote),
    support_escalation_path: cleanString(source.support_escalation_path || source.supportEscalationPath),
    post_rollback_review_owner: cleanString(source.post_rollback_review_owner || source.postRollbackReviewOwner),
  };
}

function normalizeClientOpsActivation(input = {}) {
  const source = isObject(input) ? input : {};
  return {
    clientops_record_id: cleanString(source.clientops_record_id || source.clientOpsRecordId),
    owner: cleanString(source.owner || source.clientops_owner || source.clientOpsOwner || source.support_owner || source.supportOwner),
    status: cleanString(source.status) || "pending",
    activated_at: cleanString(source.activated_at || source.activatedAt),
    support_tier: cleanString(source.support_tier || source.supportTier),
    notes: cleanString(source.notes),
  };
}

export function createVersionRecord(input = {}) {
  const version = normalizeVersionRecord(input);
  const timestamp = nowIso();
  return {
    ...version,
    version_id: version.version_id || createId("shs_launch_version", `${version.version_label || "v1"}-${timestamp}`),
    created_at: cleanString(input.created_at) || timestamp,
    updated_at: timestamp,
  };
}

export function createSignoffRecord(input = {}) {
  const timestamp = nowIso();
  const signoff = normalizeSignoff(input, cleanString(input.type) || "signoff");
  return {
    ...signoff,
    created_at: cleanString(input.created_at) || timestamp,
    updated_at: timestamp,
  };
}

export function createLaunchLedgerRecord(input = {}) {
  const timestamp = nowIso();
  const source = isObject(input) ? input : {};
  const projectId = cleanString(source.project_id || source.projectId);
  const projectName = cleanString(source.project_name || source.projectName);

  return {
    ledger_id: cleanString(source.ledger_id || source.ledgerId) || createId("shs_launch_ledger", projectId || projectName || timestamp),
    project_id: projectId,
    client_name: cleanString(source.client_name || source.clientName),
    project_name: projectName,
    package_name: cleanString(source.package_name || source.packageName),
    support_tier: cleanString(source.support_tier || source.supportTier),
    launch_status: normalizeStatus(source.launch_status || source.launchStatus),
    qa_signoff: normalizeSignoff(source.qa_signoff || source.qaSignoff, "qa"),
    operator_signoff: normalizeSignoff(source.operator_signoff || source.operatorSignoff, "operator"),
    delivery_signoff: normalizeSignoff(source.delivery_signoff || source.deliverySignoff, "delivery"),
    client_signoff: normalizeSignoff(source.client_signoff || source.clientSignoff, "client"),
    version_record: normalizeVersionRecord(source.version_record || source.versionRecord),
    rollback_plan: normalizeRollbackPlan(source.rollback_plan || source.rollbackPlan),
    clientops_activation: normalizeClientOpsActivation(source.clientops_activation || source.clientOpsActivation),
    created_at: cleanString(source.created_at || source.createdAt) || timestamp,
    updated_at: timestamp,
    private_beta_only: source.private_beta_only !== false,
    ...normalizeSafetyFlags(),
  };
}

export function getLaunchBlockers(record = {}) {
  const source = createLaunchLedgerRecord(record);
  const blockers = [];

  if (!source.project_id) blockers.push("Missing project_id blocks launch gate evaluation.");
  if (!source.client_name) blockers.push("Missing client_name blocks launch gate evaluation.");
  if (!source.project_name) blockers.push("Missing project_name blocks launch gate evaluation.");
  if (!isComplete(source.qa_signoff)) blockers.push("Missing QA signoff blocks launch_ready.");
  if (!isComplete(source.operator_signoff)) blockers.push("Missing operator signoff blocks launch_ready.");
  if (!isComplete(source.delivery_signoff)) blockers.push("Missing delivery signoff blocks launch_ready.");
  if (record.public_approved === true) blockers.push("public_approved must remain false for this private SHS launch ledger.");
  if (record.mutated_shf_impact_data === true) blockers.push("mutated_shf_impact_data must remain false; SHF Impact Data Spine mutation is blocked.");
  if (record.published_report === true) blockers.push("published_report must remain false unless a separate governed report flow approves publication.");

  return blockers;
}

export function getLaunchWarnings(record = {}) {
  const source = createLaunchLedgerRecord(record);
  const warnings = [];

  if (!source.package_name) warnings.push("Missing package_name is a private-beta warning and paid-launch blocker.");
  if (!isComplete(source.client_signoff)) warnings.push("Missing client signoff blocks paid launch but may allow supervised private beta.");
  if (!source.version_record.version_id && !source.version_record.version_label) warnings.push("Missing version record blocks paid launch and ClientOps activation.");
  if (!source.rollback_plan.owner || !source.rollback_plan.last_known_good_version) warnings.push("Incomplete rollback plan blocks paid launch.");
  if (!source.support_tier) warnings.push("Missing support_tier blocks ClientOps activation.");
  if (!source.clientops_activation.owner) warnings.push("Missing ClientOps activation owner blocks ClientOps activation.");
  if (source.private_beta_only) warnings.push("Record is marked private_beta_only; paid launch remains blocked.");

  return warnings;
}

function getPaidLaunchBlockers(record = {}) {
  const source = createLaunchLedgerRecord(record);
  const blockers = [];

  if (!source.package_name) blockers.push("Missing package_name blocks paid launch.");
  if (!isComplete(source.client_signoff)) blockers.push("Missing client signoff blocks paid launch.");
  if (!source.version_record.version_id && !source.version_record.version_label) blockers.push("Missing version record blocks paid launch.");
  if (!source.rollback_plan.owner) blockers.push("Missing rollback owner blocks paid launch.");
  if (!source.rollback_plan.last_known_good_version) blockers.push("Missing rollback last_known_good_version blocks paid launch.");
  if (!source.support_tier) blockers.push("Missing support_tier blocks paid launch and ClientOps activation.");
  if (!source.clientops_activation.owner) blockers.push("Missing ClientOps activation owner blocks paid launch.");
  if (source.private_beta_only) blockers.push("private_beta_only must be false before paid_launch_ready.");

  return blockers;
}

export function isClientOpsActivationAllowed(record = {}) {
  const source = createLaunchLedgerRecord(record);
  const baseBlockers = getLaunchBlockers(source);

  return (
    baseBlockers.length === 0 &&
    Boolean(source.support_tier) &&
    Boolean(source.clientops_activation.owner) &&
    Boolean(source.version_record.version_id || source.version_record.version_label)
  );
}

export function computeLaunchGateStatus(record = {}) {
  const source = createLaunchLedgerRecord(record);
  const blockers = getLaunchBlockers(record);
  const warnings = getLaunchWarnings(source);
  const paidLaunchBlockers = getPaidLaunchBlockers(source);
  const clientopsActivationAllowed = isClientOpsActivationAllowed(source);

  if (
    blockers.some((blocker) => blocker.includes("project_id") || blocker.includes("client_name") || blocker.includes("project_name")) ||
    blockers.some((blocker) => blocker.includes("must remain false"))
  ) {
    return {
      status: "blocked",
      launch_status: "blocked",
      blockers,
      warnings,
      paid_launch_blockers: paidLaunchBlockers,
      clientops_activation_allowed: false,
    };
  }

  if (blockers.length) {
    return {
      status: "needs_review",
      launch_status: "qa_review",
      blockers,
      warnings,
      paid_launch_blockers: paidLaunchBlockers,
      clientops_activation_allowed: false,
    };
  }

  if (paidLaunchBlockers.length) {
    return {
      status: "private_beta_ready",
      launch_status: "launch_ready",
      blockers: [],
      warnings,
      paid_launch_blockers: paidLaunchBlockers,
      clientops_activation_allowed: clientopsActivationAllowed,
    };
  }

  return {
    status: "paid_launch_ready",
    launch_status: "launch_ready",
    blockers: [],
    warnings,
    paid_launch_blockers: [],
    clientops_activation_allowed: clientopsActivationAllowed,
  };
}

export function validateLaunchLedgerRecord(record = {}) {
  const normalized = createLaunchLedgerRecord(record);
  const gate = computeLaunchGateStatus(record);

  return {
    valid: gate.status !== "blocked",
    record: normalized,
    status: gate.status,
    launch_status: gate.launch_status,
    blockers: gate.blockers,
    warnings: gate.warnings,
    paid_launch_blockers: gate.paid_launch_blockers,
    clientops_activation_allowed: gate.clientops_activation_allowed,
  };
}

export function loadLaunchLedger() {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(SHS_LAUNCH_LEDGER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(createLaunchLedgerRecord) : [];
  } catch {
    return [];
  }
}

export function saveLaunchLedger(records = []) {
  const normalized = Array.isArray(records) ? records.map(createLaunchLedgerRecord) : [];
  if (canUseStorage()) {
    window.localStorage.setItem(SHS_LAUNCH_LEDGER_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function upsertLaunchLedgerRecord(record = {}) {
  const normalized = createLaunchLedgerRecord(record);
  const records = loadLaunchLedger();
  const existingIndex = records.findIndex((item) => item.ledger_id === normalized.ledger_id);
  const nextRecords = existingIndex >= 0
    ? records.map((item, index) => (index === existingIndex ? normalized : item))
    : [...records, normalized];

  saveLaunchLedger(nextRecords);
  return normalized;
}
