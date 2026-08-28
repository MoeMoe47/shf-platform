// src/data/arcadeHomeFixtures.js
//
// ISOLATED DISPLAY FIXTURES — Learning Arcade Home / Classical Arcade Room.
//
// Everything exported from this file is sample/demo presentation data for
// UI sections that describe FUTURE phases (Create, My Studio, Showcase,
// Student Web Builder, AI Agent Builder, Registry submission, Portfolio /
// Credentials issuance). None of it is written to, or read from, any real
// data store: not the credit ledger (src/utils/creditLedger.js), not the
// Arcade wallet/Polygon path (useArcadeLedger.js), not localStorage, not
// the review queue, not Portfolio/Credentials.
//
// Per the authorized implementation instructions: "If the approved mock
// contains sample values not provided by current data, create clearly
// identified display fixtures behind one narrow mock/demo adapter. Do not
// mix sample fixtures into production ledger or wallet records." This is
// that one narrow adapter. Every consuming component must render an
// explicit "Demo preview" / "Sample" label alongside anything sourced from
// here — see DEMO_LABEL below, used consistently by ArcadeDashboard.jsx and
// ClassicalArcadeRoom.jsx.
//
// Real data (current Workforce Arcade XP/session/on-chain totals, game
// catalog, leaderboard entries a student actually submitted) comes from
// useArcadeHistory()/useArcadeLedger()/arcadeGames instead — never from
// here.

export const DEMO_LABEL = "Demo preview";

// --- Continue Building (Home §B) ------------------------------------
// The Eco City Agent Challenge project referenced by the approved mock has
// no real project-identity record anywhere in this codebase (confirmed by
// the prior audit — no course→project launch, no build-environment model
// exists yet). Shown as a demo preview of what the future Create/My Studio
// phase will populate for real.
export const CONTINUE_BUILDING_DEMO = {
  projectTitle: "Eco City Agent Challenge",
  projectImage: "/assets/arcade/eco-city-thumb.jpg",
  description: "Design a sustainable city with AI agents that balance resources and community wellbeing.",
  progressPercent: 68,
  plannedTools: ["Unreal Engine", "Blender", "Meshy"],
  instructorReviewStatus: "Not yet submitted",
  collaborators: [
    { initials: "JR", name: "J. Rivera" },
    { initials: "AK", name: "A. Kim" },
  ],
};

// --- Continue Learning (Home §C) -------------------------------------
// No real "AI Game Development I" / "Agent Identity & Purpose" course
// route exists in Curriculum today (confirmed: no course→project launch,
// no lesson catalog under those titles). Shown as an honest demo preview,
// not a live lesson link, so the Resume Lesson control opens an
// informational dialog instead of navigating to nowhere.
export const CONTINUE_LEARNING_DEMO = {
  courseImage: "/assets/arcade/ai-game-dev-course.jpg",
  courseTitle: "AI Game Development I",
  lessonTitle: "Agent Identity & Purpose",
  lessonsCompleted: 4,
  lessonsTotal: 8,
};

// --- Creator Pathway (Home §D) ----------------------------------------
// Display pathway only — no persistence model exists for pathway stage
// yet (confirmed: no student-progress schema for this concept). Current
// stage is fixed sample data, not computed from any real record.
export const CREATOR_PATHWAY_DEMO = {
  stages: ["Explorer", "Builder", "Developer", "Studio Fellow"],
  currentStageIndex: 0,
};

// --- AI Agent Game Lab (Home §E) ---------------------------------------
// Mirrors the audit's explicit critical constraints: Registry status must
// never read as Registered/Verified, and this must never create or imply
// a real Registry record.
//
// CORRECTED FINDING (post-implementation, verified read-only): an
// independent Autonomous Registry project genuinely exists at
// /Users/mikeslate/Desktop/autonomous-registry — it is NOT vaporware.
// Its real record schema (contracts/records/agent-record.schema.v1.json)
// defines a `status` enum of draft / submitted / under_review /
// registered / needs_revision / suspended / retired, with `draft` as the
// initial state. "Not Submitted" here is the honest, schema-aligned
// description of that initial (pre-`submitted`) state — not a status this
// schema itself uses verbatim, but not a fabricated one either. Its own
// README confirms Phase 0 delivered only "institutional documentation,
// machine-readable contracts, record schema, lifecycle contract,
// design-token bridge contract, deterministic validators" — explicitly
// NOT "Full user interface, Runtime services, Database implementation,
// Deployment configuration, Production promotion." Confirmed live in this
// environment: nothing responds on its dev port (5174) or shrv1's
// documented VITE_SHRV1_BASE_URL default. There is no live service this
// Arcade could submit to yet, so no submission call is made — this
// remains a display-only status, per the authorized package's explicit
// instruction not to create Registry records or bypass its independent
// authority.
export const AGENT_GAME_LAB_DEMO = {
  agentName: "EcoAssistant_v1",
  standardValidationPercent: 82,
  standardValidationLabel: "Ready",
  registryStatus: "Not Submitted",
  sandboxStatus: "Active & Isolated",
  // "Approved" describes what this sandbox is configured to allow a
  // student agent to use — not that a live integration is connected.
  // SHS Web Builder / AI Agent Builder are covered honestly elsewhere
  // (Classical Arcade Room's "How Was This Built?" section) rather than
  // repeated here, matching the approved mock's own tool list for this
  // specific section exactly.
  approvedTools: ["Unreal Engine", "Blender", "Meshy", "OpenAI API (GPT-4o-mini)"],
};

// --- Student-Made Experiences (Home §G) --------------------------------
// Sample showcase cards only — explicitly not real student Portfolio or
// Registry records. No student names; short project titles only.
export const STUDENT_MADE_DEMO = [
  {
    id: "agent-architect",
    title: "Agent Architect",
    image: "/assets/arcade/student-agent-architect.jpg",
    description: "AI systems + ethics",
    tags: ["AI", "Ethics", "Simulation"],
    by: "Student team · Demo",
    rating: 4.8,
    plays: "2.1K",
  },
  {
    id: "code-red",
    title: "Code Red",
    image: "/assets/arcade/student-code-red.jpg",
    description: "Cybersecurity defense",
    tags: ["Cybersecurity", "Puzzle", "Strategy"],
    by: "Student team · Demo",
    rating: 4.7,
    plays: "1.6K",
  },
  {
    id: "community-tech-sprint",
    title: "Community Tech Sprint",
    image: "/assets/arcade/student-community-tech-sprint.jpg",
    description: "Solve real community challenges",
    tags: ["Collaboration", "Social Impact"],
    by: "Student team · Demo",
    rating: 4.9,
    plays: "3.3K",
  },
];

// --- Achievement Snapshot (Home §J) -------------------------------------
// No credential-issuance workflow exists yet (confirmed by the audit:
// CredentialsBadges.jsx is pure static display, no issuance logic). Shown
// as an isolated demo model, not a claim of issued credentials.
export const ACHIEVEMENT_SNAPSHOT_DEMO = {
  skillsVerified: 24,
  projectsPublished: 7,
  credentialsEarned: 3,
};

// --- Arcade Activity: Rank + Next Tournament (Home §F / Room §H) --------
// No real aggregate cross-student rank exists anywhere in this codebase
// (confirmed by the audit — Leaderboard.jsx is per-game, free-text, and
// never aggregated into an overall rank), and Tournaments.jsx is itself
// still labeled "(Placeholder)" in its own pre-existing source. XP and
// Badges in the Arcade Activity card come from the real ledger
// (useArcadeHistory) instead — only these two fields, which have no real
// source at all, are fixtures.
export const ARCADE_ACTIVITY_DEMO = {
  rank: 18,
  nextTournamentDay: "Fri",
};

// --- Classical Arcade Room: classic-inspired games (Room §D) -----------
// The four "classic-inspired" games named in the approved mock (Orbit
// Defender, Pixel Foundry, Circuit Runner, Eco Stack) do not exist as real,
// playable game entries in src/data/arcade.js's arcadeGames catalog
// (confirmed: that catalog only has debt-hunter / career-rush / client-sim
// / resume-quest). Shown as a display fixture, original-artwork-slot cards
// — never inserted into arcadeGames or any real ledger/leaderboard key.
export const CLASSIC_GAMES_DEMO = [
  {
    id: "orbit-defender",
    title: "Orbit Defender",
    skills: ["Logic", "Timing", "Systems"],
    difficulty: "Beginner",
    rating: 4.7,
    xp: 150,
  },
  {
    id: "pixel-foundry",
    title: "Pixel Foundry",
    skills: ["Creativity", "Patterns", "Loops"],
    difficulty: "Beginner",
    rating: 4.6,
    xp: 120,
  },
  {
    id: "circuit-runner",
    title: "Circuit Runner",
    skills: ["Logic", "Flow", "Optimization"],
    difficulty: "Intermediate",
    rating: 4.5,
    xp: 110,
  },
  {
    id: "eco-stack",
    title: "Eco Stack",
    skills: ["Systems", "Balance", "Strategy"],
    difficulty: "Intermediate",
    rating: 4.6,
    xp: 130,
  },
];

// --- Featured cabinet (Room §B) -----------------------------------------
export const FEATURED_CABINET_DEMO = {
  id: "orbit-defender",
  title: "Orbit Defender",
  skills: ["Logic + Timing", "Loops", "Coordinates", "Systems Thinking"],
};

// --- Student Hall of Fame (Room §F) -------------------------------------
// Privacy-safe: stylized fictional gamertag handles only, never a real
// student's full name or any identifier that could re-identify them. Not
// sourced from the real per-game leaderboard (Leaderboard.jsx's
// localStorage `lb_<gameKey>` entries), since that store holds whatever
// free-text name a student typed in — using it here would risk exposing
// exactly what this section must not expose. Kept as a clearly separate
// demo fixture instead. "JamieR_2025 (You)" mirrors the sidebar's demo
// persona (ArcadeSidebar.jsx / ArcadeHeaderExtras.jsx both show "Jamie
// Rivera") so the "(You)" row reads as the same person, not a mismatch.
export const HALL_OF_FAME_DEMO = [
  { displayName: "NovaCoder_17", rank: 1, xp: 6320, title: "Orbit Defender Master" },
  { displayName: "PixelPilot_42", rank: 2, xp: 5410, title: "Circuit Runner Expert" },
  { displayName: "CodeCrafter_9", rank: 3, xp: 4980, title: "Pixel Foundry Pro" },
  { displayName: "JamieR_2025 (You)", rank: 18, xp: 2450, title: "Eco Stack Strategist" },
];

// --- Upcoming Challenges (Room §G) --------------------------------------
export const UPCOMING_CHALLENGE_DEMO = {
  title: "Friday Retro Build Jam",
  date: "May 16, 2026",
  time: "4:00 PM CT",
  teamSize: "Teams of 2–4",
  skillLevel: "All Skill Levels",
  instructorApproved: true,
};
