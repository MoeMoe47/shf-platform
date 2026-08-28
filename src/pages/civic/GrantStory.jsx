// src/pages/civic/GrantStory.jsx
// Redesigned per the approved Grant Story mock (light + dark, supplied
// directly during this task). Shell/theme/shared design tokens are
// inherited unchanged from the Civic Lab Dashboard/Elections/Proposals
// redesigns — see src/styles/civic-dashboard.css and
// src/styles/civic-grantstory.css (this page's own additions only).
//
// This page is a pure READER over shf_master_grant_narrative_v1
// (src/utils/binderMerge.js) — it has never written to that key and still
// doesn't; Admin's ToolDashboard.jsx "Sync with Civic & Update Master
// Narrative" remains the only writer. The Master Grant Narrative stays
// exactly as authored there: raw markdown text, never parsed/rendered,
// never editable — matching the pre-redesign implementation's own
// behavior (a <textarea readOnly>), just presented as a real read-only
// document viewer instead of a 320px textarea.
//
// One real improvement made, not a data-shape change: Admin's sync
// already writes `meta.civicMinutesTotal` (civic-only session minutes)
// alongside the blended `totalTimeHours` (every AI-assisted session,
// admin + civic combined) — the pre-redesign page only ever surfaced the
// blended total. This page's "Civic Sessions / Hours" card now uses the
// civic-specific field for its headline number (more accurate for what
// the card claims to show), while the blended total is still shown,
// unchanged, in the supporting sentence beneath it.
import React from "react";
import { Link } from "react-router-dom";
import { loadMasterNarrativeFromStorage } from "@/utils/binderMerge.js";
import { useToasts } from "@/context/Toasts.jsx";
import { useCompanion } from "@/hooks/useCompanion.js";
import CompanionFace from "@/components/companion/CompanionFace.jsx";

const PATHWAY = [
  { icon: "📖", name: "Learn", desc: "Build knowledge", to: "/micro-lessons" },
  { icon: "👥", name: "Participate", desc: "Join missions", to: "/elections" },
  { icon: "📋", name: "Document", desc: "Capture evidence", to: "/journal" },
  { icon: "💼", name: "Portfolio", desc: "Show your work", to: "/portfolio" },
  { icon: "🏛️", name: "Grant Story / Impact", desc: "Drive community change", to: null },
];

const FUNDER_POINTS = [
  {
    title: "Student work is documented through missions",
    desc: "Evidence and reflections are captured as students learn.",
  },
  {
    title: "AI tools enhance, not replace, student agency",
    desc: "We use AI to support research, writing, and analysis — students lead the thinking.",
  },
  {
    title: "Outcomes are connected to community impact",
    desc: "Mission evidence feeds directly into the narrative funders review in reports and grant applications.",
  },
];

function formatDate(iso) {
  if (!iso || iso === "—") return "Not available";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function GrantStory() {
  const { toast } = useToasts();
  const companion = useCompanion();
  const [markdown, setMarkdown] = React.useState("");
  const [meta, setMeta] = React.useState({});
  const [feedback, setFeedback] = React.useState(null); // {text, error}

  React.useEffect(() => {
    const { markdown: md, meta: m } = loadMasterNarrativeFromStorage();
    setMarkdown(md || "");
    setMeta(m || {});
  }, []);

  // --- Data (see Final Report §4 for the full LIVE/DERIVED/FALLBACK table) ---
  const adminCount = meta.adminCount || 0;
  const civicCount = meta.civicCount || 0;
  const totalSessions = adminCount + civicCount;
  const civicShare = totalSessions > 0 ? Math.round((civicCount / totalSessions) * 100) : 0;
  const totalTimeHours = meta.totalTimeHours || 0;
  const civicHours = typeof meta.civicMinutesTotal === "number" ? Math.round((meta.civicMinutesTotal / 60) * 10) / 10 : 0;
  const updatedAt = meta.updatedAt || null;

  function handleCopy() {
    if (!markdown) {
      setFeedback({ text: "There's no narrative to copy yet.", error: true });
      toast("There's no narrative to copy yet.", { type: "error" });
      return;
    }
    if (!navigator?.clipboard) {
      setFeedback({ text: "Clipboard isn't available here — select and copy the text manually.", error: true });
      toast("Clipboard isn't available here. Select and copy the text manually.", { type: "error" });
      return;
    }
    navigator.clipboard.writeText(markdown).then(
      () => {
        setFeedback({ text: "Copied to clipboard", error: false });
        toast("✅ Grant narrative copied to clipboard.", { type: "success" });
      },
      () => {
        setFeedback({ text: "Couldn't copy — select and copy the text manually.", error: true });
        toast("Couldn't copy. You can still select and copy manually.", { type: "error" });
      }
    );
  }

  function handleDownload() {
    if (!markdown) {
      setFeedback({ text: "There's no narrative to download yet.", error: true });
      toast("There's no narrative to download yet.", { type: "error" });
      return;
    }
    try {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shf-grant-narrative.md";
      a.click();
      URL.revokeObjectURL(url);
      setFeedback({ text: "Download started", error: false });
      toast("⬇️ Downloading shf-grant-narrative.md", { type: "success" });
    } catch {
      setFeedback({ text: "Download failed — please try again.", error: true });
      toast("Download failed. Please try again.", { type: "error" });
    }
  }

  return (
    <div className="gs-page">
      <h1 className="cv-srOnly">Grant Story</h1>

      <header className="gs-header" aria-labelledby="gs-title">
        <span className="gs-header__icon" aria-hidden="true">📖</span>
        <div>
          <p className="gs-header__h1" id="gs-title">Grant Story</p>
          <p className="gs-header__sub">
            This is the read-only grant narrative generated from <strong>Admin AI logs</strong> and{" "}
            <strong>Civic missions</strong>. It's the story funders see about how Silicon Heartland uses AI and
            student work to drive impact.
          </p>
        </div>
      </header>

      <div className="gs-actions">
        <button type="button" className="gs-actionBtn" onClick={handleCopy}>
          <span aria-hidden="true">📋</span> Copy for Grant Portal
        </button>
        <button type="button" className="gs-actionBtn gs-actionBtn--secondary" onClick={handleDownload}>
          <span aria-hidden="true">⬇️</span> Download .md
        </button>
        <span role="status" aria-live="polite" className={`gs-actionFeedback${feedback?.error ? " gs-actionFeedback--error" : ""}`}>
          {feedback?.text || ""}
        </span>
      </div>

      <div className="gs-summaryGrid">
        <div className="gs-card gs-summary">
          <span className="gs-summary__icon gs-summary__icon--pink" aria-hidden="true">📅</span>
          <span className="gs-summary__label">Last Updated</span>
          <span className="gs-summary__value">{formatDate(updatedAt)}</span>
          <p className="gs-summary__hint">
            Updated when Admin runs <strong>Sync with Civic &amp; Update Master Narrative</strong>.
          </p>
        </div>

        <div className="gs-card gs-summary">
          <span className="gs-summary__icon gs-summary__icon--gold" aria-hidden="true">👥</span>
          <span className="gs-summary__label">Civic Contribution</span>
          <span className="gs-summary__value">{civicShare}%</span>
          <p className="gs-summary__hint">
            Civic missions account for <strong>{civicShare}% of all AI-assisted sessions</strong> in this grant story.
          </p>
        </div>

        <div className="gs-card gs-summary">
          <span className="gs-summary__icon gs-summary__icon--purple" aria-hidden="true">🕐</span>
          <span className="gs-summary__label">Civic Sessions / Hours</span>
          <span className="gs-summary__value">{civicCount} / {civicHours} hrs</span>
          <p className="gs-summary__hint">
            {civicCount} civic sessions out of {totalSessions} total, about {totalTimeHours} hours overall.
          </p>
        </div>

        <div className="gs-card gs-summary">
          <span className="gs-summary__icon gs-summary__icon--pink" aria-hidden="true">🔒</span>
          <span className="gs-summary__label">Reporting Status</span>
          <span className="gs-summary__status">Read-only</span>
          <p className="gs-summary__hint">This is the master grant narrative used for reporting.</p>
        </div>
      </div>

      <section className="gs-card gs-pathway" aria-labelledby="gs-pathway-title">
        <h2 className="gs-pathway__title" id="gs-pathway-title">How your work becomes impact</h2>
        <div className="gs-pathway__flow">
          {PATHWAY.map((step, i) => (
            <React.Fragment key={step.name}>
              {i > 0 && <span className="gs-pathway__arrow" aria-hidden="true">→</span>}
              {step.to ? (
                <Link className="gs-pathway__step" to={step.to}>
                  <span className="gs-pathway__icon" aria-hidden="true">{step.icon}</span>
                  <span className="gs-pathway__text">
                    <span className="gs-pathway__name">{step.name}</span>
                    <span className="gs-pathway__desc">{step.desc}</span>
                  </span>
                </Link>
              ) : (
                <span className="gs-pathway__step" aria-current="page">
                  <span className="gs-pathway__icon" aria-hidden="true">{step.icon}</span>
                  <span className="gs-pathway__text">
                    <span className="gs-pathway__name">{step.name}</span>
                    <span className="gs-pathway__desc">{step.desc}</span>
                  </span>
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      <div className="gs-layout">
        <section className="gs-card gs-narrative" aria-labelledby="gs-narrative-title">
          <div className="gs-narrative__head">
            <h2 className="gs-narrative__title" id="gs-narrative-title">Master Grant Narrative</h2>
            <span className="gs-narrative__badge"><span aria-hidden="true">🔒</span> Read-only</span>
          </div>
          {markdown ? (
            <pre className="gs-narrative__body" tabIndex={0} aria-label="Master grant narrative, read-only">
              {markdown}
            </pre>
          ) : (
            <div className="gs-narrative__empty">
              Grant narrative is not available yet. Ask Admin to open <strong>AI Tool Workflow</strong> and click{" "}
              <strong>Sync with Civic &amp; Update Master Narrative</strong> after logging some sessions.
            </div>
          )}
        </section>

        <div className="gs-colRight">
          <section className="gs-card gs-funders" aria-labelledby="gs-funders-title">
            <h2 className="gs-funders__title" id="gs-funders-title">What funders see</h2>
            <p className="gs-funders__intro">
              This narrative shows how student missions and AI-assisted work contribute to real community impact.
              It's automatically synchronized from Admin AI logs and Civic missions.
            </p>
            <ul className="gs-funders__list">
              {FUNDER_POINTS.map((p) => (
                <li key={p.title} className="gs-funders__item">
                  <span className="gs-funders__check" aria-hidden="true">✓</span>
                  <div>
                    <p className="gs-funders__itemTitle">{p.title}</p>
                    <p className="gs-funders__itemDesc">{p.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="gs-card gs-coach" aria-labelledby="gs-coach-title">
            <div>
              <h2 className="gs-coach__title" id="gs-coach-title">Need help understanding grant language?</h2>
              <p className="gs-coach__body">
                Ask Coach about grant terminology, how missions connect to impact reporting, or how AI is used
                responsibly here.
              </p>
              <button type="button" className="gs-actionBtn" onClick={() => companion.openCoach()} style={{ marginLeft: 0 }}>
                Ask Coach!
              </button>
            </div>
            <div className="gs-coach__art" aria-hidden="true">
              <CompanionFace animation="wave" size={100} />
            </div>
          </section>
        </div>
      </div>

      <p className="gs-header__sub" style={{ marginTop: -4 }}>
        Students can see how their missions feed the <strong>real grant language</strong> used for Title IV, ESSA,
        and other programs. This turns their work into visible impact, not just class credit.
      </p>
    </div>
  );
}
