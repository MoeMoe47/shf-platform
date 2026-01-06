// src/components/ui/InlineMCQ.jsx
import React, { useEffect, useId, useState } from "react";

/**
 * Inline, self-check multiple-choice question.
 * Props:
 *  - q: string (question)
 *  - options: string[] (choices)
 *  - answerIndex: number (0-based index of correct answer)
 */
export default function InlineMCQ({ q, options = [], answerIndex = 0 }) {
  const [picked, setPicked] = useState(null);
  const [ann, setAnn] = useState(""); // screen reader live region text
  const qId = useId();

  const correct = picked !== null && picked === answerIndex;

  // announce result changes for screen readers
  useEffect(() => {
    if (picked === null) return;
    setAnn(correct ? "Correct. +10 XP" : "Not quite. Try again.");
  }, [picked, correct]);

  return (
    <div
      className={`sh-mcq ${picked !== null ? (correct ? "is-correct" : "is-wrong") : ""}`}
      role="group"
      aria-labelledby={`${qId}-label`}
    >
      <p id={`${qId}-label`} className="sh-mcqQ">{q}</p>

      {/* Live region for result feedback (a11y) */}
      <span className="sh-srOnly" aria-live="polite">{ann}</span>

      <div className="sh-mcqOpts" role="listbox" aria-label="Choices">
        {options.map((opt, i) => {
          const isChosen = picked === i;
          return (
            <button
              key={i}
              type="button"
              className={"sh-mcqBtn" + (isChosen ? " is-picked" : "")}
              onClick={() => {
                const next = i;
                const wasCorrect = picked !== null && picked === answerIndex;
                setPicked(next);
                const nowCorrect = next === answerIndex;
                // Fire a global XP event only on first time turning correct
                if (!wasCorrect && nowCorrect) {
                  window.dispatchEvent(
                    new CustomEvent("sh:xp", { detail: { points: 10, msg: "Nice work!" } })
                  );
                }
              }}
              aria-pressed={isChosen ? "true" : "false"}
              aria-describedby={`${qId}-hint`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="sh-mcqFeedback" aria-live="polite" id={`${qId}-hint`}>
          {correct ? (
            "✅ Nice! +10 XP"
          ) : (
            <>
              💡 Hint: keep your wrist neutral and pace steady.
              <details style={{ marginTop: 6 }}>
                <summary>Show answer</summary>
                The best choice is <b>{options[answerIndex]}</b>.
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}
