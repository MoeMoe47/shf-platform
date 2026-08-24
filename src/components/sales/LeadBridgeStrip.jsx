// src/components/sales/LeadBridgeStrip.jsx
//
// Copied forward from src/_archive/components.sales.20251107-000126/
// LeadBridgeStrip.jsx — a real, working Sales<->Employer bridge (reads
// src/shared/sales/leadQueue.js, backed by a real dev mock endpoint in
// src/dev/mockApi.js). Renders nothing when the queue is empty, which is
// the expected state until an Employer-side flow actually pushes a lead.
// .muted/.btn/.btn--sm from the archive aren't defined anywhere in the
// project — swapped for inline styles instead.
import React from "react";
import { getLeadQueue } from "@/shared/sales/leadQueue.js";

export default function LeadBridgeStrip() {
  const [leads, setLeads] = React.useState(() => getLeadQueue());

  React.useEffect(() => {
    const h = () => setLeads(getLeadQueue());
    window.addEventListener("sales:leadQueue:updated", h);
    return () => window.removeEventListener("sales:leadQueue:updated", h);
  }, []);

  if (!leads.length) return null;

  return (
    <div className="card card--pad" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: 0 }}>New employer leads</h3>
      <ul style={{ margin: "8px 0 0 0", paddingLeft: 16 }}>
        {leads.slice(-5).reverse().map((l, i) => {
          const params = new URLSearchParams({
            pathway: l.pathway ?? "",
            wage: String(l.wage ?? ""),
            hours: String(l.hours ?? ""),
            programIds: (l.programs || []).join(","),
          });
          return (
            <li key={i} style={{ marginBottom: 6 }}>
              <span style={{ color: "var(--ink-soft, #6b7280)" }}>
                {l.state} · {l.pathway} · ${l.wage}/hr · {l.hours}h
              </span>{" "}
              <a className="sh-btn sh-btn--soft" href={`#/demo/proposal?${params.toString()}`}>
                Create Proposal →
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
