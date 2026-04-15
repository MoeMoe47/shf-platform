const HUB_API_BASE = "http://127.0.0.1:8091";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer dev-token:user_admin_001",
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error?.message || `Request failed: ${res.status}`);
  }
  return data?.data ?? data;
}

export async function fetchOrganizations() {
  const res = await fetch(`${HUB_API_BASE}/identity/organizations`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return parseJson(res);
}

export async function fetchTaxonomy() {
  const res = await fetch(`${HUB_API_BASE}/programs/taxonomy`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return parseJson(res);
}

export async function fetchReferrals() {
  const res = await fetch(`${HUB_API_BASE}/cases/referrals`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return parseJson(res);
}

export default {
  fetchOrganizations,
  fetchTaxonomy,
  fetchReferrals,
};
