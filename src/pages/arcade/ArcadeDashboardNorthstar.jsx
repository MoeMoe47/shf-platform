// src/pages/arcade/ArcadeDashboardNorthstar.jsx
// ------------------------------------------------------------
// SHF Arcade – Northstar Dashboard
//
// High-level KPI scaffold + dev-only legacy compatibility event panel.
// ------------------------------------------------------------

import React from "react";
import { Link } from "react-router-dom";
import { useArcadeLedger } from "@/shared/arcade/useArcadeLedger.js";
import { PUBLIC_ENV } from "../../system/env/publicEnv.js";

const isDev =
  PUBLIC_ENV.DEV ||
  process.env.NODE_ENV !== "production";

export default function ArcadeDashboardNorthstar() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Arcade — Northstar</h1>
          <p className="db-subtitle">
            Development scaffold for future Arcade reporting; no institutional metrics are connected here.
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
          This Northstar view is a planning scaffold. Any future institutional
          reporting must use records from their canonical authorities.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          Legacy browser history and event metadata do not establish impact,
          rewards, verified skills, or institutional truth.
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
 * Dev-only helper that sends legacy UI event vocabulary through the
 * quarantined compatibility hook. It creates no institutional records.
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
      setMessage(`Sending compatibility event: ${label}…`);

      await recordArcadeEvent(eventType, payload);

      setMessage("Legacy compatibility event — no institutional outcome is recorded.");
    } catch (err) {
      console.error("[DevArcadeTestPanelNorthstar] Failed to send compatibility event:", err);
      setMessage(`Could not send ${label} – see console for details`);
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
    fire("Northstar Badge Claim (Dev Student C)", ARCADE_EVENTS.BADGE_CLAIMED, {
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
            Send legacy compatibility event labels for development checks.
            No institutional outcome is recorded or added to Arcade History.
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
            Send NS Game Start Intent
          </button>

          <button
            type="button"
            className="ar-btn primary sm"
            onClick={handleGameComplete}
            disabled={busy}
          >
            Send NS Game Completion Intent
          </button>

          <button
            type="button"
            className="ar-btn ghost sm"
            onClick={handleBadgeClaim}
            disabled={busy}
          >
            Send NS Badge Claim Intent
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
