import Stripe from "stripe";
import {
  DonationError,
  isStripeCheckoutUrl,
  type Donation,
  type DonationProvider,
  type VerifiedDonationEvent,
} from "./model.js";

type StripeConfig = {
  secret: string;
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
};
function returnUrl(value: string, route: string, production: boolean) {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && local && !production)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash !== `#/get-involved/${route}` ||
    !["/foundation.html", "/shf.html"].includes(url.pathname)
  )
    throw new Error("invalid_donation_return_url");
  return url;
}
export function donationStripeConfig(
  env: NodeJS.ProcessEnv = process.env,
): StripeConfig | null {
  const secret = env.STRIPE_SECRET_KEY || "";
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET || "";
  if (
    !/^sk_(test|live)_\S+$/.test(secret) ||
    !/^whsec_\S+$/.test(webhookSecret)
  )
    return null;
  try {
    const production =
      String(env.SHS_AUTH_ENV || env.NODE_ENV).toLowerCase() === "production";
    const success = returnUrl(
      env.SHF_DONATION_SUCCESS_URL || "",
      "success",
      production,
    );
    const cancel = returnUrl(
      env.SHF_DONATION_CANCEL_URL || "",
      "canceled",
      production,
    );
    if (
      success.origin !== cancel.origin ||
      success.pathname !== cancel.pathname
    )
      return null;
    return {
      secret,
      webhookSecret,
      successUrl: success.href,
      cancelUrl: cancel.href,
    };
  } catch {
    return null;
  }
}
function reference(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}
export class StripeDonationProvider implements DonationProvider {
  readonly livemode: boolean;
  constructor(
    private readonly config: StripeConfig,
    private readonly stripe: Stripe = new Stripe(config.secret, {
      apiVersion: "2026-09-30.endive",
      timeout: 10_000,
      maxNetworkRetries: 1,
    }),
  ) {
    this.livemode = config.secret.startsWith("sk_live_");
  }

  async createCheckout(donation: Donation) {
    const monthly = donation.frequency === "MONTHLY";
    const metadata = {
      shf_donation_id: donation.donation_id,
      context: "shf_public_donation",
    };
    const result = await this.stripe.checkout.sessions.create(
      {
        mode: monthly ? "subscription" : "payment",
        allowed_payment_method_types: ["card"],
        client_reference_id: donation.donation_id,
        metadata,
        ...(monthly
          ? { subscription_data: { metadata } }
          : { payment_intent_data: { metadata } }),
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: donation.currency,
              unit_amount: donation.amountCents,
              product_data: {
                name: monthly
                  ? "SHF monthly donation"
                  : "SHF one-time donation",
              },
              ...(monthly ? { recurring: { interval: "month" as const } } : {}),
            },
          },
        ],
        success_url: `${this.config.successUrl}?donation=${donation.public_reference}`,
        cancel_url: `${this.config.cancelUrl}?donation=${donation.public_reference}`,
      },
      { idempotencyKey: `shf-donation:${donation.donation_id}` },
    );
    if (result.livemode !== this.livemode || !isStripeCheckoutUrl(result.url)) {
      throw new DonationError(503, "donation_checkout_unavailable");
    }
    return { id: result.id, url: result.url };
  }

  async verifyEvent(
    raw: Buffer,
    signature: string,
  ): Promise<VerifiedDonationEvent | null> {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        raw,
        signature,
        this.config.webhookSecret,
        300,
      );
    } catch {
      throw new DonationError(400, "invalid_webhook");
    }
    // This endpoint is for the configured account, never Connect/on-behalf-of.
    if (event.account || event.livemode !== this.livemode)
      throw new DonationError(400, "invalid_webhook");
    const common = {
      id: event.id,
      type: event.type,
      created: event.created,
      livemode: event.livemode,
    };
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
      ].includes(event.type)
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.context !== "shf_public_donation") return null;
      const donationId = session.metadata.shf_donation_id;
      if (
        !donationId ||
        session.client_reference_id !== donationId ||
        !["payment", "subscription"].includes(session.mode)
      )
        throw new DonationError(400, "invalid_webhook");
      const monthly = session.mode === "subscription";
      const paid =
        session.payment_status === "paid" &&
        [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
        ].includes(event.type);
      const kind =
        event.type === "checkout.session.expired"
          ? "EXPIRED"
          : event.type === "checkout.session.async_payment_failed"
            ? "FAILED"
            : paid && !monthly
              ? "PAID"
              : "CHECKOUT";
      return {
        ...common,
        donationId,
        kind,
        sessionId: session.id,
        amountCents: session.amount_total ?? undefined,
        currency: session.currency || undefined,
        frequency: monthly ? "MONTHLY" : "ONE_TIME",
        paymentId: monthly ? undefined : reference(session.payment_intent),
        subscriptionId: reference(session.subscription),
        collectionId: kind === "PAID" ? session.id : undefined,
      };
    }
    if (
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice.payment_failed"
    ) {
      const invoice = event.data.object as Stripe.Invoice;
      const details = invoice.parent?.subscription_details;
      if (details?.metadata?.context !== "shf_public_donation") return null;
      const paid = event.type === "invoice.payment_succeeded";
      // Unlike invoice.paid, payment_succeeded does not confirm manually
      // marked-paid invoices. Only our automatic fixed-price subscription.
      if (
        !details.subscription ||
        invoice.collection_method !== "charge_automatically" ||
        (paid && invoice.status !== "paid")
      )
        throw new DonationError(400, "invalid_webhook");
      return {
        ...common,
        donationId: details.metadata.shf_donation_id,
        kind: paid ? "PAID" : "FAILED",
        frequency: "MONTHLY",
        subscriptionId: reference(details.subscription),
        amountCents: paid ? invoice.amount_paid : invoice.amount_due,
        currency: invoice.currency,
        collectionId: paid ? invoice.id : undefined,
        recurringStatus: paid ? "ACTIVE" : "PAST_DUE",
      };
    }
    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.metadata.context !== "shf_public_donation") return null;
      // Only cancellation is projected from subscription status. Payment
      // success/failure comes from actual collections, not subscription.active.
      if (subscription.status !== "canceled") return null;
      return {
        ...common,
        donationId: subscription.metadata.shf_donation_id,
        kind: "SUBSCRIPTION",
        frequency: "MONTHLY",
        subscriptionId: subscription.id,
        recurringStatus: "CANCELED",
      };
    }
    return null;
  }
}
