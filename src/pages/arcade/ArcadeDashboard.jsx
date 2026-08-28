// src/pages/arcade/ArcadeDashboard.jsx
// ------------------------------------------------------------
// SHF Learning Arcade — Home
//
// Visual-fidelity repair pass: rebuilt to match the approved Learning
// Arcade Home mock's authoritative desktop geometry (real Eco City hero
// photo with an angled CSS clip-path boundary, text-left/image-right,
// a main-column + right-rail desktop composition instead of a symmetric
// alternating grid, real extracted images on Continue Building/Continue
// Learning/Student-Made cards, and exact mock copy). "Creator Pathway"
// is no longer rendered as a Home section — it does not appear anywhere
// in the approved mock's visible Home content, confirmed by direct
// comparison.
//
// Data sourcing discipline is unchanged from the certified package:
//   - Arcade Activity (via ArcadeActivitySummary) reads useArcadeHistory()
//     for XP/Badges/Games Played — REAL data, empty-ledger-honest.
//   - Everything else describing a future capability renders clearly
//     labeled "Demo preview" data from arcadeHomeFixtures.js.
//   - "Open Creator Studio" and "Build Agent Game" open honest dialogs;
//     Registry status never reads as anything but "Not Submitted".
// ------------------------------------------------------------

import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useArcadeLedger } from "@/shared/arcade/useArcadeLedger.js";
import ArcadeInfoDialog from "@/components/arcade/ArcadeInfoDialog.jsx";
import ArcadeActivitySummary from "@/components/arcade/ArcadeActivitySummary.jsx";
import {
  DEMO_LABEL,
  CONTINUE_BUILDING_DEMO,
  CONTINUE_LEARNING_DEMO,
  AGENT_GAME_LAB_DEMO,
  STUDENT_MADE_DEMO,
  ACHIEVEMENT_SNAPSHOT_DEMO,
} from "@/data/arcadeHomeFixtures.js";

const isDev =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
  process.env.NODE_ENV !== "production";

function DemoTag() {
  return <span className="ar-demoTag">{DEMO_LABEL}</span>;
}

function InfoTriggerButton({ label, className = "ar-btn ar-btn--ghost", onOpen, triggerRef }) {
  return (
    <button type="button" ref={triggerRef} className={className} onClick={onOpen}>
      {label}
    </button>
  );
}

// --------------------------- A. Hero ---------------------------------
function HeroSection() {
  const navigate = useNavigate();
  const [studioOpen, setStudioOpen] = useState(false);
  const studioBtnRef = useRef(null);

  return (
    <section className="ar-hero" aria-labelledby="ar-hero-title">
      <div className="ar-hero__body">
        <h1 id="ar-hero-title" className="ar-hero__title">
          PLAY WHAT&rsquo;S POSSIBLE.<br />BUILD WHAT COMES NEXT.
        </h1>
        <p className="ar-hero__sub">
          The SHF Learning Arcade: play real skill-building games today, and
          build your own AI agent games as new capabilities come online.
        </p>
        <div className="ar-hero__actions">
          <button type="button" className="ar-btn ar-btn--primary" onClick={() => navigate("/games")}>
            Explore Games
          </button>
          <InfoTriggerButton label="Open Creator Studio" onOpen={() => setStudioOpen(true)} triggerRef={studioBtnRef} />
        </div>
      </div>

      {/* Real, project-owned photo asset extracted from the approved mock
          (public/assets/arcade/eco-city-hero.jpg — see final report for
          full extraction provenance). The angled boundary between copy
          and image is real CSS (clip-path), not baked into the asset, so
          it stays responsive at every viewport. */}
      <div className="ar-hero__art">
        <img
          className="ar-hero__img"
          src="/assets/arcade/eco-city-hero.jpg"
          alt="A student looks out over a futuristic, sustainable Eco City with green rooftops, wind turbines, and an aerial vehicle overhead."
        />
      </div>

      <ArcadeInfoDialog
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        returnFocusRef={studioBtnRef}
        titleId="ar-studio-dialog-title"
        title="Creator Studio"
      >
        <p>
          Creator Studio is part of a future phase of the Learning Arcade
          and isn&rsquo;t built yet. When it launches, it will let you start
          and manage your own game or AI agent projects here. Nothing is
          created by this dialog.
        </p>
      </ArcadeInfoDialog>
    </section>
  );
}

// --------------------------- B. Continue Building ----------------------
function ContinueBuildingSection() {
  const d = CONTINUE_BUILDING_DEMO;
  return (
    <section className="ar-card ar-section ar-buildSection ar-homeItem ar-homeItem--build" aria-labelledby="ar-continue-building-title">
      <div className="ar-section__head">
        <h2 id="ar-continue-building-title" className="ar-section__title">Continue Building</h2>
        <DemoTag />
      </div>
      <div className="ar-buildCard">
        <img className="ar-buildCard__img" src={d.projectImage} alt="" aria-hidden="true" />
        <div className="ar-buildCard__main">
          <h3 className="ar-buildCard__title">{d.projectTitle}</h3>
          <p className="ar-buildCard__desc">{d.description}</p>
          <div className="ar-progressBar" role="progressbar" aria-valuenow={d.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${d.projectTitle} build progress`}>
            <div className="ar-progressBar__fill" style={{ width: `${d.progressPercent}%` }} />
          </div>
          <p className="ar-buildCard__meta">{d.progressPercent}% Complete · {DEMO_LABEL}</p>
          <div className="ar-buildCard__collabs">
            <span className="ar-buildCard__toolsLabel">Collaborators</span>
            <div className="ar-avatarRow">
              {d.collaborators.map((c) => (
                <span key={c.initials} className="ar-avatarChip" title={c.name} aria-label={c.name}>
                  {c.initials}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="ar-buildCard__side">
          <span className="ar-buildCard__toolsLabel">Planned tools (not connected):</span>
          {d.plannedTools.map((t) => (
            <span key={t} className="ar-pill ar-pill--planned ar-pill--block">{t}</span>
          ))}
          <span className="ar-pill ar-pill--amber ar-pill--block">Instructor Review: {d.instructorReviewStatus}</span>
        </div>
      </div>
    </section>
  );
}

// --------------------------- C. Continue Learning -----------------------
function ContinueLearningSection() {
  const d = CONTINUE_LEARNING_DEMO;
  const [resumeOpen, setResumeOpen] = useState(false);
  const resumeBtnRef = useRef(null);

  return (
    <section className="ar-card ar-section ar-learnSection ar-homeItem ar-homeItem--learn" aria-labelledby="ar-continue-learning-title">
      <div className="ar-section__head">
        <h2 id="ar-continue-learning-title" className="ar-section__title">Continue Learning</h2>
        <DemoTag />
      </div>
      <div className="ar-learnCard">
        <img className="ar-learnCard__img" src={d.courseImage} alt="" aria-hidden="true" />
        <p className="ar-learnCard__course">{d.courseTitle}</p>
        <p className="ar-learnCard__lesson">Lesson: {d.lessonTitle}</p>
        <p className="ar-learnCard__progress">{d.lessonsCompleted} of {d.lessonsTotal} lessons completed</p>
        <div className="ar-progressBar ar-progressBar--sm" role="progressbar" aria-valuenow={Math.round((d.lessonsCompleted / d.lessonsTotal) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress">
          <div className="ar-progressBar__fill" style={{ width: `${Math.round((d.lessonsCompleted / d.lessonsTotal) * 100)}%` }} />
        </div>
        <InfoTriggerButton label="Resume Lesson" onOpen={() => setResumeOpen(true)} triggerRef={resumeBtnRef} className="ar-btn ar-btn--primary" />
      </div>

      <ArcadeInfoDialog
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        returnFocusRef={resumeBtnRef}
        titleId="ar-resume-lesson-title"
        title="Resume Lesson"
      >
        <p>
          &ldquo;{d.lessonTitle}&rdquo; is a preview of a future Learning
          Arcade course and doesn&rsquo;t have a real lesson yet to resume.
          No lesson content exists behind this button.
        </p>
      </ArcadeInfoDialog>
    </section>
  );
}

// --------------------------- AI Agent Game Lab (right rail) -------------
function AgentGameLabSection() {
  const d = AGENT_GAME_LAB_DEMO;
  const [buildOpen, setBuildOpen] = useState(false);
  const buildBtnRef = useRef(null);

  return (
    <section className="ar-card ar-section ar-homeItem ar-homeItem--agentlab" aria-labelledby="ar-agent-lab-title">
      <div className="ar-section__head">
        <h2 id="ar-agent-lab-title" className="ar-section__title">AI Agent Game Lab</h2>
        <DemoTag />
      </div>
      <dl className="ar-agentLab__stats">
        <div className="ar-agentLab__stat">
          <dt>Registered Agent Identity</dt>
          <dd>{d.agentName}</dd>
        </div>
        <div className="ar-agentLab__stat">
          <dt>Standard Validation</dt>
          <dd className="ar-agentLab__amber">{d.standardValidationPercent}% {d.standardValidationLabel}</dd>
        </div>
        <div className="ar-agentLab__stat">
          <dt>Registry Status</dt>
          {/* Must never read as Registered/Verified — this is the only
              truthful value: no registration workflow exists yet. */}
          <dd><span className="ar-pill ar-pill--amber">{d.registryStatus}</span></dd>
        </div>
        <div className="ar-agentLab__stat">
          <dt>Sandbox Status</dt>
          <dd><span className="ar-pill ar-pill--green">{d.sandboxStatus}</span></dd>
        </div>
        <div className="ar-agentLab__stat ar-agentLab__stat--tools">
          <dt>Approved Tools</dt>
          <dd>
            {d.approvedTools.join(", ")}
            <span className="ar-pill ar-pill--green ar-pill--sm">Approved</span>
          </dd>
        </div>
      </dl>
      <InfoTriggerButton label="Build Agent Game" onOpen={() => setBuildOpen(true)} triggerRef={buildBtnRef} className="ar-btn ar-btn--primary ar-btn--block" />

      <ArcadeInfoDialog
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        returnFocusRef={buildBtnRef}
        titleId="ar-build-agent-title"
        title="Build Agent Game"
      >
        <p>
          A student-facing AI Agent Builder isn&rsquo;t connected to the
          Arcade yet, so no agent is created, validated, or submitted by
          this button. The Autonomous Registry is a real, independent
          project — it isn&rsquo;t recreated or bypassed here, and nothing
          in this app can register or verify an agent on its behalf.
        </p>
      </ArcadeInfoDialog>
    </section>
  );
}

// --------------------------- Student-Made Experiences --------------------
function StudentMadeSection() {
  return (
    <section className="ar-card ar-section ar-homeItem ar-homeItem--student" aria-labelledby="ar-student-made-title">
      <div className="ar-section__head">
        <h2 id="ar-student-made-title" className="ar-section__title">Student-Made Experiences</h2>
        <div className="ar-section__headRight">
          <DemoTag />
          <span className="ar-note ar-note--link">View All →</span>
        </div>
      </div>
      <p className="ar-muted">
        Sample cards only — not real student Portfolio or Registry records.
      </p>
      <div className="ar-studentGrid">
        {STUDENT_MADE_DEMO.map((s) => (
          <article key={s.id} className="ar-studentCard">
            <img className="ar-studentCard__img" src={s.image} alt="" aria-hidden="true" />
            <h3 className="ar-studentCard__title">{s.title}</h3>
            <p className="ar-studentCard__desc">{s.description}</p>
            <p className="ar-studentCard__by">by {s.by.replace(" · Demo", "")} <span className="ar-verifiedDot" aria-hidden="true">✓</span></p>
            <ul className="ar-chipList ar-chipList--sm">
              {s.tags.map((t) => <li key={t} className="ar-pill ar-pill--tag">{t}</li>)}
            </ul>
            <div className="ar-studentCard__foot">
              <span className="ar-studentCard__rating">★ {s.rating}</span>
              <span className="ar-studentCard__plays">▶ {s.plays}</span>
              <button type="button" className="ar-btn ar-btn--primary ar-btn--sm">Play</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// --------------------------- Classical Arcade Room ------------------------
function ClassicalArcadeRoomCard() {
  return (
    <section className="ar-card ar-section ar-roomEntry ar-homeItem ar-homeItem--classic" aria-labelledby="ar-classical-entry-title">
      <img className="ar-roomEntry__img" src="/assets/arcade/classical-arcade-cabinets.jpg" alt="" aria-hidden="true" />
      <div className="ar-roomEntry__body">
        <h2 id="ar-classical-entry-title" className="ar-roomEntry__title">
          <span aria-hidden="true">🕹️</span> Classical Arcade Room
        </h2>
        <p className="ar-roomEntry__sub">Classic games. Timeless fun. Level up your skills.</p>
      </div>
      <Link className="ar-btn ar-btn--primary" to="/classical-arcade">Enter Arcade</Link>
    </section>
  );
}

// --------------------------- Submit a Game (right rail) --------------------
function SubmitGameSection() {
  return (
    <section className="ar-card ar-section ar-homeItem ar-homeItem--submit" aria-labelledby="ar-submit-title">
      <div className="ar-section__head">
        <span className="ar-section__icon" aria-hidden="true">📤</span>
        <h2 id="ar-submit-title" className="ar-section__title">Submit a Game</h2>
      </div>
      <p className="ar-muted">Instructor and safety review required.</p>
      <button type="button" className="ar-btn ar-btn--primary ar-btn--block" disabled title="Publishing isn't available yet — instructor and safety review infrastructure doesn't exist in this phase.">
        Submit a Game
      </button>
    </section>
  );
}

// --------------------------- Achievement Snapshot (right rail) -------------
function AchievementSnapshotSection() {
  const d = ACHIEVEMENT_SNAPSHOT_DEMO;
  return (
    <section className="ar-card ar-section ar-homeItem ar-homeItem--achievement" aria-labelledby="ar-achievement-title">
      <div className="ar-section__head">
        <h2 id="ar-achievement-title" className="ar-section__title">Achievement Snapshot</h2>
        <DemoTag />
      </div>
      <div className="ar-achievement">
        <div className="ar-achievement__stat">
          <span className="ar-achievement__icon" aria-hidden="true">🔷</span>
          <span className="ar-achievement__value">{d.skillsVerified}</span>
          <span className="ar-achievement__label">Skills Verified</span>
          <span className="ar-note ar-note--link">View Skills →</span>
        </div>
        <div className="ar-achievement__stat">
          <span className="ar-achievement__icon" aria-hidden="true">🏆</span>
          <span className="ar-achievement__value">{d.projectsPublished}</span>
          <span className="ar-achievement__label">Projects Published</span>
          <span className="ar-note ar-note--link">View Projects →</span>
        </div>
        <div className="ar-achievement__stat">
          <span className="ar-achievement__icon" aria-hidden="true">🎖️</span>
          <span className="ar-achievement__value">{d.credentialsEarned}</span>
          <span className="ar-achievement__label">Credentials Earned</span>
          <span className="ar-note ar-note--link">View Credentials →</span>
        </div>
      </div>
      <p className="ar-muted">
        {DEMO_LABEL} — no credential-issuance workflow exists yet, so
        nothing shown here has actually been issued.
      </p>
    </section>
  );
}

// --------------------------- Dev-only ledger test panel (preserved) -----
function DevArcadeTestPanel() {
  const { ARCADE_EVENTS, recordArcadeEvent } = useArcadeLedger();
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");

  if (!ARCADE_EVENTS || typeof recordArcadeEvent !== "function") {
    return (
      <div className="ar-card ar-section">
        <h2 style={{ fontSize: "1rem" }}>Arcade Dev Tools</h2>
        <p className="ar-muted">Arcade ledger not available. Check useArcadeLedger.js wiring.</p>
      </div>
    );
  }

  const baseMeta = { cohort: "DEV-LOCAL", location: "Columbus Rec – Sandbox", device: "MacBook (Local Dev)" };

  async function fire(label, eventType, payload) {
    try {
      setBusy(true);
      setMessage(`Logging: ${label}…`);
      await recordArcadeEvent(eventType, payload);
      setMessage(`Logged ${label} into the SHF Arcade ledger`);
    } catch (err) {
      console.error("[DevArcadeTestPanel] Failed to log event:", err);
      setMessage(`Error logging ${label} — see console for details`);
    } finally {
      setBusy(false);
    }
  }

  const handleGameStart = () =>
    fire("Game Start (Dev Student 1)", ARCADE_EVENTS.GAME_START, {
      userId: "dev-student-1", userName: "Dev Student 1", gameId: "debt-hunter",
      meta: { ...baseMeta, runTimeMs: 0, selTags: ["self-management"], workforceTags: ["financial literacy"] },
    });
  const handleGameComplete = () =>
    fire("Game Complete (Dev Student 2)", ARCADE_EVENTS.GAME_COMPLETE, {
      userId: "dev-student-2", userName: "Dev Student 2", gameId: "debt-hunter",
      meta: { ...baseMeta, runTimeMs: 42000, accuracy: 0.86, selTags: ["planning", "self-management"], workforceTags: ["financial literacy", "problem solving"] },
    });
  const handleBadgeClaim = () =>
    fire("Badge Claim (Dev Student 3)", ARCADE_EVENTS.BADGE_CLAIMED, {
      userId: "dev-student-3", userName: "Dev Student 3", gameId: "debt-hunter",
      meta: { ...baseMeta, badgeId: "debt-hunter-streak-5", badgeLabel: "Debt Hunter – 5 Session Streak", selTags: ["self-management"], workforceTags: ["financial literacy"] },
    });

  return (
    <div className="ar-card ar-section">
      <h2 style={{ fontSize: "1rem" }}>Arcade Dev Tools (local only)</h2>
      <p className="ar-muted">Generates sample arcade events. Open Arcade Impact History and download the CSV to verify.</p>
      <div className="ar-linkRow">
        <button type="button" className="ar-btn ar-btn--ghost" onClick={handleGameStart} disabled={busy}>Log Game Start (Dev 1)</button>
        <button type="button" className="ar-btn ar-btn--primary" onClick={handleGameComplete} disabled={busy}>Log Game Complete (Dev 2)</button>
        <button type="button" className="ar-btn ar-btn--ghost" onClick={handleBadgeClaim} disabled={busy}>Log Badge Claim (Dev 3)</button>
      </div>
      {message && <p className="ar-muted" role="status">{busy ? "⏳ " : "✅ "}{message}</p>}
    </div>
  );
}

export default function ArcadeDashboard() {
  return (
    <div className="ar-home">
      <HeroSection />
      {/* Flat DOM order = the exact required mobile reading order
          (Continue Building, Continue Learning, AI Agent Game Lab, Arcade
          Activity, Student-Made Experiences, Classical Arcade Room, Submit
          a Game, Achievement Snapshot). Desktop/tablet visual composition
          (main column + narrow right rail, or two-column tablet layouts)
          is done purely with CSS grid-column/grid-row placement on each
          .ar-homeItem--* class (see .ar-homeGrid in arcade.css) — never
          with the `order` property — so screen readers and keyboard/tab
          navigation always follow this same sensible sequence at every
          breakpoint, not just visually at mobile. */}
      <div className="ar-homeGrid">
        <ContinueBuildingSection />
        <ContinueLearningSection />
        <AgentGameLabSection />
        <ArcadeActivitySummary
          headingId="ar-activity-title"
          title="Arcade Activity"
          variant="home"
          className="ar-homeItem ar-homeItem--activity"
        />
        <StudentMadeSection />
        <ClassicalArcadeRoomCard />
        <SubmitGameSection />
        <AchievementSnapshotSection />
      </div>
      {isDev && <DevArcadeTestPanel />}
    </div>
  );
}
