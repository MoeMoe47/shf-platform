// src/components /sales/MicroQuiz.jsx
import React from "react";
import earn from "@/shared/credit/earn-shim.js";
import { enqueue } from "@/shared/offline/queue.js";
import { award } from "@/shared/rewards/shim.js";

/* ---------------------------------------------
   Tiny internal helpers (no external deps)
--------------------------------------------- */
function ping(name, data = {}) {
  try {
    window.dispatchEvent(new CustomEvent("analytics:ping", { detail: { name, ...data } }));
  } catch {}
}

// Persist per-lesson quiz state in one JSON object:
// key = `civic:quiz:${lessonId}`
// shape = { [qid]: { answered, choiceIndex, isCorrect, score, at } }
function readQuizState(lessonId) {
  try {
    return JSON.parse(localStorage.getItem(`civic:quiz:${lessonId}`) || "{}");
  } catch {
    return {};
  }
}
function writeQuizState(lessonId, state) {
  try {
    localStorage.setItem(`civic:quiz:${lessonId}`, JSON.stringify(state));
    window.dispatchEvent(new StorageEvent("storage", { key: `civic:quiz:${lessonId}`, newValue: "updated" }));
  } catch {}
}

function gradeMCQ(choiceIndex, correctIndex = 0) {
  const isCorrect = Number(choiceIndex) === Number(correctIndex);
  return { isCorrect, score: isCorrect ? 1 : 0 };
}

/* ---------------------------------------------
   Component
   - Primary signature (new): { lessonId, qid, stem, choices, correctIndex, onUpdate? }
   - Back-compat (old): { lessonId, quiz:{ id, question, choices:[{id,label,isCorrect}], explain? } }
--------------------------------------------- */
export default function MicroQuiz(props) {
  // Normalize props for both shapes
  const legacy = props.quiz != null;
  const lessonId = props.lessonId || "civic-current";
  const qid = legacy ? props.quiz.id : props.qid;
  const onUpdate = props.onUpdate;

  // Build a common view model
  const vm = React.useMemo(() => {
    if (!legacy) {
      return {
        stem: props.stem || "",
        choices: (props.choices || []).map((c, i) =>
          typeof c === "object" ? { label: c.label ?? String(c), _idx: i } : { label: String(c), _idx: i }
        ),
        correctIndex: Number(props.correctIndex ?? 0),
        explain: props.explain,
      };
    }
    // legacy quiz format: choices may include {id,label,isCorrect}
    const correctIdx = Math.max(
      0,
      (props.quiz.choices || []).findIndex((c) => c?.isCorrect)
    );
    return {
      stem: props.quiz.question || "",
      choices: (props.quiz.choices || []).map((c, i) => ({ label: c?.label ?? String(c), _idx: i })),
      correctIndex: correctIdx,
      explain: props.quiz.explain,
    };
  }, [legacy, props]);

  if (!qid) return null;

  /* ---------------------------------------------
     Attempt history (per-lesson, cross-question)
     key = civic:lesson:${lessonId}:quiz
     value = [{ qid, choice, isCorrect, ts }, ...] (dedup by qid, keep latest)
  --------------------------------------------- */
  const ATTEMPT_KEY = `civic:lesson:${lessonId}:quiz`;
  const [attempts, setAttempts] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "[]"); }
    catch { return []; }
  });
  function saveAttempts(nextArr) {
    setAttempts(nextArr);
    try { localStorage.setItem(ATTEMPT_KEY, JSON.stringify(nextArr)); } catch {}
    try { onUpdate?.(nextArr); } catch {}
  }

  // load per-question state
  const [state, setState] = React.useState(() => {
    const all = readQuizState(lessonId);
    return all[qid] || { answered: false, choiceIndex: null, isCorrect: null, score: 0, at: 0 };
  });

  const answered = !!state.answered;

  function onSelect(idx) {
    if (answered) return;

    const { isCorrect, score } = gradeMCQ(idx, vm.correctIndex);
    const next = { answered: true, choiceIndex: idx, isCorrect, score, at: Date.now() };

    // persist under this lesson's state blob
    const all = readQuizState(lessonId);
    all[qid] = next;
    writeQuizState(lessonId, all);
    setState(next);

    // update cross-question attempt ledger (dedupe by qid, keep latest)
    const entry = { qid, choice: idx, isCorrect, ts: Date.now() };
    const map = new Map(attempts.map(r => [r.qid, r]));
    map.set(qid, entry);
    saveAttempts(Array.from(map.values()));

    // offline queue + analytics + rewards pulse
    try {
      enqueue("quizResult", { lessonId, qid, choiceIndex: idx, isCorrect, score });
      ping("civic.quiz.answer", { lessonId, qid, isCorrect, score });
      window.dispatchEvent(new Event("rewards:update"));
    } catch {}

    // award first-quiz (idempotent) + give +1 point on first correct
    if (isCorrect) {
      award("first_quiz");
      earn({ kind: "quiz", points: 1, meta: { lessonId, quizId: qid } });
      try {
        window.dispatchEvent(new CustomEvent("rewards:earned", { detail: { points: 1, kind: "quiz", lessonId } }));
        window.dispatchEvent(new Event("rewards:update"));
      } catch {}
    }
  }

  return (
    <div
      className={`micro-quiz ${props.compact ? "is-compact" : ""}`}
      role="group"
      aria-label={`Quiz ${qid}`}
      data-quiz-key={`${lessonId}:${qid}`}
      style={{
        border: "1px solid var(--ring,#e5e7eb)",
        borderRadius: 12,
        padding: 10,
        background: "var(--card,#fff)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden>🧠</span>
        <strong style={{ fontSize: 14, lineHeight: 1.2 }}>{vm.stem}</strong>
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "10px 0 0",
          display: "grid",
          gap: 6,
        }}
      >
        {vm.choices.map((c, idx) => {
          const selected = state.choiceIndex === idx;
          const showCorrect = answered && idx === vm.correctIndex;
          const showWrong = answered && selected && !state.isCorrect;

          return (
            <li key={idx}>
              <button
                type="button"
                className="sh-btn is-ghost"
                aria-pressed={selected ? "true" : "false"}
                onClick={() => onSelect(idx)}
                disabled={answered}
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  border: selected ? "1px solid var(--ring,#ddd)" : "1px solid transparent",
                  background: showCorrect
                    ? "rgba(20,184,166,.12)"
                    : showWrong
                    ? "rgba(239,68,68,.12)"
                    : "transparent",
                }}
                title={
                  answered
                    ? showCorrect
                      ? "Correct"
                      : selected
                      ? "Your answer"
                      : "Choice"
                    : "Select answer"
                }
              >
                <span style={{ marginRight: 8, opacity: 0.7 }}>
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span>{c?.label ?? String(c)}</span>
                {showCorrect ? <span style={{ marginLeft: "auto" }} aria-hidden>✅</span> : null}
                {showWrong ? <span style={{ marginLeft: "auto" }} aria-hidden>❌</span> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div className="micro-quiz__feedback" role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 13 }}>
          {state.isCorrect ? (
            <span style={{ color: "var(--success,#0a7b41)" }}>
              Nice! Correct — +1 knowledge point.
            </span>
          ) : (
            <span>
              Not quite. The correct answer is{" "}
              <strong>{String.fromCharCode(65 + vm.correctIndex)}</strong>.
              {vm.explain ? <> {vm.explain}</> : null}
            </span>
          )}

          {/* review hook — surfaces full attempts array to parent */}
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              className="sh-btn is-ghost"
              onClick={() => {
                try { onUpdate?.(attempts); } catch {}
              }}
            >
              Review answers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
