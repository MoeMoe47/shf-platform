const RAW_API_BASE = (import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000").trim();

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function ensureLeadingSlash(value) {
  return String(value || "").startsWith("/") ? value : `/${value}`;
}

export const API_BASE = stripTrailingSlash(RAW_API_BASE);

export function buildApiUrl(path) {
  if (!path || typeof path !== "string") {
    throw new Error("buildApiUrl(path) requires a non-empty string path.");
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE}${ensureLeadingSlash(path)}`;
}

export async function apiRequest(path, options = {}) {
  const url = buildApiUrl(path);
  const method = options.method || "GET";
  const timeoutMs = options.timeoutMs ?? 15000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();

  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    const durationMs = Math.round(performance.now() - started);
    const contentType = response.headers.get("content-type") || "";

    let payload = null;
    let rawText = "";

    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      rawText = await response.text();
    }

    console.info("[apiRequest]", {
      method,
      path,
      url,
      status: response.status,
      ok: response.ok,
      durationMs,
    });

    if (!response.ok) {
      const message =
        payload?.detail ||
        payload?.message ||
        rawText ||
        `Request failed with status ${response.status}`;

      const error = new Error(message);
      error.status = response.status;
      error.url = url;
      error.payload = payload;
      throw error;
    }

    return payload;
  } catch (err) {
    const durationMs = Math.round(performance.now() - started);

    if (err?.name === "AbortError") {
      const error = new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
      error.url = url;
      error.timeoutMs = timeoutMs;
      console.error("[apiRequest timeout]", { method, path, url, durationMs });
      throw error;
    }

    console.error("[apiRequest error]", {
      method,
      path,
      url,
      durationMs,
      message: err?.message || String(err),
    });

    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function apiGet(path, options = {}) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}
