export type Frequency = "ONE_TIME" | "MONTHLY";
export type DonationStatus =
  | "CREATED"
  | "CHECKOUT_CREATED"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";
export type RecurringStatus = "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
export type Gift = {
  amountCents: number;
  currency: "usd";
  frequency: Frequency;
};
export type Donation = Gift & {
  donation_id: string;
  public_reference: string;
  idempotency_key: string;
  livemode: boolean;
  status: DonationStatus;
  checkout_session_id: string | null;
  checkout_url: string | null;
  payment_reference: string | null;
  subscription_reference: string | null;
  recurring_status: RecurringStatus | null;
  recurring_event_created: number;
  created_at: Date;
  completed_at: Date | null;
};
export type VerifiedDonationEvent = {
  id: string;
  type: string;
  created: number;
  livemode: boolean;
  donationId: string;
  kind: "CHECKOUT" | "PAID" | "FAILED" | "EXPIRED" | "SUBSCRIPTION";
  sessionId?: string;
  paymentId?: string;
  subscriptionId?: string;
  amountCents?: number;
  currency?: string;
  frequency: Frequency;
  collectionId?: string;
  recurringStatus?: RecurringStatus;
};
export interface DonationProvider {
  readonly livemode: boolean;
  createCheckout(donation: Donation): Promise<{ id: string; url: string }>;
  verifyEvent(
    raw: Buffer,
    signature: string,
  ): Promise<VerifiedDonationEvent | null>;
}
export class DonationError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(code);
  }
}
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateGift(input: unknown): Gift {
  const value = input as Record<string, unknown>;
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some(
      (key) => !["amountCents", "currency", "frequency"].includes(key),
    ) ||
    typeof value.amountCents !== "number" ||
    !Number.isSafeInteger(value.amountCents) ||
    value.amountCents < 100 ||
    value.amountCents > 1_000_000 ||
    typeof value.currency !== "string" ||
    value.currency.toLowerCase() !== "usd" ||
    typeof value.frequency !== "string" ||
    !["ONE_TIME", "MONTHLY"].includes(value.frequency)
  ) {
    throw new DonationError(400, "invalid_donation");
  }
  return {
    amountCents: value.amountCents,
    currency: "usd",
    frequency: value.frequency as Frequency,
  };
}
export function isStripeCheckoutUrl(value: unknown): value is string {
  try {
    const url = new URL(String(value));
    return (
      url.protocol === "https:" &&
      url.hostname === "checkout.stripe.com" &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname.startsWith("/c/")
    );
  } catch {
    return false;
  }
}
