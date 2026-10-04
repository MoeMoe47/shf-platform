import { randomUUID } from "crypto";
import { withTransaction } from "../../../db/transaction.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import {
  SALES_CURRENCIES,
  SALES_DISCOVERY_STATUSES,
  SALES_NEED_PRIORITIES,
  SALES_NEED_STATUSES,
  SALES_NEED_TYPES,
  SALES_OPPORTUNITY_STAGES,
  SALES_OPPORTUNITY_STATUSES,
  SALES_RELATIONSHIP_STATUSES,
  SALES_RELATIONSHIP_TYPES,
} from "../model/sales-record.js";
import { SalesRepo, SalesScope } from "../repo/sales-repo.js";
import { evaluateSalesOpportunityStageTransition } from "./sales-stage-transition-policy.js";

const SERVER_DERIVED_FIELDS = [
  "id", "tenantId", "tenant_id", "organizationId", "organization_id",
  "actor_id", "createdByUserId", "updatedByUserId",
  "createdBy", "created_by_user_id", "updatedBy", "updated_by_user_id",
  "createdAt", "created_at", "updatedAt", "updated_at", "archivedAt",
  "archived_at", "version", "canonicalOrganization", "organizationName",
  "organizationType", "address",
];

function actorId(actor: any) {
  return String(actor?.user_id || actor?.id || actor?.actor_user_id || "").trim();
}

function activeOrganizationId(actor: any) {
  return String(actor?.active_organization_id || "").trim();
}

function scopeFromActor(actor: any): SalesScope & { actor_id: string } {
  const organizationId = activeOrganizationId(actor);
  const userId = actorId(actor);
  const tenantId = String(actor?.tenant_id || "").trim();
  if (!organizationId || !tenantId || !userId) throw new SalesError("AUTH_REQUIRED", "Authenticated organization context is required.", 401);
  return { organization_id: organizationId, tenant_id: tenantId, actor_id: userId };
}

function rejectServerDerived(input: any) {
  for (const key of Object.keys(input || {})) {
    if (SERVER_DERIVED_FIELDS.includes(key)) {
      throw new SalesError("SERVER_DERIVED_AUTHORITY", `${key} is server-derived or belongs to another canonical authority.`, 400);
    }
  }
}

function text(input: any, camel: string, snake: string, label: string, max = 400, required = false) {
  const raw = String(input?.[camel] ?? input?.[snake] ?? "").trim();
  if (!raw && required) throw new SalesError("INVALID_REQUEST", `${label} is required.`, 400);
  return raw ? raw.slice(0, max) : null;
}

function enumValue<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number], label: string): T[number] {
  const raw = String(value || fallback).trim().toUpperCase();
  if (!allowed.includes(raw)) throw new SalesError("INVALID_REQUEST", `${label} is not supported.`, 400);
  return raw as T[number];
}

function stringArray(input: any, camel: string, snake: string) {
  const value = input?.[camel] ?? input?.[snake];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim())) {
    throw new SalesError("INVALID_REQUEST", `${camel} must be an array of IDs or text values.`, 400);
  }
  return value.map((item) => item.trim());
}

function optionalDate(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim();
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    throw new SalesError("INVALID_REQUEST", `${label} must be YYYY-MM-DD.`, 400);
  }
  return raw;
}

function optionalMoney(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new SalesError("INVALID_REQUEST", "estimatedValue cannot be negative.", 400);
  return amount.toFixed(2);
}

export class SalesError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "SalesError";
  }
}

export class SalesService {
  constructor(
    private repo = new SalesRepo(),
    private auditWriter = writeAuditEvent,
  ) {}

  async listRelationships(actor: any) { return this.repo.listRelationships(scopeFromActor(actor)); }
  async getRelationship(id: string, actor: any) { return this.repo.getRelationship(id, scopeFromActor(actor)); }
  async listDiscoveryRecords(actor: any) { return this.repo.listDiscoveryRecords(scopeFromActor(actor)); }
  async getDiscoveryRecord(id: string, actor: any) { return this.repo.getDiscoveryRecord(id, scopeFromActor(actor)); }
  async listNeeds(actor: any) { return this.repo.listNeeds(scopeFromActor(actor)); }
  async getNeed(id: string, actor: any) { return this.repo.getNeed(id, scopeFromActor(actor)); }
  async listOpportunities(actor: any) { return this.repo.listOpportunities(scopeFromActor(actor)); }
  async getOpportunity(id: string, actor: any) { return this.repo.getOpportunity(id, scopeFromActor(actor)); }

  async createRelationship(input: any, actor: any) {
    rejectServerDerived(input);
    const scope = scopeFromActor(actor);
    const accountOrganizationId = await this.requireAccountOrganization(input, scope, actor);
    const ownerUserId = text(input, "ownerUserId", "owner_user_id", "Owner user", 160);
    if (ownerUserId) await this.requireOwner(ownerUserId, scope);
    const payload = {
      relationship_id: `sales_rel_${randomUUID()}`,
      ...scope,
      account_organization_id: accountOrganizationId,
      relationship_type: enumValue(input?.relationshipType ?? input?.relationship_type, SALES_RELATIONSHIP_TYPES, "BUYER", "relationshipType"),
      relationship_status: enumValue(input?.relationshipStatus ?? input?.relationship_status, SALES_RELATIONSHIP_STATUSES, "PROSPECT", "relationshipStatus"),
      owner_user_id: ownerUserId,
      source: text(input, "source", "source", "Source", 160),
      notes: text(input, "notes", "notes", "Notes", 4000),
    };
    return withTransaction(async (executor) => {
      const created = await this.repo.createRelationship(payload, executor);
      await this.audit("sales.relationship", created.relationship_id, "sales.relationship.created", scope, null, this.auditShape(created), executor);
      return created;
    });
  }

  async updateRelationship(id: string, input: any, actor: any) {
    rejectServerDerived(input);
    const scope = scopeFromActor(actor);
    const nextStatus = String(input?.relationshipStatus ?? input?.relationship_status ?? "").trim().toUpperCase();
    const action = nextStatus === "CLOSED" ? "relationship.archived" : "relationship.updated";
    const ownerUserId = text(input, "ownerUserId", "owner_user_id", "Owner user", 160);
    if (ownerUserId) await this.requireOwner(ownerUserId, scope);
    return this.updateWithAudit("sales.relationship", id, action, scope, input, this.repo.getRelationship.bind(this.repo), async (executor) => this.repo.updateRelationship(id, scope, {
      relationship_type: input?.relationshipType || input?.relationship_type ? enumValue(input?.relationshipType ?? input?.relationship_type, SALES_RELATIONSHIP_TYPES, "BUYER", "relationshipType") : null,
      relationship_status: input?.relationshipStatus || input?.relationship_status ? enumValue(input?.relationshipStatus ?? input?.relationship_status, SALES_RELATIONSHIP_STATUSES, "PROSPECT", "relationshipStatus") : null,
      owner_user_id: ownerUserId,
      source: text(input, "source", "source", "Source", 160),
      notes: text(input, "notes", "notes", "Notes", 4000),
      actor_id: scope.actor_id,
    }, executor));
  }

  async createDiscoveryRecord(input: any, actor: any) {
    rejectServerDerived(input);
    const scope = scopeFromActor(actor);
    const accountOrganizationId = await this.requireAccountOrganization(input, scope, actor);
    const relationshipId = text(input, "relationshipId", "relationship_id", "Relationship", 160);
    if (relationshipId) await this.requireReference("relationship", relationshipId, scope, accountOrganizationId);
    const payload = {
      discovery_record_id: `sales_disc_${randomUUID()}`,
      ...scope,
      account_organization_id: accountOrganizationId,
      relationship_id: relationshipId,
      discovery_status: enumValue(input?.discoveryStatus ?? input?.discovery_status, SALES_DISCOVERY_STATUSES, "NOT_STARTED", "discoveryStatus"),
      business_goals: stringArray(input, "businessGoals", "business_goals") || [],
      pain_points: stringArray(input, "painPoints", "pain_points") || [],
      current_processes: stringArray(input, "currentProcesses", "current_processes") || [],
      constraints: stringArray(input, "constraints", "constraints") || [],
      timeline: text(input, "timeline", "timeline", "Timeline", 1000),
      budget_context: text(input, "budgetContext", "budget_context", "Budget context", 1000),
      decision_process: text(input, "decisionProcess", "decision_process", "Decision process", 1000),
      stakeholder_context: text(input, "stakeholderContext", "stakeholder_context", "Stakeholder context", 1000),
      notes: text(input, "notes", "notes", "Notes", 4000),
    };
    return withTransaction(async (executor) => {
      const created = await this.repo.createDiscoveryRecord(payload, executor);
      await this.audit("sales.discovery", created.discovery_record_id, "sales.discovery.created", scope, null, this.auditShape(created), executor);
      return created;
    });
  }

  async updateDiscoveryRecord(id: string, input: any, actor: any) {
    rejectServerDerived(input);
    const scope = scopeFromActor(actor);
    return this.updateWithAudit("sales.discovery", id, "discovery.updated", scope, input, this.repo.getDiscoveryRecord.bind(this.repo), async (executor) => this.repo.updateDiscoveryRecord(id, scope, {
      discovery_status: input?.discoveryStatus || input?.discovery_status ? enumValue(input?.discoveryStatus ?? input?.discovery_status, SALES_DISCOVERY_STATUSES, "NOT_STARTED", "discoveryStatus") : null,
      business_goals: stringArray(input, "businessGoals", "business_goals"),
      pain_points: stringArray(input, "painPoints", "pain_points"),
      current_processes: stringArray(input, "currentProcesses", "current_processes"),
      constraints: stringArray(input, "constraints", "constraints"),
      timeline: text(input, "timeline", "timeline", "Timeline", 1000),
      budget_context: text(input, "budgetContext", "budget_context", "Budget context", 1000),
      decision_process: text(input, "decisionProcess", "decision_process", "Decision process", 1000),
      stakeholder_context: text(input, "stakeholderContext", "stakeholder_context", "Stakeholder context", 1000),
      notes: text(input, "notes", "notes", "Notes", 4000),
      actor_id: scope.actor_id,
    }, executor));
  }

  async createNeed(input: any, actor: any) {
    rejectServerDerived(input);
    const scope = scopeFromActor(actor);
    const accountOrganizationId = await this.requireAccountOrganization(input, scope, actor);
    const discoveryRecordId = text(input, "discoveryRecordId", "discovery_record_id", "Discovery record", 160);
    if (discoveryRecordId) await this.requireReference("discovery", discoveryRecordId, scope, accountOrganizationId);
    const payload = {
      need_id: `sales_need_${randomUUID()}`,
      ...scope,
      account_organization_id: accountOrganizationId,
      discovery_record_id: discoveryRecordId,
      need_type: enumValue(input?.needType ?? input?.need_type, SALES_NEED_TYPES, "BUSINESS", "needType"),
      title: text(input, "title", "title", "Title", 300, true),
      description: text(input, "description", "description", "Description", 2000),
      priority: enumValue(input?.priority, SALES_NEED_PRIORITIES, "MEDIUM", "priority"),
      status: enumValue(input?.status, SALES_NEED_STATUSES, "OPEN", "status"),
      source: text(input, "source", "source", "Source", 160),
    };
    return withTransaction(async (executor) => {
      const created = await this.repo.createNeed(payload, executor);
      await this.audit("sales.need", created.need_id, "sales.need.created", scope, null, this.auditShape(created), executor);
      return created;
    });
  }

  async updateNeed(id: string, input: any, actor: any) {
    rejectServerDerived(input);
    const scope = scopeFromActor(actor);
    const requestedStatus = input?.status;
    const action = requestedStatus === "CLOSED" ? "need.archived"
      : requestedStatus ? "need.status_changed" : "need.updated";
    return this.updateWithAudit("sales.need", id, action, scope, input, this.repo.getNeed.bind(this.repo), async (executor) => this.repo.updateNeed(id, scope, {
      need_type: input?.needType || input?.need_type ? enumValue(input?.needType ?? input?.need_type, SALES_NEED_TYPES, "BUSINESS", "needType") : null,
      title: text(input, "title", "title", "Title", 300),
      description: text(input, "description", "description", "Description", 2000),
      priority: input?.priority ? enumValue(input?.priority, SALES_NEED_PRIORITIES, "MEDIUM", "priority") : null,
      status: input?.status ? enumValue(input?.status, SALES_NEED_STATUSES, "OPEN", "status") : null,
      source: text(input, "source", "source", "Source", 160),
      actor_id: scope.actor_id,
    }, executor));
  }

  async createOpportunity(input: any, actor: any) {
    rejectServerDerived(input);
    const scope = scopeFromActor(actor);
    const accountOrganizationId = await this.requireAccountOrganization(input, scope, actor);
    const relationshipId = text(input, "relationshipId", "relationship_id", "Relationship", 160);
    if (relationshipId) await this.requireReference("relationship", relationshipId, scope, accountOrganizationId);
    const discoveryRecordId = text(input, "discoveryRecordId", "discovery_record_id", "Discovery record", 160);
    if (discoveryRecordId) await this.requireReference("discovery", discoveryRecordId, scope, accountOrganizationId);
    const primaryNeedIds = stringArray(input, "primaryNeedIds", "primary_need_ids") || [];
    for (const needId of primaryNeedIds) await this.requireReference("need", needId, scope, accountOrganizationId);
    const stage = enumValue(input?.stage, SALES_OPPORTUNITY_STAGES, "TARGET", "stage");
    const status = enumValue(input?.status, SALES_OPPORTUNITY_STATUSES, "OPEN", "status");
    if (stage !== "TARGET" || !["OPEN", "PAUSED"].includes(status)) {
      throw new SalesError("INVALID_TRANSITION", "New Opportunities must begin at TARGET with an OPEN or PAUSED status.", 400);
    }
    const ownerUserId = text(input, "ownerUserId", "owner_user_id", "Owner user", 160);
    if (ownerUserId) await this.requireOwner(ownerUserId, scope);
    const payload = {
      opportunity_id: `sales_opp_${randomUUID()}`,
      ...scope,
      account_organization_id: accountOrganizationId,
      relationship_id: relationshipId,
      discovery_record_id: discoveryRecordId,
      stage,
      status,
      name: text(input, "name", "name", "Name", 300, true),
      estimated_value: optionalMoney(input?.estimatedValue ?? input?.estimated_value),
      currency: enumValue(input?.currency, SALES_CURRENCIES, "USD", "currency"),
      target_close_date: optionalDate(input?.targetCloseDate ?? input?.target_close_date, "targetCloseDate"),
      owner_user_id: ownerUserId,
      primary_need_ids: primaryNeedIds,
      employer_incentive_assessment_ids: stringArray(input, "employerIncentiveAssessmentIds", "employer_incentive_assessment_ids") || [],
    };
    return withTransaction(async (executor) => {
      const created = await this.repo.createOpportunity(payload, executor);
      await this.audit("sales.opportunity", created.opportunity_id, "sales.opportunity.created", scope, null, this.auditShape(created), executor);
      return created;
    });
  }

  async updateOpportunity(id: string, input: any, actor: any) {
    rejectServerDerived(input);
    const scope = scopeFromActor(actor);
    const primaryNeedIds = stringArray(input, "primaryNeedIds", "primary_need_ids");
    return withTransaction(async (executor) => {
      const current = await this.repo.getOpportunityForUpdate(id, scope, executor);
      if (!current) return null;
      const requestedStage = input?.stage ? enumValue(input.stage, SALES_OPPORTUNITY_STAGES, "TARGET", "stage") : current.stage;
      let requestedStatus = input?.status ? enumValue(input.status, SALES_OPPORTUNITY_STATUSES, "OPEN", "status") : current.status;
      if (["WON", "LOST", "ARCHIVED"].includes(current.status)
        && (requestedStage !== current.stage || requestedStatus !== current.status)) {
        throw new SalesError("INVALID_TRANSITION", "Closed Opportunities cannot be reopened or moved to another stage.", 409);
      }
      let stage = input?.stage ? requestedStage : null;
      if (requestedStage === "LOST" || requestedStatus === "LOST") {
        stage = "LOST";
        requestedStatus = "LOST";
      }

      if (primaryNeedIds) {
        for (const needId of primaryNeedIds) {
          await this.requireReference("need", needId, scope, current.account_organization_id, executor);
        }
      }
      const ownerUserId = text(input, "ownerUserId", "owner_user_id", "Owner user", 160);
      if (ownerUserId) await this.requireOwner(ownerUserId, scope, executor);

      let transitionDecision: any = null;
      const stageRequested = requestedStage !== current.stage;
      const wonRequested = requestedStatus === "WON";
      if (stageRequested || wonRequested) {
        const relationship = current.relationship_id
          ? await this.requireReference("relationship", current.relationship_id, scope, current.account_organization_id, executor)
          : null;
        const discovery = current.discovery_record_id
          ? await this.requireReference("discovery", current.discovery_record_id, scope, current.account_organization_id, executor)
          : null;
        const activeNeeds = await this.repo.listActiveNeedsForAccount(current.account_organization_id, scope, executor);
        transitionDecision = evaluateSalesOpportunityStageTransition(
          current.stage,
          wonRequested ? "WON" : requestedStage,
          {
            relationshipStatus: relationship?.relationship_status,
            discoveryStatus: discovery?.discovery_status,
            hasActiveNeed: activeNeeds.length > 0,
            productAuthorityConnected: false,
            fundingReviewComplete: false,
            noFundingNeeded: false,
            proposalAuthorityConnected: false,
            contractAuthorityConnected: false,
          },
        );
        if (!transitionDecision.allowed) {
          throw new SalesError(transitionDecision.code, transitionDecision.message, 409);
        }
      }

      const updated = await this.repo.updateOpportunity(id, scope, {
        stage,
        status: requestedStatus !== current.status ? requestedStatus : null,
        name: text(input, "name", "name", "Name", 300),
        estimated_value: optionalMoney(input?.estimatedValue ?? input?.estimated_value),
        currency: input?.currency ? enumValue(input.currency, SALES_CURRENCIES, "USD", "currency") : null,
        target_close_date: optionalDate(input?.targetCloseDate ?? input?.target_close_date, "targetCloseDate"),
        owner_user_id: ownerUserId,
        primary_need_ids: primaryNeedIds,
        employer_incentive_assessment_ids: stringArray(input, "employerIncentiveAssessmentIds", "employer_incentive_assessment_ids"),
        actor_id: scope.actor_id,
      }, executor);
      if (!updated) return null;
      if (transitionDecision) updated.transition_decision = transitionDecision;
      const action = requestedStatus === "ARCHIVED" ? "sales.opportunity.archived"
        : requestedStatus === "WON" || requestedStatus === "LOST" ? "sales.opportunity.closed"
          : stageRequested ? "sales.opportunity.stage_changed" : "sales.opportunity.updated";
      await this.audit("sales.opportunity", id, action, scope, this.auditShape(current), this.auditShape(updated), executor);
      return updated;
    });
  }

  async archiveDiscoveryRecord(id: string, actor: any) {
    const scope = scopeFromActor(actor);
    return this.updateWithAudit(
      "sales.discovery",
      id,
      "discovery.archived",
      scope,
      {},
      this.repo.getDiscoveryRecord.bind(this.repo),
      async (executor) => this.repo.archiveDiscoveryRecord(id, scope, scope.actor_id, executor),
    );
  }

  private async requireAccountOrganization(input: any, scope: SalesScope, actor: any) {
    const organizationId = text(input, "accountOrganizationId", "account_organization_id", "accountOrganizationId", 160, true) as string;
    if (!await this.repo.organizationExists(organizationId)) {
      throw new SalesError("ORGANIZATION_NOT_FOUND", "Canonical account organization was not found.", 404);
    }
    if (organizationId !== scope.organization_id && !actor?.permissions?.includes("organization.view")) {
      throw new SalesError("ORGANIZATION_REFERENCE_NOT_AUTHORIZED", "Organization authority has not permitted this account reference for the current actor.", 403);
    }
    return organizationId;
  }

  private async requireReference(type: "relationship" | "discovery" | "need", id: string, scope: SalesScope, accountOrganizationId: string, executor?: any) {
    const reference = await this.repo.getLinkReference(type, id, executor);
    if (!reference || reference.archived_at) {
      throw new SalesError("REFERENCE_NOT_FOUND", `Linked Sales ${type} record was not found.`, 404);
    }
    if (reference.tenant_id !== scope.tenant_id || reference.organization_id !== scope.organization_id) {
      throw new SalesError("REFERENCE_TENANT_MISMATCH", "Linked Sales record is outside the current tenant scope.", 404);
    }
    if (reference.account_organization_id !== accountOrganizationId) {
      throw new SalesError("CROSS_ACCOUNT_REFERENCE", "Linked Sales record belongs to a different account organization.", 409);
    }
    return reference;
  }

  private async requireOwner(userId: string, scope: SalesScope, executor?: any) {
    if (!await this.repo.userBelongsToOrganization(userId, scope.organization_id, executor)) {
      throw new SalesError("OWNER_NOT_IN_TENANT", "Assigned owner must be an active member of the Sales organization.", 400);
    }
  }

  private async updateWithAudit(targetType: string, id: string, actionSuffix: string, scope: SalesScope & { actor_id: string }, input: any, getCurrent: (id: string, scope: SalesScope, executor: any) => Promise<any>, update: (executor: any, current: any) => Promise<any>, autoAudit = true) {
    return withTransaction(async (executor) => {
      const current = await getCurrent(id, scope, executor);
      if (!current) return null;
      const updated = await update(executor, current);
      if (!updated) return null;
      if (autoAudit) await this.audit(targetType, id, `sales.${actionSuffix}`, scope, this.auditShape(current), this.auditShape(updated), executor, input?.reason || null);
      return updated;
    });
  }

  private auditShape(row: any) {
    if (!row) return null;
    const shaped: any = {
      id: row.relationship_id || row.discovery_record_id || row.need_id || row.opportunity_id,
      organization_id: row.organization_id,
      tenant_id: row.tenant_id,
      account_organization_id: row.account_organization_id,
      status: row.relationship_status || row.discovery_status || row.status,
      stage: row.stage,
      version: row.version,
      archived_at: row.archived_at || null,
    };
    return shaped;
  }

  private async audit(targetType: string, targetId: string, action: string, scope: SalesScope & { actor_id: string }, previous: unknown, next: unknown, executor: any, reason?: string | null) {
    return this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: scope.organization_id,
      actor_user_id: scope.actor_id,
      target_object_type: targetType,
      target_object_id: targetId,
      action_type: action,
      previous_state_json: previous,
      new_state_json: next,
      reason_text: reason || null,
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "shs-api",
    }, executor);
  }
}
