// src/pages /sales/Surveys.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";
import { StorageSoftReset, useStorageGuard, bumpKPI } from "@/shared/storage/guard.jsx";
import { logWallet } from "@/shared/rewards/history.js";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";

/* ---------------- Storage Keys + KPI ---------------- */
const KEY_SURVEYS = "civic:surveys";            // JSON[ {id,title,questions:[{id, label, ...}], ...} ]
const KEY_ANSWERS = "civic:survey:answers";     // JSON{ [surveyId]: { qid: answer, ... } }
const KPI_SURVEYS = "civic:kpi:surveysCompleted";

/* ---------------- Small helpers ---------------- */
function read(k, d) {
  try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; }
}
function write(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    window.dispatchEvent(new StorageEvent("storage", { key: k, newValue: "updated" }));
  } catch {}
}

export default function Surveys() {
  const { toast } = useToasts();

  // Guard malformed keys this page relies on (with toast feedback)
  useStorageGuard([KEY_SURVEYS, KEY_ANSWERS], { toast });

  // Catalog + state
  const [catalog, setCatalog] = React.useState(() => read(KEY_SURVEYS, []));
  const [answers, setAnswers] = React.useState(() => read(KEY_ANSWERS, {}));
  const [activeId, setActiveId] = React.useState(() => (catalog[0]?.id ?? null));
  const [saving, setSaving] = React.useState(false);

  // UNDO buffer (clear answers)
  const undoRef = React.useRef(null); // { type:"clearAnswers", payload:{id,prev}, timerId:number }

  // Cross-tab sync for catalog/answers
  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key == null) {
        setCatalog(read(KEY_SURVEYS, []));
        setAnswers(read(KEY_ANSWERS, {}));
        return;
      }
      if (e.key === KEY_SURVEYS) setCatalog(read(KEY_SURVEYS, []));
      if (e.key === KEY_ANSWERS) setAnswers(read(KEY_ANSWERS, {}));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const onAnswer = (qid, value) => {
    if (!activeId) return;
    const curr = answers[activeId] || {};
    const next = { ...answers, [activeId]: { ...curr, [qid]: value } };
    setAnswers(next);
    write(KEY_ANSWERS, next);
  };

  const onSubmit = () => {
    if (!activeId) return;
    setSaving(true);
    try {
      // TODO: validation / submit pipeline as needed
      bumpKPI(KPI_SURVEYS, +1);
      logWallet({ note: `Survey submitted (${activeId})`, delta: +5 });

      // clear draft answers for this survey
      const next = { ...answers, [activeId]: {} };
      setAnswers(next);
      write(KEY_ANSWERS, next);

      toast?.("✅ Survey submitted! +5 pts", { type: "success" });
    } finally {
      setSaving(false);
    }
  };

  const onClearAnswers = () => {
    if (!activeId) return;
    const prev = answers[activeId] || {};
    const next = { ...answers, [activeId]: {} };
    setAnswers(next);
    write(KEY_ANSWERS, next);

    // UNDO (7s)
    if (undoRef.current?.timerId) clearTimeout(undoRef.current.timerId);
    const timerId = setTimeout(() => { undoRef.current = null; }, 7000);
    undoRef.current = { type: "clearAnswers", payload: { id: activeId, prev }, timerId };

    toast?.("Answers cleared.", {
      type: "info",
      duration: 7000,
      action: {
        label: "Undo",
        onClick: () => {
          const u = undoRef.current;
          if (u?.type === "clearAnswers" && u.payload?.id === activeId) {
            const restored = { ...answers, [activeId]: u.payload.prev };
            setAnswers(restored);
            write(KEY_ANSWERS, restored);
            logWallet({ note: "Survey clear undo", delta: 0 });
            clearTimeout(u.timerId);
            undoRef.current = null;
          }
        },
      },
    });
  };

  const activeSurvey = catalog.find(s => s.id === activeId) || null;
  const activeAns = (activeId && answers[activeId]) || {};

  return (
    <section className="crb-main" aria-labelledby="sv-title">
      <header className="db-head">
        <div>
          <h1 id="sv-title" className="db-title">Surveys</h1>
          <p className="db-subtitle">Answer short surveys to earn small rewards and insights.</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <StorageSoftReset
            keys={[KEY_SURVEYS, KEY_ANSWERS]}
            label="Fix storage"
            onDone={() => toast?.("Storage reset for Surveys.", { type:"info" })}
          />
          <RewardsChip />
        </div>
      </header>

      {/* Survey selector */}
      <div className="card card--pad" style={{ display:"flex", gap:8, alignItems:"center" }}>
        <label style={{ display:"grid", gap:6 }}>
          <span style={{ fontSize:12, opacity:.8 }}>Choose survey</span>
          <select
            className="sh-input"
            value={activeId || ""}
            onChange={(e) => setActiveId(e.target.value || null)}
          >
            <option value="">— Select —</option>
            {catalog.map(s => <option key={s.id} value={s.id}>{s.title || s.id}</option>)}
          </select>
        </label>
        {activeId && (
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <button className="sh-btn is-ghost" onClick={onClearAnswers}>Clear Answers</button>
            <button className="sh-btn" onClick={onSubmit} disabled={saving}>{saving ? "Submitting…" : "Submit"}</button>
          </div>
        )}
      </div>

      {/* Questions */}
      {activeSurvey ? (
        <section className="card card--pad" aria-label="Survey Questions" style={{ marginTop:12 }}>
          <strong style={{ fontSize:16 }}>{activeSurvey.title || "Survey"}</strong>
          <div style={{ display:"grid", gap:10, marginTop:8 }}>
            {(activeSurvey.questions || []).map(q => (
              <label key={q.id} style={{ display:"grid", gap:6 }}>
                <span style={{ fontSize:13, opacity:.8 }}>{q.label || q.id}</span>
                <input
                  className="sh-input"
                  value={activeAns[q.id] ?? ""}
                  onChange={(e) => onAnswer(q.id, e.target.value)}
                  placeholder="Type answer…"
                />
              </label>
            ))}
          </div>
        </section>
      ) : (
        <section className="card card--pad" style={{ marginTop:12 }}>
          <div style={{
            border:"1px dashed var(--ring,#e5e7eb)",
            borderRadius:10,
            padding:"12px 10px",
            background:"#fafafa"
          }}>
            No survey selected. Choose one above.
          </div>
        </section>
      )}
    </section>
  );
}
