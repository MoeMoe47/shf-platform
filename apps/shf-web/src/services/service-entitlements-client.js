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

export async function listServiceCatalog() {
  return json(await fetch(`${API_BASE}/service-catalog`, { headers: headers() }));
}

export async function listOrganizationEntitlements(organizationId) {
  return json(await fetch(`${API_BASE}/organizations/${organizationId}/service-entitlements`, { headers: headers() }));
}

export async function grantOrganizationService(organizationId, serviceKey, reason) {
  return json(await fetch(`${API_BASE}/organizations/${organizationId}/service-entitlements`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ service_key: serviceKey, reason }),
  }));
}

export async function transitionOrganizationService(organizationId, entitlementId, status, reason) {
  return json(await fetch(`${API_BASE}/organizations/${organizationId}/service-entitlements/${entitlementId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status, reason }),
  }));
}
