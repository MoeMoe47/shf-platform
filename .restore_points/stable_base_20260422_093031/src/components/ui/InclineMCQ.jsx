// src/components/ui/InlineMCQ.jsx
import React from "react";

/**
 * InlineMCQ
 * ----------
 * Props:
 * - qid:        string (required) unique id for this question
 * - prompt:     string|ReactNode
 * - options:    Array<string | { id?:string, label:string, correct?:boolean }>
 * - type:       "single" | "multi" (default "single")
 * - correctIndex: number (optional, single)
 * - correctIds:   string[] (optional, multi)
 * - onCorrect:  fn(qid) — optional callback
 * - onSubmit:   fn({ correct:boolean, chosenIds:string[] }) — optional
 *
 * Minimal usage (single):
 *   <InlineMCQ qid="asl-03-q7"
 *              prompt="Which handshape is used?"
 *              options={["A", "B", "C", "D"]}
 *              correctIndex={2} />
 *
 * Multi:
 *   <InlineMCQ qid="asl-03-q2"
 *              type="multi"
 *              prompt="Select all that apply"
 *              options={[
 *                { id:"a", label:"Classifier", correct:true },
 *                { id:"b", label:"Palm orientation", correct:true },
 *                { id:"c", label:"Random choice" }
 *              ]}
 *              correctIds={["a","b"]} />
 */

export default function InlineMCQ(props) {
  const {
    qid,
    prompt,
    options = [],
    type = "single",
    correctIndex,
    correctIds,
    onCorrect,
    onSubmit,
    className = "",
  } = props;

  // Normalize option objects
  const norm = React.useMemo(() => {
    return options.map((o, i) => {
      if (typeof o === "string") return { id: `opt-${i}`, label: o, correct: i === correctIndex };
      return {
        id: o.id || `opt-${i}`,
        label: o.label,
        correct:
          typeof o.correct === "boolean"
            ? o.correct
            : type === "single"
            ? i === correctIndex
            : Array.isArray(correctIds) && correctIds.includes(o.id || `opt-${i}`),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options), type, correctIndex, JSON.stringify(correctIds)]);

  const [chosen, setChosen] = React.useState(() => new Set());
  const [status, setStatus] = React.useState("idle"); // "idle" | "correct" | "incorrect"
  const firedRef = React.useRef(false);

  function toggle(id) {
    setStatus("idle");
    setChosen((prev) => {
      const next = new Set(prev);
      if (type === "single") {
        next.clear();
        next.add(id);
      } else {
        next.has(id) ? next.delete(id) : next.add(id);
      }
      return next;
    });
  }

  function isCorrectChoice() {
    if (type === "single") {
      const [only] = Array.from(chosen);
      const target = norm.find((o) => o.id === only);
      return !!target && !!target.correct;
    }
    // multi: sets equal?
    const correctSet = new Set(norm.filter((o) => o.correct).map((o) => o.id));
    if (correctSet.size !== chosen.size) return false;
    for (const id of chosen) if (!correctSet.has(id)) return false;
    return true;
  }

  function submit() {
    const ok = isCorrectChoice();
    setStatus(ok ? "correct" : "incorrect");

    const chosenIds = Array.from(chosen);
    try { onSubmit && onSubmit({ correct: ok, chosenIds }); } catch {}

    if (ok && !firedRef.current) {
      firedRef.current = true;
      // Fire learning event; the award hook below will pick this up.
      try {
        window.dispatchEvent(
          new CustomEvent("mcq:correct", { detail: { qid: qid || "", chosen: chosenIds } })
        );
      } catch {}
      try { onCorrect && onCorrect(qid || ""); } catch {}
    }
  }

  const disabled = status === "correct";
  const canSubmit = chosen.size > 0 && !disabled;

  return (
    <section
      className={`mcq card card--pad ${className || ""}`}
      role="group"
      aria-labelledby={qid ? `${qid}-lbl` : undefined}
      data-qid={qid}
    >
      {prompt && (
        <h4 id={qid ? `${qid}-lbl` : undefined} style={{ marginTop: 0 }}>
          {prompt}
        </h4>
      )}

      <ul className="mcq__list" style={{ listStyle: "none", padding: 0, margin: "8px 0", display: "grid", gap: 8 }}>
        {norm.map((o) => {
          const active = chosen.has(o.id);
          return (
            <li key={o.id}>
              <button
                type="button"
                className={`sh-btn ${active ? "" : "sh-btn--secondary"}`}
                onClick={() => toggle(o.id)}
                disabled={disabled}
                style={{ width: "100%", textAlign: "left" }}
                aria-pressed={active}
              >
                {type === "multi" ? (active ? "☑︎ " : "☐ ") : (active ? "◉ " : "○ ")}
                {o.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sh-actionsRow" style={{ marginTop: 8 }}>
        <button className="sh-btn" onClick={submit} disabled={!canSubmit}>
          {status === "correct" ? "Great job ✓" : "Check answer"}
        </button>
        <button
          className="sh-btn sh-btn--secondary"
          onClick={() => { setChosen(new Set()); setStatus("idle"); }}
          disabled={disabled && chosen.size === 0}
        >
          Reset
        </button>
      </div>

      <div aria-live="polite" className="subtle" style={{ minHeight: 20, marginTop: 6 }}>
        {status === "correct" ? "Correct!" : status === "incorrect" ? "Try again." : ""}
      </div>

      {/* Local, tiny style assist */}
      <style>{`
        .mcq .sh-btn { border-radius: 10px; }
        .mcq .sh-btn.sh-btn--secondary { background: #fff; }
        :not([data-app="curriculum"])[data-theme="dark"] .mcq .sh-btn.sh-btn--secondary { background: #111317; }
      `}</style>
    </section>
  );
}

/* --- SHF: MCQ correct answer micro-award (drop-in) --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_mcqCorrect) return;
  window.__shfHook_mcqCorrect = true;

  const COOLDOWN_MS = 60_000; // 1 minute per qid (anti-spam)

  function award(qid) {
    if (!qid) return;
    const now = Date.now();
    const key = `shf.award.mcq.${qid}`;
    const last = Number(localStorage.getItem(key) || 0);
    if (now - last < COOLDOWN_MS) return; // cooldown

    try {
      window.shfCredit?.earn?.({
        action: "quiz.correct",
        rewards: { corn: 1 },   // 🌽
        scoreDelta: 1,
        meta: { qid }
      });
      localStorage.setItem(key, String(now));
      window.shToast?.("🧠 Correct! · +1 🌽 · +1 score");
    } catch {
      // no-op
    }
  }

  window.addEventListener("mcq:correct", (e) => {
    try {
      const qid = (e && e.detail && e.detail.qid) || "";
      award(qid);
    } catch {}
  });

  // Optional helper you can call manually:
  //   window.shfAward.mcqCorrect("asl-03-q7")
  window.shfAward = Object.assign({}, window.shfAward || {}, {
    mcqCorrect: (qid) => award(qid)
  });
})();
