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

function assertBinder(data, fallback) {
  if (!data?.binderId || data?.lifecycleStatus !== "draft" || !Number.isInteger(Number(data.version))) {
    throw new Error(fallback);
  }
  return data;
}

export async function listGrantBinders({
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Grant Binder backend unavailable");
  const response = await fetchImpl(`${apiBase}/grant-binders`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await requestJson(response);
  if (!response.ok || !Array.isArray(data?.data?.items)) {
    throw new Error(errorMessage(data, "Grant Binder workspace unavailable"));
  }
  return data.data.items.map((item) => assertBinder(item, "Invalid Grant Binder workspace response"));
}

export async function createGrantBinder({
  title = "Grant Binder Workspace",
} = {}, {
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Grant Binder backend unavailable");
  const response = await fetchImpl(`${apiBase}/grant-binders`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await requestJson(response);
  if (!response.ok) throw new Error(errorMessage(data, "Grant Binder workspace could not be created"));
  return assertBinder(data?.data, "Invalid Grant Binder workspace response");
}

export async function updateGrantBinder(binderId, input, {
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Grant Binder backend unavailable");
  const response = await fetchImpl(`${apiBase}/grant-binders/${encodeURIComponent(binderId)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await requestJson(response);
  if (!response.ok) throw new Error(errorMessage(data, "Grant Binder workspace could not be updated"));
  return assertBinder(data?.data, "Invalid Grant Binder workspace response");
}
