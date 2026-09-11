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

export async function getImpactAttribution(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  }
  return json(await fetch(`${API_BASE}/impact/attribution?${search.toString()}`, { headers: headers() }));
}
