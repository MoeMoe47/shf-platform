import { createHmac, timingSafeEqual } from "node:crypto";

export type FinancialEntity = "SHS" | "SHF";
export type PaymentEnvironment = "SANDBOX" | "PRODUCTION";
export type PaymentState = "CREATED" | "PENDING" | "REQUIRES_ACTION" | "SUCCEEDED" | "FAILED" | "CANCELED" | "PARTIALLY_REFUNDED" | "REFUNDED" | "DISPUTED";
export type ReconciliationState = "UNMATCHED" | "MATCHED" | "MISMATCH" | "MISSING_INTERNAL" | "MISSING_EXTERNAL" | "REQUIRES_REVIEW";

export type PaymentRecord = {
  paymentId: string;
  legalEntity: FinancialEntity;
  organizationId: string;
  payerReference: string;
  purpose: "COMMERCIAL" | "DONATION" | "PROGRAM";
  productReference: string;
  amountMinor: number;
  currency: string;
  provider: string;
  providerPaymentId: string;
  environment: PaymentEnvironment;
  state: PaymentState;
  idempotencyKey: string;
  reconciliation: ReconciliationState;
  createdAt: string;
  updatedAt: string;
  rawProviderReference?: string;
};

export type ProviderEvent = {
  eventId: string;
  providerPaymentId: string;
  state: Extract<PaymentState, "PENDING" | "REQUIRES_ACTION" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED" | "DISPUTED">;
  amountMinor: number;
  currency: string;
  environment: PaymentEnvironment;
  occurredAt: string;
};

export type PaymentProviderAdapter = {
  readonly providerKey: string;
  createPayment(input: { amountMinor: number; currency: string; idempotencyKey: string; environment: PaymentEnvironment }): { providerPaymentId: string; state: "PENDING" };
  refundPayment(providerPaymentId: string, amountMinor: number): { refundId: string; state: "SUCCEEDED" };
  createDispute(providerPaymentId: string, amountMinor: number): { disputeId: string; state: "OPEN" };
  verifyWebhook(payload: string, signature: string): ProviderEvent;
};

function requireMinorUnits(amountMinor: number) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("payment_amount_minor_positive_integer_required");
}

function requireCurrency(currency: string) {
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("payment_currency_required");
}

function signedPayload(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export class DeterministicPaymentAdapter implements PaymentProviderAdapter {
  readonly providerKey = "test-double";
  private sequence = 0;
  constructor(private readonly secret: string, private readonly environment: PaymentEnvironment) {}

  createPayment(input: { amountMinor: number; currency: string; idempotencyKey: string; environment: PaymentEnvironment }) {
    requireMinorUnits(input.amountMinor); requireCurrency(input.currency);
    if (input.environment !== this.environment) throw new Error("payment_environment_mismatch");
    return { providerPaymentId: `testpay_${++this.sequence}`, state: "PENDING" as const };
  }

  refundPayment(providerPaymentId: string, amountMinor: number) {
    requireMinorUnits(amountMinor);
    return { refundId: `testrefund_${providerPaymentId}_${amountMinor}`, state: "SUCCEEDED" as const };
  }

  createDispute(providerPaymentId: string, amountMinor: number) {
    requireMinorUnits(amountMinor);
    return { disputeId: `testdispute_${providerPaymentId}_${amountMinor}`, state: "OPEN" as const };
  }

  signWebhook(event: ProviderEvent) {
    return signedPayload(this.secret, JSON.stringify(event));
  }

  verifyWebhook(payload: string, signature: string) {
    const expected = signedPayload(this.secret, payload);
    const supplied = Buffer.from(String(signature || ""), "utf8");
    const expectedBytes = Buffer.from(expected, "utf8");
    if (supplied.length !== expectedBytes.length || !timingSafeEqual(supplied, expectedBytes)) throw new Error("payment_webhook_signature_invalid");
    const event = JSON.parse(payload) as ProviderEvent;
    if (event.environment !== this.environment) throw new Error("payment_webhook_environment_mismatch");
    requireMinorUnits(event.amountMinor); requireCurrency(event.currency);
    return event;
  }
}

export class PaymentReadinessStore {
  private readonly payments = new Map<string, PaymentRecord>();
  private readonly idempotency = new Map<string, string>();
  private readonly providerPayments = new Map<string, string>();
  private readonly webhookEvents = new Set<string>();
  private readonly refunded = new Map<string, number>();

  createPayment(input: Omit<PaymentRecord, "paymentId" | "providerPaymentId" | "state" | "reconciliation" | "createdAt" | "updatedAt">, adapter: PaymentProviderAdapter) {
    requireMinorUnits(input.amountMinor); requireCurrency(input.currency);
    if (input.environment !== "SANDBOX" && input.environment !== "PRODUCTION") throw new Error("payment_environment_required");
    const existingId = this.idempotency.get(`${input.organizationId}:${input.idempotencyKey}`);
    if (existingId) return this.payments.get(existingId)!;
    const provider = adapter.createPayment({ amountMinor: input.amountMinor, currency: input.currency, idempotencyKey: input.idempotencyKey, environment: input.environment });
    if (this.providerPayments.has(provider.providerPaymentId)) throw new Error("payment_provider_reference_duplicate");
    const now = new Date().toISOString();
    const record: PaymentRecord = { ...input, paymentId: `pay_${this.payments.size + 1}`, providerPaymentId: provider.providerPaymentId, state: "PENDING", reconciliation: "UNMATCHED", createdAt: now, updatedAt: now };
    this.payments.set(record.paymentId, record); this.idempotency.set(`${input.organizationId}:${input.idempotencyKey}`, record.paymentId); this.providerPayments.set(provider.providerPaymentId, record.paymentId);
    return record;
  }

  applyVerifiedWebhook(event: ProviderEvent, adapter: PaymentProviderAdapter) {
    const recordId = this.providerPayments.get(event.providerPaymentId);
    if (!recordId) return { state: "MISSING_INTERNAL" as const, eventId: event.eventId };
    if (this.webhookEvents.has(event.eventId)) return { state: "DUPLICATE" as const, payment: this.payments.get(recordId)! };
    const record = this.payments.get(recordId)!;
    if (record.environment !== event.environment || record.amountMinor !== event.amountMinor || record.currency !== event.currency) {
      record.reconciliation = "REQUIRES_REVIEW"; this.webhookEvents.add(event.eventId); return { state: "REQUIRES_REVIEW" as const, payment: record };
    }
    record.state = event.state; record.reconciliation = "MATCHED"; record.updatedAt = event.occurredAt; record.rawProviderReference = `${adapter.providerKey}:${event.eventId}`; this.webhookEvents.add(event.eventId);
    return { state: "APPLIED" as const, payment: record };
  }

  requestRefund(paymentId: string, amountMinor: number, adapter: PaymentProviderAdapter) {
    const payment = this.payments.get(paymentId); if (!payment) throw new Error("payment_not_found");
    if (payment.state !== "SUCCEEDED" && payment.state !== "PARTIALLY_REFUNDED") throw new Error("payment_not_refundable");
    requireMinorUnits(amountMinor);
    const total = (this.refunded.get(paymentId) || 0) + amountMinor;
    if (total > payment.amountMinor) throw new Error("refund_exceeds_payment");
    const refund = adapter.refundPayment(payment.providerPaymentId, amountMinor); this.refunded.set(paymentId, total);
    payment.state = total === payment.amountMinor ? "REFUNDED" : "PARTIALLY_REFUNDED"; payment.updatedAt = new Date().toISOString();
    return { ...refund, paymentId, amountMinor, totalRefundedMinor: total };
  }

  reconcileExternal(input: { providerPaymentId: string; amountMinor: number; currency: string; environment: PaymentEnvironment }) {
    const paymentId = this.providerPayments.get(input.providerPaymentId);
    if (!paymentId) return "MISSING_INTERNAL" as const;
    const payment = this.payments.get(paymentId)!;
    return payment.amountMinor === input.amountMinor && payment.currency === input.currency && payment.environment === input.environment ? "MATCHED" as const : "MISMATCH" as const;
  }
}

export const PAYMENT_BOUNDARIES = Object.freeze({
  noRawCardData: true,
  hostedOrTokenizedCollectionRequired: true,
  browserCannotConfirm: true,
  civicSureIsNotPaymentAuthority: true,
  entitlementActivationRequiresAuthorizedFulfillment: true,
  shfAndShsEntityRequired: true,
});
