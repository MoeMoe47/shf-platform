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

export async function listOnboardingCases() {
  return json(await fetch(`${API_BASE}/organization-onboarding/cases`, { headers: headers() }));
}

export async function submitOnboardingCase(input) {
  return json(await fetch(`${API_BASE}/organization-onboarding/cases`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  }));
}

export async function approveOnboardingCase(caseId, input) {
  return json(await fetch(`${API_BASE}/organization-onboarding/cases/${caseId}/approve`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  }));
}

export async function declineOnboardingCase(caseId, input) {
  return json(await fetch(`${API_BASE}/organization-onboarding/cases/${caseId}/decline`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  }));
}

export async function activateOnboardingCase(caseId, input = {}) {
  return json(await fetch(`${API_BASE}/organization-onboarding/cases/${caseId}/activate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  }));
}

export async function suspendOnboardingCase(caseId, reason) {
  return json(await fetch(`${API_BASE}/organization-onboarding/cases/${caseId}/suspend`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ reason }),
  }));
}

export async function exitOnboardingCase(caseId, reason) {
  return json(await fetch(`${API_BASE}/organization-onboarding/cases/${caseId}/exit`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ reason }),
  }));
}
