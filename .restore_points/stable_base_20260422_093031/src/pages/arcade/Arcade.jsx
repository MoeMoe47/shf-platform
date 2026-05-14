// src/pages/arcade/Arcade.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HubV1 from "@/components/templates/arcade/HubV1.jsx";
import { meta as gameMeta } from "./games/index.js";
import { track } from "@/utils/analytics.js";

/* ---------- Credit earn shim (safe if provider not mounted) ---------- */
function earn(detail){
  try {
    if (window.shfCredit?.earn) return window.shfCredit.earn(detail);
    window.dispatchEvent(new CustomEvent("shf-credit-earn", { detail }));
  } catch {}
}

/* ---------- LocalStorage helpers ---------- */
const safeJSON = (k, fb = {}) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const safeGet = (k) => localStorage.getItem(k);
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

/* ---------- Back-compat CDL keys ---------- */
const LEGACY = {
  bestKeyByGame: { "transport/cdl-driver": "sh_arcade_cdl_best" },
  achKeyByGame:  { "transport/cdl-driver": "sh_arcade_cdl_achievements_v1" },
  lbKeyByGame:   { "transport/cdl-driver": "sh_class_cdl_leaderboard_v1" },
};

/* ---------- Hooks ---------- */
function useBestFor(gameKey) {
  const genericKey = `best_${gameKey}`;
  const legacyKey = LEGACY.bestKeyByGame[gameKey];
  const read = () => {
    const legacy = legacyKey ? Number(safeGet(legacyKey) || 0) : 0;
    const generic = Number(safeGet(genericKey) || 0);
    const val = Math.max(legacy, generic);
    return Number.isFinite(val) && val > 0 ? val : null;
  };
  const [best, setBest] = useState(read);
  useEffect(() => {
    const refresh = () => setBest(read());
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [gameKey]);
  return best;
}

const CDL_EMOJI_MAP = { perfectStop: "🚀", cleanBackIn: "🌽", laneKeeper: "🌾", safeDriver: "❤️" };
const emojiLabel = (em) =>
  em === "🚀" ? "Perfect Stop" :
  em === "🌽" ? "Clean Back-In" :
  em === "🌾" ? "Lane Keeper" :
  em === "❤️" ? "Safe Driver" : "";

function useAchievementsFor(gameKey) {
  const genericKey = `ach_${gameKey}`;
  const legacyKey = LEGACY.achKeyByGame[gameKey];
  const read = () => {
    const ach = safeJSON(genericKey, null) || (legacyKey ? safeJSON(legacyKey, null) : null) || {};
    const out = [];
    for (const [k, v] of Object.entries(ach)) if (v && CDL_EMOJI_MAP[k]) out.push(CDL_EMOJI_MAP[k]);
    return out;
  };
  const [list, setList] = useState(read);
  useEffect(() => {
    const refresh = () => setList(read());
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [gameKey]);
  return list;
}

function recordPlay(gameKey) {
  const playsKey = `plays_${gameKey}`;
  const lastKey  = `last_${gameKey}`;
  const next = (Number(localStorage.getItem(playsKey) || 0) || 0) + 1;
  try { localStorage.setItem(playsKey, String(next)); localStorage.setItem(lastKey, String(Date.now())); } catch {}
}
function usePlaysFor(gameKey) {
  const playsKey = `plays_${gameKey}`;
  const read = () => Number(localStorage.getItem(playsKey) || 0) || 0;
  const [plays, setPlays] = useState(read);
  useEffect(() => {
    const refresh = () => setPlays(read());
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [gameKey]);
  return plays;
}
function useTopFor(gameKey) {
  const lbKey = LEGACY.lbKeyByGame[gameKey] || `lb_${gameKey}`;
  const read = () => {
    try {
      const raw = localStorage.getItem(lbKey);
      const rows = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(rows) || rows.length === 0) return null;
      const top = rows.reduce((m, r) => Math.max(m, Number(r?.score) || 0), 0);
      return Number.isFinite(top) && top > 0 ? top : null;
    } catch { return null; }
  };
  const [top, setTop] = useState(read);
  useEffect(() => {
    const refresh = () => setTop(read());
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [gameKey, lbKey]);
  return top;
}

/* ---------- Card ---------- */
function hueFromKey(key = "") {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return (h % 300) + 20;
}

function Card({ game, onKeyPlay, onAnyPlay, topScore }) {
  const [hover, setHover] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const onKey = (e) => { if (e.key === "Enter") { e.preventDefault(); onKeyPlay?.(); onAnyPlay?.(); } };
    ref.current.addEventListener("keydown", onKey);
    return () => ref.current?.removeEventListener("keydown", onKey);
  }, [onKeyPlay, onAnyPlay]);

  const primaryHref = game.externalHref || game.practicePath || game.playPath || game.quizPath || game.leaderboardPath;
  const lbTitle = topScore != null ? `#1: ${topScore} • Open leaderboard` : "Open leaderboard";
  const hue = hueFromKey(game.key);

  return (
    <article
      ref={ref}
      className="ar-tile"
      tabIndex={0}
      role="article"
      aria-label={game.title}
      style={{ "--ar-hue": hue }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      {game.leaderboardPath && (
        <Link to={game.leaderboardPath} title={lbTitle} aria-label={lbTitle}
          className="ar-ghost sm" style={{ position: "absolute", top: 10, right: 10, padding: 8, borderRadius: "999px" }}
          onClick={(e) => e.stopPropagation()}>
          🏆
        </Link>
      )}
      <div className="ar-tile__media">
        {!imgLoaded && <div className="ar-skel" />}
        {game.thumb ? (
          <img src={game.thumb} alt={`${game.title} thumbnail`} onLoad={() => setImgLoaded(true)}
            style={{ transform: hover ? "scale(1.03)" : "scale(1)", transition: "transform .25s ease" }} />
        ) : (
          <div className="ar-skel" style={{ display: "grid", placeItems: "center", fontSize: 40 }}>{game.icon || "🎮"}</div>
        )}
        <div className="ar-tile__glow" />
      </div>

      <div className="ar-tile__body">
        <div className="ar-tile__meta">
          {game.difficulty ? `Difficulty: ${game.difficulty}` : null}
          {typeof game.plays === "number" ? `  •  Plays: ${game.plays}` : null}
          {game.best != null ? `  •  Best: ${game.best}` : null}
        </div>
        <h3 className="ar-tile__title">{game.title}</h3>
        {game.desc && <p style={{ margin: 0, color: "var(--ink-soft)" }}>{game.desc}</p>}
        {!!game.badges?.length && (
          <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
            {game.badges.map((em, i) => (
              <span key={i} title={emojiLabel(em)} aria-label={emojiLabel(em)}>{em}</span>
            ))}
          </div>
        )}
        <div className="ar-tile__row" style={{ marginTop: 6, flexWrap: "wrap" }}>
          {game.externalHref ? (
            <>
              <a className="ar-cta sm" href={game.externalHref} target="_blank" rel="noreferrer" onClick={onAnyPlay}>Play</a>
              <a className="ar-ghost sm" href={game.externalHref} target="_blank" rel="noreferrer" onClick={onAnyPlay}>Open</a>
            </>
          ) : (
            <>
              {game.practicePath && <Link className="ar-cta sm" to={game.practicePath} onClick={onAnyPlay}>Practice →</Link>}
              {game.quizPath && <Link className="ar-ghost sm" to={game.quizPath} onClick={onAnyPlay}>Quiz</Link>}
              {game.leaderboardPath && <Link className="ar-ghost sm" to={game.leaderboardPath} onClick={onAnyPlay}>Leaderboard</Link>}
              {game.playPath && !game.practicePath && <Link className="ar-ghost sm" to={game.playPath} onClick={onAnyPlay}>Play</Link>}
            </>
          )}
        </div>
      </div>
      {primaryHref && <a href={primaryHref} style={{ position: "absolute", inset: 0, opacity: 0 }} aria-hidden="true" tabIndex={-1} />}
    </article>
  );
}

/* ---------- Wrapper ---------- */
function CardWithData({ base }) {
  const playFn = () => {
    const href = base.externalHref || base.practicePath || base.playPath || base.quizPath || base.leaderboardPath;
    if (!href) return;
    if (base.externalHref) window.open(href, "_blank", "noopener,noreferrer");
  };

  // When any "Play" CTA is hit:
  const onAnyPlay = () => {
    recordPlay(base.key);
    try { track("arcade.play", { gameId: base.key, title: base.title }); } catch {}
    // Credit: just for playing
    earn({ action: "arcade.play", rewards: { corn: 2 }, scoreDelta: 1, meta: { gameId: base.key, title: base.title } });
  };

  const plays = usePlaysFor(base.key);
  const topScore = useTopFor(base.key);
  if (base.externalHref) return <Card game={{ ...base, best: null, badges: [], plays }} onKeyPlay={playFn} onAnyPlay={onAnyPlay} topScore={topScore} />;
  const best = useBestFor(base.key);
  const badges = useAchievementsFor(base.key);
  return <Card game={{ ...base, best, badges, plays }} onKeyPlay={playFn} onAnyPlay={onAnyPlay} topScore={topScore} />;
}

/* ---------- Page ---------- */
export default function Arcade() {
  const [q, setQ] = useState(() => safeGet("arc_q") || "");
  const [sort, setSort] = useState(() => safeGet("arc_sort") || "title");
  const [chipSet, setChipSet] = useState(() => new Set(safeJSON("arc_chips", [])));
  useEffect(() => safeSet("arc_q", q), [q]);
  useEffect(() => safeSet("arc_sort", sort), [sort]);
  useEffect(() => safeSet("arc_chips", JSON.stringify(Array.from(chipSet))), [chipSet]);

  // Listen for game result events dispatched by individual games:
  // window.dispatchEvent(new CustomEvent("arcade-game-result", { detail: { gameId, title, won, score } }))
  useEffect(() => {
    const onResult = (e) => {
      const { gameId, key, title, won, score } = e?.detail || {};
      const gid = gameId || key;
      try { track("arcade.result", { gameId: gid, title, won, score }); } catch {}
      if (won) {
        earn({ action: "arcade.win", rewards: { corn: 10 }, scoreDelta: 5, meta: { gameId: gid, title, score } });
      } else {
        earn({ action: "arcade.participate", rewards: { corn: 2 }, scoreDelta: 1, meta: { gameId: gid, title, score } });
      }
    };
    window.addEventListener("arcade-game-result", onResult);
    window.addEventListener("shf-arcade-result", onResult); // alt event name supported
    return () => {
      window.removeEventListener("arcade-game-result", onResult);
      window.removeEventListener("shf-arcade-result", onResult);
    };
  }, []);

  const cards = useMemo(() => Object.entries(gameMeta).map(([key, m]) => ({
    key,
    title: `${m.icon ? m.icon + " " : ""}${m.title}`,
    icon: m.icon || "🎮",
    thumb: m.thumb,
    desc: m.description,
    tags: m.tags || [],
    difficulty: m.difficulty,
    practicePath: m.practicePath,
    quizPath: m.quizPath,
    leaderboardPath: m.leaderboardPath,
    playPath: m.playPath,
    externalHref: m.externalHref,
  })), []);

  const [lbKey, setLbKey] = useState(() => "transport/cdl-driver");
  const recentKey = useMemo(() => {
    let best = { key: null, ts: 0 };
    cards.forEach(c => {
      const ts = Number(localStorage.getItem(`last_${c.key}`) || 0);
      if (ts > best.ts) best = { key: c.key, ts };
    });
    return best.key;
  }, [cards]);

  const chipOptions = useMemo(() => {
    const set = new Set();
    cards.forEach(c => c.tags?.forEach(t => set.add(t)));
    if (cards.some(c => c.key.startsWith("classic/"))) set.add("Classic");
    if (cards.some(c => c.key.startsWith("transport/"))) set.add("CDL");
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [cards]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = cards.filter(c => {
      const hay = [c.title, c.desc, ...(c.tags||[])].join(" ").toLowerCase();
      const matchText = !needle || hay.includes(needle);
      if (chipSet.size === 0) return matchText;
      const labels = Array.from(chipSet);
      const hitTag = labels.some(lbl => (c.tags||[]).includes(lbl));
      const hitClassic = labels.includes("Classic") && c.key.startsWith("classic/");
      const hitCDL = labels.includes("CDL") && c.key.startsWith("transport/");
      return matchText && (hitTag || hitClassic || hitCDL);
    });
    if (sort === "title") out = out.sort((a,b) => a.title.localeCompare(b.title));
    else if (sort === "recent") {
      const ts = (k) => Number(localStorage.getItem(`last_${k}`) || 0);
      out = out.sort((a,b) => ts(b.key) - ts(a.key) || a.title.localeCompare(b.title));
    }
    return out;
  }, [cards, q, sort, chipSet]);

  const featuredData = useMemo(() => ({
    title: "Featured",
    emoji: "✨",
    intro: "Quick launches and demos.",
    tiles: [
      {
        id: "cdl",
        emoji: "🚚",
        title: "CDL Driver (Top-Down)",
        desc: "Practice lane discipline, stop line, and back-in alley.",
        launch: "/arcade/cdl-driver",
        external: false,
        docs: "/arcade/leaderboard?game=transport/cdl-driver",
      },
      {
        id: "pacman",
        emoji: "🟡",
        title: "Pac-Man (Classic)",
        desc: "Classic maze chase — fun focus break.",
        launch: (gameMeta["classic/pacman"]?.externalHref) || "#",
        external: true,
        docs: "/arcade/leaderboard?game=classic/pacman",
      },
    ],
    footer_note: "",
  }), [cards]);

  return (
    <div className="ar-root">
      {/* Header */}
      <header className="ar-header">
        <div className="ar-header__row">
          <div className="ar-brand">
            <span className="ar-dot" />
            <span className="ar-wordmark">Arcade</span>
            <span style={{ color: "var(--ink-soft)", marginLeft: 8 }}>({Object.keys(gameMeta).length} games)</span>
          </div>
          <div className="ar-actions" style={{ flexWrap: "wrap" }}>
            <label className="ar-search" aria-label="Search games">
              <input className="ar-search__input" placeholder="Search games or tags…" value={q} onChange={(e)=>setQ(e.target.value)} />
            </label>
            <select className="ar-ghost sm" value={sort} onChange={(e)=>setSort(e.target.value)} aria-label="Sort games">
              <option value="title">Sort: A → Z</option>
              <option value="recent">Sort: Recently played</option>
            </select>
            <select className="ar-ghost sm" value={lbKey} onChange={(e)=>setLbKey(e.target.value)} aria-label="Pick a game for leaderboard">
              {cards.map(c => <option key={c.key} value={c.key}>{c.title}</option>)}
            </select>
            <Link className="ar-cta sm" to={`/arcade/leaderboard?game=${encodeURIComponent(lbKey)}`}>🏆 Leaderboard</Link>
            {recentKey && <Link className="ar-ghost sm" to={`/arcade/leaderboard?game=${encodeURIComponent(recentKey)}`}>⏱ Recent</Link>}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="ar-hero">
        <div className="ar-hero__content">
          <h1 className="ar-hero__title">Play. Build. Level Up.</h1>
          <p className="ar-hero__sub">Minimal, fast, and distraction-free. New drops every week.</p>
          <div className="ar-hero__actions">
            <a className="ar-cta" href="#library">Start Playing</a>
            <a className="ar-ghost" href="#library">Browse Library</a>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="ar-main">
        <section className="ar-section" aria-label="Featured games">
          <h2 className="ar-section__title">✨ Featured</h2>
          <HubV1 data={featuredData} />
        </section>
        <section id="library" className="ar-section" aria-label="Game library">
          {q.trim() && (
            <div style={{ marginBottom: 10, color: "var(--ink-soft)" }}>
              Search: “{q.trim()}” • {filtered.length} match{filtered.length !== 1 ? "es" : ""}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {chipOptions.map(label => {
              const active = label !== "All" && chipSet.has(label);
              return (
                <button key={label} type="button" className="ar-ghost sm"
                  style={active ? { background: "rgba(255,255,255,.08)" } : null}
                  onClick={() => {
                    if (label === "All") setChipSet(new Set());
                    else {
                      const s = new Set(chipSet);
                      s.has(label) ? s.delete(label) : s.add(label);
                      setChipSet(s);
                    }
                  }}>
                  {label}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <div className="ar-empty">No games match your filters. Try clearing chips or search.</div>
          ) : (
            <div className="ar-grid">
              {filtered.map((c) => <CardWithData key={c.key} base={c} />)}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="ar-footer">
        <div className="ar-footer__row">
          <span>© Arcade</span>
          <nav className="ar-footer__nav">
            <a className="ar-footlink" href="#library">Library</a>
            <a className="ar-footlink" href="#top">Top</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
