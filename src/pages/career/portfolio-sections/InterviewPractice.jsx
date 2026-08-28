// src/pages/career/portfolio-sections/InterviewPractice.jsx
//
// Adapted from the pre-existing MockInterviewCard (formerly inline in
// Portfolio.jsx): same localStorage persistence key, same question set,
// same timer/rating/notes/export/reset logic and analytics track()
// calls — restyled to the approved mock and extended with a real
// duration selector (the mock shows one; the prior version only had a
// fixed 60s timer).
import React from "react";
import { track } from "@/utils/analytics.js";
import { ChevronDownIcon } from "@/components/curriculum/icons.jsx";

const STORAGE_KEY = "sh_portfolio_mock_interview";
const ZOOM_HREF = "https://zoom.us/j/123456789"; // pre-existing approved live-coaching destination

const DEFAULT_QUESTIONS = [
  { id: "q1", text: "Tell me about yourself." },
  { id: "q2", text: "Why are you interested in this role/pathway?" },
  { id: "q3", text: "Describe a challenge you faced and how you handled it." },
  { id: "q4", text: "Walk me through a project you're proud of." },
  { id: "q5", text: "What's a time you learned quickly on the job or in class?" },
];

const DURATIONS = [30, 60, 90];

function avg(list) {
  if (!Array.isArray(list) || list.length === 0) return NaN;
  const total = list.reduce((sum, n) => sum + Number(n || 0), 0);
  return total / list.length;
}

function earn(detail) {
  try {
    if (window.shfCredit?.earn) return window.shfCredit.earn(detail);
    window.dispatchEvent(new CustomEvent("shf-credit-earn", { detail }));
  } catch {}
}

export default function InterviewPractice() {
  const [state] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  });

  const [i, setI] = React.useState(state.i ?? 0);
  const [duration, setDuration] = React.useState(state.duration ?? 60);
  const [running, setRunning] = React.useState(false);
  const [secs, setSecs] = React.useState(state.secs ?? state.duration ?? 60);
  const [answers, setAnswers] = React.useState(state.answers ?? {});

  const q = DEFAULT_QUESTIONS[i] ?? null;
  const total = DEFAULT_QUESTIONS.length;

  React.useEffect(() => {
    const payload = { i, secs, answers, duration };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [i, secs, answers, duration]);

  React.useEffect(() => {
    if (!running) return;
    if (secs <= 0) {
      setRunning(false);
      track("mock_interview_timeout", { qid: q?.id });
      return;
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, secs, q?.id]);

  function start() {
    track("mock_interview_start", { duration });
    setRunning(true);
    setSecs(duration);
  }
  function pause() {
    setRunning(false);
    track("mock_interview_pause", { qid: q?.id, secsRemaining: secs });
  }
  function next() {
    const ni = Math.min(i + 1, total - 1);
    setI(ni);
    setSecs(duration);
    setRunning(false);
    track("mock_interview_next", { to: ni });
  }
  function prev() {
    const pi = Math.max(i - 1, 0);
    setI(pi);
    setSecs(duration);
    setRunning(false);
    track("mock_interview_prev", { to: pi });
  }
  function changeDuration(next) {
    setDuration(next);
    if (!running) setSecs(next);
  }
  function setRating(qid, val) {
    setAnswers((a) => ({ ...a, [qid]: { ...(a[qid] || {}), rating: val } }));
  }
  function setNotes(qid, val) {
    setAnswers((a) => ({ ...a, [qid]: { ...(a[qid] || {}), notes: val } }));
  }
  function resetAll() {
    if (!confirm("Reset your interview practice notes & ratings?")) return;
    setI(0);
    setSecs(duration);
    setRunning(false);
    setAnswers({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    track("mock_interview_reset");
  }
  function exportJSON() {
    const ratings = Object.values(answers).map((r) => Number(r?.rating ?? 0)).filter(Boolean);
    const payload = { exportedAt: new Date().toISOString(), answers, scoreAvg: avg(ratings) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview_practice_notes.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    track("mock_interview_export");
    earn({ action: "mock_interview.export", rewards: { wheat: 2 }, scoreDelta: 4 });
  }

  const scoreAvg = avg(Object.values(answers).map((r) => Number(r?.rating ?? 0)).filter(Boolean));

  return (
    <section className="sp-card" aria-labelledby="sp-interview-h">
      <div className="sp-cardHeadRow">
        <h2 id="sp-interview-h" className="sp-cardTitle">
          Interview Practice
        </h2>
        <div className="sp-interviewMeta">
          <span>
            {i + 1} of {total}
          </span>
          <span>
            Average score <strong>{Number.isFinite(scoreAvg) ? scoreAvg.toFixed(1) : "—"}/5</strong>
          </span>
        </div>
      </div>

      {q ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <p className="sp-interviewQuestion">{q.text}</p>
            <div className="sp-durationWrap">
              <label htmlFor="sp-duration" className="sp-srOnly">
                Practice duration
              </label>
              <select
                id="sp-duration"
                className="sp-durationSelect"
                value={duration}
                onChange={(e) => changeDuration(Number(e.target.value))}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}s
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={14} className="sp-durationChevron" />
            </div>
          </div>

          <div className="sp-ratingRow">
            <span className="sp-ratingLabel">Rate yourself:</span>
            <div className="sp-ratingBtns" role="group" aria-label="Rate your answer from 1 to 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="sp-ratingBtn"
                  aria-pressed={answers[q.id]?.rating === n}
                  aria-label={`Rate ${n} out of 5`}
                  onClick={() => setRating(q.id, n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="sp-ratingHint">1 = needs work • 5 = job-ready</span>
          </div>

          <label htmlFor={`sp-notes-${q.id}`} className="sp-notesLabel">
            Notes
          </label>
          <textarea
            id={`sp-notes-${q.id}`}
            className="sp-notesInput"
            value={answers[q.id]?.notes || ""}
            onChange={(e) => setNotes(q.id, e.target.value)}
            placeholder="Add STAR notes and improvement points..."
          />

          <div className="sp-interviewActions">
            <button type="button" className="sp-btn sp-btnPrimary" onClick={running ? pause : start}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {running ? <rect x="6" y="5" width="4" height="14" /> : <path d="M8 5v14l11-7Z" />}
                {running && <rect x="14" y="5" width="4" height="14" />}
              </svg>
              {running ? `Pause (${secs}s)` : "Start practice"}
            </button>
            <a
              className="sp-viewLink"
              href={ZOOM_HREF}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("zoom_join_clicked", { surface: "portfolio_interview_practice" })}
            >
              Join live coaching
            </a>
          </div>

          <div className="sp-interviewSecondaryActions">
            <button type="button" className="sp-btn sp-btnSecondary" onClick={prev} disabled={i === 0}>
              ← Prev
            </button>
            <button type="button" className="sp-btn sp-btnSecondary" onClick={next} disabled={i === total - 1}>
              Next →
            </button>
            <button type="button" className="sp-btn sp-btnSecondary" onClick={exportJSON}>
              Export notes
            </button>
            <button type="button" className="sp-btn sp-btnSecondary" onClick={resetAll}>
              Reset
            </button>
          </div>
        </>
      ) : (
        <p className="sp-notesLabel">No interview questions available right now.</p>
      )}
    </section>
  );
}
