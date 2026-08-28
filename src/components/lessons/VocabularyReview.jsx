// src/components/lessons/VocabularyReview.jsx
//
// Phase 2B — dedicated one-term-at-a-time vocabulary review experience.
// The lesson data model already has a consistent, real vocab shape
// (`{term, def}`, present in 67 of 72 real ASL student lessons) and it
// was already rendered as an inline list in LessonBody.jsx — but there
// was no dedicated review flow (previous/next, keyboard, tracked review
// state). This component is additive: LessonBody still shows the
// existing inline list, this is a separate, optional deeper-review mode.
//
// Reuses, not duplicates:
//  - src/components/tts/SpeakBtn.jsx for optional read-aloud (real,
//    existing Web Speech API component).
//  - src/shared/progress/progressClient.js's recordVocabularyReviewed
//    (Phase 2B addition to the existing progress client).
import React from "react";
import SpeakBtn from "@/components/tts/SpeakBtn.jsx";
import { recordVocabularyReviewed } from "@/shared/progress/progressClient.js";

function reviewedKey(curriculum, slug) {
  return `curriculum:vocabReviewed:${curriculum}:${slug}`;
}

export default function VocabularyReview({ vocab, curriculum, slug, actorId, onClose }) {
  const [index, setIndex] = React.useState(0);
  const [reviewed, setReviewed] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(reviewedKey(curriculum, slug)) || "[]")); }
    catch { return new Set(); }
  });
  const containerRef = React.useRef(null);

  const total = vocab.length;
  const term = vocab[index];

  function persistReviewed(nextSet) {
    try { localStorage.setItem(reviewedKey(curriculum, slug), JSON.stringify([...nextSet])); } catch {}
  }

  function markReviewed() {
    if (reviewed.has(index)) return;
    const next = new Set(reviewed);
    next.add(index);
    setReviewed(next);
    persistReviewed(next);
    recordVocabularyReviewed({ actorId, curriculum, slug, term: term?.term });
  }

  function goTo(nextIndex) {
    if (nextIndex < 0 || nextIndex >= total) return;
    setIndex(nextIndex);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
    else if (e.key === "Escape") { onClose?.(); }
  }

  if (!total) return null;

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={`Vocabulary review, term ${index + 1} of ${total}`}
      onKeyDown={handleKeyDown}
      className="card card--pad"
      style={{ display: "grid", gap: 10 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong>Vocabulary Review</strong>
        <span className="subtle">{index + 1} / {total}</span>
      </div>

      <div style={{ border: "1px solid var(--ring,#e5e7eb)", borderRadius: 10, padding: 16, textAlign: "center" }}>
        <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{term.term}</p>
        <p style={{ marginTop: 8 }}>{term.def}</p>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 8 }}>
          <SpeakBtn text={`${term.term}. ${term.def}`} label="🔊 Hear this term" />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="sh-btn is-ghost" onClick={() => goTo(index - 1)} disabled={index === 0}>
            ← Previous
          </button>
          <button type="button" className="sh-btn is-ghost" onClick={() => goTo(index + 1)} disabled={index === total - 1}>
            Next →
          </button>
        </div>
        <button type="button" className="sh-btn" onClick={markReviewed} disabled={reviewed.has(index)}>
          {reviewed.has(index) ? "Reviewed ✓" : "Mark reviewed"}
        </button>
      </div>

      <p className="subtle" style={{ margin: 0 }}>
        {reviewed.size} of {total} terms reviewed. Use ← → to move between terms, Esc to close.
      </p>

      {onClose && (
        <button type="button" className="sh-btn is-ghost" onClick={onClose}>
          Close vocabulary review
        </button>
      )}
    </div>
  );
}
