const API_BASE = import.meta.env.VITE_SHS_API_BASE || "http://127.0.0.1:8091";

function token() {
  return window.localStorage.getItem("shfOperatorToken") || "";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(options.headers || {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `Request failed (${response.status})`);
  return payload.data;
}

export const createAccommodationDraft = (body) => request("/accessibility/accommodations/drafts", { method: "POST", body });
export const submitAccommodation = (id) => request(`/accessibility/accommodations/${id}/submit`, { method: "POST" });
export const getOwnAccommodation = (id) => request(`/accessibility/accommodations/me/${id}`);
export const listAccommodations = () => request("/accessibility/accommodations");
export const reviewAccommodation = (id) => request(`/accessibility/accommodations/${id}/review`, { method: "POST" });
export const approveAccommodation = (id, body) => request(`/accessibility/accommodations/${id}/approve`, { method: "POST", body });
export const activateAccommodation = (id) => request(`/accessibility/accommodations/${id}/activate`, { method: "POST" });
export const getAccommodationProjection = (id) => request(`/accessibility/accommodations/${id}/projection`);
export const fulfillAccommodation = (id, requirementId, fulfillmentStatus) => request(`/accessibility/accommodations/${id}/requirements/${requirementId}/fulfillment`, { method: "PATCH", body: { fulfillmentStatus } });
export async function getCurrentAuth() {
  const response = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token()}` } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `Request failed (${response.status})`);
  return payload;
}
