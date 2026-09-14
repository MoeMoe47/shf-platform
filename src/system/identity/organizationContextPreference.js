const PREFERRED_ORG_KEY = "shsPreferredOrganizationId";
const LEGACY_OPERATOR_ORG_KEY = "shfOperatorOrganizationId";

const ORG_SCOPED_STATE_KEYS = [
  "shsActiveRouteState",
  "shsSelectedServiceKey",
  "shsOrganizationScopedFilters",
  "shsWorkflowDraftState",
];

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getPreferredOrganizationId() {
  const store = storage();
  if (!store) return "";
  return store.getItem(PREFERRED_ORG_KEY) || store.getItem(LEGACY_OPERATOR_ORG_KEY) || "";
}

export function setPreferredOrganizationId(organizationId) {
  const store = storage();
  if (!store) return "";
  const normalized = String(organizationId || "").trim();
  if (!normalized) {
    store.removeItem(PREFERRED_ORG_KEY);
    return "";
  }
  store.setItem(PREFERRED_ORG_KEY, normalized);
  return normalized;
}

export function clearOrganizationScopedClientState() {
  const store = storage();
  if (!store) return;
  ORG_SCOPED_STATE_KEYS.forEach((key) => store.removeItem(key));
}

export function applyOrganizationContextInvalidation(invalidation = {}) {
  if (invalidation.clear_org_scoped_state) {
    clearOrganizationScopedClientState();
  }
}
