// src/pages/resume-builder/CareerIntelligence.jsx
// Career Intelligence (Job Match / ATS analysis). The job-description
// textarea keeps its own local draft state and syncs into the shared
// resume document on a bounded debounce — typing never drives a
// synchronous full-document update loop, which is what produced the
// "Maximum update depth exceeded" crash in the previous implementation.
import React, { useEffect, useRef, useState } from "react";
import { fkGrade, readabilityLabel, computeStrength } from "./store.js";

const STRONG_VERBS = [
  "led", "built", "launched", "optimized", "automated", "reduced", "increased", "implemented", "delivered",
  "designed", "created", "managed", "developed", "improved", "drove", "grew", "achieved", "coordinated",
  "streamlined", "spearheaded", "negotiated", "analyzed", "mentored", "produced", "resolved",
];

function bulletRecommendations(doc) {
  const recs = [];
  (doc.sections || []).forEach((s) => {
    if (!["experience", "projects", "custom"].includes(s.type)) return;
    (s.items || []).forEach((it) => {
      (it.bullets || []).forEach((b, bi) => {
        const firstWord = (b.trim().split(/\s+/)[0] || "").toLowerCase().replace(/[^a-z]/g, "");
        const hasVerb = STRONG_VERBS.includes(firstWord);
        const hasMetric = /\d/.test(b);
        if (!hasVerb || !hasMetric) {
          recs.push({
            key: `${s.title || s.type}-${it.role || it.name || it.title || "item"}-${bi}`,
            section: s.title || s.type,
            text: b,
            missingVerb: !hasVerb,
            missingMetric: !hasMetric,
          });
        }
      });
    });
  });
  return recs.slice(0, 8);
}

function improvementChecklist(doc) {
  return [
    { key: "summary", label: "Add a professional summary", done: (doc.summary || "").trim().length >= 40 },
    { key: "skills", label: "Add at least 3 skills", done: (doc.skills || []).length >= 3 },
    {
      key: "metric",
      label: "Quantify at least one bullet with a number",
      done: (doc.sections || []).some((s) => (s.items || []).some((it) => (it.bullets || []).some((b) => /\d/.test(b)))),
    },
    {
      key: "education",
      label: "Add an education entry",
      done: (doc.sections || []).some((s) => s.type === "education" && (s.items || []).length > 0),
    },
    { key: "contact", label: "Complete your email and phone", done: !!(doc.contact?.email && doc.contact?.phone) },
  ];
}

export default function CareerIntelligence({ data, onChangeJobDesc, match, addSkill }) {
  const [draft, setDraft] = useState(data.jobDesc || "");
  const syncTimer = useRef(null);

  // Keep the draft in sync if the resume is reloaded/reset/imported out
  // from under this component (not on every keystroke — see below).
  useEffect(() => {
    setDraft(data.jobDesc || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setDraft(value);
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => onChangeJobDesc(value), 300);
  };

  useEffect(() => () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
  }, []);

  const grade = fkGrade(data.summary || "");
  const strength = computeStrength(data);
  const recs = bulletRecommendations(data);
  const checklist = improvementChecklist(data);
  const missingTop = match.missing.slice(0, 24);

  return (
    <div className="rb2-ci">
      <div className="rb2-ciHead">
        <h2 className="rb2-h2">Career Intelligence</h2>
        <span className="rb2-ciScore" title="Keyword coverage against the pasted job description">{match.coveragePct}% match</span>
      </div>

      <div className="rb2-stack">
        <label className="rb2-label" htmlFor="ci-jobdesc">Paste job description</label>
        <textarea
          id="ci-jobdesc"
          className="rb2-textarea"
          rows={8}
          value={draft}
          onChange={handleChange}
          placeholder="Paste the job description here to analyze keywords…"
        />
      </div>

      <div className="rb2-ciMetrics">
        <div className="rb2-ciMetric"><b>{match.used.length}</b><span>Matched</span></div>
        <div className="rb2-ciMetric"><b>{match.missing.length}</b><span>Missing</span></div>
        <div className="rb2-ciMetric"><b>{match.hardUsed.length}</b><span>Hard skills</span></div>
        <div className="rb2-ciMetric"><b>{match.softUsed.length}</b><span>Soft signals</span></div>
      </div>

      {!!missingTop.length && (
        <div className="rb2-stack">
          <div className="rb2-ciSub">Missing keywords</div>
          <div className="rb2-kwChips">
            {missingTop.map((kw, i) => (
              <button key={i} type="button" className="rb2-kwChip rb2-kwChip--ghost" onClick={() => addSkill(kw)}>
                + {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {!!match.used.length && (
        <div className="rb2-stack">
          <div className="rb2-ciSub">Matched keywords</div>
          <div className="rb2-kwList">
            {match.used.slice(0, 60).map((kw, i) => <span key={i} className="rb2-kwChip rb2-kwChip--flat">{kw}</span>)}
          </div>
        </div>
      )}

      <div className="rb2-ciSection">
        <div className="rb2-ciSub">Readability</div>
        <p className="rb2-hint">Summary grade level: <b>{grade}</b> — {readabilityLabel(grade)}. Resume strength: <b>{strength}%</b>.</p>
      </div>

      {!!recs.length && (
        <div className="rb2-ciSection">
          <div className="rb2-ciSub">Bullet recommendations</div>
          <ul className="rb2-recList">
            {recs.map((r) => (
              <li key={r.key} className="rb2-recItem">
                <span className="rb2-recText">“{r.text}”</span>
                <span className="rb2-recWhy">
                  {r.missingVerb && "Start with a strong action verb. "}
                  {r.missingMetric && "Add a number or metric to quantify impact."}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rb2-ciSection">
        <div className="rb2-ciSub">Improvement checklist</div>
        <ul className="rb2-checklist">
          {checklist.map((c) => (
            <li key={c.key} className={c.done ? "is-done" : ""}>
              <span aria-hidden="true">{c.done ? "✓" : "○"}</span> {c.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
