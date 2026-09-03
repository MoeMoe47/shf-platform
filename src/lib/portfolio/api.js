import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const PORTFOLIO_API_BASE = import.meta.env?.VITE_SHS_API_BASE || import.meta.env?.VITE_LIVE_LEARNING_API_BASE || "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error?.message || "Portfolio is unavailable right now.");
    error.code = payload?.error?.code || "PORTFOLIO_REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload?.data ?? payload;
}

export async function getPortfolio(role = "student") {
  return parseResponse(await fetch(`${PORTFOLIO_API_BASE}/portfolio`, {
    credentials: "include", cache: "no-store", headers: authHeaders(role),
  }));
}

export async function listPortfolioArtifacts(role = "student") {
  return parseResponse(await fetch(`${PORTFOLIO_API_BASE}/portfolio/artifacts`, {
    credentials: "include", cache: "no-store", headers: authHeaders(role),
  }));
}

export async function createPortfolioArtifactFromEvidence(role = "student", { evidenceId, ...presentation } = {}) {
  const body = { evidenceId };
  for (const key of ["title", "summary", "reflection", "thumbnailRef", "collectionKey", "position", "visibility"]) {
    if (presentation[key] !== undefined) body[key] = presentation[key];
  }
  return parseResponse(await fetch(`${PORTFOLIO_API_BASE}/portfolio/artifacts/from-evidence`, {
    method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify(body),
  }));
}

export async function updatePortfolioArtifact(role = "student", artifactId, presentation = {}) {
  const body = {};
  for (const key of ["title", "summary", "reflection", "thumbnailRef", "collectionKey", "position", "visibility", "status"]) {
    if (presentation[key] !== undefined) body[key] = presentation[key];
  }
  return parseResponse(await fetch(`${PORTFOLIO_API_BASE}/portfolio/artifacts/${encodeURIComponent(artifactId)}`, {
    method: "PATCH", credentials: "include", headers: authHeaders(role), body: JSON.stringify(body),
  }));
}

export default {
  getPortfolio,
  listPortfolioArtifacts,
  createPortfolioArtifactFromEvidence,
  updatePortfolioArtifact,
};
