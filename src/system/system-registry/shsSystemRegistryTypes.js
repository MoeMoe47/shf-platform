export const SHS_SYSTEM_REGISTRY_VERSION = "shs.system-registry.v1";

export const SHS_SYSTEM_REGISTRY_SAFETY_COPY =
  "SHS System Registry & Dependency Intelligence V1 maps internal layer relationships only. It does not execute workflows, mutate data, publish reports, change public approval, send external messages, write warehouse records, or modify auth.";

export const SYSTEM_REGISTRY_CATEGORIES = [
  "governance",
  "truth",
  "oracle",
  "agent",
  "workflow",
  "automation",
  "reports",
  "clientops",
  "sales",
  "qa",
  "direct_connect",
  "persistence",
  "tracking",
  "orchestrator",
  "registry",
  "security",
  "data",
  "public",
  "admin",
  "infrastructure",
];

export const SYSTEM_REGISTRY_RELEASE_STATUSES = [
  "v1_released",
  "v1_1_active",
  "local_only",
  "future_gated",
  "deprecated",
  "needs_review",
];

export const SYSTEM_REGISTRY_PRODUCTION_STATUSES = [
  "production_ready",
  "admin_ready",
  "local_only",
  "docs_only",
  "placeholder",
];

export const SYSTEM_REGISTRY_LIFECYCLE_STATUSES = [
  "draft",
  "in_development",
  "validation",
  "governance_review",
  "release_candidate",
  "released",
  "deprecated",
  "archived",
];

export const DEFAULT_DANGEROUS_CAPABILITIES = Object.freeze({
  production_mutation: false,
  public_approval_mutation: false,
  shf_impact_mutation: false,
  external_delivery: false,
  webhook_send: false,
  notification_send: false,
  warehouse_write: false,
  auth_mutation: false,
  credential_storage: false,
});

export const DEFAULT_HEALTH_SCORE = Object.freeze({
  validation: 0,
  documentation: 0,
  coverage: 0,
  governance: 0,
  smoke_tests: 0,
  dependencies: 0,
  performance: 0,
  security: 0,
  technical_debt: 0,
  overall: 0,
});

export function createRegistryEntry(input = {}) {
  return {
    layer_id: input.layer_id || "",
    name: input.name || "",
    category: input.category || "infrastructure",
    release_status: input.release_status || "needs_review",
    production_status: input.production_status || "placeholder",
    lifecycle_status: input.lifecycle_status || "draft",
    current_version: input.current_version || "v1",
    version_history: input.version_history || [],
    release_commit: input.release_commit || "",
    release_tag: input.release_tag || "",
    release_date: input.release_date || "",
    owner: input.owner || "SHS",
    purpose: input.purpose || "",
    owner_surface: input.owner_surface || "internal_admin",
    admin_route: input.admin_route || "",
    public_route: input.public_route || "",
    docs: input.docs || [],
    validators: input.validators || [],
    package_scripts: input.package_scripts || [],
    source_files: input.source_files || [],
    data_contracts: input.data_contracts || [],
    repositories: input.repositories || [],
    agents: input.agents || [],
    reports: input.reports || [],
    dependencies: input.dependencies || [],
    dependents: input.dependents || [],
    safety_rules: input.safety_rules || [],
    health: { ...DEFAULT_HEALTH_SCORE, ...(input.health || {}) },
    dangerous_capabilities: {
      ...DEFAULT_DANGEROUS_CAPABILITIES,
      ...(input.dangerous_capabilities || {}),
    },
    readiness_score: input.readiness_score || 0,
    notes: input.notes || [],
  };
}

