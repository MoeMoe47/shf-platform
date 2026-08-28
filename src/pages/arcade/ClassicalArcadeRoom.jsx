// src/pages/arcade/ClassicalArcadeRoom.jsx
// ------------------------------------------------------------
// Classical Arcade Room — visual-fidelity correction pass.
//
// Root cause of the prior mismatch (found live, not guessed): this page
// never received the same visual-fidelity repair the Learning Arcade Home
// got in an earlier pass. It still used the ORIGINAL Task-1 hero markup
// (.ar-hero__art rendered BEFORE .ar-hero__body — the opposite DOM order
// from Home's corrected hero, which is why the title/controls rendered on
// the right instead of the left) with three flat CSS-gradient
// ".ar-cabinet" rectangles standing in for real artwork, and dumped all 8
// sections as flat children of the OLD two-column `.ar-homeGrid` (which
// auto-flowed Today's Featured Cabinet into the main/left column instead
// of a persistent right rail, and — after the Home responsive pass gave
// `.ar-homeGrid` its own Home-specific `.ar-homeItem--*` placement rules —
// would have received NO placement at all, since none of these sections
// carry those classes).
//
// This page now uses its own dedicated grid system (.ar-roomGrid /
// .ar-roomItem--*), completely independent of Home's .ar-homeGrid /
// .ar-homeItem--* system, so neither page's layout can affect the other's.
// The shell (ArcadeAppShell/ArcadeSidebar/ArcadeHeader/ArcadeTopNav) is
// unchanged and fully reused — nothing here duplicates it.
//
// Honesty boundaries (unchanged from the certified package, restated
// because several sections below reference them):
//   - Free Play is the only mode/game control that launches something
//     real (the existing /games route). Every other mode, the four
//     "classic-inspired" games, and the "How Was This Built" topics are
//     preview fixtures — activating them opens an honest informational
//     dialog, never a dead link and never a silent no-op.
//   - The four classic-inspired games (Orbit Defender, Pixel Foundry,
//     Circuit Runner, Eco Stack) do not exist in src/data/arcade.js's real
//     arcadeGames catalog and are never written into it or into any real
//     ledger/leaderboard key.
//   - Student Hall of Fame uses privacy-safe, clearly fictional gamertag
//     handles (never a real student's name), and is never written into
//     the real per-game leaderboard storage.
//   - "Your Arcade Activity" (via ArcadeActivitySummary) reads real XP/
//     session data from useArcadeHistory() — unchanged, not a fixture.
// ------------------------------------------------------------

import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ArcadeInfoDialog from "@/components/arcade/ArcadeInfoDialog.jsx";
import ArcadeActivitySummary from "@/components/arcade/ArcadeActivitySummary.jsx";
import {
  CLASSIC_GAMES_DEMO,
  FEATURED_CABINET_DEMO,
  HALL_OF_FAME_DEMO,
  UPCOMING_CHALLENGE_DEMO,
} from "@/data/arcadeHomeFixtures.js";

// Real artwork extracted directly from the approved Classical Arcade Room
// mock (/Users/mikeslate/Projects/Dark_classic_aracde.png, 1536x1024 —
// found during a forensic re-search; identical artwork also confirmed in
// the light-mode mock, "light_ classic_ arcade.png", card chrome only
// differs). Each crop is the card's own art region only — no card
// border, title text, or button chrome captured. See
// docs/architecture/ARCADE_CLASSICAL_ARTWORK_SOURCING.md for exact
// source coordinates per asset.
const GAME_ART = {
  "orbit-defender": "/assets/arcade/classical/orbit-defender.jpg",
  "pixel-foundry": "/assets/arcade/classical/pixel-foundry.jpg",
  "circuit-runner": "/assets/arcade/classical/circuit-runner.jpg",
  "eco-stack": "/assets/arcade/classical/eco-stack.jpg",
};
// Today's Featured Cabinet uses its own dedicated (larger, more detailed)
// crop of the same Orbit Defender scene from the mock, not a re-scaled
// copy of the small game-card art above.
const FEATURED_ART = "/assets/arcade/classical/featured-cabinet-orbit-defender.jpg";

function InfoTriggerButton({ label, className = "ar-btn ar-btn--ghost", onOpen, triggerRef, ...rest }) {
  return (
    <button type="button" ref={triggerRef} className={className} onClick={onOpen} {...rest}>
      {label}
    </button>
  );
}

// --------------------------- Hero (main column, row 1) --------------------
function RoomControls() {
  const navigate = useNavigate();
  const [howOpen, setHowOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const howBtnRef = useRef(null);
  const a11yBtnRef = useRef(null);

  return (
    <div className="ar-roomControls">
      <button type="button" className="ar-btn ar-btn--primary" onClick={() => navigate("/games")}>
        Start Free Play
      </button>
      <InfoTriggerButton label="How the Arcade Works" onOpen={() => setHowOpen(true)} triggerRef={howBtnRef} />
      <span className="ar-pill ar-pill--green" role="status">Safe Play</span>
      <span className="ar-pill ar-pill--green" role="status">Instructor Approved</span>
      <InfoTriggerButton
        label="Accessibility Ready"
        className="ar-pill ar-pill--green ar-pill--button"
        onOpen={() => setA11yOpen(true)}
        triggerRef={a11yBtnRef}
      />

      <ArcadeInfoDialog open={howOpen} onClose={() => setHowOpen(false)} returnFocusRef={howBtnRef} titleId="ar-how-title" title="How the Arcade Works">
        <p>
          The Classical Arcade Room plays original, skill-building games
          right now, and previews how future games — including ones built
          with AI agents — will come together. Free Play launches a real
          game from the existing Games library; the other modes and
          &ldquo;how it was built&rdquo; previews below are informational
          only in this phase.
        </p>
      </ArcadeInfoDialog>

      <ArcadeInfoDialog open={a11yOpen} onClose={() => setA11yOpen(false)} returnFocusRef={a11yBtnRef} titleId="ar-a11y-title" title="Accessibility">
        <p>
          This room supports keyboard navigation, visible focus indicators,
          screen-reader labels on every control, and reduced-motion
          preferences. If something here is hard to use, please tell your
          instructor so it can be fixed.
        </p>
      </ArcadeInfoDialog>
    </div>
  );
}

function RoomHero() {
  return (
    <section className="ar-hero ar-hero--room ar-roomItem ar-roomItem--hero" aria-labelledby="ar-room-title">
      <div className="ar-hero__body">
        <nav className="ar-roomBreadcrumb" aria-label="Breadcrumb">
          <AppLinkBreadcrumb />
        </nav>
        <h1 id="ar-room-title" className="ar-hero__title">CLASSICAL ARCADE ROOM</h1>
        <p className="ar-hero__sub">Play timeless games. Discover how they work. Build what comes next.</p>
        <RoomControls />
      </div>
      <div className="ar-hero__art">
        {/* Original arcade-cabinet photo extracted from the approved
            Classical Arcade Room mock (Task 1/2 pass) — colorful,
            fictional cabinet marquees (Circuit Runner / Eco Stack /
            Foundry), no commercial game brands or characters. */}
        <img
          className="ar-hero__img ar-hero__img--room"
          src="/assets/arcade/classical-arcade-cabinets.jpg"
          alt="Row of original, colorfully lit arcade cabinets with neon marquees in the Classical Arcade Room."
        />
      </div>
    </section>
  );
}

function AppLinkBreadcrumb() {
  return (
    <ol className="ar-roomBreadcrumb__list">
      <li><a href="/arcade.html#/dashboard">Arcade</a></li>
      <li aria-hidden="true">/</li>
      <li aria-current="page">Classical Arcade Room</li>
    </ol>
  );
}

// --------------------------- Featured Cabinet (rail, row 1) ---------------
function FeaturedCabinetSection() {
  const navigate = useNavigate();
  const [howBuiltOpen, setHowBuiltOpen] = useState(false);
  const howBuiltBtnRef = useRef(null);
  const d = FEATURED_CABINET_DEMO;

  return (
    <section className="ar-card ar-section ar-roomItem ar-roomItem--featured" aria-labelledby="ar-featured-eyebrow">
      <div className="ar-section__head">
        <h2 id="ar-featured-eyebrow" className="ar-roomEyebrow">Today&rsquo;s Featured Cabinet</h2>
      </div>
      <div className="ar-featuredCabinet ar-featuredCabinet--room">
        <img className="ar-featuredCabinet__art" src={FEATURED_ART} alt="" aria-hidden="true" />
        <div className="ar-featuredCabinet__body">
          <h3 className="ar-featuredCabinet__title">{d.title}</h3>
          <ul className="ar-chipList">
            {d.skills.map((s) => <li key={s} className="ar-pill">{s}</li>)}
          </ul>
          <div className="ar-linkRow">
            <button type="button" className="ar-btn ar-btn--primary" onClick={() => navigate("/games")}>Play Now</button>
            <InfoTriggerButton label="See How It Was Built" onOpen={() => setHowBuiltOpen(true)} triggerRef={howBuiltBtnRef} />
          </div>
        </div>
      </div>

      <ArcadeInfoDialog open={howBuiltOpen} onClose={() => setHowBuiltOpen(false)} returnFocusRef={howBuiltBtnRef} titleId="ar-featured-built-title" title={`How ${d.title} Was Built`}>
        <p>
          This is a preview of a future &ldquo;behind the build&rdquo; view
          — it will walk through the game logic, art, and (where used) AI
          agent behavior once the Creator tools exist. Nothing is shown
          here yet.
        </p>
      </ArcadeInfoDialog>
    </section>
  );
}

// --------------------------- 1. Choose Your Arcade Mode (main, row 2) -----
const ARCADE_MODES = [
  { key: "free", label: "Free Play", body: "Explore approved games", accent: "cyan", real: true },
  { key: "guided", label: "Guided Play", body: "Play with learning prompts", accent: "violet", real: false, dialog: "Guided Play doesn't have a proven implementation yet — it will walk you through a game step by step. Free Play works today." },
  { key: "weekly", label: "Weekly Challenge", body: "Compete and build skills", accent: "gold", real: false, dialog: "Weekly Challenge isn't wired up yet. Check Upcoming Challenges for what's planned." },
  { key: "classroom", label: "Classroom Mode", body: "Join your instructor's room", accent: "green", real: false, dialog: "Classroom Mode (instructor-led, whole-class play) isn't implemented yet." },
];

function ArcadeModeSection() {
  const navigate = useNavigate();
  const [openMode, setOpenMode] = useState(null);
  const triggerRefs = useRef({});

  return (
    <section className="ar-card ar-section ar-roomItem ar-roomItem--mode" aria-labelledby="ar-mode-title">
      <div className="ar-section__head">
        <h2 id="ar-mode-title" className="ar-section__title">1. Choose Your Arcade Mode</h2>
      </div>
      <div className="ar-modeRow ar-modeRow--room" role="group" aria-label="Arcade modes">
        {ARCADE_MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            ref={(el) => { triggerRefs.current[m.key] = el; }}
            className={`ar-roomModeCard ar-roomModeCard--${m.accent}${m.key === "free" ? " is-active" : ""}`}
            aria-describedby={m.real ? undefined : `ar-mode-${m.key}-status`}
            onClick={() => (m.real ? navigate("/games") : setOpenMode(m.key))}
          >
            <span className="ar-roomModeCard__icon" aria-hidden="true" />
            <span className="ar-roomModeCard__text">
              <span className="ar-roomModeCard__label">{m.label}</span>
              <span className="ar-roomModeCard__desc">{m.body}</span>
            </span>
            {!m.real && <span id={`ar-mode-${m.key}-status`} className="ar-srOnly">, preview only, not yet available</span>}
          </button>
        ))}
      </div>
      {ARCADE_MODES.filter((m) => !m.real).map((m) => (
        <ArcadeInfoDialog
          key={m.key}
          open={openMode === m.key}
          onClose={() => setOpenMode(null)}
          returnFocusRef={{ current: triggerRefs.current[m.key] }}
          titleId={`ar-mode-${m.key}-title`}
          title={m.label}
        >
          <p>{m.dialog}</p>
        </ArcadeInfoDialog>
      ))}
    </section>
  );
}

// --------------------------- 4. Student Hall of Fame (rail, row 2) --------
function HallOfFameSection() {
  return (
    <section className="ar-card ar-section ar-roomItem ar-roomItem--hof" aria-labelledby="ar-hof-title">
      <div className="ar-section__head">
        <h2 id="ar-hof-title" className="ar-section__title">4. Student Hall of Fame</h2>
        <Link className="ar-note ar-note--link" to="/leaderboard">View All →</Link>
      </div>
      <p className="ar-muted ar-srOnly">Privacy-safe fictional display names only.</p>
      <ol className="ar-hofList">
        {HALL_OF_FAME_DEMO.map((row) => (
          <li key={row.rank} className="ar-hofRow">
            <span className="ar-hofRow__rank">{row.rank}</span>
            <span className="ar-hofRow__body">
              <span className="ar-hofRow__name">{row.displayName}</span>
              <span className="ar-hofRow__title">{row.title}</span>
            </span>
            <span className="ar-hofRow__xp">{row.xp.toLocaleString()} XP</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// --------------------------- 2. Classic-Inspired Games (main, row 3) ------
function ClassicGamesSection() {
  const [openGame, setOpenGame] = useState(null);
  const triggerRefs = useRef({});

  return (
    <section className="ar-card ar-section ar-roomItem ar-roomItem--games" aria-labelledby="ar-classic-games-title">
      <div className="ar-section__head">
        <h2 id="ar-classic-games-title" className="ar-section__title">2. Classic-Inspired Games</h2>
      </div>
      <div className="ar-roomGameGrid">
        {CLASSIC_GAMES_DEMO.map((g) => {
          const filledDots = g.difficulty === "Beginner" ? 1 : g.difficulty === "Intermediate" ? 2 : 3;
          return (
          <article key={g.id} className="ar-gameCard ar-gameCard--room">
            <img className="ar-gameCard__art" src={GAME_ART[g.id]} alt="" aria-hidden="true" />
            <h3 className="ar-gameCard__title">{g.title}</h3>
            <ul className="ar-chipList ar-chipList--sm">
              {g.skills.map((s) => <li key={s} className="ar-pill ar-pill--tag">{s}</li>)}
            </ul>
            <div className="ar-gameCard__meta">
              <span className="ar-difficultyDots" aria-label={`Difficulty: ${g.difficulty}`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} aria-hidden="true" className={`ar-difficultyDots__dot${n <= filledDots ? " is-filled" : ""}`} />
                ))}
              </span>
              <span>★ {g.rating}</span>
              <span>+{g.xp} XP</span>
            </div>
            <button
              type="button"
              ref={(el) => { triggerRefs.current[g.id] = el; }}
              className="ar-btn ar-btn--secondary ar-btn--block"
              onClick={() => setOpenGame(g.id)}
            >
              Play
            </button>
          </article>
          );
        })}
      </div>

      {CLASSIC_GAMES_DEMO.map((g) => (
        <ArcadeInfoDialog
          key={g.id}
          open={openGame === g.id}
          onClose={() => setOpenGame(null)}
          returnFocusRef={{ current: triggerRefs.current[g.id] }}
          titleId={`ar-game-${g.id}-title`}
          title={g.title}
        >
          <p>
            {g.title} is a preview card for a future Classical Arcade
            catalog entry — it isn&rsquo;t a playable game yet. Try Free
            Play above for a real, working game from the current Games
            library.
          </p>
        </ArcadeInfoDialog>
      ))}
    </section>
  );
}

// --------------------------- 5. Upcoming Challenges (rail, row 3) ---------
function UpcomingChallengesSection() {
  const d = UPCOMING_CHALLENGE_DEMO;
  return (
    <section className="ar-card ar-section ar-roomItem ar-roomItem--upcoming" aria-labelledby="ar-upcoming-title">
      <div className="ar-section__head">
        <h2 id="ar-upcoming-title" className="ar-section__title">5. Upcoming Challenges</h2>
      </div>
      <div className="ar-challengeCard ar-challengeCard--room">
        <img className="ar-challengeCard__icon" src="/assets/arcade/classical/retro-build-jam-icon.svg" alt="" aria-hidden="true" />
        <div className="ar-challengeCard__body">
          <h3 className="ar-challengeCard__title">{d.title}</h3>
          <p className="ar-challengeCard__meta">{d.date} · {d.time}</p>
          <p className="ar-challengeCard__meta">{d.teamSize} · {d.skillLevel}</p>
          {d.instructorApproved && <span className="ar-pill ar-pill--green">Instructor Approved</span>}
          <Link className="ar-btn ar-btn--secondary ar-btn--block" to="/tournaments">View Challenge</Link>
        </div>
      </div>
    </section>
  );
}

// --------------------------- 3. How Was This Built? (main, row 4) ---------
function HowBuiltSection() {
  const [openTopic, setOpenTopic] = useState(null);
  const triggerRefs = useRef({});

  const TOPICS = [
    // Game Logic: no clean crop exists in the approved mock at usable
    // quality (the icon sits ~60x40px, tight against surrounding label
    // text with no isolatable margin on any edge — confirmed by direct
    // extraction attempts). Uses an upgraded custom SVG instead, matching
    // the mock's own orbital-motion concept and the sophistication level
    // of the other custom artwork in this asset set.
    { key: "logic", label: "Game Logic", bullets: ["Movement", "Collisions", "Spawning", "Scoring"], art: "/assets/arcade/classical/game-logic-orbital.svg", body: "A preview of how game rules and interactions are put together for Orbit Defender." },
    { key: "art", label: "Art & Assets", bullets: ["Vector ships", "Particles", "UI"], art: "/assets/arcade/classical/art-assets-ship.jpg", body: "A preview of how original art and assets are made for these games." },
    { key: "agent", label: "AI Agent Behavior", bullets: ["Adaptive difficulty", "Threat patterns"], art: "/assets/arcade/classical/ai-agent-systems.jpg", body: "A preview of how an AI agent's behavior would be designed and tested for a game." },
  ];

  const ACTIONS = [
    { key: "code", label: "Explore the Code", body: "Explore the Code is a planned educational preview — no live code viewer exists yet in this phase." },
    { key: "similar", label: "Start a Similar Project", body: "This will connect to the future Create/My Studio phase. Nothing is created by this button yet." },
  ];

  // SHS Web Builder and AI Agent Builder are real, verified systems, not
  // vaporware, but neither is connected to this Arcade yet:
  //  - SHS Web Builder lives as the "Studio" app in the separate shf-next
  //    project (src/system/routes/crossAppRouteBridge.js documents it as
  //    a real "live template marketplace" at /studio/templates/browse).
  //  - AI Agent Builder: only an internal, admin-only Agent Workbench
  //    exists in this platform (admin.html#/ops/agents) — not a
  //    student-facing tool, and not reachable from here.
  // No cross-app link is wired here per the authorized package's
  // phasing — hover text documents the real system, not a guessed URL.
  const PLANNED_TOOLS = [
    { label: "SHS Web Builder", detail: "Real system — lives in the separate SHF-Next Studio app. Not connected here yet." },
    { label: "AI Agent Builder", detail: "Only an internal, admin-only Agent Workbench exists today — not a student tool, and not connected here." },
    { label: "Blender", detail: "Not integrated with this platform." },
  ];

  return (
    <section className="ar-card ar-section ar-roomItem ar-roomItem--howbuilt" aria-labelledby="ar-how-built-title">
      <div className="ar-section__head">
        <h2 id="ar-how-built-title" className="ar-section__title">3. How Was This Built?</h2>
        <span className="ar-note">Selected game: Orbit Defender</span>
      </div>
      <div className="ar-howBuiltRow">
        <div className="ar-howBuiltTopics">
          {TOPICS.map((t) => (
            <button
              key={t.key}
              type="button"
              ref={(el) => { triggerRefs.current[t.key] = el; }}
              className="ar-howBuiltTopic"
              onClick={() => setOpenTopic(t.key)}
            >
              <img className="ar-howBuiltTopic__art" src={t.art} alt="" aria-hidden="true" />
              <span className="ar-howBuiltTopic__label">{t.label}</span>
              <span className="ar-howBuiltTopic__bullets">{t.bullets.join(" · ")}</span>
            </button>
          ))}
        </div>
        <div className="ar-howBuiltActions">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              ref={(el) => { triggerRefs.current[a.key] = el; }}
              className="ar-btn ar-btn--ghost ar-btn--block"
              onClick={() => setOpenTopic(a.key)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ar-buildCard__tools">
        <span className="ar-buildCard__toolsLabel">Planned tools (not connected):</span>
        {PLANNED_TOOLS.map((t) => (
          <span key={t.label} className="ar-pill ar-pill--planned" title={t.detail}>{t.label}</span>
        ))}
      </div>

      {[...TOPICS, ...ACTIONS].map((t) => (
        <ArcadeInfoDialog
          key={t.key}
          open={openTopic === t.key}
          onClose={() => setOpenTopic(null)}
          returnFocusRef={{ current: triggerRefs.current[t.key] }}
          titleId={`ar-howbuilt-${t.key}-title`}
          title={t.label}
        >
          <p>{t.body}</p>
        </ArcadeInfoDialog>
      ))}
    </section>
  );
}

// --------------------------- 7. Turn Play Into Progress (rail, row 5) -----
function TurnPlayIntoProgressSection() {
  const navigate = useNavigate();
  const [openStage, setOpenStage] = useState(null);
  const triggerRefs = useRef({});

  const FUTURE_STAGES = [
    { key: "build", label: "Build", body: "Build is part of a future phase (the Create / My Studio / Web Builder / Agent Builder tools)." },
    { key: "publish", label: "Publish", body: "Publish stays fail-closed until real instructor and safety review exists. Nothing is published by this button." },
  ];

  return (
    <section className="ar-card ar-section ar-roomItem ar-roomItem--progress" aria-labelledby="ar-progress-title">
      <div className="ar-section__head">
        <h2 id="ar-progress-title" className="ar-section__title">7. Turn Play Into Progress</h2>
      </div>
      <ol className="ar-stageRow">
        <li><button type="button" className="ar-stageBtn is-active" onClick={() => navigate("/games")}>Play</button></li>
        <li><a className="ar-stageBtn" href="/career.html#/learn">Learn</a></li>
        {FUTURE_STAGES.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              ref={(el) => { triggerRefs.current[s.key] = el; }}
              className="ar-stageBtn ar-stageBtn--future"
              aria-describedby={`ar-stage-${s.key}-status`}
              onClick={() => setOpenStage(s.key)}
            >
              {s.label}
            </button>
            <span id={`ar-stage-${s.key}-status`} className="ar-srOnly">, coming in a future phase</span>
          </li>
        ))}
      </ol>
      <Link className="ar-btn ar-btn--ghost ar-btn--block" to="/dashboard">View Creator Pathway</Link>

      {FUTURE_STAGES.map((s) => (
        <ArcadeInfoDialog
          key={s.key}
          open={openStage === s.key}
          onClose={() => setOpenStage(null)}
          returnFocusRef={{ current: triggerRefs.current[s.key] }}
          titleId={`ar-stage-${s.key}-title`}
          title={s.label}
        >
          <p>{s.body}</p>
        </ArcadeInfoDialog>
      ))}
    </section>
  );
}

// --------------------------- Bottom policy bar (main column) --------------
function ContentNoticeSection() {
  return (
    <div className="ar-roomPolicyBar ar-roomItem ar-roomItem--policy" role="note">
      <p className="ar-roomPolicyBar__text">
        Original, licensed, public-domain and student-created games only.
      </p>
      <ul className="ar-roomPolicyBar__tags">
        <li className="ar-pill ar-pill--green">Safe</li>
        <li className="ar-pill ar-pill--green">Inclusive</li>
        <li className="ar-pill ar-pill--green">Educational</li>
        <li className="ar-pill ar-pill--green">Approved by Instructors</li>
      </ul>
      <a className="ar-note ar-note--link" href="/help">Report an Issue</a>
    </div>
  );
}

export default function ClassicalArcadeRoom() {
  // Four grid children, not ten: (Hero, Featured Cabinet) share row 1;
  // (.ar-roomMain, .ar-roomRail — each an internally independent flex
  // column) share row 2. DOM order is now IDENTICAL to the required
  // mobile reading order with no `order` property anywhere on this page:
  // Hero, Featured Cabinet, 1-2-3 (main topics), Policy, 4-7 (rail
  // topics). Below 900px .ar-roomGrid collapses to one column and
  // .ar-roomMain/.ar-roomRail become `display:contents` (see arcade.css)
  // so all ten sections flatten into that exact DOM sequence.
  //
  // Row 1 (Hero/Featured) is a safe row-track pairing — both are already
  // similar natural heights by design (Hero fixed at 288px desktop;
  // Featured's card was sized to roughly match) — unlike row-pairing
  // individual sections of very different heights (the earlier defect:
  // pairing the compact "1. Choose Your Arcade Mode" row against the
  // much taller "4. Student Hall of Fame" list in a shared grid row
  // forced that row's track to the taller item's height regardless of
  // align-items, leaving a large dead gap below the shorter one — CSS
  // Grid ties row height across columns; there is no supported masonry
  // mode in this browser target). Row 2 pairs exactly two opaque flex
  // columns (not multiple same-row items), so each sizes to its own
  // content independently — the shorter column just leaves ordinary
  // trailing whitespace at the page's bottom, not a mid-page gap.
  return (
    <div className="ar-home ar-room">
      <div className="ar-roomGrid">
        <RoomHero />
        <FeaturedCabinetSection />
        <div className="ar-roomMain">
          <ArcadeModeSection />
          <ClassicGamesSection />
          <HowBuiltSection />
          <ContentNoticeSection />
        </div>
        <div className="ar-roomRail">
          <HallOfFameSection />
          <UpcomingChallengesSection />
          <ArcadeActivitySummary
            headingId="ar-room-activity-title"
            title="6. Your Arcade Activity"
            variant="room"
            className="ar-roomItem ar-roomItem--activity"
          />
          <TurnPlayIntoProgressSection />
        </div>
      </div>
    </div>
  );
}
