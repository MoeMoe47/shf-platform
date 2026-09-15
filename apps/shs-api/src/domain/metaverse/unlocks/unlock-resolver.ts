import { SILICON_HEARTLAND_CITY_ID } from "../registry/city-registry.js";
import {
  deterministicUnlockKey,
  validateUnlockIdentityContext,
  type CanonicalLearnerUnlockContext,
  type MetaverseAccessLevel,
  type MetaverseUnlockDecision,
  type MetaverseUnlockDecisionRecord,
  type MetaverseUnlockReasonCode,
} from "./unlock-contract.js";
import { explainUnlockDecision } from "./unlock-explanation.js";
import { activityRequirementGroup, districtRequirementGroup, facilityRequirementGroup, inferResourceType } from "./unlock-policy.js";
import { evaluateRequirementGroup, type MetaverseEligibilityFacts, type MetaverseRequirementGroup } from "./unlock-requirements.js";

export type MetaverseUnlockResource = {
  city_id?: string;
  district_id?: string | null;
  facility_id?: string | null;
  activity_id?: string | null;
  resource_id: string;
  access_level: MetaverseAccessLevel;
  organization_id: string;
  route_reference?: string | null;
};

function groupFor(resource: MetaverseUnlockResource): MetaverseRequirementGroup {
  if (resource.access_level === "DISTRICT_ACCESS") return districtRequirementGroup(resource.resource_id);
  if (resource.access_level === "FACILITY_ACCESS") return facilityRequirementGroup(resource.resource_id);
  if (resource.access_level === "CITY_ACCESS") return { operator: "ALL_OF", requirements: [{ id: "active-membership", type: "membership", authority: "identity-organization-membership", reason_code: "ROLE_ALLOWED", description: "Active canonical organization membership is required.", fact_key: "active_membership", expected: true }] };
  return activityRequirementGroup(resource.resource_id, resource.access_level);
}

function decide(input: {
  resource: MetaverseUnlockResource;
  groupOk: boolean;
  firstReason: MetaverseUnlockReasonCode;
  facts: MetaverseEligibilityFacts;
}): { decision: MetaverseUnlockDecision; reason: MetaverseUnlockReasonCode } {
  if (input.facts.user_suspended || input.facts.organization_suspended) return { decision: "RESTRICTED", reason: "SUSPENDED" };
  if (!input.facts.active_membership) return { decision: "RESTRICTED", reason: "REVOKED" };
  if ((input.facts.closed_resources || []).includes(input.resource.resource_id)) return { decision: "TEMPORARILY_UNAVAILABLE", reason: "ACTIVITY_CLOSED" };
  if (input.groupOk) {
    if ((input.facts.instructor_assignments || []).includes(input.resource.resource_id)) return { decision: "ASSIGNED", reason: "ASSIGNED" };
    if ((input.facts.outcomes || []).some((outcome) => outcome.outcome_id === input.resource.resource_id && outcome.type === "COMPLETED")) return { decision: "COMPLETED_ACCESSIBLE", reason: "VERIFIED_OUTCOME" };
    return { decision: "AVAILABLE", reason: input.firstReason };
  }
  if (input.resource.access_level === "CIVIC_SESSION_ACCESS") return { decision: "RESTRICTED", reason: "CIVIC_ELIGIBLE" };
  if (input.firstReason === "CREDENTIAL_VERIFIED") return { decision: "LOCKED", reason: "CREDENTIAL_REQUIRED" };
  if (input.firstReason === "ENROLLED") return { decision: "LOCKED", reason: "NOT_ENROLLED" };
  if (input.firstReason === "ASSIGNED") return { decision: "LOCKED", reason: "ASSIGNMENT_REQUIRED" };
  return { decision: "LOCKED", reason: "PREREQUISITE_MISSING" };
}

export function resolveMetaverseUnlock(input: {
  context: CanonicalLearnerUnlockContext;
  resource: MetaverseUnlockResource;
  facts: MetaverseEligibilityFacts;
  computed_at: string;
  expires_at?: string | null;
}): MetaverseUnlockDecisionRecord {
  const identityErrors = validateUnlockIdentityContext(input.context);
  if (identityErrors.length) throw new Error(identityErrors.join(","));
  if (input.context.client_claimed_unlock) throw new Error("client_cannot_grant_unlock");
  if (input.context.camera_context?.facility_id && input.context.camera_context.facility_id !== input.resource.facility_id) {
    throw new Error("camera_position_cannot_grant_unlock");
  }
  if (input.context.organization_id !== input.resource.organization_id || input.context.organization_id !== input.facts.organization_id) {
    throw new Error("cross_org_unlock_denied");
  }

  const group = groupFor(input.resource);
  const evaluation = evaluateRequirementGroup(group, input.facts);
  const firstReason = evaluation.firstRemaining?.reason_code || group.requirements.find((requirement) => evaluation.satisfied.includes(requirement.id))?.reason_code || "ORGANIZATION_POLICY";
  const decision = decide({ resource: input.resource, groupOk: evaluation.ok, firstReason, facts: input.facts });
  const nextAction = decision.decision === "LOCKED" ? evaluation.firstRemaining?.next_action || null : null;

  return {
    unlock_id: deterministicUnlockKey({
      user_id: input.context.user_id as string,
      organization_id: input.context.organization_id as string,
      resource_type: inferResourceType(input.resource.access_level),
      resource_id: input.resource.resource_id,
      access_level: input.resource.access_level,
    }),
    user_id: input.context.user_id as string,
    organization_id: input.context.organization_id as string,
    tenant_id: input.context.tenant_id,
    city_id: input.resource.city_id || SILICON_HEARTLAND_CITY_ID,
    district_id: input.resource.district_id || null,
    facility_id: input.resource.facility_id || null,
    activity_id: input.resource.activity_id || null,
    resource_type: inferResourceType(input.resource.access_level),
    resource_id: input.resource.resource_id,
    access_level: input.resource.access_level,
    decision: decision.decision,
    reason_code: decision.reason,
    reason_text: explainUnlockDecision({ decision: decision.decision, reasonCode: decision.reason, firstRemaining: evaluation.firstRemaining }),
    source_authorities: [...new Set(group.requirements.map((requirement) => requirement.authority))],
    source_facts: evaluation.sourceFacts,
    requirements: group.requirements.map((requirement) => requirement.id),
    requirements_satisfied: evaluation.satisfied,
    requirements_remaining: evaluation.remaining,
    next_action: nextAction,
    computed_at: input.computed_at,
    expires_at: input.expires_at ?? null,
    revalidation_policy: "server_recheck_required_at_protected_entry_and_on_authority_change",
    projection_version: "MET-3",
  };
}

export function canEnterProtectedMetaverseResource(decision: Pick<MetaverseUnlockDecisionRecord, "decision" | "expires_at">, now = new Date()): boolean {
  if (decision.expires_at && new Date(decision.expires_at) <= now) return false;
  return ["AVAILABLE", "ASSIGNED", "COMPLETED_ACCESSIBLE"].includes(decision.decision);
}
