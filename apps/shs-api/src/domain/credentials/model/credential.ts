// SHF Ecosystem Phase 7 — Credential model types.
export const CREDENTIAL_TYPES = ["INTERNAL", "EXTERNAL"] as const;
export type CredentialType = typeof CREDENTIAL_TYPES[number];

export const CREDENTIAL_DEFINITION_STATUSES = ["active", "inactive"] as const;
export type CredentialDefinitionStatus = typeof CREDENTIAL_DEFINITION_STATUSES[number];

export interface CredentialDefinition {
  id: string;
  slug: string;
  name: string;
  credentialType: CredentialType;
  issuingAuthority: string;
  description: string | null;
  careerId: string | null;
  requiresAcceptedCapstone: boolean;
  validityPeriodMonths: number | null;
  renewalWindowDays: number | null;
  status: CredentialDefinitionStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

// Bounded, stored lifecycle only — EXPIRED is never persisted here (see
// deriveLearnerCredentialLifecycle below).
export const LEARNER_CREDENTIAL_STATUSES = ["ISSUED", "REVOKED"] as const;
export type LearnerCredentialStoredStatus = typeof LEARNER_CREDENTIAL_STATUSES[number];

// The full displayed lifecycle, including derived states. "EXPIRED" and
// "RENEWAL_DUE" are computed at read time from expires_at/renewal_window
// — never written to the row — so a later policy correction can never
// leave a stale mutable status behind.
export type LearnerCredentialLifecycle = "ISSUED" | "RENEWAL_DUE" | "EXPIRED" | "REVOKED";

export interface LearnerCredential {
  id: string;
  credentialDefinitionId: string;
  learnerUserId: string;
  organizationId: string;
  status: LearnerCredentialStoredStatus;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  issuedByUserId: string;
  revokedByUserId: string | null;
  verificationId: string;
  credentialVersion: number;
  issuanceKey: string | null;
  provenance: Record<string, unknown>;
  verificationHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export function deriveLearnerCredentialLifecycle(
  credential: Pick<LearnerCredential, "status" | "expiresAt">,
  definition: Pick<CredentialDefinition, "renewalWindowDays">,
  now: Date = new Date(),
): LearnerCredentialLifecycle {
  if (credential.status === "REVOKED") return "REVOKED";
  if (!credential.expiresAt) return "ISSUED";
  const expiresAt = new Date(credential.expiresAt);
  if (expiresAt <= now) return "EXPIRED";
  if (definition.renewalWindowDays) {
    const renewalDueAt = new Date(expiresAt.getTime() - definition.renewalWindowDays * 86_400_000);
    if (renewalDueAt <= now) return "RENEWAL_DUE";
  }
  return "ISSUED";
}
