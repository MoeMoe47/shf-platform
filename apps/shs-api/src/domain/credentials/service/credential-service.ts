// SHF Ecosystem Phase 7 — Credential eligibility, issuance, revocation.
//
// Critical invariant, enforced throughout this file: ELIGIBLE != ISSUED.
// isEligibleForCredential() is a pure read — it never creates a row.
// Only issueCredential() creates canonical achievement truth, and it
// always requires explicit issuer authority; eligibility is never
// sufficient by itself (an eligible-but-not-yet-issued learner has
// nothing — no partial/pending row is ever written).
import { randomUUID } from "crypto";
import { query } from "../../../db/client.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isAdminTier } from "../../shared/audience-eligibility.js";
import { CredentialDefinitionRepo } from "../repo/credential-definition-repo.js";
import { LearnerCredentialRepo } from "../repo/learner-credential-repo.js";
import { CredentialDefinition, LearnerCredential, deriveLearnerCredentialLifecycle } from "../model/credential.js";

const definitionRepo = new CredentialDefinitionRepo();
const learnerCredentialRepo = new LearnerCredentialRepo();

export class CredentialError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "CredentialError";
  }
}

export interface CredentialActor {
  user_id: string;
  organization_id: string;
  roles: string[];
  permissions: string[];
}

function scope(actor: CredentialActor) {
  const organizationId = String(actor.organization_id || "");
  const userId = String(actor.user_id || "");
  if (!organizationId || !userId) throw new CredentialError("SCOPE_MISSING", "Actor organization/user is required.", 403);
  return { organizationId, userId, tenantId: `tenant:${organizationId}` };
}

// --- Credential Definition (global reference data) ---

export async function createCredentialDefinition(actor: CredentialActor, input: {
  slug: string; name: string; credentialType: string; issuingAuthority: string; description?: string;
  careerId?: string; requiresAcceptedCapstone?: boolean; validityPeriodMonths?: number; renewalWindowDays?: number;
}): Promise<CredentialDefinition> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.CREDENTIAL_DEFINITION_MANAGE)) {
    throw new CredentialError("FORBIDDEN", "Only an authorized admin or program manager may define Credentials.", 403);
  }
  const { userId } = scope(actor);
  if (!input.slug?.trim() || !input.name?.trim() || !input.issuingAuthority?.trim()) {
    throw new CredentialError("VALIDATION_ERROR", "slug, name, and issuingAuthority are required.", 400);
  }
  if (!["INTERNAL", "EXTERNAL"].includes(input.credentialType)) {
    throw new CredentialError("INVALID_CREDENTIAL_TYPE", "credentialType must be INTERNAL or EXTERNAL.", 400);
  }
  if (input.careerId) {
    const career = await query("SELECT 1 FROM careers WHERE career_id=$1 LIMIT 1", [input.careerId]);
    if (!career.rows[0]) throw new CredentialError("CAREER_NOT_FOUND", "Career not found.", 400);
  }
  if (input.renewalWindowDays && !input.validityPeriodMonths) {
    throw new CredentialError("RENEWAL_REQUIRES_VALIDITY_PERIOD", "renewalWindowDays requires a validityPeriodMonths — a lifetime credential cannot have a renewal date.", 400);
  }
  const existing = await definitionRepo.getBySlug(input.slug.trim());
  if (existing) throw new CredentialError("DUPLICATE_SLUG", "A Credential Definition with this slug already exists.", 409);
  return definitionRepo.create({
    id: `credential_definition_${randomUUID()}`,
    slug: input.slug.trim(),
    name: input.name.trim(),
    credentialType: input.credentialType,
    issuingAuthority: input.issuingAuthority.trim(),
    description: input.description ?? null,
    careerId: input.careerId ?? null,
    requiresAcceptedCapstone: !!input.requiresAcceptedCapstone,
    validityPeriodMonths: input.validityPeriodMonths ?? null,
    renewalWindowDays: input.renewalWindowDays ?? null,
    createdByUserId: userId,
  });
}

export async function listCredentialDefinitions(): Promise<CredentialDefinition[]> {
  return definitionRepo.listActive();
}

// --- Eligibility (read-only; never creates a row) ---

export interface EligibilityResult {
  credentialDefinitionId: string;
  eligible: boolean;
  reason: "NO_REQUIREMENT_DEFINED" | "ACCEPTED_CAPSTONE_FOUND" | "ACCEPTED_CAPSTONE_MISSING";
}

export async function isEligibleForCredential(actor: CredentialActor, credentialDefinitionId: string): Promise<EligibilityResult> {
  const { organizationId, userId } = scope(actor);
  const definition = await definitionRepo.getById(credentialDefinitionId);
  if (!definition) throw new CredentialError("CREDENTIAL_DEFINITION_NOT_FOUND", "Credential Definition not found.", 404);
  if (!definition.requiresAcceptedCapstone) {
    // No automatic eligibility rule is defined for this credential —
    // issuance for it is manual/institutional-approval-only. This is not
    // an error; it truthfully reports that eligibility isn't
    // automatically determinable, matching the phase's deliberate
    // decision not to build a generic, unproven requirements engine.
    return { credentialDefinitionId, eligible: false, reason: "NO_REQUIREMENT_DEFINED" };
  }
  const hasCapstone = await learnerCredentialRepo.hasAcceptedCapstone(organizationId, userId);
  return {
    credentialDefinitionId,
    eligible: hasCapstone,
    reason: hasCapstone ? "ACCEPTED_CAPSTONE_FOUND" : "ACCEPTED_CAPSTONE_MISSING",
  };
}

// --- Issuance (authority required; the sole path to canonical achievement truth) ---

export async function issueCredential(actor: CredentialActor, input: { credentialDefinitionId: string; learnerUserId: string }): Promise<LearnerCredential> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.CREDENTIAL_ISSUE)) {
    throw new CredentialError("FORBIDDEN", "Only an authorized admin or program manager may issue Credentials. Students cannot self-issue.", 403);
  }
  const { organizationId, tenantId, userId } = scope(actor);
  const definition = await definitionRepo.getById(input.credentialDefinitionId);
  if (!definition || definition.status !== "active") {
    throw new CredentialError("CREDENTIAL_DEFINITION_NOT_FOUND", "Credential Definition not found or inactive.", 404);
  }
  const learner = await query("SELECT 1 FROM users WHERE user_id=$1 AND organization_id=$2 LIMIT 1", [input.learnerUserId, organizationId]);
  if (!learner.rows[0]) throw new CredentialError("LEARNER_NOT_FOUND", "Learner not found in this organization.", 400);
  // Issuance is always explicit/manual — an authorized issuer may issue
  // regardless of the automatic eligibility signal (matches the phase
  // brief's "prefer explicit/manual issuance" default; eligibility is
  // advisory information for the issuer's own UI, never a hard gate here
  // — the alternative, blocking issuance on an unproven automatic rule,
  // would be a worse failure mode than trusting the human authority the
  // permission system already vouches for).
  if (await learnerCredentialRepo.hasActiveIssuance(input.credentialDefinitionId, input.learnerUserId)) {
    throw new CredentialError("DUPLICATE_ISSUANCE", "This learner already holds an active issuance of this Credential.", 409);
  }
  const expiresAt = definition.validityPeriodMonths
    ? new Date(Date.now() + definition.validityPeriodMonths * 30 * 86_400_000).toISOString()
    : null;
  return learnerCredentialRepo.create({
    id: `learner_credential_${randomUUID()}`,
    credentialDefinitionId: definition.id,
    learnerUserId: input.learnerUserId,
    organizationId,
    tenantId,
    expiresAt,
    issuedByUserId: userId,
    verificationId: randomUUID(),
  });
}

export async function revokeCredential(actor: CredentialActor, learnerCredentialId: string): Promise<LearnerCredential> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.CREDENTIAL_REVOKE)) {
    throw new CredentialError("FORBIDDEN", "Only an authorized admin or program manager may revoke Credentials.", 403);
  }
  const { organizationId, userId } = scope(actor);
  const revoked = await learnerCredentialRepo.revoke(learnerCredentialId, organizationId, userId);
  if (!revoked) throw new CredentialError("LEARNER_CREDENTIAL_NOT_FOUND", "No active issuance found to revoke.", 404);
  return revoked;
}

// --- Reads (entitlement-scoped) ---

export interface LearnerCredentialView extends LearnerCredential {
  lifecycle: ReturnType<typeof deriveLearnerCredentialLifecycle>;
  // Computed once, server-side, from expiresAt - renewalWindowDays — the
  // same arithmetic deriveLearnerCredentialLifecycle already uses
  // internally. Only present when both a real expiration and a real
  // renewal window exist; a lifetime credential's renewalDueAt is always
  // null, never fabricated.
  renewalDueAt: string | null;
  definition: Pick<CredentialDefinition, "id" | "slug" | "name" | "credentialType" | "issuingAuthority" | "careerId">;
}

async function withLifecycle(credential: LearnerCredential): Promise<LearnerCredentialView | null> {
  const definition = await definitionRepo.getById(credential.credentialDefinitionId);
  if (!definition) return null;
  const renewalDueAt = credential.expiresAt && definition.renewalWindowDays
    ? new Date(new Date(credential.expiresAt).getTime() - definition.renewalWindowDays * 86_400_000).toISOString()
    : null;
  return {
    ...credential,
    lifecycle: deriveLearnerCredentialLifecycle(credential, definition),
    renewalDueAt,
    definition: { id: definition.id, slug: definition.slug, name: definition.name, credentialType: definition.credentialType, issuingAuthority: definition.issuingAuthority, careerId: definition.careerId },
  };
}

// Admin-tier sees every organization issuance; a student sees only their
// own — never another learner's Credential list (direct-ID protection is
// enforced identically in getCredentialForActor below).
export async function listCredentialsForActor(actor: CredentialActor): Promise<LearnerCredentialView[]> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW)) {
    throw new CredentialError("FORBIDDEN", "Missing credential.view permission.", 403);
  }
  const { organizationId, userId } = scope(actor);
  const rows = isAdminTier(actor.roles)
    ? await learnerCredentialRepo.listForOrganization(organizationId)
    : await learnerCredentialRepo.listForLearner(organizationId, userId);
  const views = await Promise.all(rows.map(withLifecycle));
  return views.filter((v): v is LearnerCredentialView => v !== null);
}

export async function getCredentialForActor(actor: CredentialActor, learnerCredentialId: string): Promise<LearnerCredentialView | null> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW)) {
    throw new CredentialError("FORBIDDEN", "Missing credential.view permission.", 403);
  }
  const { organizationId, userId } = scope(actor);
  const credential = await learnerCredentialRepo.getById(learnerCredentialId);
  if (!credential || credential.organizationId !== organizationId) return null;
  if (!isAdminTier(actor.roles) && credential.learnerUserId !== userId) return null;
  return withLifecycle(credential);
}
