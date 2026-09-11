import { randomUUID } from "crypto";
import { withTransaction } from "../../../db/transaction.js";
import { isPlatformGlobalRole } from "../../../auth/security-permissions.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { FundingGrantRepo } from "../repo/funding-grant-repo.js";
import { FundingGrantError, GRANT_RESTRICTION_TYPES, GRANT_STATUSES } from "../model/funding-grant.js";

const SERVER_DERIVED_FIELDS = [
  "created_by", "createdBy", "created_by_user_id", "createdByUserId",
  "approved_by", "approvedBy", "activated_by", "activatedBy",
  "audit_actor", "auditActor", "tenant_id", "tenantId", "organization_id",
  "organizationId", "impact_producer", "impactProducer", "evidence_id",
  "evidenceId", "verified", "status_authority", "statusAuthority",
];

function actorId(actor: any) {
  return String(actor?.user_id || actor?.id || actor?.actor_user_id || "").trim();
}

function activeOrganizationId(actor: any) {
  return String(actor?.active_organization_id || actor?.organization_id || "").trim();
}

function actorHasPermission(actor: any, permission: string) {
  return Array.isArray(actor?.permissions) && actor.permissions.includes(permission);
}

function actorHasPlatformAuthority(actor: any) {
  const roles = Array.isArray(actor?.roles) ? actor.roles : [actor?.role, actor?.role_name].filter(Boolean);
  return roles.some((role: string) => isPlatformGlobalRole(role, actor?.role_scope_type));
}

function hasManage(actor: any) {
  return actorHasPlatformAuthority(actor) || actorHasPermission(actor, "funding.grant.manage");
}

function hasView(actor: any) {
  return hasManage(actor) || actorHasPermission(actor, "funding.grant.view");
}

function scopeFor(actor: any) {
  const organizationId = activeOrganizationId(actor);
  const userId = actorId(actor);
  if (!organizationId || !userId) throw new FundingGrantError("AUTH_REQUIRED", "Authenticated organization context is required.", 401);
  return {
    organization_id: organizationId,
    actor_id: userId,
    // Grant management permission is organization-scoped. Only the existing
    // platform-global role may intentionally bypass organization filtering.
    platform_global: actorHasPlatformAuthority(actor),
  };
}

function rejectServerDerived(input: any, extra: string[] = []) {
  const keys = new Set([...SERVER_DERIVED_FIELDS, ...extra]);
  for (const key of Object.keys(input || {})) {
    if (keys.has(key)) {
      throw new FundingGrantError("SERVER_DERIVED_AUTHORITY", `${key} is server-derived or not accepted from the browser.`, 400);
    }
  }
}

function normalizeAmount(value: any, field: string) {
  const raw = String(value ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new FundingGrantError("INVALID_AMOUNT", `${field} must be a non-negative decimal amount.`, 400);
  return Number(raw).toFixed(2);
}

function normalizeDate(value: any, field: string) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new FundingGrantError("INVALID_DATE", `${field} must be YYYY-MM-DD.`, 400);
  return raw;
}

function requiredText(input: any, key: string, label: string, max = 300) {
  const value = String(input?.[key] || "").trim();
  if (!value) throw new FundingGrantError("INVALID_REQUEST", `${label} is required.`, 400);
  return value.slice(0, max);
}

function requiredEither(input: any, camelKey: string, snakeKey: string, label: string, max = 300) {
  const value = String(input?.[camelKey] ?? input?.[snakeKey] ?? "").trim();
  if (!value) throw new FundingGrantError("INVALID_REQUEST", `${label} is required.`, 400);
  return value.slice(0, max);
}

function optionalText(input: any, key: string, max = 1000) {
  const value = String(input?.[key] || "").trim();
  return value ? value.slice(0, max) : null;
}

function decimalAdd(a: string, b: string) {
  return (Number(a) + Number(b)).toFixed(2);
}

function decimalGt(a: string, b: string) {
  return Number(a) > Number(b);
}

function dateKey(value: any) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value || "").slice(0, 10);
}

function transitionEvent(status: string) {
  if (status === "ACTIVE") return "funding.grant.activated";
  return `funding.grant.${String(status).toLowerCase()}`;
}

const ALLOWED_GRANT_TRANSITIONS: Record<string, string[]> = {
  AWARDED: ["ACTIVE", "CLOSED", "CANCELLED"],
  ACTIVE: ["SUSPENDED", "CLOSED", "CANCELLED"],
  SUSPENDED: ["ACTIVE", "CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

export class FundingGrantService {
  constructor(
    private repo = new FundingGrantRepo(),
    private auditWriter = writeAuditEvent,
  ) {}

  async listGrants(actor: any) {
    if (!hasView(actor)) throw new FundingGrantError("FORBIDDEN", "Funding grant view permission is required.", 403);
    return this.repo.listGrants(scopeFor(actor));
  }

  async getGrant(grantId: string, actor: any) {
    if (!hasView(actor)) throw new FundingGrantError("FORBIDDEN", "Funding grant view permission is required.", 403);
    return this.repo.getGrant(String(grantId || "").trim(), scopeFor(actor));
  }

  async createGrant(input: any, actor: any) {
    if (!hasManage(actor)) throw new FundingGrantError("FORBIDDEN", "Funding grant management permission is required.", 403);
    rejectServerDerived(input, ["status", "metadata_version", "metadataVersion"]);
    const scope = scopeFor(actor);
    const grant = {
      grant_id: `grant_${randomUUID()}`,
      grant_number: optionalText(input, "grantNumber", 120) || optionalText(input, "grant_number", 120),
      external_reference: optionalText(input, "externalReference", 180) || optionalText(input, "external_reference", 180),
      title: requiredText(input, "title", "Title"),
      funder_organization_id: requiredEither(input, "funderOrganizationId", "funder_organization_id", "Funder organization", 120),
      recipient_organization_id: requiredEither(input, "recipientOrganizationId", "recipient_organization_id", "Recipient organization", 120),
      reporting_organization_id: requiredEither(input, "reportingOrganizationId", "reporting_organization_id", "Reporting organization", 120),
      award_amount: normalizeAmount(input?.awardAmount ?? input?.award_amount, "Award amount"),
      currency: String(input?.currency || "USD").trim().toUpperCase(),
      start_date: normalizeDate(input?.startDate ?? input?.start_date, "Start date"),
      end_date: input?.endDate || input?.end_date ? normalizeDate(input?.endDate ?? input?.end_date, "End date") : null,
      purpose: optionalText(input, "purpose", 1000),
      restriction_type: String(input?.restrictionType || input?.restriction_type || "UNRESTRICTED").trim().toUpperCase(),
      restricted_program_id: optionalText(input, "restrictedProgramId", 120) || optionalText(input, "restricted_program_id", 120),
      created_by_user_id: scope.actor_id,
    };
    if (grant.currency !== "USD") throw new FundingGrantError("UNSUPPORTED_CURRENCY", "Phase 5 supports USD only.", 400);
    if (grant.funder_organization_id === grant.recipient_organization_id) {
      throw new FundingGrantError("INVALID_PARTIES", "Funder and recipient organizations must be distinct.", 400);
    }
    if (!GRANT_RESTRICTION_TYPES.includes(grant.restriction_type as any)) throw new FundingGrantError("INVALID_RESTRICTION", "Unsupported restriction type.", 400);
    if (grant.restriction_type === "PROGRAM_RESTRICTED" && !grant.restricted_program_id) throw new FundingGrantError("PROGRAM_REQUIRED", "Program restriction requires a restricted program.", 400);
    return withTransaction(async (executor) => {
      for (const organizationId of [grant.funder_organization_id, grant.recipient_organization_id, grant.reporting_organization_id]) {
        if (!await this.repo.organizationExists(organizationId, executor)) throw new FundingGrantError("ORGANIZATION_NOT_FOUND", `Organization not found: ${organizationId}`, 404);
      }
      if (grant.restricted_program_id && !await this.repo.getProgram(grant.restricted_program_id, executor)) {
        throw new FundingGrantError("PROGRAM_NOT_FOUND", "Restricted program not found.", 404);
      }
      const created = await this.repo.createGrant(grant, executor);
      await this.writeAudit("funding.grant.created", created.grant_id, scope, null, created, executor);
      return created;
    });
  }

  async transitionGrant(grantId: string, input: any, actor: any) {
    if (!hasManage(actor)) throw new FundingGrantError("FORBIDDEN", "Funding grant management permission is required.", 403);
    rejectServerDerived(input, ["created_by_user_id", "createdByUserId"]);
    const nextStatus = String(input?.status || "").trim().toUpperCase();
    if (!GRANT_STATUSES.includes(nextStatus as any)) throw new FundingGrantError("INVALID_STATUS", "Unsupported grant status.", 400);
    const scope = scopeFor(actor);
    return withTransaction(async (executor) => {
      const current = await this.repo.getGrantForUpdate(grantId, scope, executor);
      if (!current) throw new FundingGrantError("NOT_FOUND", "Grant not found.", 404);
      if (nextStatus === "ACTIVE" && current.status === "SUSPENDED" && current.end_date && dateKey(current.end_date) < dateKey(new Date())) {
        throw new FundingGrantError("FUNDING_EXPIRED", "Expired grants cannot be resumed.", 403);
      }
      if (["CLOSED", "CANCELLED"].includes(current.status) && current.status !== nextStatus) {
        throw new FundingGrantError("TERMINAL_STATUS", "Closed or cancelled grants cannot re-enter lifecycle.", 400);
      }
      if (!ALLOWED_GRANT_TRANSITIONS[current.status]?.includes(nextStatus)) {
        throw new FundingGrantError("INVALID_TRANSITION", `${current.status} cannot transition to ${nextStatus}.`, 409);
      }
      const updated = await this.repo.transitionGrant(grantId, nextStatus, executor);
      const hydrated = await this.repo.getGrantForAuthority(grantId, executor);
      await this.writeAudit(transitionEvent(nextStatus), grantId, scope, { status: current.status }, { status: updated.status }, executor);
      return hydrated;
    });
  }

  async authorizeFundedUse(input: any, actor: any) {
    if (!hasView(actor)) throw new FundingGrantError("FORBIDDEN", "Funding grant view permission is required.", 403);
    const scope = scopeFor(actor);
    const grantId = String(input?.grantId || input?.grant_id || "").trim();
    const programId = String(input?.programId || input?.program_id || "").trim();
    const occurredOn = String(input?.occurredOn || input?.occurred_on || "").trim();
    if (!grantId || !programId || !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) {
      throw new FundingGrantError("INVALID_USE", "Grant, program, and occurredOn (YYYY-MM-DD) are required.", 400);
    }
    return withTransaction(async (executor) => {
      const grant = await this.repo.getGrantForUpdate(grantId, scope, executor);
      if (!grant) throw new FundingGrantError("NOT_FOUND", "Grant not found.", 404);
      if (grant.status !== "ACTIVE") throw new FundingGrantError("FUNDING_NOT_ACTIVE", "Funded use requires an active grant.", 403);
      if (occurredOn < dateKey(grant.start_date) || (grant.end_date && occurredOn > dateKey(grant.end_date))) {
        throw new FundingGrantError("FUNDING_PERIOD_INVALID", "Funded use is outside the grant effective period.", 403);
      }
      const allocations = await this.repo.listAllocations(grantId, executor, scope);
      const allocation = allocations.find((item: any) => item.program_id === programId);
      if (!allocation) throw new FundingGrantError("PROGRAM_NOT_AUTHORIZED", "Grant has no allocation for this program.", 403);
      return {
        authorized: true,
        grant_id: grantId,
        allocation_id: allocation.allocation_id,
        program_id: programId,
        organization_id: scope.organization_id,
        occurred_on: occurredOn,
        authorization_basis: "ACTIVE_GRANT_PROGRAM_ALLOCATION",
      };
    });
  }

  async createAllocation(grantId: string, input: any, actor: any) {
    if (!hasManage(actor)) throw new FundingGrantError("FORBIDDEN", "Funding grant management permission is required.", 403);
    rejectServerDerived(input, ["remaining_amount", "remainingAmount", "allocated_total", "allocatedTotal"]);
    const scope = scopeFor(actor);
    const allocation = {
      allocation_id: `allocation_${randomUUID()}`,
      grant_id: String(grantId || "").trim(),
      program_id: requiredEither(input, "programId", "program_id", "Program", 120),
      allocated_amount: normalizeAmount(input?.allocatedAmount ?? input?.allocated_amount, "Allocated amount"),
      purpose: optionalText(input, "purpose", 1000),
      created_by_user_id: scope.actor_id,
    };
    return withTransaction(async (executor) => {
      const grant = await this.repo.getGrantForUpdate(allocation.grant_id, scope, executor);
      if (!grant) throw new FundingGrantError("NOT_FOUND", "Grant not found.", 404);
      if (["CLOSED", "CANCELLED"].includes(grant.status)) throw new FundingGrantError("GRANT_CLOSED", "Closed or cancelled grants cannot receive new allocations.", 400);
      if (grant.status === "SUSPENDED") throw new FundingGrantError("GRANT_SUSPENDED", "Suspended grants cannot receive new allocations.", 409);
      const program = await this.repo.getProgram(allocation.program_id, executor);
      if (!program) throw new FundingGrantError("PROGRAM_NOT_FOUND", "Program not found.", 404);
      if (grant.restriction_type === "PROGRAM_RESTRICTED" && grant.restricted_program_id !== allocation.program_id) {
        throw new FundingGrantError("RESTRICTION_VIOLATION", "This grant is restricted to a different program.", 403);
      }
      const allocated = await this.repo.sumAllocations(allocation.grant_id, executor);
      if (decimalGt(decimalAdd(allocated, allocation.allocated_amount), String(grant.award_amount))) {
        throw new FundingGrantError("OVER_ALLOCATED", "Program allocations cannot exceed the award amount.", 400);
      }
      const created = await this.repo.createAllocation(allocation, executor);
      await this.writeAudit("funding.allocation.created", created.allocation_id, scope, null, {
        allocation_id: created.allocation_id,
        grant_id: created.grant_id,
        program_id: created.program_id,
        allocated_amount: created.allocated_amount,
      }, executor);
      return this.repo.getGrantForAuthority(allocation.grant_id, executor);
    });
  }

  private async writeAudit(actionType: string, targetId: string, scope: any, previous: any, next: any, executor: any) {
    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: scope.organization_id,
      actor_user_id: scope.actor_id,
      target_object_type: actionType.startsWith("funding.allocation") ? "grant_program_allocation" : "funding_grant",
      target_object_id: targetId,
      action_type: actionType,
      previous_state_json: previous,
      new_state_json: next,
      reason_text: actionType,
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "shs-api",
    }, executor);
  }
}
