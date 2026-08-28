import { randomUUID } from "crypto";
import { withTransaction } from "../../../db/transaction";
import { writeAuditEvent } from "../../audit/service/audit-helper";
import { ExchangeFundingCommitmentRepo } from "../repo/exchange-funding-commitment-repo";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo";
import { buildFundingCommitmentCommittedOutboxEvent } from "../../trusted-reporting/outbox";

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Exchange funding commitment scope unavailable");
  return {
    actor_id: actorId,
    organization_id: organizationId,
    tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}`,
  };
}

function normalizedInputs(input: any) {
  const recipient = String(input?.recipientOrganizationId || input?.recipient_organization_id || "").trim();
  const amountMinor = Number(input?.amountMinor ?? input?.amount_minor);
  const currency = String(input?.currency || "").trim().toUpperCase();
  if (!recipient) throw new Error("Recipient organization is required");
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("Positive integer amount_minor is required");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Three-letter uppercase currency is required");
  return { recipient_organization_id: recipient, amount_minor: amountMinor, currency };
}

function auditInput(scope: any, commitmentId: string, actionType: string, previous: any, next: any, correlationId = `corr_${randomUUID()}`) {
  return {
    audit_event_id: `audit_${randomUUID()}`,
    organization_id: scope.organization_id,
    actor_user_id: scope.actor_id,
    target_object_type: "exchange_funding_commitment",
    target_object_id: commitmentId,
    action_type: actionType,
    previous_state_json: previous,
    new_state_json: next,
    reason_text: `Exchange funding commitment ${actionType.replace("funding_commitment.", "")}`,
    correlation_id: correlationId,
    source_channel: "shs-api",
  };
}

export class ExchangeFundingCommitmentService {
  constructor(
    private repo = new ExchangeFundingCommitmentRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
    private outbox = new IntegrationOutboxRepo(),
  ) {}

  async createCommitment(input: any, actor: any) {
    const scope = scopeFromActor(actor);
    const fields = normalizedInputs(input);
    const commitment = {
      commitment_id: `commitment_${randomUUID()}`,
      ...scope,
      ...fields,
    };
    return this.transaction(async (db: any) => {
      const created = await this.repo.createCommitment(commitment, db);
      await this.auditWriter(auditInput(scope, created.commitmentId, "funding_commitment.created", null, {
        commitment_id: created.commitmentId,
        version: created.version,
        lifecycle_status: created.lifecycleStatus,
        recipient_organization_id: created.recipientOrganizationId,
        amount_minor: created.amountMinor,
        currency: created.currency,
      }), db);
      return created;
    });
  }

  async getCommitment(commitmentId: string, actor: any) {
    return this.repo.getCommitment(commitmentId, scopeFromActor(actor));
  }

  async listCommitments(actor: any) {
    return this.repo.listCommitments(scopeFromActor(actor));
  }

  async updateCommitment(commitmentId: string, input: any, actor: any, expectedVersion: number) {
    const scope = scopeFromActor(actor);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error("Expected commitment version is required");
    const fields = normalizedInputs(input);
    return this.transaction(async (db: any) => {
      const current = await this.repo.getCommitment(commitmentId, scope, db);
      if (!current) throw new Error("Funding commitment not found");
      if (current.version !== expectedVersion) throw new Error("Funding commitment version conflict");
      if (current.lifecycleStatus !== "draft") throw new Error("Only draft commitments can be edited");
      const updated = await this.repo.updateDraft(commitmentId, scope, fields, expectedVersion, db);
      if (!updated) throw new Error("Funding commitment not found or version conflict");
      await this.auditWriter(auditInput(scope, commitmentId, "funding_commitment.updated", {
        commitment_id: commitmentId, version: current.version, lifecycle_status: current.lifecycleStatus,
      }, { commitment_id: commitmentId, version: updated.version, lifecycle_status: updated.lifecycleStatus }), db);
      return updated;
    });
  }

  async commitCommitment(commitmentId: string, actor: any, expectedVersion: number) {
    return this.transition(commitmentId, actor, "draft", "committed", expectedVersion, "committed_at", "funding_commitment.committed");
  }

  async cancelCommitment(commitmentId: string, actor: any, expectedVersion: number) {
    const current = await this.getCommitment(commitmentId, actor);
    if (!current) throw new Error("Funding commitment not found");
    return this.transition(commitmentId, actor, current.lifecycleStatus, "cancelled", expectedVersion, "cancelled_at", "funding_commitment.cancelled");
  }

  private async transition(commitmentId: string, actor: any, fromStatus: string, toStatus: string, expectedVersion: number, timestampColumn: string, actionType: string) {
    const scope = scopeFromActor(actor);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error("Expected commitment version is required");
    if (toStatus === "cancelled" && !["draft", "committed"].includes(fromStatus)) throw new Error("Cancelled commitments cannot re-enter lifecycle");
    return this.transaction(async (db: any) => {
      const current = await this.repo.getCommitment(commitmentId, scope, db);
      if (!current) throw new Error("Funding commitment not found");
      if (current.version !== expectedVersion) throw new Error("Funding commitment version conflict");
      if (current.lifecycleStatus !== fromStatus) throw new Error("Invalid funding commitment transition");
      const updated = await this.repo.transition(commitmentId, scope, fromStatus, toStatus, expectedVersion, timestampColumn, scope.actor_id, db);
      if (!updated) throw new Error("Funding commitment transition rejected");
      const correlationId = `corr_${randomUUID()}`;
      await this.auditWriter(auditInput(scope, commitmentId, actionType, {
        commitment_id: commitmentId, version: current.version, lifecycle_status: current.lifecycleStatus,
      }, { commitment_id: commitmentId, version: updated.version, lifecycle_status: updated.lifecycleStatus }, correlationId), db);
      if (toStatus === "committed") {
        await this.outbox.enqueue(buildFundingCommitmentCommittedOutboxEvent(updated, correlationId), db);
      }
      return updated;
    });
  }
}
