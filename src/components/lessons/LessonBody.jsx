// src/components/civic/LessonBody.jsx
import React from "react";

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        fontSize: 12,
        border: "1px solid var(--ring,#e5e7eb)",
        borderRadius: 999,
        background: "#fff",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function LessonBody({ lesson, nextHref }) {
  if (!lesson) {
    return (
      <div className="card card--pad">
        <strong>Lesson not found.</strong>{" "}
        <a className="sh-linkBtn" href="/civic.html#/assignments">Back to Assignments</a>
      </div>
    );
  }

  const {
    title,
    estMinutes,
    objectives = [],
    vocab = [],
    sections = [],
  } = lesson;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Header */}
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>{title}</h1>
        {estMinutes ? (
          <p className="sh-muted" style={{ marginTop: 6 }}>Estimated time: ~{estMinutes} minutes</p>
        ) : null}
        {/* “table of contents” pills */}
        {!!sections.length && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {sections.map((s, i) => <Pill key={i}>{s.heading || `Section ${i+1}`}</Pill>)}
          </div>
        )}
      </div>

      {/* Objectives */}
      {objectives.length > 0 && (
        <div className="card card--pad">
          <strong>Learning Objectives</strong>
          <ul className="sh-list" style={{ marginTop: 8 }}>
            {objectives.map((o,i)=><li key={i}>{o}</li>)}
          </ul>
        </div>
      )}

      {/* Vocabulary */}
      {vocab.length > 0 && (
        <div className="card card--pad">
          <strong>Vocabulary</strong>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
            {vocab.map((v,i)=><Pill key={i}>{v.term}</Pill>)}
          </div>
          <ul className="sh-list" style={{ marginTop:8 }}>
            {vocab.map((v,i)=><li key={i}><b>{v.term}</b> — {v.def}</li>)}
          </ul>
        </div>
      )}

      {/* Sections */}
      {sections.map((s,i)=>(
        <article key={i} className="card card--pad">
          <h3 style={{ marginTop: 0 }}>{s.heading || `Section ${i+1}`}</h3>
          {s.media?.embed ? (
            <div style={{ aspectRatio:"16/9", background:"#000", borderRadius:12, overflow:"hidden" }}>
              <iframe
                title={s.media.title || s.heading || `media-${i}`}
                src={s.media.embed}
                style={{ width:"100%", height:"100%", border:0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : null}
          {typeof s.body === "string" && (
            <div style={{ marginTop: 10, whiteSpace:"pre-wrap" }}
                 dangerouslySetInnerHTML={{ __html: s.body }} />
          )}
        </article>
      ))}

      {/* Sticky footer */}
      <div
        style={{
          position:"sticky", bottom:0, zIndex:10, padding:"10px 0 2px",
          background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 28%)"
        }}
      >
        <div className="card card--pad"
             style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ height:8, background:"#eef2ff", borderRadius: 999, overflow:"hidden" }}>
              <div style={{ width:"40%", height:"100%", background:"var(--brand,#2563eb)", opacity:.4 }} />
            </div>
          </div>
          <button className="sh-btn" onClick={() => alert("+5 points! Marked complete.")}>
            Mark as Complete (+5)
          </button>
          <a className="sh-btn is-ghost" href="/civic.html#/assignments">← Back</a>
          {nextHref && <a className="sh-btn is-ghost" href={nextHref}>Next →</a>}
        </div>
      </div>
    </div>
  );
}
