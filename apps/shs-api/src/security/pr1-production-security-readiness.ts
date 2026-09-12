import { isProductionEnvironment } from "../auth/production-identity.js";

export type Pr1GapStatus = "RESOLVED" | "BLOCKED — EXTERNAL DEPENDENCY" | "OPEN — REPOSITORY WORK REMAINS";

export type Pr1ReadinessItem = {
  gapId: string;
  capability: string;
  status: Pr1GapStatus;
  evidence: string;
  remainingDependency: string;
};

function present(env: NodeJS.ProcessEnv, name: string) {
  return String(env[name] || "").trim().length > 0;
}

function enabled(env: NodeJS.ProcessEnv, name: string) {
  return ["1", "true", "yes", "required", "enabled"].includes(String(env[name] || "").trim().toLowerCase());
}

export function evaluatePr1ProductionSecurityReadiness(env: NodeJS.ProcessEnv = process.env): Pr1ReadinessItem[] {
  const identityConfigured = present(env, "SHS_IDENTITY_PROVIDER") &&
    present(env, "SHS_IDENTITY_PROVIDER_AUDIENCE") &&
    present(env, "SHS_SESSION_SECRET_REF") &&
    present(env, "AUTH0_ISSUER") &&
    present(env, "AUTH0_AUDIENCE");
  const mfaRepositoryReady = enabled(env, "SHS_PRIVILEGED_MFA_REQUIRED") && present(env, "SHS_PRIVILEGED_MFA_POLICY_REF");
  const federationRepositoryReady = present(env, "SHS_FEDERATION_PROVIDER_REF") && present(env, "SHS_FEDERATION_MAPPING_REF");
  const serviceIdentityReady = present(env, "SHF_INTERNAL_SERVICE_ACTIVE_KID") &&
    present(env, "SHF_INTERNAL_SERVICE_KEYS_REF") &&
    present(env, "SHF_INTERNAL_SERVICE_KEY_ROTATION_REF");
  const secretsReady = present(env, "SHS_SESSION_SECRET_REF") &&
    present(env, "SHF_EXTERNAL_SECRET_KEYS_REF") &&
    present(env, "SHF_EXTERNAL_SECRET_ACTIVE_KID") &&
    present(env, "SHS_SECRET_ROTATION_RUNBOOK_REF");
  const breakGlassReady = present(env, "SHS_BREAK_GLASS_POLICY_REF") &&
    enabled(env, "SHS_BREAK_GLASS_MFA_REQUIRED") &&
    present(env, "SHS_BREAK_GLASS_MAX_TTL_MINUTES");
  const securityEventsReady = present(env, "SHS_SECURITY_EVENT_TAXONOMY_REF") &&
    present(env, "SHS_SECURITY_EVENT_ESCALATION_REF") &&
    present(env, "SHS_SECURITY_EVENT_OWNER") &&
    enabled(env, "SHS_SECURITY_EVENT_CLOSURE_REQUIRED");

  return [
    {
      gapId: "PR0-GAP-001",
      capability: "Production identity provider",
      status: identityConfigured ? "BLOCKED — EXTERNAL DEPENDENCY" : "OPEN — REPOSITORY WORK REMAINS",
      evidence: identityConfigured ? "Auth0 repository contract is configured through runtime references." : "Auth0 runtime references are incomplete.",
      remainingDependency: "Live Auth0 tenant callback/session/revocation acceptance evidence.",
    },
    {
      gapId: "PR0-GAP-002",
      capability: "Privileged MFA",
      status: mfaRepositoryReady ? "BLOCKED — EXTERNAL DEPENDENCY" : "OPEN — REPOSITORY WORK REMAINS",
      evidence: mfaRepositoryReady ? "Privileged MFA policy references are required by production readiness." : "Privileged MFA policy references are incomplete.",
      remainingDependency: "Real IdP MFA policy export and enforced privileged-role acceptance evidence.",
    },
    {
      gapId: "PR0-GAP-003",
      capability: "Federation / SCIM",
      status: federationRepositoryReady ? "BLOCKED — EXTERNAL DEPENDENCY" : "OPEN — REPOSITORY WORK REMAINS",
      evidence: federationRepositoryReady ? "Federation provider and mapping references are represented in runtime configuration." : "Federation provider/mapping references are incomplete.",
      remainingDependency: "Enterprise IdP federation/SCIM configuration, deprovisioning, and audit acceptance evidence.",
    },
    {
      gapId: "PR0-GAP-004",
      capability: "Service identities",
      status: serviceIdentityReady ? "BLOCKED — EXTERNAL DEPENDENCY" : "OPEN — REPOSITORY WORK REMAINS",
      evidence: serviceIdentityReady ? "Service identity active key, provider reference, and rotation reference are required." : "Service identity key/reference/rotation configuration is incomplete.",
      remainingDependency: "Production secret-manager backed service credential injection and stale-key denial proof.",
    },
    {
      gapId: "PR0-GAP-005",
      capability: "Break-glass access",
      status: breakGlassReady ? "BLOCKED — EXTERNAL DEPENDENCY" : "OPEN — REPOSITORY WORK REMAINS",
      evidence: breakGlassReady ? "Break-glass policy, MFA requirement, and TTL are explicit runtime requirements." : "Break-glass policy/MFA/TTL configuration is incomplete.",
      remainingDependency: "External MFA-backed activation/deactivation drill and reviewed audit event.",
    },
    {
      gapId: "PR0-GAP-006",
      capability: "Secrets / keys",
      status: secretsReady ? "BLOCKED — EXTERNAL DEPENDENCY" : "OPEN — REPOSITORY WORK REMAINS",
      evidence: secretsReady ? "Secret refs and rotation runbook refs are required at runtime." : "Secret injection or rotation references are incomplete.",
      remainingDependency: "Production secret store provisioning, rotation execution, and revocation evidence.",
    },
    {
      gapId: "PR0-GAP-016",
      capability: "Security event handling",
      status: securityEventsReady ? "RESOLVED" : "OPEN — REPOSITORY WORK REMAINS",
      evidence: securityEventsReady ? "Security event taxonomy, owner, escalation, and closure requirements are configured." : "Security event taxonomy/owner/escalation/closure requirements are incomplete.",
      remainingDependency: securityEventsReady ? "None." : "Runtime event handling configuration.",
    },
  ];
}

export function assertPr1ProductionSecurityConfigured(env: NodeJS.ProcessEnv = process.env) {
  if (!isProductionEnvironment(env)) return;
  const open = evaluatePr1ProductionSecurityReadiness(env).filter((item) => item.status === "OPEN — REPOSITORY WORK REMAINS");
  if (open.length > 0) {
    throw new Error(`PR-1 production security readiness incomplete: ${open.map((item) => item.gapId).join(", ")}`);
  }
}
