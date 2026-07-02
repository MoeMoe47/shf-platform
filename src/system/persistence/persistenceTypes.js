export const SHS_PERSISTENCE_SCHEMA_VERSION = "shs.persistence.v1";

export const SHS_PERSISTENCE_SAFETY_COPY =
  "SHS Durable Persistence Layer V1 stores approved local operational records only. It does not store credentials, API keys, OAuth tokens, banking secrets, public approval mutations, or SHF Impact Data mutations.";

export const PERSISTENCE_ADAPTERS = Object.freeze({
  LOCAL: "localStorage",
  MEMORY: "memory",
  DATABASE_PLACEHOLDER: "database_placeholder",
});

export const PERSISTENCE_REPOSITORIES = Object.freeze([
  { repository: "agents", entity_type: "agent_record", label: "Agent Workbench", storage_key: "agents" },
  { repository: "orchestrator", entity_type: "orchestration_record", label: "System Orchestrator", storage_key: "orchestrator" },
  { repository: "direct_connect", entity_type: "direct_connect_record", label: "Direct Connect", storage_key: "direct_connect" },
  { repository: "reports", entity_type: "report_record", label: "SHS Reports", storage_key: "reports" },
  { repository: "production_automation", entity_type: "production_automation_record", label: "Production Automation", storage_key: "production_automation" },
]);

export const PERSISTENCE_SNAPSHOT_SCOPES = Object.freeze([
  "agents",
  "orchestrator",
  "direct_connect",
  "reports",
  "production_automation",
  "all_safe",
]);

export const PERSISTENCE_DANGEROUS_FLAGS = Object.freeze({
  public_approved_mutation_enabled: false,
  shf_impact_data_mutation_enabled: false,
  credential_persistence_enabled: false,
  external_database_enabled: false,
  external_api_enabled: false,
  token_persistence_enabled: false,
});

export function createPersistenceId(prefix = "shs_persist") {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now()}_${random}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

export function createRecordHash(value) {
  const input = stableStringify(value || {});
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

