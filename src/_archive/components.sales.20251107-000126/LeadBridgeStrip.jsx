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
    <div className="card" style={{ marginBottom: 16 }}>
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
              <span className="muted">
                {l.state} · {l.pathway} · ${l.wage}/hr · {l.hours}h
              </span>{" "}
              <a className="btn btn--sm" href={`/sales.html#/proposal?${params.toString()}`}>
                Create Proposal →
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
