// src/pages/arcade/ArcadeDashboardNorthstar.jsx
// ------------------------------------------------------------
// SHF Arcade – Northstar Dashboard
//
// High-level KPIs + dev-only test panel that fires sample
// arcade events through useArcadeLedger so you can:
//   - Populate Arcade History
//   - Test CSV exports
//   - Verify Polygon / wallet wiring
// ------------------------------------------------------------

import React from "react";
import { Link } from "react-router-dom";
import { useArcadeLedger } from "@/shared/arcade/useArcadeLedger.js";

const isDev =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
  process.env.NODE_ENV !== "production";

export default function ArcadeDashboardNorthstar() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Arcade — Northstar</h1>
          <p className="db-subtitle">
            Core KPIs across XP, EVU, rewards, and Polygon-verified cohorts.
          </p>
        </div>

        {/* History shortcut */}
        <div className="db-head-actions">
          <Link to="/history" className="db-history-btn">
            View History
          </Link>
        </div>
      </header>

      {/* Northstar content scaffold */}
      <div className="card card--pad">
        <p>
          This Northstar view is where you’ll surface high-level arcade KPIs:
          <strong> sessions per cohort</strong>, <strong>XP to EVU flow</strong>,
          and <strong>on-chain engagement</strong> across sites.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          As you wire more data into the ledger, this page becomes your
          funding-facing snapshot for board decks, grant reports, and partner
          updates.
        </p>
      </div>

      {/* Dev-only panel: same pattern as main dashboard */}
      {isDev && (
        <div style={{ marginTop: "1.25rem" }}>
          <DevArcadeTestPanelNorthstar />
        </div>
      )}
    </section>
  );
}

/**
 * DevArcadeTestPanelNorthstar
 * ------------------------------------------------------------
 * Dev-only helper that sends 3 sample events into useArcadeLedger,
 * tagged as NORTHSTAR-DEV so you can differentiate them later if
 * you want in filters.
 */
function DevArcadeTestPanelNorthstar() {
  const { ARCADE_EVENTS, recordArcadeEvent } = useArcadeLedger();
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");

  if (!ARCADE_EVENTS || typeof recordArcadeEvent !== "function") {
    return (
      <div className="card card--pad">
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>
          Northstar Dev Tools
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
          Arcade ledger not available. Check{" "}
          <code>useArcadeLedger.js</code> wiring.
        </p>
      </div>
    );
  }

  const baseMeta = {
    cohort: "NORTHSTAR-DEV",
    location: "Columbus Rec – Northstar Sandbox",
    device: "MacBook (Local Dev)",
  };

  async function fire(label, eventType, payload) {
    try {
      setBusy(true);
      setMessage(`Logging: ${label}…`);

      await recordArcadeEvent(eventType, payload);

      setMessage(`✓ Logged ${label} into SHF Arcade ledger`);
    } catch (err) {
      console.error("[DevArcadeTestPanelNorthstar] Failed to log event:", err);
      setMessage(`⚠️ Error logging ${label} – see console for details`);
    } finally {
      setBusy(false);
    }
  }

  const handleGameStart = () =>
    fire("Northstar Game Start (Dev Student A)", ARCADE_EVENTS.GAME_START, {
      userId: "ns-dev-student-a",
      userName: "NS Dev Student A",
      gameId: "debt-hunter",
      meta: {
        ...baseMeta,
        runTimeMs: 0,
        selTags: ["self-management"],
        workforceTags: ["financial literacy"],
      },
    });

  const handleGameComplete = () =>
    fire(
      "Northstar Game Complete (Dev Student B)",
      ARCADE_EVENTS.GAME_COMPLETE,
      {
        userId: "ns-dev-student-b",
        userName: "NS Dev Student B",
        gameId: "debt-hunter",
        meta: {
          ...baseMeta,
          runTimeMs: 36000,
          accuracy: 0.91,
          selTags: ["planning", "self-management"],
          workforceTags: ["financial literacy", "problem solving"],
        },
      },
    );

  const handleBadgeClaim = () =>
    fire("Northstar Badge Claim (Dev Student C)", ARCADE_EVENTS.BADGE_CLAIM, {
      userId: "ns-dev-student-c",
      userName: "NS Dev Student C",
      gameId: "debt-hunter",
      meta: {
        ...baseMeta,
        badgeId: "debt-hunter-perfect-3",
        badgeLabel: "Debt Hunter – 3 Perfect Runs",
        selTags: ["self-management"],
        workforceTags: ["financial literacy"],
      },
    });

  return (
    <div className="card card--pad">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ marginBottom: "0.4rem", fontSize: "1rem" }}>
            Northstar Dev Tools (local only)
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#94a3b8",
              maxWidth: "30rem",
            }}
          >
            Trigger a few <strong>Northstar-tagged</strong> events so you can
            see how they roll up into the Arcade History view and CSV export.
            Perfect for tuning KPIs before you go live.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="ar-btn ghost sm"
            onClick={handleGameStart}
            disabled={busy}
          >
            Log NS Game Start
          </button>

          <button
            type="button"
            className="ar-btn primary sm"
            onClick={handleGameComplete}
            disabled={busy}
          >
            Log NS Game Complete
          </button>

          <button
            type="button"
            className="ar-btn ghost sm"
            onClick={handleBadgeClaim}
            disabled={busy}
          >
            Log NS Badge Claim
          </button>
        </div>
      </div>

      {message && (
        <p
          style={{
            marginTop: "0.6rem",
            fontSize: "0.8rem",
            color: "#e5e7eb",
          }}
        >
          {busy ? "⏳ " : "✅ "} {message}
        </p>
      )}
    </div>
  );
}
