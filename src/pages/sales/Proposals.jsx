// src/pages/sales/Proposals.jsx
//
// The previous version of this file was a verbatim, unmodified copy of
// src/pages/civic/Proposals.jsx — same component name, same UI text
// ("Draft, debate, vote"), and critically the same localStorage keys
// (civic:proposals, civic:proposalVotes, civic:kpi:*, civic:flag:*),
// meaning every "sales proposal" was silently being written into the real
// Civic app's own data. Rebuilt here on src/shared/sales/proposals.js,
// which already existed with the correct "sales:proposal:drafts"
// namespace but was never wired to any UI.
import React from "react";
import { createDraft, listDrafts } from "@/shared/sales/proposals.js";

export default function Proposals() {
  const [drafts, setDrafts] = React.useState(() => listDrafts());
  const [org, setOrg] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function submit() {
    if (!org.trim()) return;
    createDraft({ org: org.trim(), notes: notes.trim() });
    setDrafts(listDrafts());
    setOrg("");
    setNotes("");
  }

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Proposals</h1>
          <p className="db-subtitle">Draft proposals for prospective clients.</p>
        </div>
      </header>

      <div className="db-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <section className="card card--pad">
          <strong>New Proposal</strong>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--ink-soft, #6b7280)" }}>Organization</span>
              <input
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g. Cleveland City Schools"
                style={{ padding: "8px 10px", border: "1px solid var(--ring)", borderRadius: 8 }}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--ink-soft, #6b7280)" }}>Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                style={{ padding: "8px 10px", border: "1px solid var(--ring)", borderRadius: 8, resize: "vertical" }}
              />
            </label>
            <div>
              <button type="button" className="sh-btn" onClick={submit} disabled={!org.trim()}>
                Create Draft
              </button>
            </div>
          </div>
        </section>

        <section className="card card--pad">
          <strong>Drafts</strong>
          {drafts.length === 0 ? (
            <p style={{ color: "var(--ink-soft, #6b7280)", marginTop: 8 }}>No proposal drafts yet.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 8 }}>
              {drafts.map((d) => (
                <li key={d.id} style={{ borderBottom: "1px solid var(--ring)", paddingBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>{d.org}</div>
                  {d.notes && <div style={{ fontSize: 13, color: "var(--ink-soft, #6b7280)" }}>{d.notes}</div>}
                  <div style={{ fontSize: 12, color: "var(--ink-soft, #6b7280)" }}>
                    {new Date(d.createdAt).toLocaleString()}
                    {d.source === "employer-bridge" ? " · via employer bridge" : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
