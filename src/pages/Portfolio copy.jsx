import React, { useEffect, useRef, useState } from "react";
import { track } from "@/utils/analytics.js";

/* Washed KPI Attendance (kept) */
import AttendanceCard from "@/components/AttendanceCard.jsx";

/* Optional future KPIs */
import KpiCard from "@/components/ui/KpiCard.jsx";
import { getPercentWash } from "@/utils/getWashClass.js";

/* ---------- tiny helpers ---------- */
function avg(list) {
  if (!Array.isArray(list) || list.length === 0) return NaN;
  const total = list.reduce((sum, n) => sum + Number(n || 0), 0);
  return total / list.length;
}

// Safe shim to award credit/rewards from UI actions
function earn(detail) {
  try {
    if (window.shfCredit?.earn) return window.shfCredit.earn(detail);
    window.dispatchEvent(new CustomEvent("shf-credit-earn", { detail }));
  } catch {}
}

/* ---------- Inline avatar uploader (localStorage) ---------- */
function AvatarUploader({ storageKey = "sh_profile_photo", circle = true }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const x = localStorage.getItem(storageKey);
      if (x) setDataUrl(x);
    } catch {}
  }, [storageKey]);

  const pick = () => inputRef.current?.click();
  function onDrop(e) { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }
  function onDragOver(e) { e.preventDefault(); setDragOver(true); }
  function onDragLeave() { setDragOver(false); }
  function onInput(e) { handleFiles(e.target.files); e.target.value = ""; }
  function clear() {
    setDataUrl(null);
    try { localStorage.removeItem(storageKey); } catch {}
  }

  async function handleFiles(list) {
    setError("");
    const f = list?.[0]; if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(f.type)) { setError("PNG/JPG/WEBP only."); return; }
    if (f.size > 3 * 1024 * 1024) { setError("Keep it under ~3 MB."); return; }
    try {
      const out = await resizeToDataURL(f, 512);
      setDataUrl(out);
      try { localStorage.setItem(storageKey, out); } catch {}
      earn({ action: "profile.photo.upload", rewards: { heart: 1 }, scoreDelta: 3 });
    } catch (err) { console.error(err); setError("Couldn’t process that image."); }
  }

  return (
    <div className="sh-card">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody" style={{ display: "grid", gap: 12 }}>
        <h3 className="sh-cardTitle" style={{ margin: 0 }}>Profile Photo</h3>
        <div className="sh-cardContent">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload profile photo"
            onClick={pick}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pick()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            style={{
              display: "grid",
              gridTemplateColumns: "96px 1fr",
              gap: 16,
              alignItems: "center",
              border: "1px dashed var(--line,#e5e7eb)",
              borderRadius: 12,
              padding: 12,
              cursor: "pointer",
              userSelect: "none",
              background: dragOver ? "rgba(37,99,235,.06)" : "transparent",
            }}
          >
            <div style={{ width: 96, height: 96 }}>
              {dataUrl ? (
                <img
                  src={dataUrl}
                  alt="Profile preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: circle ? 999 : 10 }}
                />
              ) : (
                <div
                  aria-hidden
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(180deg,#f3f4f6,#e5e7eb)",
                    border: "1px solid var(--line,#e5e7eb)",
                    borderRadius: circle ? 999 : 10,
                  }}
                >
                  <span style={{ fontSize: 40, opacity: .7 }}>👤</span>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div className="sh-muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
                Drag & drop, or <span className="sh-link" style={{ textDecoration: "underline" }}>browse</span>.
                <br />
                <small>PNG/JPG/WEBP • up to ~3 MB</small>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="sh-btn" onClick={pick} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line,#e5e7eb)", background: "#fff" }}>
                  Upload
                </button>
                {dataUrl && (
                  <button
                    type="button"
                    className="sh-btn sh-btn--soft"
                    onClick={clear}
                    style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line,#e5e7eb)", background: "rgba(0,0,0,.03)" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <input ref={inputRef} type="file" accept="image/*" capture="user" onChange={onInput} hidden />
          </div>
          {error && <div className="sh-error" style={{ color: "#b91c1c", marginTop: 8, fontSize: 13 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}

async function resizeToDataURL(file, maxDim = 512) {
  const dataUrl = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  try { return c.toDataURL("image/webp", .9); } catch { return c.toDataURL("image/jpeg", .9); }
}

/* ---------- Simple cards ---------- */
function BadgesCard() {
  const badges = ["📚 Starter", "🚀 Streak 7", "🌽 SH Core"];
  return (
    <div className="sh-card" role="region" aria-label="Badges">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <h4 className="sh-cardTitle" style={{ margin: 0 }}>Badges</h4>
        <div className="sh-cardContent">
          <ul style={{ margin: 0, paddingLeft: 16 }}>{badges.map((b, i) => <li key={i}>{b}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function HighScoresCard() {
  const scores = [{ game: "CDL Driver", score: 1280 }, { game: "Fade Under Pressure", score: 940 }];
  return (
    <div className="sh-card" role="region" aria-label="High Scores">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <h4 className="sh-cardTitle" style={{ margin: 0 }}>High Scores</h4>
        <div className="sh-cardContent">
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {scores.map((s, i) => <li key={i}><strong>{s.score}</strong> — {s.game}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------- Mock Interview (localStorage) ---------- */
function MockInterviewCard({
  storageKey = "sh_portfolio_mock_interview",
  zoomHref = "https://zoom.us/j/123456789"
}) {
  const DEFAULT_QUESTIONS = [
    { id: "q1", text: "Tell me about yourself." },
    { id: "q2", text: "Why are you interested in this role/pathway?" },
    { id: "q3", text: "Describe a challenge you faced and how you handled it." },
    { id: "q4", text: "Walk me through a project you’re proud of." },
    { id: "q5", text: "What’s a time you learned quickly on the job or in class?" },
  ];

  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
  });
  const [i, setI] = useState(state.i ?? 0);
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(state.secs ?? 60);
  const [answers, setAnswers] = useState(state.answers ?? {});

  const q = DEFAULT_QUESTIONS[i] ?? null;
  const total = DEFAULT_QUESTIONS.length;

  useEffect(() => {
    const payload = { i, secs, answers };
    try { localStorage.setItem(storageKey, JSON.stringify(payload)); } catch {}
  }, [i, secs, answers, storageKey]);

  useEffect(() => {
    if (!running) return;
    if (secs <= 0) { setRunning(false); track("mock_interview_timeout", { qid: q?.id }); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, secs, q?.id]);

  function start() { track("mock_interview_start"); setRunning(true); setSecs(60); }
  function stop() { setRunning(false); track("mock_interview_pause", { qid: q?.id, secsRemaining: secs }); }
  function next() { const ni = Math.min(i + 1, total - 1); setI(ni); setSecs(60); setRunning(false); track("mock_interview_next", { to: ni }); }
  function prev() { const pi = Math.max(i - 1, 0); setI(pi); setSecs(60); setRunning(false); track("mock_interview_prev", { to: pi }); }
  function setRating(qid, val) { setAnswers((a) => ({ ...a, [qid]: { ...(a[qid] || {}), rating: val } })); }
  function setNotes(qid, val) { setAnswers((a) => ({ ...a, [qid]: { ...(a[qid] || {}), notes: val } })); }
  function resetAll() {
    if (!confirm("Reset your mock interview notes & ratings?")) return;
    setI(0); setSecs(60); setRunning(false); setAnswers({});
    try { localStorage.removeItem(storageKey); } catch {}
    track("mock_interview_reset");
  }
  function exportJSON() {
    const ratings = Object.values(answers).map((r) => Number(r?.rating ?? 0)).filter(Boolean);
    const payload = { exportedAt: new Date().toISOString(), answers, scoreAvg: avg(ratings) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mock_interview_notes.json"; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    track("mock_interview_export");
    earn({ action: "mock_interview.export", rewards: { wheat: 2 }, scoreDelta: 4 });
  }

  const scoreAvg = avg(Object.values(answers).map((r) => Number(r?.rating ?? 0)).filter(Boolean));

  return (
    <div className="sh-card" role="region" aria-label="Mock Interview">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <h3 className="sh-cardTitle" style={{ margin: 0 }}>Mock Interview</h3>
          <div className="sh-muted" style={{ fontSize: 12 }}>
            {i + 1}/{total} · Avg score: <strong>{isFinite(scoreAvg) ? scoreAvg.toFixed(1) : "-"}/5</strong>
          </div>
        </div>

        <div className="sh-cardContent" style={{ display: "grid", gap: 10 }}>
          <div className="sh-callout" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span aria-hidden>🎥</span>
            <div style={{ flex: 1 }}>
              Practice live with a coach on Zoom: Mon–Fri 2–4pm ET.
            </div>
            <a
              className="sh-btn sh-btn--primary"
              href={zoomHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("zoom_join_clicked", { surface: "portfolio_mock_interview" })}
            >
              Join Zoom
            </a>
          </div>

          {q ? (
            <div
              style={{
                border: "1px solid var(--line,#e5e7eb)",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 8,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>{q.text}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="sh-chip info" aria-live="polite" aria-label="seconds remaining">
                    {secs}s
                  </span>
                  {!running ? (
                    <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={start}>Start 60s</button>
                  ) : (
                    <button className="sh-btn sh-btn--secondary sh-btn--tiny" onClick={stop}>Pause</button>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label style={{ fontSize: 13, color: "#6b7280" }}>Rate yourself:</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(q.id, n)}
                      className={`sh-btn sh-btn--tiny ${answers[q.id]?.rating === n ? "sh-btn--primary" : "sh-btn--secondary"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="sh-muted" style={{ fontSize: 12 }}>
                  1 = needs work · 5 = job-ready
                </span>
              </div>

              <div>
                <label htmlFor={`notes-${q.id}`} className="sh-muted" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
                  Notes / bullets to improve
                </label>
                <textarea
                  id={`notes-${q.id}`}
                  rows={3}
                  value={answers[q.id]?.notes || ""}
                  onChange={(e) => setNotes(q.id, e.target.value)}
                  style={{
                    width: "100%", border: "1px solid var(--line,#e5e7eb)", borderRadius: 10, padding: 8, resize: "vertical",
                  }}
                  placeholder="Example: STAR structure, mention metrics, pause to breathe…"
                />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="sh-btn sh-btn--secondary" onClick={prev} disabled={i === 0}>← Prev</button>
                  <button className="sh-btn sh-btn--secondary" onClick={next} disabled={i === total - 1}>Next →</button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="sh-btn sh-btn--secondary" onClick={exportJSON}>Export Notes</button>
                  <button className="sh-btn sh-btn--soft" onClick={resetAll}>Reset</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="sh-muted">No questions available.</div>
          )}

          <div className="sh-muted" style={{ fontSize: 12 }}>
            Tip: Answer with <strong>STAR</strong> — Situation · Task · Action · Result. Aim for 45–60s.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Portfolio() {
  return (
    <div className="page pad" style={{ display: "grid", gap: 16 }}>
      <div className="sh-card">
        <div className="sh-cardStripe" />
        <div className="sh-cardBody">
          <h2 className="sh-cardTitle" style={{ margin: 0 }}>Student Portfolio</h2>
          <div className="sh-cardContent">
            Add a profile picture and review your progress, badges, high scores — then practice interviews.
          </div>
        </div>
      </div>

      <AvatarUploader />
      <MockInterviewCard />

      <section className="sh-card" aria-labelledby="progress-rewards">
        <div className="sh-cardStripe" />
        <div className="sh-cardBody" style={{ display: "grid", gap: 12 }}>
          <h3 id="progress-rewards" className="sh-cardTitle" style={{ margin: 0 }}>Progress &amp; Rewards</h3>
          <div className="sh-cardContent">
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                alignItems: "stretch",
              }}
            >
              <AttendanceCard />
              <BadgesCard />
              <HighScoresCard />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
