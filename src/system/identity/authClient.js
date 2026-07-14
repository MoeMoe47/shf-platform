import { SHS_AUTH_API_BASE } from "@/system/identity/authConfig";

async function parseResponse(response) {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(data?.detail || data?.error || "Authentication request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function authHeaders(csrfToken = "") {
  const headers = { "Content-Type": "application/json" };
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  return headers;
}

export async function fetchCurrentIdentity() {
  const response = await fetch(`${SHS_AUTH_API_BASE}/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse(response);
}

export async function loginWithPassword({ email, password }) {
  const response = await fetch(`${SHS_AUTH_API_BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return parseResponse(response);
}

export async function logoutSession(csrfToken) {
  const response = await fetch(`${SHS_AUTH_API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(csrfToken),
  });
  return parseResponse(response);
}

export async function refreshSession(csrfToken) {
  const response = await fetch(`${SHS_AUTH_API_BASE}/auth/session/refresh`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(csrfToken),
  });
  return parseResponse(response);
}

export async function fetchIdentityAccessCenterData() {
  const endpoints = [
    ["readiness", "/auth/readiness"],
    ["permissionMatrix", "/auth/permission-matrix"],
    ["routeMatrix", "/auth/route-access-matrix"],
    ["audit", "/auth/audit"],
    ["users", "/auth/users"],
  ];
  const entries = await Promise.all(
    endpoints.map(async ([key, path]) => {
      try {
        const response = await fetch(`${SHS_AUTH_API_BASE}${path}`, {
          credentials: "include",
          cache: "no-store",
        });
        return [key, await parseResponse(response)];
      } catch (error) {
        return [key, { error: error.message, status: error.status || 0 }];
      }
    })
  );
  return Object.fromEntries(entries);
}

