import { SHS_SECURITY_PERMISSIONS, hasPermission } from "../auth/security-permissions.js";

export type BreakGlassDecisionStatus = "DENIED" | "READY_FOR_EXTERNAL_MFA_ACTIVATION";

export type BreakGlassDecision = {
  status: BreakGlassDecisionStatus;
  reasonCode: string;
  ttlMinutes: number | null;
  auditEvent: string;
};

function hasMfaEvidence(actor: any) {
  const amr = actor?.auth?.amr || actor?.amr || actor?.authentication_methods;
  return actor?.mfa_verified === true ||
    actor?.auth?.mfa_verified === true ||
    (Array.isArray(amr) && amr.map((item) => String(item).toLowerCase()).includes("mfa"));
}

function maxTtlMinutes(env: NodeJS.ProcessEnv) {
  const value = Number(env.SHS_BREAK_GLASS_MAX_TTL_MINUTES || 0);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function evaluateBreakGlassAttestation(actor: any, input: any, env: NodeJS.ProcessEnv = process.env): BreakGlassDecision {
  const configured = String(env.SHS_BREAK_GLASS_POLICY_REF || "").trim() &&
    ["1", "true", "yes", "required"].includes(String(env.SHS_BREAK_GLASS_MFA_REQUIRED || "").trim().toLowerCase()) &&
    maxTtlMinutes(env);
  const requestedTtl = Number(input?.ttl_minutes || input?.ttlMinutes || 0);
  const normalizedReason = String(input?.reason || "").trim();

  if (!actor) {
    return { status: "DENIED", reasonCode: "AUTH_REQUIRED", ttlMinutes: null, auditEvent: "security.break_glass.denied" };
  }
  if (!configured) {
    return { status: "DENIED", reasonCode: "BREAK_GLASS_NOT_CONFIGURED", ttlMinutes: null, auditEvent: "security.break_glass.denied" };
  }
  if (!hasPermission(actor.permissions || actor.organization_scoped_permissions || [], SHS_SECURITY_PERMISSIONS.SECURITY_MANAGE)) {
    return { status: "DENIED", reasonCode: "SECURITY_MANAGE_REQUIRED", ttlMinutes: null, auditEvent: "security.break_glass.denied" };
  }
  if (normalizedReason.length < 16) {
    return { status: "DENIED", reasonCode: "REASON_REQUIRED", ttlMinutes: null, auditEvent: "security.break_glass.denied" };
  }
  const maxTtl = maxTtlMinutes(env);
  if (!Number.isInteger(requestedTtl) || requestedTtl <= 0 || !maxTtl || requestedTtl > maxTtl) {
    return { status: "DENIED", reasonCode: "TTL_OUT_OF_POLICY", ttlMinutes: null, auditEvent: "security.break_glass.denied" };
  }
  if (!hasMfaEvidence(actor)) {
    return { status: "DENIED", reasonCode: "MFA_REQUIRED", ttlMinutes: null, auditEvent: "security.break_glass.denied" };
  }

  return {
    status: "READY_FOR_EXTERNAL_MFA_ACTIVATION",
    reasonCode: "ATTESTED",
    ttlMinutes: requestedTtl,
    auditEvent: "security.break_glass.attested",
  };
}
