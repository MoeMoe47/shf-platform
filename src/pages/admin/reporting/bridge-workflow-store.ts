export interface BridgeWorkflowState {
  caseId: string;
  toOrganizationId: string;
  verificationState: "pending" | "verified";
  sourceToReportTraceCoverage: boolean;
  publicationMode: string;
}

const STORAGE_KEY = "shs_bridge_workflow_state";

const DEFAULT_STATE: BridgeWorkflowState = {
  caseId: "hub_case_demo_001",
  toOrganizationId: "",
  verificationState: "pending",
  sourceToReportTraceCoverage: false,
  publicationMode: "admin_internal",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadPersistedState(): BridgeWorkflowState {
  if (!canUseStorage()) return { ...DEFAULT_STATE };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function persistState(state: BridgeWorkflowState) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage write failures
  }
}

let currentState: BridgeWorkflowState = loadPersistedState();

export function getBridgeWorkflowState(): BridgeWorkflowState {
  if (canUseStorage()) {
    currentState = loadPersistedState();
  }
  return { ...currentState };
}

export function resetBridgeWorkflowState(): BridgeWorkflowState {
  currentState = { ...DEFAULT_STATE };
  persistState(currentState);
  return getBridgeWorkflowState();
}

export function updateBridgeWorkflowState(
  partial: Partial<BridgeWorkflowState>
): BridgeWorkflowState {
  currentState = {
    ...getBridgeWorkflowState(),
    ...partial,
  };
  persistState(currentState);
  return getBridgeWorkflowState();
}

export function deriveBridgeWorkflowReadiness(state: BridgeWorkflowState) {
  const missingFields: string[] = [];

  if (!state.toOrganizationId) {
    missingFields.push("toOrganizationId");
  }

  const aggregationReady = missingFields.length === 0;
  const verificationReady =
    aggregationReady && state.verificationState === "verified";
  const reportingReady =
    verificationReady && state.sourceToReportTraceCoverage;

  return {
    aggregationReady,
    verificationReady,
    reportingReady,
    missingFields,
  };
}
