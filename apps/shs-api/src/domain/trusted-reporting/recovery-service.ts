import { randomUUID } from "node:crypto";
import { withTransaction } from "../../db/transaction.js";
import { writeAuditEvent } from "../audit/service/audit-helper.js";
import { IntegrationOutboxRepo } from "./outbox-repo.js";

export class TrustedReportingRecoveryService {
  constructor(private repo = new IntegrationOutboxRepo()) {}

  async recoverQuarantined(outboxEventId: string, actor: any, reason: string) {
    if (actor?.actor_type === "AI" || actor?.actor_type === "SYSTEM") throw new Error("Human operator recovery is required");
    if (!Array.isArray(actor?.permissions) || !actor.permissions.includes("reports.publication.authorize")) throw new Error("Missing permission: reports.publication.authorize");
    const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
    const actorId = String(actor?.user_id || actor?.id || "").trim();
    const tenantId = String(actor?.tenant_id || "").trim();
    if (!organizationId || !actorId || !tenantId || !String(reason || "").trim()) throw new Error("Scoped operator recovery requires actor, tenant, and reason");
    return withTransaction(async (db: any) => {
      const priorResult = await db.query("SELECT delivery_status, attempt_count, last_error FROM integration_outbox WHERE outbox_event_id=$1 AND organization_id=$2 FOR UPDATE", [outboxEventId, organizationId]);
      const prior = priorResult.rows[0];
      const recovered = await this.repo.requeueQuarantined(outboxEventId, organizationId, db);
      if (!recovered) throw new Error("Quarantined outbox event not found or already recovered");
      await writeAuditEvent({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: organizationId,
        actor_user_id: actorId,
        target_object_type: "integration_outbox",
        target_object_id: outboxEventId,
        action_type: "trusted_reporting.outbox.recovered",
        previous_state_json: { delivery_status: prior?.delivery_status, attempt_count: prior?.attempt_count, last_error: prior?.last_error },
        new_state_json: { delivery_status: "PENDING", attempt_count: recovered.attempt_count },
        reason_text: reason.trim(),
        correlation_id: `corr_${randomUUID()}`,
        source_channel: "shs-api",
      }, db);
      return recovered;
    });
  }
}
