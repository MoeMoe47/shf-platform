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
  if (!res.ok) throw new Error(body?.error?.message || body?.error || "Request failed");
  return body;
}

export async function listFundingGrants() {
  return json(await fetch(`${API_BASE}/funding/grants`, { headers: headers() }));
}

export async function createFundingGrant(input) {
  return json(await fetch(`${API_BASE}/funding/grants`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  }));
}

export async function transitionFundingGrant(grantId, status) {
  return json(await fetch(`${API_BASE}/funding/grants/${grantId}/status`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status }),
  }));
}

export async function createGrantAllocation(grantId, input) {
  return json(await fetch(`${API_BASE}/funding/grants/${grantId}/allocations`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  }));
}
