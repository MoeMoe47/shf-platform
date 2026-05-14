import React from "react";
export default function Collapsible({ summary, children, defaultOpen=false }) {
  return (
    <details className="sh-collapse" open={defaultOpen}>
      <summary className="sh-collapseSummary">{summary}</summary>
      <div className="sh-collapseBody">{children}</div>
    </details>
  );
}
