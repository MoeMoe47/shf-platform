import { query } from "../../db/client.js";
import { randomUUID } from "node:crypto";

export type OutboxExecutor = { query: (sql: string, params?: unknown[]) => Promise<any> };

export class IntegrationOutboxRepo {
  async enqueue(event: Record<string, unknown>, executor: OutboxExecutor = { query }) {
    const result = await executor.query(
      `INSERT INTO integration_outbox (
        outbox_event_id, producer_id, event_type, subject_type, subject_id,
        organization_id, originating_actor_id, occurred_at, idempotency_key,
        correlation_id, payload_json, delivery_status, attempt_count,
        next_attempt_at, destination
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING',0,NOW(),$12)
      ON CONFLICT (organization_id, producer_id, idempotency_key)
      DO UPDATE SET updated_at = NOW()
      RETURNING *`,
      [
        `outbox_${randomUUID()}`,
        event.producer_id,
        event.event_type,
        event.subject_type,
        event.subject_id,
        event.organization_id,
        event.originating_actor_id,
        event.occurred_at,
        event.idempotency_key,
        event.correlation_id,
        JSON.stringify({
          ...event,
          // Scope and actor are part of the authenticated signed event body.
        }),
        event.destination,
      ],
    );
    return result.rows[0];
  }

  async claimPending(limit = 20, workerId = "trusted-reporting-worker", leaseSeconds = 60, executor: OutboxExecutor = { query }) {
    const result = await executor.query(
      `UPDATE integration_outbox
       SET delivery_status = 'DELIVERING', lease_owner = $2,
           lease_expires_at = NOW() + ($3 * INTERVAL '1 second'),
           lease_reclaimed = (delivery_status = 'DELIVERING'),
           attempt_count = attempt_count + 1, last_attempt_at = NOW(), updated_at = NOW()
       WHERE outbox_event_id IN (
         SELECT outbox_event_id FROM integration_outbox
         WHERE (delivery_status IN ('PENDING','RETRYABLE') AND next_attempt_at <= NOW())
            OR (delivery_status = 'DELIVERING' AND lease_expires_at <= NOW())
         ORDER BY created_at ASC LIMIT $1 FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [limit, workerId, leaseSeconds],
    );
    return result.rows;
  }

  async markDelivered(id: string, workerId = "trusted-reporting-worker", executor: OutboxExecutor = { query }) {
    return executor.query(`UPDATE integration_outbox SET delivery_status='DELIVERED', delivered_at=NOW(), updated_at=NOW(), last_error=NULL, failure_classification=NULL, lease_owner=NULL, lease_expires_at=NULL WHERE outbox_event_id=$1 AND delivery_status='DELIVERING' AND lease_owner=$2`, [id, workerId]);
  }

  async markRetryable(id: string, error: string, nextAttemptAt: Date, workerId = "trusted-reporting-worker", executor: OutboxExecutor = { query }) {
    return executor.query(`UPDATE integration_outbox SET delivery_status='RETRYABLE', next_attempt_at=$2, last_error=$3, failure_classification='RETRYABLE', updated_at=NOW(), lease_owner=NULL, lease_expires_at=NULL WHERE outbox_event_id=$1 AND delivery_status='DELIVERING' AND lease_owner=$4`, [id, nextAttemptAt, error.slice(0, 500), workerId]);
  }

  async markFailedFinal(id: string, error: string, workerId = "trusted-reporting-worker", quarantined = false, executor: OutboxExecutor = { query }) {
    return executor.query(`UPDATE integration_outbox SET delivery_status=$2, quarantined_at=CASE WHEN $2='QUARANTINED' THEN NOW() ELSE quarantined_at END, last_error=$3, failure_classification=CASE WHEN $2='QUARANTINED' THEN 'QUARANTINED' ELSE 'PERMANENT' END, updated_at=NOW(), lease_owner=NULL, lease_expires_at=NULL WHERE outbox_event_id=$1 AND delivery_status='DELIVERING' AND lease_owner=$4`, [id, quarantined ? "QUARANTINED" : "FAILED_FINAL", error.slice(0, 500), workerId]);
  }

  async getBacklogStatus(executor: OutboxExecutor = { query }) {
    const result = await executor.query(`SELECT COUNT(*) FILTER (WHERE delivery_status IN ('PENDING','RETRYABLE'))::int AS pending_count, COUNT(*) FILTER (WHERE delivery_status='DELIVERING')::int AS leased_count, COUNT(*) FILTER (WHERE delivery_status='QUARANTINED')::int AS quarantined_count, MIN(created_at) FILTER (WHERE delivery_status IN ('PENDING','RETRYABLE')) AS oldest_pending_at, MAX(delivered_at) AS last_success_at FROM integration_outbox`);
    return result.rows[0];
  }
}
