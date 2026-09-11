const API_BASE = import.meta.env.VITE_SHS_API_BASE || import.meta.env.VITE_API_BASE || "http://localhost:8091";
const DEFAULT_TOKEN = "dev-token:user_admin_001";
const DEFAULT_ORG = "org_shf_001";

function devToken() {
  return window.localStorage.getItem("shfOperatorToken") || DEFAULT_TOKEN;
}

function activeOrg() {
  return window.localStorage.getItem("shfOperatorOrganizationId") || DEFAULT_ORG;
}

function headers(token = devToken(), organizationId = activeOrg()) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-shs-organization-id": organizationId,
  };
}

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message || body?.error || "Request failed");
  }
  return body;
}

export async function listServiceAgreements() {
  return json(await fetch(`${API_BASE}/service-agreements`, { headers: headers() }));
}

export async function createServiceAgreement(payload) {
  return json(await fetch(`${API_BASE}/service-agreements`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  }));
}

export async function approveServiceAgreement(agreementId, reason) {
  return transition(agreementId, "approve", reason);
}

export async function activateServiceAgreement(agreementId, reason) {
  return transition(agreementId, "activate", reason);
}

export async function suspendServiceAgreement(agreementId, reason) {
  return transition(agreementId, "suspend", reason);
}

export async function terminateServiceAgreement(agreementId, reason) {
  return transition(agreementId, "terminate", reason);
}

async function transition(agreementId, action, reason) {
  return json(await fetch(`${API_BASE}/service-agreements/${agreementId}/${action}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ reason }),
  }));
}
