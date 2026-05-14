// src/pages/arcade/History.jsx
import React, { useMemo, useState } from "react";
// If you haven't created this yet, wire it up later – the UI will be ready.
import { useArcadeHistory } from "@/shared/arcade/useArcadeLedger.js";

/**
 * ArcadeHistory
 * ------------------------------------------------------------
 * Funding-facing view:
 * - Shows last N arcade events
 * - Summarizes XP, EVU, on-chain hits
 * - Makes it obvious: "Every game = SEL + workforce impact"
 */

export default function ArcadeHistory() {
  const [eventFilter, setEventFilter] = useState("all"); // all | complete | badge | tournament
  const [onChainOnly, setOnChainOnly] = useState(false);

  // Pull history from ledger (limit can be tuned later)
  const { events = [], loading, error } = useArcadeHistory
    ? useArcadeHistory({ limit: 50 })
    : { events: [], loading: false, error: null }; // safe fallback if hook not wired yet

  // ---- Derived stats for donor-facing summary ----
  const { totals, filteredEvents } = useMemo(() => {
    const base = {
      xp: 0,
      evu: 0,
      onChainCount: 0,
      uniquePlayers: new Set(),
      gamesPlayed: new Set(),
    };

    const safeEvents = Array.isArray(events) ? events : [];

    for (const ev of safeEvents) {
      const xp = Number(ev.xp || ev.xpDelta || 0);
      const evu = Number(ev.evu || ev.evuDelta || 0);
      base.xp += xp;
      base.evu += evu;

      if (ev.polygonTxHash || ev.onChain === true) {
        base.onChainCount += 1;
      }
      if (ev.userId) base.uniquePlayers.add(ev.userId);
      if (ev.gameId) base.gamesPlayed.add(ev.gameId);
    }

    let list = safeEvents;

    if (eventFilter === "complete") {
      list = list.filter((ev) => ev.type === "arcade_game_complete");
    } else if (eventFilter === "badge") {
      list = list.filter((ev) => ev.type === "arcade_badge_claimed");
    } else if (eventFilter === "tournament") {
      list = list.filter((ev) =>
        ev.type === "arcade_tournament_join" ||
        ev.type === "arcade_tournament_win"
      );
    }

    if (onChainOnly) {
      list = list.filter((ev) => ev.polygonTxHash || ev.onChain === true);
    }

    return {
      totals: {
        xp: base.xp,
        evu: base.evu,
        onChainCount: base.onChainCount,
        uniquePlayersCount: base.uniquePlayers.size,
        gamesPlayedCount: base.gamesPlayed.size,
      },
      filteredEvents: list,
    };
  }, [events, eventFilter, onChainOnly]);

  return (
    <section className="ar-history-page">
      {/* Page header – donor-facing framing */}
      <header className="ar-history-header">
        <div>
          <h1 className="ar-history-title">Arcade History & Impact</h1>
          <p className="ar-history-subtitle">
            Every game session creates real data: SEL skills, workforce badges,
            and Polygon-verified receipts for donors and partners.
          </p>
        </div>
        <div className="ar-history-badge">
          <span className="ar-history-badge-dot" />
          <span>Live arcade telemetry · SHF Wallet + Polygon</span>
        </div>
      </header>

      {/* Summary strip for funders */}
      <section className="ar-history-summary">
        <SummaryCard
          label="Total XP Awarded"
          value={totals.xp.toLocaleString()}
          helper="Shows student practice volume across all arcade titles."
        />
        <SummaryCard
          label="EVU (Education Value Units)"
          value={totals.evu.toLocaleString()}
          helper="Funding-aligned learning credits mapped to curriculum."
        />
        <SummaryCard
          label="On-chain Events"
          value={totals.onChainCount.toLocaleString()}
          helper="Transactions mirrored to Polygon for transparency."
        />
        <SummaryCard
          label="Active Players / Games"
          value={`${totals.uniquePlayersCount} / ${totals.gamesPlayedCount}`}
          helper="Number of unique learners and arcade titles engaged."
        />
      </section>

      {/* Controls */}
      <section className="ar-history-controls">
        <div className="ar-history-filter-group">
          <FilterChip
            active={eventFilter === "all"}
            onClick={() => setEventFilter("all")}
          >
            All events
          </FilterChip>
          <FilterChip
            active={eventFilter === "complete"}
            onClick={() => setEventFilter("complete")}
          >
            Game completions
          </FilterChip>
          <FilterChip
            active={eventFilter === "badge"}
            onClick={() => setEventFilter("badge")}
          >
            Badges claimed
          </FilterChip>
          <FilterChip
            active={eventFilter === "tournament"}
            onClick={() => setEventFilter("tournament")}
          >
            Tournaments
          </FilterChip>
        </div>

        <label className="ar-history-toggle">
          <input
            type="checkbox"
            checked={onChainOnly}
            onChange={(e) => setOnChainOnly(e.target.checked)}
          />
          <span>Show on-chain events only</span>
        </label>
      </section>

      {/* Main list */}
      <section className="ar-history-table-card">
        {loading && (
          <div className="ar-history-empty">
            Loading arcade history from the ledger...
          </div>
        )}

        {!loading && error && (
          <div className="ar-history-empty ar-history-empty--error">
            There was an issue loading arcade history. Once the ledger client
            is wired, this page will populate automatically.
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <div className="ar-history-empty">
            No events match this filter yet. Once students start playing, their
            sessions, badges, and on-chain actions will appear here in real
            time.
          </div>
        )}

        {!loading && !error && filteredEvents.length > 0 && (
          <div className="ar-history-table-wrapper">
            <table className="ar-history-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Player</th>
                  <th>Game / Event</th>
                  <th>Outcome</th>
                  <th>XP</th>
                  <th>EVU</th>
                  <th>On-chain</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev) => (
                  <HistoryRow key={ev.id || `${ev.type}-${ev.createdAt}-${ev.userId || "anon"}`} ev={ev} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer note for funders */}
      <footer className="ar-history-footer">
        <p>
          Each arcade event can be exported as anonymized impact data for grants,
          board reports, and employer partners. Polygon transactions give
          third-party verifiers confidence that rewards and EVU credits are
          backed by real learner effort.
        </p>
      </footer>
    </section>
  );
}

/* ============== Subcomponents ================== */

function SummaryCard({ label, value, helper }) {
  return (
    <article className="ar-history-summary-card">
      <div className="ar-history-summary-label">{label}</div>
      <div className="ar-history-summary-value">{value}</div>
      <p className="ar-history-summary-helper">{helper}</p>
    </article>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`ar-history-chip ${active ? "ar-history-chip--active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function HistoryRow({ ev }) {
  const date = ev.createdAt ? new Date(ev.createdAt) : null;
  const when = date ? date.toLocaleString() : "—";

  const xp = ev.xp ?? ev.xpDelta ?? 0;
  const evu = ev.evu ?? ev.evuDelta ?? 0;

  const isOnChain = !!(ev.polygonTxHash || ev.onChain);
  const shortTx =
    typeof ev.polygonTxHash === "string" && ev.polygonTxHash.length > 12
      ? `${ev.polygonTxHash.slice(0, 6)}…${ev.polygonTxHash.slice(-4)}`
      : ev.polygonTxHash;

  // Human-readable type label
  const typeLabel = (() => {
    switch (ev.type) {
      case "arcade_game_start":
        return "Game started";
      case "arcade_game_complete":
        return "Game completed";
      case "arcade_badge_claimed":
        return "Badge claimed";
      case "arcade_tournament_join":
        return "Tournament joined";
      case "arcade_tournament_win":
        return "Tournament win";
      default:
        return ev.type || "Event";
    }
  })();

  return (
    <tr>
      <td>{when}</td>
      <td>{ev.userLabel || ev.userId || "Player"}</td>
      <td>
        <div className="ar-history-game">
          <span className="ar-history-game-title">
            {ev.gameTitle || ev.gameId || "Arcade Game"}
          </span>
          {ev.selTags && ev.selTags.length > 0 && (
            <span className="ar-history-tag ar-history-tag--sel">
              SEL: {ev.selTags.join(", ")}
            </span>
          )}
          {ev.workforceTags && ev.workforceTags.length > 0 && (
            <span className="ar-history-tag ar-history-tag--workforce">
              Workforce: {ev.workforceTags.join(", ")}
            </span>
          )}
        </div>
      </td>
      <td>{typeLabel}</td>
      <td>{xp ? xp.toLocaleString() : "—"}</td>
      <td>{evu ? evu.toLocaleString() : "—"}</td>
      <td>
        {isOnChain ? (
          <span className="ar-history-onchain">
            <span className="ar-history-onchain-dot" />
            <span className="ar-history-onchain-label">Polygon</span>
            {shortTx && <span className="ar-history-onchain-tx">{shortTx}</span>}
          </span>
        ) : (
          <span className="ar-history-onchain ar-history-onchain--off">
            Off-ledger
          </span>
        )}
      </td>
    </tr>
  );
}
