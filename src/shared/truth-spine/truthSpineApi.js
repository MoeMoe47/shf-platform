/**
 * SHS Truth Spine V1 API adapter.
 *
 * Purpose:
 * Keep Hub pages from hardcoding backend routes everywhere.
 * This is a hybrid bridge:
 * - Use SHS API when available.
 * - Let page-level fallback keep the demo stable if API is down.
 */

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getDevAuthHeader() {
  return {
    Authorization: "Bearer dev-token:demo-user-1",
  };
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...getDevAuthHeader(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function unwrapItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function unwrapRecord(payload) {
  return payload?.data || payload?.record || payload?.item || payload;
}

export async function fetchBackendReferrals() {
  const payload = await requestJson("/api/cases/referrals");
  return unwrapItems(payload);
}

export async function createBackendReferral(payload) {
  const response = await requestJson("/api/cases/referrals", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return unwrapRecord(response);
}

export async function assignBackendCase(caseId, payload = {}) {
  if (!caseId) throw new Error("assignBackendCase requires caseId");

  const response = await requestJson(`/api/cases/${encodeURIComponent(caseId)}/assign`, {
    method: "POST",
    body: JSON.stringify({
      reason_text: "Assigned from SHS Hub Action Queue",
      ...payload,
    }),
  });

  return unwrapRecord(response);
}

export async function transitionBackendCase(caseId, payload = {}) {
  if (!caseId) throw new Error("transitionBackendCase requires caseId");

  const response = await requestJson(`/api/cases/${encodeURIComponent(caseId)}/transition`, {
    method: "POST",
    body: JSON.stringify({
      reason_text: "Transitioned from SHS Hub Truth Spine",
      ...payload,
    }),
  });

  return unwrapRecord(response);
}

export async function fetchAggregationPipeline(entityId) {
  if (!entityId) throw new Error("fetchAggregationPipeline requires entityId");
  return requestJson(`/api/aggregation/pipeline/${encodeURIComponent(entityId)}`);
}

export async function fetchOracleTruth(entityId) {
  if (!entityId) throw new Error("fetchOracleTruth requires entityId");
  return requestJson(`/api/oracle/truth/${encodeURIComponent(entityId)}`);
}

export async function fetchAuditEvents() {
  const payload = await requestJson("/api/audit");
  return unwrapItems(payload);
}

export async function fetchReportingExports() {
  const payload = await requestJson("/api/reporting/exports");
  return unwrapItems(payload);
}

export async function createReportingExport(payload = {}) {
  const response = await requestJson("/api/reporting/exports", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return unwrapRecord(response);
}

function normalizeCaseStatus(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[-\s]+/g, "_")
    .trim();
}

function normalizeQueueAction(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[-\s]+/g, "_")
    .trim();
}

export function mapQueueActionToBackend(action, referral = {}) {
  const normalizedAction = normalizeQueueAction(action);
  const currentStatus = normalizeCaseStatus(
    referral.status ||
    referral.currentStatus ||
    referral.case_status ||
    "open"
  );

  if (normalizedAction === "assign") {
    return {
      mode: "assign",
      caseId: referral.case_id || referral.id,
      payload: {
        assigned_user_id: referral.assigned_user_id || referral.assigned || "user_admin_001",
        assigned_team_id: referral.assigned_team_id || null,
        reason_text: "Assigned from SHS Partner Action Queue",
      },
    };
  }

  const nextStatusByAction = {
    start_review: "in_review",
    review: "in_review",
    hold: "on_hold",
    resolve: "resolved",
    close: "closed",
  };

  const nextStatus = nextStatusByAction[normalizedAction];

  if (!nextStatus) {
    return {
      mode: "none",
      caseId: referral.case_id || referral.id,
      payload: null,
      reason: `No backend mapping for action: ${action}`,
    };
  }

  return {
    mode: "transition",
    caseId: referral.case_id || referral.id,
    payload: {
      current_status: currentStatus,
      next_status: nextStatus,
      reason_text: `Partner Action Queue changed ${currentStatus} to ${nextStatus}`,
    },
  };
}

export async function syncPartnerQueueActionToBackend(referral = {}, action = "") {
  const mapped = mapQueueActionToBackend(action, referral);

  if (!mapped.caseId) {
    throw new Error("syncPartnerQueueActionToBackend requires a case id");
  }

  if (mapped.mode === "assign") {
    return assignBackendCase(mapped.caseId, mapped.payload);
  }

  if (mapped.mode === "transition") {
    const currentStatus = String(mapped.payload?.current_status || "").toLowerCase();
    const nextStatus = String(mapped.payload?.next_status || "").toLowerCase();

    if (currentStatus && nextStatus && currentStatus === nextStatus) {
      return {
        skipped: true,
        noop: true,
        reason: `No backend transition needed: ${currentStatus} -> ${nextStatus}`,
        caseId: mapped.caseId,
        payload: mapped.payload,
      };
    }

    return transitionBackendCase(mapped.caseId, mapped.payload);
  }

  return {
    skipped: true,
    reason: mapped.reason || "No backend action required",
    caseId: mapped.caseId,
  };
}

