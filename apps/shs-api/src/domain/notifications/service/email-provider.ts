export type TrustedMailMessage = {
  to: string;
  subject: string;
  templateKey: string;
  certificateReference: string;
  attachment?: { filename: string; contentBase64: string; sha256: string };
};

export type MailDeliveryResult = { delivered: boolean; provider: string; providerMessageReference?: string; reason?: string };

export interface OutboundMailProvider {
  send(message: TrustedMailMessage): Promise<MailDeliveryResult>;
}

class TestMailProvider implements OutboundMailProvider {
  async send(message: TrustedMailMessage): Promise<MailDeliveryResult> {
    return { delivered: true, provider: "test", providerMessageReference: `test-mail:${message.certificateReference}:${message.attachment?.sha256 || "none"}` };
  }
}

class GenericHttpMailProvider implements OutboundMailProvider {
  async send(message: TrustedMailMessage): Promise<MailDeliveryResult> {
    const endpoint = String(process.env.SHS_EMAIL_PROVIDER_ENDPOINT || "").trim();
    const apiKey = String(process.env.SHS_EMAIL_PROVIDER_API_KEY || "").trim();
    if (!endpoint || !apiKey) return { delivered: false, provider: "generic-http", reason: "EMAIL_PROVIDER_NOT_CONFIGURED" };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ to: message.to, subject: message.subject, templateKey: message.templateKey, certificateReference: message.certificateReference, attachment: message.attachment }), signal: controller.signal });
      if (!response.ok) return { delivered: false, provider: "generic-http", reason: response.status >= 500 ? "EMAIL_PROVIDER_RETRYABLE" : "EMAIL_PROVIDER_REJECTED" };
      const body = await response.json().catch(() => ({}));
      return { delivered: true, provider: "generic-http", providerMessageReference: String(body?.id || body?.messageId || `generic-http:${message.certificateReference}`) };
    } catch (error: any) {
      return { delivered: false, provider: "generic-http", reason: error?.name === "AbortError" ? "EMAIL_PROVIDER_TIMEOUT" : "EMAIL_PROVIDER_UNAVAILABLE" };
    } finally { clearTimeout(timer); }
  }
}

export function getOutboundMailProvider(): OutboundMailProvider {
  const provider = String(process.env.SHS_EMAIL_PROVIDER || (process.env.NODE_ENV === "production" ? "generic-http" : "test")).trim().toLowerCase();
  if (provider === "test") return new TestMailProvider();
  if (provider === "generic-http") return new GenericHttpMailProvider();
  throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
}
