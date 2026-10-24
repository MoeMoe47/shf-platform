import { randomUUID } from "node:crypto";
import { pool } from "../../db/client.js";
import type { Donation, Gift } from "./model.js";

export interface DonationRepository {
  create(gift: Gift, key: string, livemode: boolean): Promise<Donation>;
  locked<T>(id: string, fn: (row: Donation, db: any) => Promise<T>): Promise<T>;
  save(row: Donation, db: any): Promise<void>;
  recordEvent(
    event: { id: string; type: string; created: number },
    id: string,
    db: any,
  ): Promise<boolean>;
  collect(
    reference: string,
    eventId: string,
    row: Donation,
    db: any,
  ): Promise<void>;
  publicStatus(reference: string): Promise<Record<string, unknown> | null>;
}
function map(row: any): Donation {
  return {
    ...row,
    amountCents: row.amount_cents,
    recurring_event_created: Number(row.recurring_event_created),
  };
}
export class PostgresDonationRepository implements DonationRepository {
  constructor(private readonly database: any = pool) {}
  async create(gift: Gift, key: string, livemode: boolean) {
    const result = await this.database.query(
      `INSERT INTO foundation_donations
      (donation_id, public_reference, idempotency_key, amount_cents, currency, frequency, livemode, recurring_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
      [
        randomUUID(),
        randomUUID(),
        key,
        gift.amountCents,
        gift.currency,
        gift.frequency,
        livemode,
        gift.frequency === "MONTHLY" ? "PENDING" : null,
      ],
    );
    return map(result.rows[0]);
  }
  async locked<T>(
    id: string,
    fn: (row: Donation, db: any) => Promise<T>,
  ): Promise<T> {
    const db = await this.database.connect();
    try {
      await db.query("BEGIN");
      const result = await db.query(
        "SELECT * FROM foundation_donations WHERE donation_id=$1 FOR UPDATE",
        [id],
      );
      if (!result.rows[0]) throw new Error("donation_not_found");
      const value = await fn(map(result.rows[0]), db);
      await db.query("COMMIT");
      return value;
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    } finally {
      db.release();
    }
  }
  async save(row: Donation, db: any) {
    await db.query(
      `UPDATE foundation_donations SET status=$2, checkout_session_id=$3, checkout_url=$4,
      payment_reference=$5, subscription_reference=$6, recurring_status=$7, recurring_event_created=$8,
      completed_at=$9, updated_at=NOW() WHERE donation_id=$1`,
      [
        row.donation_id,
        row.status,
        row.checkout_session_id,
        row.checkout_url,
        row.payment_reference,
        row.subscription_reference,
        row.recurring_status,
        row.recurring_event_created,
        row.completed_at,
      ],
    );
  }
  async recordEvent(
    event: { id: string; type: string; created: number },
    id: string,
    db: any,
  ) {
    const result = await db.query(
      `INSERT INTO foundation_donation_events
      (processor_event_id, donation_id, event_type, processor_created) VALUES ($1,$2,$3,$4)
      ON CONFLICT DO NOTHING RETURNING processor_event_id`,
      [event.id, id, event.type, event.created],
    );
    return result.rowCount === 1;
  }
  async collect(reference: string, eventId: string, row: Donation, db: any) {
    await db.query(
      `INSERT INTO foundation_donation_collections
      (collection_reference, donation_id, processor_event_id, amount_cents, currency)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [reference, row.donation_id, eventId, row.amountCents, row.currency],
    );
  }
  async publicStatus(reference: string) {
    const result = await this.database.query(
      `SELECT status, amount_cents AS "amountCents", currency, frequency,
      recurring_status AS "recurringStatus" FROM foundation_donations WHERE public_reference=$1`,
      [reference],
    );
    return result.rows[0] || null;
  }
}
