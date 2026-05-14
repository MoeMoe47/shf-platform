// src/pages /sales/IssueSurvey.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import { useRewards } from "@/hooks/useRewards.js";

/* ---------------- Keys ---------------- */
const KEY_SURVEY   = "civic:survey:issues";          // { answers:[{id,choice}] }
const KPI_SURVEYS  = "civic:kpi:surveysCompleted";
const FLAG_DONE    = "civic:flag:surveyIssuesDone";   // one-time reward/log flag
const KEY_HISTORY  = "wallet:history";

/* ---------------- Helpers ---------------- */
function readJSON(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } }
function saveJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function emitStorage(key){
  try { window.dispatchEvent(new StorageEvent("storage", { key, newValue: "updated" })); } catch {}
}
function bumpKPI(key, delta=1){
  try {
    const n = Math.max(0, (Number(localStorage.getItem(key))||0) + Number(delta||0));
    localStorage.setItem(key, String(n));
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: String(n) }));
  } catch {}
}

/* ---------------- Survey Model ----------------
   Keep IDs stable—ProfileResults & scoring map rely on these.
------------------------------------------------ */
const QUESTIONS = [
  { id: "public-safety",  label: "Public Safety",          help: "Investments in policing, prevention, and response." },
  { id: "schools",        label: "K–12 Schools",           help: "Funding, staffing, and facilities for local schools." },
  { id: "taxes",          label: "Taxes & Fees",           help: "Overall direction on tax levels for services." },
  { id: "jobs",           label: "Jobs & Small Business",  help: "Support for job creation and entrepreneurs." },
  { id: "housing",        label: "Housing & Homelessness", help: "Affordable units, services, and zoning updates." },
];

// Consistent 5-point stance scale. We DO NOT store numeric values—just these IDs.
const CHOICES = [
  { id: "strongly-agree",    label: "Strongly Agree"    },
  { id: "agree",             label: "Agree"             },
  { id: "neutral",           label: "Neutral"           },
  { id: "disagree",          label: "Disagree"          },
  { id: "strongly-disagree", label: "Strongly Disagree" },
];

/* ---------------- XY Preview (neutral centered) ----------------
   Map choices → numeric stance (−2 … +2), then apply simple weights:
   - X (economic): taxes, jobs
   - Y (community/services): schools, housing, public-safety
   These are preview-only and do not alter saved payload shape.
----------------------------------------------------------------- */
const CHOICE_VAL = {
  "strongly-disagree": -2,
  "disagree":          -1,
  "neutral":            0,
  "agree":             +1,
  "strongly-agree":    +2,
};
// weights per axis
const W = {
  x: { taxes: 1.0, jobs: 1.0 },
  y: { schools: 1.0, housing: 1.0, "public-safety": 1.0 },
};
function computeXY(selMap) {
  // X
  let xSum = 0, xW = 0;
  Object.entries(W.x).forEach(([qid, w]) => {
    const v = CHOICE_VAL[selMap[qid] || "neutral"];
    xSum += (v || 0) * w; xW += w;
  });
  // Y
  let ySum = 0, yW = 0;
  Object.entries(W.y).forEach(([qid, w]) => {
    const v = CHOICE_VAL[selMap[qid] || "neutral"];
    ySum += (v || 0) * w; yW += w;
  });
  // average, round to single decimal for display
  const X = xW ? Math.round((xSum / xW) * 10) / 10 : 0;
  const Y = yW ? Math.round((ySum / yW) * 10) / 10 : 0;
  return { x: X, y: Y };
}

/* ---------------- UI Bits ---------------- */
function QuestionRow({ q, value, onChange }) {
  return (
    <article className="card" style={{ padding: 12 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
        <strong>{q.label}</strong>
        <span className="sh-badge is-ghost">{q.id}</span>
      </div>
      {q.help && <div style={{ fontSize:13, opacity:.8, marginTop:4 }}>{q.help}</div>}

      <div style={{ display:"grid", gap:8, marginTop:10 }}>
        {CHOICES.map(c => (
          <label key={c.id} className="sh-radio" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <input
              type="radio"
              name={q.id}
              value={c.id}
              checked={value === c.id}
              onChange={()=> onChange(q.id, c.id)}
            />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
    </article>
  );
}

/* ---------------- Page ---------------- */
export default function IssueSurvey(){
  const { toast } = useToasts();
  const rewards = (typeof useRewards === "function" ? useRewards() : {});
  const { addPoints } = rewards || {};

  // Prefill from saved payload (shape: {answers:[{id,choice}]})
  const initial = React.useMemo(() => {
    const payload = readJSON(KEY_SURVEY, { answers: [] });
    const map = {};
    if (payload && Array.isArray(payload.answers)) {
      payload.answers.forEach(({ id, choice }) => { if (id) map[id] = choice || ""; });
    }
    return map;
  }, []);

  const [sel, setSel] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  const completeCount = QUESTIONS.filter(q => sel[q.id]).length;
  const allAnswered   = completeCount === QUESTIONS.length;

  // Live XY preview
  const { x: px, y: py } = computeXY(sel);

  // Autosave (called after each selection)
  const autosave = React.useCallback((nextSel) => {
    const payload = {
      answers: QUESTIONS
        .filter(q => nextSel[q.id])
        .map(q => ({ id: q.id, choice: nextSel[q.id] }))
    };
    saveJSON(KEY_SURVEY, payload);
    emitStorage(KEY_SURVEY);

    // If this is the first time the user reached full completion, do the once-only KPI/log
    if (QUESTIONS.every(q => !!nextSel[q.id]) && !localStorage.getItem(FLAG_DONE)) {
      bumpKPI(KPI_SURVEYS, +1);
      try { addPoints?.(2); } catch {}
      try {
        const h = readJSON(KEY_HISTORY, []);
        h.push({ at: Date.now(), delta: +2, note: "Completed Issues Survey" });
        saveJSON(KEY_HISTORY, h);
      } catch {}
      try { localStorage.setItem(FLAG_DONE, "1"); } catch {}
    }
  }, [addPoints]);

  const onPick = (qid, choiceId) => {
    setSel(s => {
      const next = { ...s, [qid]: choiceId };
      autosave(next);                 // 🔁 AUTOSAVE on every selection
      return next;
    });
  };

  const saveSurvey = () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        answers: QUESTIONS
          .filter(q => sel[q.id])
          .map(q => ({ id: q.id, choice: sel[q.id] }))
      };
      saveJSON(KEY_SURVEY, payload);
      emitStorage(KEY_SURVEY);
      // Manual save confirmation
      toast("Survey saved. Your profile will update shortly.", { type: "success" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="crb-main" aria-labelledby="sv-title">
      <header className="db-head">
        <div>
          <h1 id="sv-title" className="db-title">Issues Survey</h1>
          <p className="db-subtitle">Choose your stance on each topic. This powers your Civic Profile and XY map.</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <RewardsChip />
        </div>
      </header>

      <div className="db-grid" style={{ gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {/* Questions */}
        <section className="card card--pad" aria-label="Survey Questions">
          <strong style={{ fontSize:16 }}>Your Stances</strong>
          <div style={{ display:"grid", gap:10, marginTop:8 }}>
            {QUESTIONS.map(q => (
              <QuestionRow key={q.id} q={q} value={sel[q.id] || ""} onChange={onPick} />
            ))}
          </div>

          <div style={{ display:"grid", gap:6, marginTop:12 }}>
            <div style={{ display:"flex", gap:8 }}>
              <button className="sh-btn" onClick={saveSurvey} disabled={saving}>
                {saving ? "Saving…" : (allAnswered ? "Save Survey" : "Save Progress")}
              </button>
              {!allAnswered && (
                <span style={{ marginLeft:"auto", fontSize:12, opacity:.75 }}>
                  Answered {completeCount}/{QUESTIONS.length}
                </span>
              )}
            </div>

            {/* 🔎 Tiny live preview line */}
            <small style={{ fontSize:12, opacity:.8 }}>
              Preview XY shift: <code>X {px}</code>, <code>Y {py}</code> (neutral = 0,0)
            </small>
          </div>
        </section>

        {/* Live preview of saved payload */}
        <aside className="card card--pad" aria-label="Saved Answers Preview">
          <strong style={{ fontSize:16 }}>Saved Payload</strong>
          <p style={{ marginTop:6, opacity:.8, fontSize:13 }}>
            Stored at <code>{KEY_SURVEY}</code> in the exact shape the scoring map expects.
          </p>
          <PayloadPreview sel={sel} />
        </aside>
      </div>
    </section>
  );
}

/* Small pretty JSON viewer of the *to-be-saved* payload */
function PayloadPreview({ sel }) {
  const payload = {
    answers: Object.entries(sel)
      .filter(([, choice]) => !!choice)
      .map(([id, choice]) => ({ id, choice })),
  };
  return (
    <pre
      style={{
        marginTop: 8,
        background:"#0b1020",
        color:"#d1e3ff",
        borderRadius:10,
        padding:"10px 12px",
        overflow:"auto",
        maxHeight: 260
      }}
      aria-label="Saved JSON preview"
    >
{JSON.stringify(payload, null, 2)}
    </pre>
  );
}
