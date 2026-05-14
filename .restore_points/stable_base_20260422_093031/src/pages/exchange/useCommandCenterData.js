import { useCallback, useEffect, useMemo, useState } from "react";
import { loadCommandCenterData } from "./commandCenterAdapter";

const DEFAULT_CASE = {
  id: "franklin_county",
  label: "Franklin County",
  status: "review_in_progress",
};

const DEFAULT_RECOMMENDATION = {
  action: "assign_verifier",
  reason: "duplicate outcome anomaly triggered verification review",
  confidence: 0.81,
  blockers: [],
  prerequisites: ["funding_pool_ready", "contract_present"],
};

function buildChangeSummary(prevData, nextData) {
  if (!prevData || !nextData) {
    return {
      hasChanges: false,
      items: ["Initial load complete. No prior snapshot available yet."],
    };
  }

  const prev = prevData?.proofMetrics || {};
  const next = nextData?.proofMetrics || {};
  const items = [];

  const checks = [
    ["verifiedOutcomes", "Verified outcomes"],
    ["capitalDeployed", "Capital deployed"],
    ["openDisputeCount", "Open disputes"],
    ["poolCount", "Pool count"],
  ];

  checks.forEach(([key, label]) => {
    const a = prev?.[key] ?? 0;
    const b = next?.[key] ?? 0;
    if (a !== b) {
      const direction = b > a ? "increased" : "decreased";
      items.push(`${label} ${direction} from ${a} to ${b}.`);
    }
  });

  if (!items.length) {
    items.push("No material dashboard metric changes detected on refresh.");
  }

  return {
    hasChanges: items[0] !== "No material dashboard metric changes detected on refresh.",
    items,
  };
}

export function useCommandCenterData() {
  const [data, setData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCase, setActiveCase] = useState(DEFAULT_CASE);
  const [viewMode, setViewMode] = useState("executive");
  const [selectedPanel, setSelectedPanel] = useState("response_plan");
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [timelineStep, setTimelineStep] = useState("verification_inquiry");
  const [agentAudience, setAgentAudience] = useState("operator");
  const [systemStatus, setSystemStatus] = useState("review_in_progress");
  const [recommendation, setRecommendation] = useState(DEFAULT_RECOMMENDATION);
  const [changeSummary, setChangeSummary] = useState({
    hasChanges: false,
    items: ["Initial load complete. No prior snapshot available yet."],
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const next = await loadCommandCenterData();

      setPreviousData((prev) => {
        setChangeSummary(buildChangeSummary(data, next));
        return data;
      });

      setData(next);

      const inferredCase = next?.activeCase || DEFAULT_CASE;
      const inferredStatus =
        next?.systemStatus ||
        inferredCase?.status ||
        "review_in_progress";

      const inferredRecommendation =
        next?.recommendation || DEFAULT_RECOMMENDATION;

      setActiveCase((current) =>
        current?.id === DEFAULT_CASE.id ? inferredCase : current
      );
      setSystemStatus((current) =>
        current === "review_in_progress" ? inferredStatus : current
      );
      setRecommendation((current) =>
        current?.action === DEFAULT_RECOMMENDATION.action ? inferredRecommendation : current
      );
    } catch (err) {
      setError(err?.message || "Failed to load command center data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const resetToLiveState = useCallback(() => {
    const inferredCase = data?.activeCase || DEFAULT_CASE;
    const inferredStatus =
      data?.systemStatus ||
      inferredCase?.status ||
      "review_in_progress";

    const inferredRecommendation =
      data?.recommendation || DEFAULT_RECOMMENDATION;

    setActiveCase(inferredCase);
    setViewMode("executive");
    setSelectedPanel("response_plan");
    setSelectedMetric(null);
    setTimelineStep("verification_inquiry");
    setAgentAudience("operator");
    setSystemStatus(inferredStatus);
    setRecommendation(inferredRecommendation);
  }, [data]);


  useEffect(() => {
    refresh();
  }, [refresh]);

  const agentContext = useMemo(() => {
    return {
      activeCase,
      viewMode,
      selectedPanel,
      selectedMetric,
      timelineStep,
      agentAudience,
      systemStatus,
      recommendation,
      changeSummary,
    };
  }, [
    activeCase,
    viewMode,
    selectedPanel,
    selectedMetric,
    timelineStep,
    agentAudience,
    systemStatus,
    recommendation,
    changeSummary,
  ]);

  return {
    data,
    previousData,
    loading,
    error,
    refresh,

    activeCase,
    setActiveCase,

    viewMode,
    setViewMode,

    selectedPanel,
    setSelectedPanel,

    selectedMetric,
    setSelectedMetric,

    timelineStep,
    setTimelineStep,

    agentAudience,
    setAgentAudience,

    systemStatus,
    setSystemStatus,

    recommendation,
    setRecommendation,

    changeSummary,
    resetToLiveState,
    agentContext,
  };
}
