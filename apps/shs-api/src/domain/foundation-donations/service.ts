import {
  DonationError,
  isStripeCheckoutUrl,
  UUID,
  validateGift,
  type DonationProvider,
  type VerifiedDonationEvent,
} from "./model.js";
import type { DonationRepository } from "./repo.js";

export class DonationService {
  constructor(
    private readonly repo: DonationRepository,
    private readonly provider: DonationProvider | null,
  ) {}
  async checkout(input: unknown, key: string) {
    const gift = validateGift(input);
    if (!UUID.test(key))
      throw new DonationError(400, "invalid_idempotency_key");
    if (!this.provider)
      throw new DonationError(503, "donation_provider_unavailable");
    const provider = this.provider;
    const row = await this.repo.create(gift, key, provider.livemode);
    if (
      row.amountCents !== gift.amountCents ||
      row.currency !== gift.currency ||
      row.frequency !== gift.frequency ||
      row.livemode !== provider.livemode
    ) {
      throw new DonationError(409, "donation_intent_conflict");
    }
    return this.repo.locked(row.donation_id, async (current, db) => {
      // Stripe retains idempotency keys for at least 24h. Never retry an
      // ambiguous creation outside that window or revive an expired checkout.
      if (
        Date.now() - new Date(current.created_at).getTime() > 23 * 3600_000 ||
        !["CREATED", "CHECKOUT_CREATED"].includes(current.status)
      ) {
        throw new DonationError(409, "donation_checkout_closed");
      }
      if (!current.checkout_session_id) {
        const session = await provider.createCheckout(current);
        if (!session.id || !isStripeCheckoutUrl(session.url))
          throw new DonationError(503, "donation_checkout_unavailable");
        current.checkout_session_id = session.id;
        current.checkout_url = session.url;
        current.status = "CHECKOUT_CREATED";
        await this.repo.save(current, db);
      }
      return {
        donationId: current.public_reference,
        checkoutUrl: current.checkout_url,
      };
    });
  }
  async webhook(raw: Buffer, signature: string) {
    if (!signature || !Buffer.isBuffer(raw))
      throw new DonationError(400, "invalid_webhook");
    if (!this.provider)
      throw new DonationError(503, "donation_provider_unavailable");
    const event = await this.provider.verifyEvent(raw, signature);
    if (!event) return { received: true, result: "IGNORED" };
    if (
      !UUID.test(event.donationId) ||
      event.livemode !== this.provider.livemode
    )
      throw new DonationError(400, "invalid_webhook");
    return this.apply(event);
  }
  private async apply(event: VerifiedDonationEvent) {
    return this.repo.locked(event.donationId, async (row, db) => {
      // All processor-owned references must agree before changing domain truth.
      if (
        row.livemode !== event.livemode ||
        row.frequency !== event.frequency ||
        (event.amountCents !== undefined &&
          event.amountCents !== row.amountCents) ||
        (event.currency !== undefined && event.currency !== row.currency) ||
        (row.checkout_session_id &&
          event.sessionId &&
          row.checkout_session_id !== event.sessionId) ||
        (row.subscription_reference &&
          event.subscriptionId &&
          row.subscription_reference !== event.subscriptionId) ||
        (row.payment_reference &&
          event.paymentId &&
          row.payment_reference !== event.paymentId)
      ) {
        throw new DonationError(409, "donation_event_mismatch");
      }
      if (!(await this.repo.recordEvent(event, row.donation_id, db)))
        return { received: true, result: "DUPLICATE" };
      row.checkout_session_id ||= event.sessionId || null;
      row.subscription_reference ||= event.subscriptionId || null;
      row.payment_reference ||= event.paymentId || null;
      if (event.kind === "PAID") {
        if (
          !event.collectionId ||
          event.amountCents !== row.amountCents ||
          event.currency !== row.currency
        ) {
          throw new DonationError(409, "donation_event_mismatch");
        }
        await this.repo.collect(event.collectionId, event.id, row, db);
        row.status = "COMPLETED";
        row.completed_at ||= new Date(event.created * 1000);
      } else if (row.status !== "COMPLETED") {
        if (event.kind === "FAILED") row.status = "FAILED";
        else if (event.kind === "EXPIRED") row.status = "CANCELED";
        else if (
          event.kind === "SUBSCRIPTION" &&
          event.recurringStatus === "CANCELED"
        )
          row.status = "CANCELED";
        else if (
          event.kind === "CHECKOUT" &&
          !["FAILED", "CANCELED"].includes(row.status)
        )
          row.status = "PENDING";
      }
      const recurringIsNewer =
        event.created > row.recurring_event_created ||
        (event.created === row.recurring_event_created &&
          ["ACTIVE", "CANCELED"].includes(event.recurringStatus || ""));
      if (
        event.recurringStatus &&
        row.recurring_status !== "CANCELED" &&
        recurringIsNewer
      ) {
        row.recurring_status = event.recurringStatus;
        row.recurring_event_created = event.created;
      }
      await this.repo.save(row, db);
      return { received: true, result: "APPLIED" };
    });
  }
  async status(reference: string) {
    if (!UUID.test(reference))
      throw new DonationError(404, "donation_not_found");
    const row = await this.repo.publicStatus(reference);
    if (!row) throw new DonationError(404, "donation_not_found");
    return row;
  }
}
