// src/pages/arcade/ArcadeDashboard.jsx
// ------------------------------------------------------------
// SHF Arcade – Main Dashboard
//
// This shows the primary arcade overview AND, in dev mode,
// a small Dev Test Panel that fires sample arcade events
// through useArcadeLedger so you can:
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

export default function ArcadeDashboard() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Arcade Dashboard</h1>
          <p className="db-subtitle">
            Launch games, track progress, and route every session into the SHF
            wallet and Polygon ledger.
          </p>
        </div>

        {/* History shortcut (same pattern as Northstar) */}
        <div className="db-head-actions">
          <Link to="/history" className="db-history-btn">
            View History
          </Link>
        </div>
      </header>

      {/* Main dashboard content scaffold */}
      <div className="card card--pad">
        <p>
          This is your main SHF Arcade control room. From here you can route
          students into the game library, check leaderboards, and see how XP
          flows into credits and on-chain proofs.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          Use the sidebar to jump into <strong>Games</strong>,{" "}
          <strong>Leaderboard</strong>, <strong>Rewards</strong>, or{" "}
          <strong>Arcade History</strong>.
        </p>
      </div>

      {/* Dev-only panel: generates fake events for testing history + CSV */}
      {isDev && (
        <div style={{ marginTop: "1.25rem" }}>
          <DevArcadeTestPanel />
        </div>
      )}
    </section>
  );
}

/**
 * DevArcadeTestPanel
 * ------------------------------------------------------------
 * Renders ONLY in dev (Vite dev or NODE_ENV !== "production").
 * Fires 3 different event types into useArcadeLedger so you can:
 *   - See rows appear in /history
 *   - Download CSV and inspect the data
 */
function DevArcadeTestPanel() {
  const { ARCADE_EVENTS, recordArcadeEvent } = useArcadeLedger();
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");

  if (!ARCADE_EVENTS || typeof recordArcadeEvent !== "function") {
    return (
      <div className="card card--pad">
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>
          Arcade Dev Tools
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
          Arcade ledger not available. Check{" "}
          <code>useArcadeLedger.js</code> wiring.
        </p>
      </div>
    );
  }

  const baseMeta = {
    cohort: "DEV-LOCAL",
    location: "Columbus Rec – Sandbox",
    device: "MacBook (Local Dev)",
  };

  async function fire(label, eventType, payload) {
    try {
      setBusy(true);
      setMessage(`Logging: ${label}…`);

      await recordArcadeEvent(eventType, payload);

      setMessage(`✓ Logged ${label} into SHF Arcade ledger`);
    } catch (err) {
      console.error("[DevArcadeTestPanel] Failed to log event:", err);
      setMessage(`⚠️ Error logging ${label} – see console for details`);
    } finally {
      setBusy(false);
    }
  }

  const handleGameStart = () =>
    fire("Game Start (Dev Student 1)", ARCADE_EVENTS.GAME_START, {
      userId: "dev-student-1",
      userName: "Dev Student 1",
      gameId: "debt-hunter",
      meta: {
        ...baseMeta,
        runTimeMs: 0,
        selTags: ["self-management"],
        workforceTags: ["financial literacy"],
      },
    });

  const handleGameComplete = () =>
    fire("Game Complete (Dev Student 2)", ARCADE_EVENTS.GAME_COMPLETE, {
      userId: "dev-student-2",
      userName: "Dev Student 2",
      gameId: "debt-hunter",
      meta: {
        ...baseMeta,
        runTimeMs: 42000,
        accuracy: 0.86,
        selTags: ["planning", "self-management"],
        workforceTags: ["financial literacy", "problem solving"],
      },
    });

  const handleBadgeClaim = () =>
    fire("Badge Claim (Dev Student 3)", ARCADE_EVENTS.BADGE_CLAIM, {
      userId: "dev-student-3",
      userName: "Dev Student 3",
      gameId: "debt-hunter",
      meta: {
        ...baseMeta,
        badgeId: "debt-hunter-streak-5",
        badgeLabel: "Debt Hunter – 5 Session Streak",
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
            Arcade Dev Tools (local only)
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", maxWidth: "30rem" }}>
            Use these buttons in <strong>dev</strong> to generate sample arcade
            events. Then open <strong>Arcade → History</strong> and download the
            CSV to verify XP, EVU, credits, and Polygon status.
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
            Log Game Start (Dev 1)
          </button>

          <button
            type="button"
            className="ar-btn primary sm"
            onClick={handleGameComplete}
            disabled={busy}
          >
            Log Game Complete (Dev 2)
          </button>

          <button
            type="button"
            className="ar-btn ghost sm"
            onClick={handleBadgeClaim}
            disabled={busy}
          >
            Log Badge Claim (Dev 3)
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
