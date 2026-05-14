// src/templates/arcade/HubV1.jsx
import React from "react";
import { Link } from "react-router-dom";

/** Featured row for Arcade.
 * props.data = { title, emoji, intro, tiles: [{ id, emoji, title, desc, launch, external, docs }] }
 */
export default function HubV1({ data }) {
  if (!data) return null;
  const S = {
    wrap: { display: "grid", gap: 12, margin: "8px 0 18px" },
    head: { display: "flex", alignItems: "baseline", gap: 10 },
    h2: { margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" },
    intro: { margin: 0, color: "var(--ink-soft)", fontSize: 14 },
    row: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 12 },
    card: {
      border: "1px solid var(--ring)", borderRadius: 14, padding: 12, display: "grid", gap: 8,
      background: "linear-gradient(180deg,var(--card),color-mix(in oklab,var(--card) 94%,black 6%))",
    },
    title: { margin: 0, fontSize: 16, fontWeight: 700 },
    desc: { margin: 0, color: "var(--ink-soft)", fontSize: 13 },
    actions: { display: "flex", gap: 8, flexWrap: "wrap" },
    btn: {
      display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 11px",
      borderRadius: 10, border: "1px solid var(--ring)", background: "var(--card)",
      textDecoration: "none", color: "var(--ink)", fontSize: 13,
    },
    primary: { background: "var(--accent)", color: "white", borderColor: "var(--accent)" },
    emoji: { fontSize: 18, lineHeight: 1 },
  };

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.emoji} aria-hidden="true">{data.emoji || "✨"}</div>
        <h2 style={S.h2}>{data.title || "Featured"}</h2>
      </div>
      {data.intro && <p style={S.intro}>{data.intro}</p>}
      <div style={S.row}>
        {(data.tiles || []).map(t => {
          const playEl = t.external
            ? <a href={t.launch} target="_blank" rel="noreferrer" style={{ ...S.btn, ...S.primary }}>Play</a>
            : <Link to={t.launch} style={{ ...S.btn, ...S.primary }}>Play</Link>;
          const docsEl = t.docs
            ? (t.docs.startsWith("http")
                ? <a href={t.docs} target="_blank" rel="noreferrer" style={S.btn}>Leaderboard</a>
                : <Link to={t.docs} style={S.btn}>Leaderboard</Link>)
            : null;

          return (
            <article key={t.id} style={S.card} aria-label={t.title}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={S.emoji} aria-hidden="true">{t.emoji || "🎮"}</div>
                <h3 style={S.title}>{t.title}</h3>
              </div>
              {t.desc && <p style={S.desc}>{t.desc}</p>}
              <div style={S.actions}>
                {playEl}
                {docsEl}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
