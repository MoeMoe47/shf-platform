// NCA-4 §13 (Email): a provider-neutral delivery adapter for the
// canonical notification, generalized beyond the certificate-only path.
//
// This deliberately does NOT reuse `email-provider.ts`'s
// `OutboundMailProvider`/`TrustedMailMessage` — that interface's message
// shape requires a `certificateReference` and is used today only by
// `certificate-service.ts`. Changing its shape to accommodate general
// notifications would risk the one real, working email flow this
// repository has; adding a second, differently-shaped interface next to
// it (reusing the *same* provider-selection environment variables —
// SHS_EMAIL_PROVIDER, SHS_EMAIL_PROVIDER_ENDPOINT, SHS_EMAIL_PROVIDER_API_KEY
// — so there is exactly one place operators configure an email provider,
// not two) is the lower-risk path. Both adapters are honestly classified
// the same way in the NCA-4 report: real code, but EXTERNAL_DEPENDENCY for
// actual delivery, since no provider is configured in this environment.
export type NotificationMailMessage = {
  to: string;
  subject: string;
  templateKey: string;
  /** The canonical notification_id — the natural idempotent send key; see delivery-service.ts. */
  notificationId: string;
  /** Already-rendered, bounded plain text — see renderNotificationEmail() in delivery-service.ts. Never raw source-domain content. */
  bodyText: string;
  /** A same-origin relative path only — validated by isSafeInternalPath() before this is ever set. */
  actionUrl?: string;
};

export type MailDeliveryResult = {
  delivered: boolean;
  provider: string;
  providerMessageReference?: string;
  reason?: string;
};

export interface NotificationMailProvider {
  send(message: NotificationMailMessage): Promise<MailDeliveryResult>;
}

class TestNotificationMailProvider implements NotificationMailProvider {
  async send(message: NotificationMailMessage): Promise<MailDeliveryResult> {
    return { delivered: true, provider: "test", providerMessageReference: `test-notification-mail:${message.notificationId}` };
  }
}

class GenericHttpNotificationMailProvider implements NotificationMailProvider {
  async send(message: NotificationMailMessage): Promise<MailDeliveryResult> {
    const endpoint = String(process.env.SHS_EMAIL_PROVIDER_ENDPOINT || "").trim();
    const apiKey = String(process.env.SHS_EMAIL_PROVIDER_API_KEY || "").trim();
    if (!endpoint || !apiKey) return { delivered: false, provider: "generic-http", reason: "EMAIL_PROVIDER_NOT_CONFIGURED" };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ to: message.to, subject: message.subject, templateKey: message.templateKey, notificationId: message.notificationId, bodyText: message.bodyText, actionUrl: message.actionUrl }),
        signal: controller.signal,
      });
      if (!response.ok) return { delivered: false, provider: "generic-http", reason: response.status >= 500 ? "EMAIL_PROVIDER_RETRYABLE" : "EMAIL_PROVIDER_REJECTED" };
      const body = await response.json().catch(() => ({}));
      return { delivered: true, provider: "generic-http", providerMessageReference: String(body?.id || body?.messageId || `generic-http:${message.notificationId}`) };
    } catch (error: any) {
      return { delivered: false, provider: "generic-http", reason: error?.name === "AbortError" ? "EMAIL_PROVIDER_TIMEOUT" : "EMAIL_PROVIDER_UNAVAILABLE" };
    } finally { clearTimeout(timer); }
  }
}

export function getNotificationMailProvider(): NotificationMailProvider {
  const provider = String(process.env.SHS_EMAIL_PROVIDER || (process.env.NODE_ENV === "production" ? "generic-http" : "test")).trim().toLowerCase();
  if (provider === "test") return new TestNotificationMailProvider();
  if (provider === "generic-http") return new GenericHttpNotificationMailProvider();
  throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
}

// NCA-4 §22 (Retry Policy): a failure reason classifies into exactly one of
// these — never left ambiguous, and never assumed retryable by default.
export type MailFailureClass = "TRANSIENT" | "PERMANENT" | "NOT_CONFIGURED";

export function classifyMailFailure(reason?: string): MailFailureClass {
  if (reason === "EMAIL_PROVIDER_NOT_CONFIGURED") return "NOT_CONFIGURED";
  if (reason === "EMAIL_PROVIDER_RETRYABLE" || reason === "EMAIL_PROVIDER_TIMEOUT" || reason === "EMAIL_PROVIDER_UNAVAILABLE") return "TRANSIENT";
  return "PERMANENT"; // EMAIL_PROVIDER_REJECTED, or any unrecognized reason — never assumed safe to retry.
}
