import React from "react";

export default function LineageTraceButton({ lineageId, label = "Trace", compact = false }) {
  const hasTrace = Boolean(lineageId);

  function handleClick() {
    if (!hasTrace || typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("shs:lineage-trace-request", {
        detail: {
          lineageId,
          source: "aggregation_ui",
          timestamp: new Date().toISOString(),
        },
      })
    );
  }

  return (
    <button
      type="button"
      className={[
        "admin-aggregation-trace-button",
        hasTrace ? "is-ready" : "is-missing",
        compact ? "is-compact" : "",
      ].join(" ")}
      onClick={handleClick}
      disabled={!hasTrace}
      title={hasTrace ? `Open lineage trace ${lineageId}` : "Lineage trace missing"}
    >
      {label}
    </button>
  );
}
