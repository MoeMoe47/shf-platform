import { AragRepo } from "../repo/arag-repo.js";

export type AragPolicyDecision = { decision: "ALLOW" | "DENY"; code?: string; reason?: string; policy?: any };

export interface AragPolicyEvaluator { evaluate(input: { request: any; organizationId: string; tenantId: string; actorUserId?: string; actorRoles?: string[] }): Promise<AragPolicyDecision>; }

export class DefaultAragPolicyEvaluator implements AragPolicyEvaluator {
  constructor(private repo = new AragRepo()) {}

  async evaluate(input: { request: any; organizationId: string; tenantId: string; actorUserId?: string; actorRoles?: string[] }) {
    const policy = await this.repo.getActiveWorkOrderPolicy(input.request.work_order_reference, input.organizationId, input.tenantId);
    if (!policy) return { decision: "DENY" as const, code: "RELEASE_POLICY_DENIED", reason: "No active ARAG work-order policy exists for this organization and tenant." };
    const now = new Date();
    if (policy.status !== "ACTIVE" || new Date(policy.effective_from) > now || (policy.expires_at && new Date(policy.expires_at) <= now)) return { decision: "DENY" as const, code: "RELEASE_POLICY_DENIED", reason: "The ARAG work-order policy is stale, retired, revoked, or outside its effective window.", policy };
    const includes = (value: unknown, expected: string) => Array.isArray(value) && value.length > 0 && value.includes(expected);
    if (!includes(policy.allowed_project_ids, input.request.project_id) || !includes(policy.allowed_repository_references, input.request.repository_reference) || !includes(policy.allowed_provider_keys, input.request.provider_key) || !includes(policy.allowed_target_environments, input.request.target_environment)) return { decision: "DENY" as const, code: "RELEASE_POLICY_DENIED", reason: "The release subject is outside the work-order policy scope.", policy };
    if (includes(policy.prohibited_actions, "release") || includes(policy.prohibited_actions, "release.execute")) return { decision: "DENY" as const, code: "RELEASE_POLICY_DENIED", reason: "The work-order policy prohibits release execution.", policy };
    const actorAllowed = (Array.isArray(policy.permitted_actor_user_ids) && policy.permitted_actor_user_ids.length > 0 && policy.permitted_actor_user_ids.includes(input.actorUserId)) || (Array.isArray(policy.permitted_actor_roles) && policy.permitted_actor_roles.length > 0 && (input.actorRoles || []).some((role) => policy.permitted_actor_roles.includes(role)));
    if (!actorAllowed) return { decision: "DENY" as const, code: "RELEASE_POLICY_DENIED", reason: "The actor is not permitted by the work-order policy.", policy };
    return { decision: "ALLOW" as const, policy };
  }
}
