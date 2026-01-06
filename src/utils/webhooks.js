// src/utils/webhooks.js
// Mocked outbound notifiers for Alerts. Swap to real Slack/email/webhook later.
import { track } from "@/utils/analytics.js";

const DEV = typeof import.meta !== "undefined"
  ? (import.meta.env?.MODE !== "production")
  : true;

export async function notifySlack({ channel = "#ops", text, meta = {} }) {
  // Console + analytics only (no network call)
  // eslint-disable-next-line no-console
  console.log("[SLACK:mock]", channel, text, meta);
  track("alert_notify_slack", { channel, ...meta }, { silent: true });
  // simulate network delay
  await wait(200);
  return { ok: true };
}

export async function notifyWebhook({ url = "https://example/webhook", payload, meta = {} }) {
  // Mock: just console + analytics; no fetch to avoid CORS in dev
  // eslint-disable-next-line no-console
  console.log("[WEBHOOK:mock]", url, payload, meta);
  track("alert_notify_webhook", { url, kind: payload?.kind, ...meta }, { silent: true });
  await wait(200);
  return { ok: true };
}

export async function notifyEmail({ to = "ops@example.com", subject, body, meta = {} }) {
  // Mock email delivery
  // eslint-disable-next-line no-console
  console.log("[EMAIL:mock]", to, subject, body, meta);
  track("alert_notify_email", { to, subject, ...meta }, { silent: true });
  await wait(200);
  return { ok: true };
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// quick helper for a single API that fans out by target
export async function sendAlert({ targets = [], title, message, meta = {} }) {
  const results = [];
  for (const t of targets) {
    if (t.kind === "slack") {
      results.push(await notifySlack({ channel: t.channel, text: `${title} — ${message}`, meta }));
    } else if (t.kind === "webhook") {
      results.push(await notifyWebhook({ url: t.url, payload: { kind: "alert", title, message, meta }, meta }));
    } else if (t.kind === "email") {
      results.push(await notifyEmail({ to: t.to, subject: title, body: message, meta }));
    }
  }
  return results;
}
