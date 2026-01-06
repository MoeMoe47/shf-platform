// Tiny wrappers for the new endpoints
const API = import.meta.env.VITE_API_BASE || ""; // e.g. "http://localhost:5174"

async function post(path, body) {
  const res = await fetch(`${API}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/** Queue attestation for on-chain mirror later */
export function apiQueueAttest(payload) {
  // expected: { type, subjectId, evidence, tags?, user?, policy? }
  return post("/attest", payload);
}

/** Verify social/share URL before accepting */
export function apiVerifyShareUrl(url, context = "general") {
  return post("/social/verify", { url, context });
}

/** Publication guard: check if user/payload may be externally published */
export function apiCheckPublish(user, payload) {
  return post("/publish/check", { user, payload });
}
