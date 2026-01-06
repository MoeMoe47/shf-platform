// src/pages/lordOutcomes/PilotLauncher.jsx
import React from "react";

// Use your existing pilot component (already in your tree)
import PilotLauncher from "@/components/lordOutcomes/pilots/PilotLauncher.jsx";

export default function PilotLauncherPage() {
  return (
    <div className="loo-dymContainer">
      <div className="loo-pageHeader">
        <h1 className="loo-h1">Pilot Launcher</h1>
        <p className="loo-sub">
          Launch and manage outcome pilots with clear evidence, reporting, and funder-ready exports.
        </p>
      </div>

      {/* Top tiles (quick status) */}
      <div className="loo-tiles" style={{ marginBottom: 14 }}>
        <div className="loo-tile">
          <div className="loo-muted" style={{ fontSize: 12 }}>Active Pilots</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>1</div>
          <div className="loo-muted" style={{ fontSize: 12, marginTop: 8 }}>
            Current cycle running
          </div>
        </div>

        <div className="loo-tile">
          <div className="loo-muted" style={{ fontSize: 12 }}>Evidence Pack</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>Ready</div>
          <div className="loo-muted" style={{ fontSize: 12, marginTop: 8 }}>
            Proof + logs available
          </div>
        </div>

        <div className="loo-tile">
          <div className="loo-muted" style={{ fontSize: 12 }}>Reporting</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>Live</div>
          <div className="loo-muted" style={{ fontSize: 12, marginTop: 8 }}>
            L4 → L5 metrics flowing
          </div>
        </div>
      </div>

      {/* Main card */}
      <section className="loo-card">
        <div className="loo-cardPad">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div>
              <div className="loo-muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>
                Pilot Controls
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>
                Start / Track / Export
              </div>
              <div className="loo-muted" style={{ fontSize: 12, marginTop: 6 }}>
                Run a pilot like a fundable program: define scope, log outcomes, export proof.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="loo-btnSecondary"
                type="button"
                onClick={() => window.alert("Coming next: Funding narrative + export pack")}
              >
                Funding Narrative
              </button>
              <button
                className="loo-btn"
                type="button"
                onClick={() => window.alert("Coming next: Export evidence pack (JSON/CSV/PDF)")}
              >
                Export Pack
              </button>
            </div>
          </div>

          {/* Your existing launcher UI */}
          <PilotLauncher />
        </div>
      </section>

      {/* Secondary info row */}
      <div className="loo-grid2" style={{ marginTop: 14 }}>
        <section className="loo-card">
          <div className="loo-cardPad">
            <div className="loo-cardTitle">Recommended Pilot Structure</div>
            <p className="loo-text">
              Define a program scope, choose your metrics, run for a fixed window (ex: 30–90 days),
              and produce an evidence-backed report for funders and partners.
            </p>
          </div>
        </section>

        <section className="loo-card">
          <div className="loo-cardPad">
            <div className="loo-cardTitle">Compliance Notes</div>
            <p className="loo-text">
              Track outcomes with minimal personal data. Store proof artifacts and event logs
              so audits and reporting are straightforward.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
