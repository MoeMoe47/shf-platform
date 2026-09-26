// src/pages/admin/agent-fabric-command/commandClient.js
// Read-only client for the Command Center. GET only. Two transports, one client:
//   - "fabric": same-origin Fabric base (fabricConfig.js /fabric-api) — public
//     probes and AFCC-2A session reads. Never a hard-coded host.
//   - "shs": the SHS API /api base (AFCC-2A.2 bridge). SHS authorizes the user
//     and reads Fabric server-side with its own service identity.
// The browser sends no credential header on either path (cookies only).
import {
  FABRIC_API_BASE,
  FABRIC_PRODUCTION_UNCONFIGURED_BASE,
  fabricUrl,
} from "../../../system/fabric/fabricConfig.js";
import { getPreferredOrganizationId } from "../../../system/identity/organizationContextPreference.js";
import {
  BACKEND_AUTH,
  BROWSER_SATISFIABLE_AUTH,
  FAILURE_LAYER,
  REQUEST_TIMEOUT_MS,
  SOURCE_STATE,
  TRANSPORT,
} from "./commandContracts.js";

const AUTH_BRIDGE_MESSAGE = "This route accepts only a server-held Fabric admin credential.";
const BRIDGE_CONTRACT = "afcc.bridge.v1";

// Same resolution order as system/identity/authConfig.js (window override ->
// VITE_SHS_API_BASE -> "/api"), guarded so it also loads outside Vite.
export function resolveShsApiBase() {
  try {
    if (typeof window !== "undefined" && window.__SHS_API_BASE__) return String(window.__SHS_API_BASE__);
  } catch {
    // no window
  }
  try {
    const configured = import.meta.env.VITE_SHS_API_BASE;
    if (configured) return String(configured);
  } catch {
    // outside Vite
  }
  return "/api";
}

export function shsUrl(path, base = resolveShsApiBase()) {
  return `${String(base).replace(/\/+$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function isFabricRouteConfigured(base = FABRIC_API_BASE) {
  return base !== FABRIC_PRODUCTION_UNCONFIGURED_BASE;
}

function sourceResult(endpoint, state, extra = {}) {
  return {
    key: endpoint.key,
    endpoint: endpoint.path,
    authority: endpoint.authority,
    state,
    httpStatus: extra.httpStatus ?? null,
    payload: extra.payload ?? null,
    message: extra.message || "",
    failedLayer: extra.failedLayer || null,
    observedAt: extra.observedAt || new Date().toISOString(),
  };
}

function detailFrom(payload) {
  const detail = payload?.detail ?? payload?.reason_code ?? payload?.error ?? payload?.message;
  return typeof detail === "string" ? detail.slice(0, 200) : "";
}

const REASON = /^[A-Z][A-Z0-9_]{1,63}$/;

// SHS bridge error envelope -> source state. The bridge names the failing layer.
const BRIDGE_STATES = Object.freeze({
  BRIDGE_NOT_CONFIGURED: SOURCE_STATE.BRIDGE_NOT_CONFIGURED,
  BACKEND_UNAVAILABLE: SOURCE_STATE.BACKEND_UNAVAILABLE,
  BRIDGE_REJECTED: SOURCE_STATE.BRIDGE_REJECTED,
  FABRIC_ERROR: SOURCE_STATE.FABRIC_ERROR,
  INVALID_RESPONSE: SOURCE_STATE.INVALID_RESPONSE,
});
const BRIDGE_LAYERS = new Set([FAILURE_LAYER.SHS, FAILURE_LAYER.SHS_TO_FABRIC, FAILURE_LAYER.FABRIC]);

function classifyBridgeError(endpoint, status, payload, now) {
  const error = payload?.error;
  const state = BRIDGE_STATES[error?.code];
  if (payload?.contract !== BRIDGE_CONTRACT || !state) return null;
  const reason = REASON.test(String(error.reason_code || "")) ? ` (${error.reason_code})` : "";
  return sourceResult(endpoint, state, {
    httpStatus: status,
    message: `${typeof error.message === "string" ? error.message.slice(0, 200) : ""}${reason}`,
    failedLayer: BRIDGE_LAYERS.has(error.layer) ? error.layer : FAILURE_LAYER.SHS,
    observedAt: now(),
  });
}

// Fetches one contract endpoint and classifies the outcome. Never throws.
export async function fetchCommandSource(endpoint, options = {}) {
  const {
    fetchImpl = globalThis.fetch,
    base = FABRIC_API_BASE,
    shsBase = resolveShsApiBase(),
    timeoutMs = REQUEST_TIMEOUT_MS,
    signal,
    now = () => new Date().toISOString(),
  } = options;
  const viaShs = endpoint.transport === TRANSPORT.SHS;
  const firstHop = viaShs ? FAILURE_LAYER.BROWSER_TO_SHS : FAILURE_LAYER.GATEWAY_TO_FABRIC;

  if (!endpoint.admitted) {
    return sourceResult(endpoint, SOURCE_STATE.AUTH_HARDENING_REQUIRED, {
      message: endpoint.rejection,
      observedAt: now(),
    });
  }
  // AFCC-2A.1: routes that only accept the Fabric admin key are never called from the browser.
  if (!BROWSER_SATISFIABLE_AUTH.includes(endpoint.auth)) {
    return sourceResult(endpoint, SOURCE_STATE.AUTH_BRIDGE_REQUIRED, { message: AUTH_BRIDGE_MESSAGE, observedAt: now() });
  }
  if (!viaShs && !isFabricRouteConfigured(base)) {
    return sourceResult(endpoint, SOURCE_STATE.NOT_CONFIGURED, {
      message: "No Agent Fabric route is configured for this deployment.",
      observedAt: now(),
    });
  }

  // No credential headers: Fabric reads use the same-origin Fabric session cookie;
  // SHS bridge reads use the SHS session cookie. The organization preference is
  // context, not a credential, and is what every SHS client sends.
  const headers = { Accept: "application/json" };
  if (viaShs) {
    const org = getPreferredOrganizationId();
    if (org) headers["x-shs-preferred-organization-id"] = org;
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener?.("abort", onOuterAbort);

  let response;
  try {
    response = await fetchImpl(viaShs ? shsUrl(endpoint.path, shsBase) : fabricUrl(endpoint.path), {
      method: "GET",
      headers,
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    signal?.removeEventListener?.("abort", onOuterAbort);
    if (timedOut) {
      return sourceResult(endpoint, SOURCE_STATE.TIMEOUT, {
        message: `No response within ${Math.round(timeoutMs / 1000)}s.`,
        failedLayer: firstHop,
        observedAt: now(),
      });
    }
    return sourceResult(endpoint, SOURCE_STATE.OFFLINE, {
      message: viaShs ? "The SHS API could not be reached from this browser." : "Agent Fabric could not be reached.",
      failedLayer: firstHop,
      observedAt: now(),
    });
  }
  clearTimeout(timer);
  signal?.removeEventListener?.("abort", onOuterAbort);

  const status = response.status;
  let payload = null;
  let parsed = false;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
    parsed = payload !== null;
  } catch {
    parsed = false;
  }
  const isObject = parsed && typeof payload === "object" && !Array.isArray(payload);

  if (viaShs) {
    const bridged = isObject ? classifyBridgeError(endpoint, status, payload, now) : null;
    if (bridged) return bridged;
    if (status === 401) {
      return sourceResult(endpoint, SOURCE_STATE.UNAUTHENTICATED, {
        httpStatus: status,
        message: "The SHS API requires a signed-in SHS session.",
        failedLayer: FAILURE_LAYER.BROWSER_TO_SHS,
        observedAt: now(),
      });
    }
    if (status === 403) {
      return sourceResult(endpoint, SOURCE_STATE.FORBIDDEN, {
        httpStatus: status,
        message: "Your SHS role does not hold bos.governance.read for the active organization.",
        failedLayer: FAILURE_LAYER.BROWSER_TO_SHS,
        observedAt: now(),
      });
    }
  } else if (status === 401 && endpoint.auth === BACKEND_AUTH.COMMAND_READ) {
    // No Fabric session in this browser. These three reads are not bridged yet.
    return sourceResult(endpoint, SOURCE_STATE.AUTH_BRIDGE_REQUIRED, {
      httpStatus: status,
      message: "No Fabric session is present in this browser.",
      failedLayer: FAILURE_LAYER.GATEWAY_TO_FABRIC,
      observedAt: now(),
    });
  } else if (status === 401) {
    return sourceResult(endpoint, SOURCE_STATE.UNAUTHENTICATED, {
      httpStatus: status,
      message: "Agent Fabric rejected the request as unauthenticated.",
      observedAt: now(),
    });
  } else if (status === 403) {
    return sourceResult(endpoint, SOURCE_STATE.FORBIDDEN, {
      httpStatus: status,
      message: "Agent Fabric denied access to this source for the current credentials.",
      observedAt: now(),
    });
  }

  if (!endpoint.acceptStatuses.includes(status)) {
    if (status >= 500 && !isObject) {
      // An empty or non-JSON 5xx comes from the proxy/gateway, not the service:
      // the service behind it is not reachable (e.g. the dev proxy's ECONNREFUSED 500).
      return sourceResult(endpoint, SOURCE_STATE.BACKEND_UNAVAILABLE, {
        httpStatus: status,
        message: viaShs ? "The gateway could not reach the SHS API." : "The gateway could not reach Agent Fabric.",
        failedLayer: firstHop,
        observedAt: now(),
      });
    }
    if (status >= 500 && !viaShs) {
      return sourceResult(endpoint, SOURCE_STATE.FABRIC_ERROR, {
        httpStatus: status,
        message: detailFrom(payload) || `Agent Fabric returned HTTP ${status}.`,
        failedLayer: FAILURE_LAYER.FABRIC,
        observedAt: now(),
      });
    }
    return sourceResult(endpoint, SOURCE_STATE.HTTP_ERROR, {
      httpStatus: status,
      message: detailFrom(payload) || `${viaShs ? "The SHS API" : "Agent Fabric"} returned HTTP ${status}.`,
      failedLayer: viaShs ? FAILURE_LAYER.SHS : FAILURE_LAYER.FABRIC,
      observedAt: now(),
    });
  }
  if (!isObject) {
    return sourceResult(endpoint, SOURCE_STATE.INVALID_RESPONSE, {
      httpStatus: status,
      message: "Response was not the JSON object this contract expects.",
      failedLayer: viaShs ? FAILURE_LAYER.SHS : FAILURE_LAYER.FABRIC,
      observedAt: now(),
    });
  }
  return sourceResult(endpoint, SOURCE_STATE.AVAILABLE, {
    httpStatus: status,
    payload,
    observedAt: now(),
  });
}
