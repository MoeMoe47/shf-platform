// src/components/lessons/AssessmentRenderer.jsx
//
// Phase 2B — the shared knowledge-check / assessment renderer for
// Curriculum. Consumes the canonical shape from
// src/utils/normalizeAssessment.js (built from real, populated ASL
// lesson `quiz` data — see that file's header for the four real source
// shapes). Reuses, rather than duplicates:
//   - src/shared/quiz/grade.js (gradeMCQ) — real, pre-existing, had zero
//     callers before this.
//   - src/shared/quiz/store.js (namespaced "curriculum" — extended, not
//     forked, in Phase 2B).
//   - src/components/ally/A11yTools.jsx's announce() for live-region
//     result announcements.
//   - src/shared/progress/progressClient.js's new recordQuiz*/
//     recordReflectionSaved functions (Phase 2B additions to the
//     existing, real progress client — not a second progress system).
//
// "mcq" items are objectively graded. "short" and "reflection" items are
// NEVER scored — reflection is explicitly not treated as a quiz (see the
// real data's own type discriminator), matching the audit's rule that a
// reflection must not be auto-graded.
import React from "react";
import { gradeMCQ } from "@/shared/quiz/grade.js";
import { readQuizState, writeQuizState } from "@/shared/quiz/store.js";
import { announce } from "@/components/ally/A11yTools.jsx";
import {
  recordQuizStarted,
  recordQuizSubmitted,
  recordQuizCompleted,
  recordReflectionSaved,
} from "@/shared/progress/progressClient.js";

const APP = "curriculum";

function McqItem({ item, lessonKey, actorId, curriculum, slug, assessmentId, onGraded }) {
  const [state, setState] = React.useState(() => {
    const all = readQuizState(lessonKey, APP);
    return all[item.id] || { answered: false, choiceIndex: null, isCorrect: null };
  });
  const [selected, setSelected] = React.useState(state.choiceIndex);

  function handleSubmit(e) {
    e.preventDefault();
    if (selected == null) return;
    const { isCorrect, score } = gradeMCQ(selected, item.correctIndex);
    const next = { answered: true, choiceIndex: selected, isCorrect, score, at: Date.now() };
    const all = readQuizState(lessonKey, APP);
    all[item.id] = next;
    writeQuizState(lessonKey, all, APP);
    setState(next);
    recordQuizSubmitted({ actorId, curriculum, slug, assessmentId, itemId: item.id, isCorrect });
    announce(isCorrect ? "Correct." : "Not quite correct.");
    onGraded?.(item.id, isCorrect);
  }

  function handleRetry() {
    setState({ answered: false, choiceIndex: null, isCorrect: null });
    setSelected(null);
  }

  const groupId = `${lessonKey}-${item.id}`;

  return (
    <fieldset className="cj-field" style={{ border: "1px solid var(--ring,#e5e7eb)", borderRadius: 10, padding: 12 }}>
      <legend style={{ fontWeight: 700, padding: "0 4px" }}>{item.prompt}</legend>
      <div role="radiogroup" aria-label={item.prompt} style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {item.choices.map((choice, idx) => {
          const id = `${groupId}-${idx}`;
          const isSelected = selected === idx;
          const revealCorrect = state.answered && idx === item.correctIndex;
          const revealWrong = state.answered && isSelected && !state.isCorrect;
          return (
            <label
              key={id}
              htmlFor={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid var(--ring,#e5e7eb)",
                cursor: state.answered ? "default" : "pointer",
              }}
            >
              <input
                type="radio"
                id={id}
                name={groupId}
                value={idx}
                checked={isSelected}
                disabled={state.answered}
                onChange={() => setSelected(idx)}
              />
              <span>{choice}</span>
              {revealCorrect && <span aria-hidden="true"> ✅</span>}
              {revealWrong && <span aria-hidden="true"> ❌</span>}
              {revealCorrect && <span className="cj-srOnly"> (correct answer)</span>}
              {revealWrong && <span className="cj-srOnly"> (your answer, incorrect)</span>}
            </label>
          );
        })}
      </div>

      {!state.answered ? (
        <button type="button" className="sh-btn" style={{ marginTop: 10 }} disabled={selected == null} onClick={handleSubmit}>
          Submit answer
        </button>
      ) : (
        <div role="status" aria-live="polite" style={{ marginTop: 10 }}>
          <p style={{ margin: 0, fontWeight: 700, color: state.isCorrect ? "#166534" : "#b91c1c" }}>
            {state.isCorrect ? "Correct!" : "Not quite."}
          </p>
          {!state.isCorrect && item.explain && <p className="subtle" style={{ marginTop: 4 }}>{item.explain}</p>}
          <button type="button" className="sh-btn is-ghost" style={{ marginTop: 6 }} onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}
    </fieldset>
  );
}

function ShortItem({ item, lessonKey }) {
  const storageKey = `${APP}:short:${lessonKey}:${item.id}`;
  const [value, setValue] = React.useState(() => {
    try { return localStorage.getItem(storageKey) || ""; } catch { return ""; }
  });
  const [saved, setSaved] = React.useState(false);

  function handleSave() {
    try { localStorage.setItem(storageKey, value); } catch {}
    setSaved(true);
    announce("Response saved.");
  }

  return (
    <div className="cj-field" style={{ border: "1px solid var(--ring,#e5e7eb)", borderRadius: 10, padding: 12 }}>
      <label htmlFor={`${lessonKey}-${item.id}`} style={{ fontWeight: 700, display: "block" }}>
        {item.prompt}
      </label>
      <p className="subtle" style={{ margin: "2px 0 8px" }}>Short response — not scored.</p>
      <textarea
        id={`${lessonKey}-${item.id}`}
        className="sh-inputText"
        rows={2}
        style={{ width: "100%", boxSizing: "border-box" }}
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); }}
      />
      <button type="button" className="sh-btn is-ghost" style={{ marginTop: 6 }} onClick={handleSave} disabled={!value.trim()}>
        {saved ? "Saved" : "Save response"}
      </button>
    </div>
  );
}

function ReflectionItem({ item, lessonKey, actorId, curriculum, slug }) {
  const storageKey = `${APP}:reflection:${lessonKey}:${item.id}`;
  const [value, setValue] = React.useState(() => {
    try { return localStorage.getItem(storageKey) || ""; } catch { return ""; }
  });
  const [saved, setSaved] = React.useState(false);

  function handleSave() {
    try { localStorage.setItem(storageKey, value); } catch {}
    setSaved(true);
    recordReflectionSaved({ actorId, curriculum, slug, itemId: item.id });
    announce("Reflection saved.");
  }

  return (
    <div
      className="cj-field"
      style={{ border: "1px solid var(--civic-purple,#8b5cf6)", borderRadius: 10, padding: 12, background: "rgba(139,92,246,0.05)" }}
    >
      <label htmlFor={`${lessonKey}-${item.id}`} style={{ fontWeight: 700, display: "block" }}>
        Reflection: {item.prompt}
      </label>
      <p className="subtle" style={{ margin: "2px 0 8px" }}>This is a reflection, not a graded question.</p>
      <textarea
        id={`${lessonKey}-${item.id}`}
        className="sh-inputText"
        rows={3}
        style={{ width: "100%", boxSizing: "border-box" }}
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); }}
      />
      <button type="button" className="sh-btn is-ghost" style={{ marginTop: 6 }} onClick={handleSave} disabled={!value.trim()}>
        {saved ? "Saved" : "Save reflection"}
      </button>
    </div>
  );
}

/**
 * Props:
 *  - assessment: canonical shape from normalizeAssessment()
 *  - curriculum, slug: for progress events + storage namespacing
 *  - actorId: current student identity (see UserContext)
 */
export default function AssessmentRenderer({ assessment, curriculum, slug, actorId }) {
  const lessonKey = `${curriculum}:${slug}`;
  const assessmentId = `${lessonKey}:quiz`;
  const startedRef = React.useRef(false);
  const [gradedCount, setGradedCount] = React.useState(0);

  React.useEffect(() => {
    if (assessment && !startedRef.current) {
      startedRef.current = true;
      recordQuizStarted({ actorId, curriculum, slug, assessmentId });
    }
  }, [assessment, actorId, curriculum, slug, assessmentId]);

  const mcqItems = React.useMemo(() => (assessment?.items || []).filter((i) => i.type === "mcq"), [assessment]);

  React.useEffect(() => {
    if (!assessment || mcqItems.length === 0) return;
    const all = readQuizState(lessonKey, APP);
    const answeredCount = mcqItems.filter((i) => all[i.id]?.answered).length;
    if (answeredCount === mcqItems.length && answeredCount > 0) {
      const score = mcqItems.filter((i) => all[i.id]?.isCorrect).length;
      recordQuizCompleted({ actorId, curriculum, slug, assessmentId, score, maxScore: mcqItems.length });
    }
  }, [gradedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!assessment || !Array.isArray(assessment.items) || assessment.items.length === 0) {
    return null;
  }

  return (
    <section className="card card--pad" aria-label="Knowledge check">
      <strong>{assessment.title || "Knowledge Check"}</strong>
      {assessment.note && <p className="subtle" style={{ marginTop: 4 }}>{assessment.note}</p>}
      <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
        {assessment.items.map((item) => {
          if (item.type === "mcq") {
            return (
              <McqItem
                key={item.id}
                item={item}
                lessonKey={lessonKey}
                actorId={actorId}
                curriculum={curriculum}
                slug={slug}
                assessmentId={assessmentId}
                onGraded={() => setGradedCount((c) => c + 1)}
              />
            );
          }
          if (item.type === "short") {
            return <ShortItem key={item.id} item={item} lessonKey={lessonKey} />;
          }
          return (
            <ReflectionItem key={item.id} item={item} lessonKey={lessonKey} actorId={actorId} curriculum={curriculum} slug={slug} />
          );
        })}
      </div>
    </section>
  );
}
