const DEFAULT_API_BASE = "/api";

async function requestJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function errorMessage(data, fallback) {
  return data?.error?.message || data?.error || fallback;
}

export async function createShsReportDraft(input, {
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("SHS report backend unavailable");
  const response = await fetchImpl(`${apiBase}/reporting/drafts`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await requestJson(response);
  if (!response.ok || !data?.data?.reportId) {
    throw new Error(errorMessage(data, "SHS report draft could not be saved"));
  }
  return data.data;
}

export async function listShsReportDrafts({
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("SHS report backend unavailable");
  const response = await fetchImpl(`${apiBase}/reporting/drafts`, { credentials: "include", cache: "no-store" });
  const data = await requestJson(response);
  if (!response.ok || !Array.isArray(data?.data?.items)) {
    throw new Error(errorMessage(data, "SHS report drafts unavailable"));
  }
  return data.data.items;
}

export async function getShsReportDraft(reportId, {
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("SHS report backend unavailable");
  const response = await fetchImpl(`${apiBase}/reporting/drafts/${encodeURIComponent(reportId)}`, { credentials: "include", cache: "no-store" });
  const data = await requestJson(response);
  if (!response.ok || !data?.data?.reportId) {
    throw new Error(errorMessage(data, "SHS report draft unavailable"));
  }
  return data.data;
}

export async function listShsReportRevisions(reportId, {
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("SHS report backend unavailable");
  const response = await fetchImpl(`${apiBase}/reporting/drafts/${encodeURIComponent(reportId)}/revisions`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await requestJson(response);
  if (!response.ok || !Array.isArray(data?.data?.items)) {
    throw new Error(errorMessage(data, "SHS report revisions unavailable"));
  }
  return data.data.items;
}
