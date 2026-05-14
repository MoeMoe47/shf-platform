// src/pages/arcade/games/index.jsx
import React from "react";
import { Link } from "react-router-dom";
import { track } from "@/utils/analytics.js";

/** ---- Game metadata (yours) ---- */
export const meta = {
  "classic/fingerspelling": {
    title: "Fingerspelling Speed",
    description: "Type what you see. Improve ASL fingerspelling recognition.",
    icon: "🤟",
    tags: ["ASL", "Speed", "Classic"],
    // thumb: "/arcade/fingerspelling.jpg",
    externalHref: "https://example.com/fingerspelling", // or remove for internal
  },
  "classic/vocab-match": {
    title: "Vocabulary Match",
    description: "Match sign to term under time pressure.",
    icon: "🧩",
    tags: ["ASL", "Memory", "Classic"],
  },
  "classic/gesture-memory": {
    title: "Gesture Memory",
    description: "Remember and replay sequences of gestures.",
    icon: "🧠",
    tags: ["Memory", "Pattern"],
  },
  "transport/cdl-driver": {
    title: "CDL Driver Trainer",
    description: "Back-in, lane discipline, and safe stops.",
    icon: "🚚",
    tags: ["CDL", "Simulation"],
    // If you host it internally, add: playPath, practicePath, leaderboardPath
    externalHref: "https://example.com/cdl-classic",
  },
};

/** ---- Credit shim (one place for all games) ---- */
function earn(detail) {
  try {
    if (window.shfCredit?.earn) return window.shfCredit.earn(detail);
    window.dispatchEvent(new CustomEvent("shf-credit-earn", { detail }));
  } catch {}
}

/** ---- Central result reporter: call from each game on finish ----
 * Usage in a game:
 *   import { reportGameResult } from "./index.jsx";
 *   reportGameResult({ gameId: "transport/cdl-driver", title: "CDL Driver", won: true, score: 1234 });
 */
export function reportGameResult({ gameId, title, won = false, score = 0 }) {
  try { track("arcade.result", { gameId, title, won, score }); } catch {}
  // Credit
  if (won) {
    earn({ action: "arcade.win", rewards: { corn: 10 }, scoreDelta: 5, meta: { gameId, title, score } });
  } else {
    earn({ action: "arcade.participate", rewards: { corn: 2 }, scoreDelta: 1, meta: { gameId, title, score } });
  }
}

/** ---- Small presentational helpers ---- */
function Tag({ children }) {
  return (
    <span
      className="arc-tag"
      style={{
        fontSize: 12,
        lineHeight: 1,
        borderRadius: 999,
        padding: "4px 8px",
        border: "1px solid #e5e7eb",
        background: "#fafafa",
        color: "#0f172a",
      }}
    >
      {children}
    </span>
  );
}

function GameCard({ id, cfg }) {
  const { title, description, icon, tags = [], thumb, externalHref, playPath } = cfg;

  const Action = () => {
    // Prefer explicit playPath if provided; otherwise externalHref; otherwise disabled
    if (playPath) {
      return (
        <Link className="arc-btn arc-btn--play" to={playPath} style={btnPlayStyle}>
          Play
        </Link>
      );
    }
    if (externalHref) {
      return (
        <a
          className="arc-btn arc-btn--play"
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          style={btnPlayStyle}
        >
          Play
        </a>
      );
    }
    return (
      <button className="arc-btn arc-btn--disabled" disabled style={btnDisabledStyle} title="Coming soon">
        Coming soon
      </button>
    );
  };

  return (
    <article className="arc-card" style={cardStyle}>
      <div className="arc-thumb" style={thumbStyle}>
        {thumb ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={thumb} alt={`${title} thumbnail`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={iconCircleStyle} aria-hidden>
            <span style={{ fontSize: 28 }}>{icon || "🎮"}</span>
          </div>
        )}
      </div>

      <div className="arc-body" style={{ padding: 14 }}>
        <h3 className="arc-title" style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>
          {title || id}
        </h3>
        <p className="arc-desc" style={{ margin: "6px 0 10px", color: "#6b7280", fontSize: 14 }}>
          {description}
        </p>

        {!!tags.length && (
          <div className="arc-tags" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}

        <div className="arc-actions" style={{ display: "flex", gap: 8 }}>
          <Action />
        </div>
      </div>
    </article>
  );
}

/** ---- Page component (default export) ---- */
export default function GamesIndex() {
  const entries = Object.entries(meta);

  return (
    <div style={pageWrapStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>Arcade</h1>
        <p style={{ margin: 0, color: "#6b7280" }}>Pick a game to play.</p>
      </header>

      <section className="arc-grid" style={gridStyle}>
        {entries.map(([id, cfg]) => (
          <GameCard key={id} id={id} cfg={cfg} />
        ))}
      </section>
    </div>
  );
}

/** ---- Inline styles (keeps it readable even without arcade.css) ---- */
const pageWrapStyle = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "20px 16px",
};

const headerStyle = {
  marginBottom: 12,
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: 10,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 12,
};

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#fff",
  overflow: "hidden",
  display: "grid",
  gridTemplateRows: "140px auto",
};

const thumbStyle = {
  background: "#fafafa",
  borderBottom: "1px solid #f3f4f6",
  display: "grid",
  placeItems: "center",
};

const iconCircleStyle = {
  width: 72,
  height: 72,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "#fff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0,0,0,.05)",
};

const btnPlayStyle = {
  borderRadius: 10,
  border: "1px solid #ff4f00",
  background: "#ff4f00",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 14,
  textDecoration: "none",
  cursor: "pointer",
};

const btnDisabledStyle = {
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  color: "#9ca3af",
  padding: "8px 12px",
  fontSize: 14,
  cursor: "not-allowed",
};
/* --- SHF: Arcade fallback award (avoid if reportGameResult already used) --- */
(() => {
  if (typeof window === "undefined" || window.__shfHook_arcadeFallback) return; window.__shfHook_arcadeFallback = true;

  // fire when a game ends:
  //   window.dispatchEvent(new CustomEvent("arcade:result", { detail:{ gameId, title, won, score } }))
  window.addEventListener("arcade:result", (e) => {
    const d = (e && e.detail) || {};
    try {
      window.shfCredit?.earn?.({
        action: d.won ? "arcade.win" : "arcade.participate",
        rewards: d.won ? { corn: 10 } : { corn: 2 },
        scoreDelta: d.won ? 5 : 1,
        meta: { gameId: d.gameId, title: d.title, score: d.score }
      });
      window.shToast?.(d.won ? "🏆 GG! +10 🌽 +5 score" : "🎮 Nice run! +2 🌽 +1 score");
    } catch {}
  });
})();
