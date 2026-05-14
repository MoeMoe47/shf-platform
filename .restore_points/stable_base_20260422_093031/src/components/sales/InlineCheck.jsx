import React from "react";

/**
 * InlineCheck
 * - Tiny in-flow quiz with 1 correct answer
 * - Persists score (0/100) to localStorage
 * - Emits analytics: "civic:quiz:answer"
 *
 * Props:
 *  id:          unique string per check
 *  objective:   objective id (e.g., "obj1")
 *  question:    string
 *  options:     [{ text, correct }, ...]
 *  onMastery:   fn(score: 0|100)
 */
export default function InlineCheck({ id, objective, question, options = [], onMastery }) {
  const key = `civic:check:${id}:score`;
  const [state, setState] = React.useState(() => {
    const saved = Number(localStorage.getItem(key) || "NaN");
    return {
      picked: null,
      correct: Number.isFinite(saved) ? saved === 100 : null,
      locked: Number.isFinite(saved),
    };
  });

  function pick(idx) {
    if (state.locked) return;
    const choice = options[idx];
    const isCorrect = !!choice?.correct;
    const score = isCorrect ? 100 : 0;
    try { localStorage.setItem(key, String(score)); } catch {}
    setState({ picked: idx, correct: isCorrect, locked: true });
    onMastery?.(score);
    window.dispatchEvent(new CustomEvent("analytics:ping", {
      detail: { name: "civic:quiz:answer", id, objective, correct: isCorrect }
    }));
  }

  return (
    <div
      className={`sh-mcq ${state.correct === true ? "is-correct" : state.correct === false ? "is-wrong" : ""}`}
      role="group" aria-label="Quick check"
    >
      <div className="sh-mcqQ">{question}</div>
      <div className="sh-mcqOpts">
        {options.map((opt, i) => (
          <button
            key={i}
            className={`sh-mcqBtn ${state.picked === i ? "is-picked" : ""}`}
            onClick={() => pick(i)}
            aria-pressed={state.picked === i}
            disabled={state.locked}
          >
            {opt.text}
          </button>
        ))}
      </div>
      {state.correct != null && (
        <div className="sh-mcqFeedback" aria-live="polite">
          {state.correct ? "✅ Nice! You’ve got it." : "❌ Not quite. Re-read that section and try again later."}
        </div>
      )}
    </div>
  );
}
