import { randomUUID } from "crypto";
import { withTransaction } from "../../../db/transaction.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { GrantBinderRepo } from "../repo/grant-binder-repo.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { buildGrantBinderCreatedOutboxEvent } from "../../trusted-reporting/outbox.js";

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Grant Binder scope unavailable");
  return {
    actor_id: actorId,
    organization_id: organizationId,
    tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}`,
  };
}

function titleFromInput(input: any) {
  const title = String(input?.title || "Grant Binder Workspace").trim();
  if (!title) throw new Error("Grant Binder title is required");
  return title;
}

export class GrantBinderService {
  constructor(
    private repo = new GrantBinderRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
    private outbox = new IntegrationOutboxRepo(),
  ) {}

  async createBinder(input: any, actor: any) {
    const scope = scopeFromActor(actor);
    const binder = {
      binder_id: `binder_${randomUUID()}`,
      tenant_id: scope.tenant_id,
      organization_id: scope.organization_id,
      actor_id: scope.actor_id,
      title: titleFromInput(input),
    };
    const correlationId = `corr_${randomUUID()}`;

    return this.transaction(async (db: any) => {
      const created = await this.repo.createBinder(binder, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: scope.organization_id,
        actor_user_id: scope.actor_id,
        target_object_type: "grant_binder",
        target_object_id: created.binderId,
        action_type: "grant_binder.created",
        new_state_json: {
          binder_id: created.binderId,
          version: created.version,
          lifecycle_status: created.lifecycleStatus,
        },
        reason_text: "Grant Binder workspace created",
        correlation_id: correlationId,
        source_channel: "shs-api",
      }, db);
      await this.outbox.enqueue(
        buildGrantBinderCreatedOutboxEvent(created, correlationId),
        db,
      );
      return created;
    });
  }

  async getBinder(binderId: string, actor: any) {
    return this.repo.getBinder(binderId, scopeFromActor(actor));
  }

  async listBinders(actor: any) {
    return this.repo.listBinders(scopeFromActor(actor));
  }

  async updateBinder(binderId: string, input: any, actor: any, expectedVersion: number) {
    const scope = scopeFromActor(actor);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new Error("Expected Grant Binder version is required");
    }

    return this.transaction(async (db: any) => {
      const current = await this.repo.getBinder(binderId, scope, db);
      if (!current) throw new Error("Grant Binder not found");
      if (Number(current.version) !== expectedVersion) throw new Error("Grant Binder version conflict");

      const updated = await this.repo.updateBinder(
        binderId,
        scope,
        titleFromInput(input),
        expectedVersion,
        db,
      );
      if (!updated) throw new Error("Grant Binder not found, not editable, or version conflict");

      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: scope.organization_id,
        actor_user_id: scope.actor_id,
        target_object_type: "grant_binder",
        target_object_id: binderId,
        action_type: "grant_binder.updated",
        previous_state_json: { binder_id: binderId, version: current.version, title: current.title },
        new_state_json: { binder_id: binderId, version: updated.version, title: updated.title },
        reason_text: "Grant Binder workspace updated",
        correlation_id: `corr_${randomUUID()}`,
        source_channel: "shs-api",
      }, db);
      return updated;
    });
  }
}
