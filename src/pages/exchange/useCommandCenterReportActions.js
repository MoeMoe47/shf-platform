import { useCallback } from "react";

function buildFallbackReportData({ agentContext, proofMetrics }) {
  const safe = agentContext || {};
  const rec = safe?.recommendation || {};

  return {
    generatedAt: new Date().toISOString(),
    title: "Intelligence Brief",
    caseLabel: safe?.activeCase?.label || "Unknown Case",
    timelineStep: safe?.timelineStep || "risk_signal",
    systemStatus: safe?.systemStatus || "review_in_progress",
    recommendation: {
      action: rec?.action || "no_action",
      reason: rec?.reason || "No recommendation reason available.",
      confidence: rec?.confidence ?? 0,
      prerequisites: Array.isArray(rec?.prerequisites) ? rec.prerequisites : [],
      blockers: Array.isArray(rec?.blockers) ? rec.blockers : [],
    },
    proofMetrics: proofMetrics || {},
  };
}

export function useCommandCenterReportActions({
  agentContext,
  proofMetrics,
}) {
  const handleGenerateBrief = useCallback(() => {
    const report = buildFallbackReportData({
      agentContext,
      proofMetrics,
    });

    try {
      localStorage.setItem(
        "shf.commandCenter.latestBrief",
        JSON.stringify(report)
      );
    } catch {}

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    try {
      localStorage.setItem("shf.commandCenter.latestBriefUrl", url);
    } catch {}

    window.open(url, "_blank", "noopener,noreferrer");
  }, [agentContext, proofMetrics]);

  const handleOpenLatestBrief = useCallback(() => {
    try {
      const storedUrl = localStorage.getItem("shf.commandCenter.latestBriefUrl");
      if (storedUrl) {
        window.open(storedUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const storedReport = localStorage.getItem("shf.commandCenter.latestBrief");
      if (storedReport) {
        const blob = new Blob([storedReport], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // no-op for safe Phase 1 behavior
    }
  }, []);

  return {
    handleGenerateBrief,
    handleOpenLatestBrief,
  };
}
