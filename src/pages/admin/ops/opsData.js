export const OPS_INTERNAL_NOTICE =
  "Internal SHS production workflow. Clients see approved demos, deliverables, timelines, and finished systems — not internal build packets, prompts, QA machinery, or adaptive learning.";

export const opsRoutes = [
  { path: "/ops/production", label: "Production Dashboard", key: "production" },
  { path: "/ops/projects", label: "Project Setup", key: "projects" },
  { path: "/ops/brand-profile", label: "Brand Profile", key: "brandProfile" },
  { path: "/ops/page-intent", label: "Page Intent", key: "pageIntent" },
  { path: "/ops/layout-blueprint", label: "Layout Blueprint", key: "layoutBlueprint" },
  { path: "/ops/visual-treatment", label: "Visual Treatment", key: "visualTreatment" },
  { path: "/ops/assets", label: "Asset Governance", key: "assets" },
  { path: "/ops/data-binding", label: "Data Binding", key: "dataBinding" },
  { path: "/ops/mock-review", label: "Mock Review", key: "mockReview" },
  { path: "/ops/build-packet", label: "Build Packet", key: "buildPacket" },
  { path: "/ops/screenshot-qa", label: "Screenshot QA", key: "screenshotQa" },
  { path: "/ops/learning", label: "Learning Dashboard", key: "learning" },
];

export const opsPipeline = [
  "Sales discovery",
  "Quick demo/mock",
  "Approval",
  "Scope confirmation",
  "Build-ready packet",
  "Codex implementation",
  "Screenshot QA",
  "Functional QA",
  "Delivery",
  "Adaptive learning loop",
];

export const opsStageStatusOptions = [
  "Not Started",
  "In Progress",
  "Ready for Review",
  "Approved",
  "Blocked",
];

export const opsPageTypes = [
  "Sales Page",
  "Report Page",
  "Dashboard Page",
  "Portal Page",
  "Intake Page",
  "Admin Page",
  "Workflow Page",
  "Public Page",
  "Internal Page",
];

export const opsProjects = [
  {
    id: "ops_project_cic_demo",
    name: "Community Impact Center Demo",
    type: "Client demo",
    brandSystem: "SHS admin blue",
    owner: "Sales + Build",
    status: "Active",
    stage: "Mock review",
    priority: "High",
    confidentiality: "Internal only",
    next: "Confirm approved screen list and packet notes.",
  },
  {
    id: "ops_project_growth_console",
    name: "Partner Growth Console",
    type: "Internal product",
    brandSystem: "SHS command",
    owner: "Development",
    status: "QA",
    stage: "Screenshot QA",
    priority: "Medium",
    confidentiality: "SHS internal",
    next: "Compare screenshots against approved internal mock.",
  },
  {
    id: "ops_project_referral_pilot",
    name: "Referral Intake Pilot",
    type: "Client pilot",
    brandSystem: "Client-neutral demo",
    owner: "Sales",
    status: "Discovery",
    stage: "Discovery",
    priority: "High",
    confidentiality: "Pre-approval",
    next: "Collect audience, workflows, exclusions, and timeline.",
  },
];

export const opsDefaultPages = [
  {
    id: "ops_page_cic_home",
    projectId: "ops_project_cic_demo",
    pageName: "CIC Demo Home",
    route: "/demo/community-impact",
    pageType: "Sales Page",
    audience: "Community executives and funders",
    primaryGoal: "Show the approved demo path and conversion story.",
    status: "Active",
    mockStatus: "Ready for Review",
    specStatus: "In Progress",
    buildPacketStatus: "Not Started",
    qaStatus: "Not Started",
    screenshotMatchScore: "82",
    activeStage: "Mock review",
    notes: "Keep this page client-demo friendly; internal packet details stay hidden.",
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-01T12:00:00.000Z",
  },
  {
    id: "ops_page_growth_dashboard",
    projectId: "ops_project_growth_console",
    pageName: "Growth Console Dashboard",
    route: "/admin.html#/growth",
    pageType: "Dashboard Page",
    audience: "SHS internal growth team",
    primaryGoal: "Prioritize partner opportunities and next actions.",
    status: "QA",
    mockStatus: "Approved",
    specStatus: "Approved",
    buildPacketStatus: "Approved",
    qaStatus: "In Progress",
    screenshotMatchScore: "88",
    activeStage: "Screenshot QA",
    notes: "Compare dashboard density and table behavior against approved mock.",
    createdAt: "2026-06-01T12:05:00.000Z",
    updatedAt: "2026-06-01T12:05:00.000Z",
  },
  {
    id: "ops_page_referral_intake",
    projectId: "ops_project_referral_pilot",
    pageName: "Referral Intake",
    route: "/hub/intake",
    pageType: "Intake Page",
    audience: "Partner intake navigators",
    primaryGoal: "Capture referral details with consent and next-step clarity.",
    status: "Discovery",
    mockStatus: "Not Started",
    specStatus: "In Progress",
    buildPacketStatus: "Not Started",
    qaStatus: "Not Started",
    screenshotMatchScore: "",
    activeStage: "Sales discovery",
    notes: "Gather required fields and out-of-scope backend assumptions.",
    createdAt: "2026-06-01T12:10:00.000Z",
    updatedAt: "2026-06-01T12:10:00.000Z",
  },
];

export const opsDefaultStageStatus = opsPipeline.reduce((acc, stage, index) => {
  acc[stage] = index === 0 ? "In Progress" : "Not Started";
  return acc;
}, {});

export const opsDefaultBuildPacketDraft = {
  brandProfile:
    "Audience: executive buyer and operational lead. Tone: clear, credible, implementation-ready. Avoid public Foundation styling.",
  pageIntent:
    "Primary pages should show what the user can decide or do next, not generic marketing copy.",
  layoutBlueprint:
    "Use compact admin sections, visible state, clear tables, and no public landing-page hero treatment.",
  visualTreatment:
    "Use SHS internal admin blues, slate surfaces, restrained cyan accents, and dense operational cards.",
  assets:
    "Use approved logos, generated mock screenshots, and internal-only placeholders until client approval.",
  dataBinding:
    "Use local mock data for V1 demos. Mark future API fields clearly before build handoff.",
  mockReview:
    "Confirm route list, user tasks, screenshot expectations, and client-facing language before implementation.",
  qaChecklist:
    "Desktop screenshot, mobile screenshot, route load, text fit, sidebar visibility, localStorage persistence, no public route changes.",
};

export const opsDefaultPageBuildPacketDraft = {
  brandProfile: opsDefaultBuildPacketDraft.brandProfile,
  pageIntent: opsDefaultBuildPacketDraft.pageIntent,
  layoutBlueprint: opsDefaultBuildPacketDraft.layoutBlueprint,
  visualTreatment: opsDefaultBuildPacketDraft.visualTreatment,
  assets: opsDefaultBuildPacketDraft.assets,
  dataBinding: opsDefaultBuildPacketDraft.dataBinding,
  mockReview: opsDefaultBuildPacketDraft.mockReview,
  qaChecklist: opsDefaultBuildPacketDraft.qaChecklist,
};

export const opsDefaultScreenshotNotes = {
  mockNotes: "Approved mock should feel clean, operational, and client-demo ready.",
  builtNotes: "Record implementation screenshot observations here.",
  matchScore: "82",
  driftCategory: "Visual Drift",
  updatedAt: "",
};

export const opsDefaultLearningEvents = [
  {
    id: "ops_learning_packet_specificity",
    category: "Build Packet Issue",
    note: "Build packets need explicit non-goals and allowed file paths before Codex implementation.",
    createdAt: "2026-06-01T12:00:00.000Z",
  },
  {
    id: "ops_learning_screenshot_first",
    category: "Time Saver",
    note: "Screenshot QA catches layout drift faster when mock and built screenshots are compared before functional QA.",
    createdAt: "2026-06-01T12:05:00.000Z",
  },
];

export const opsLearningCategories = [
  "Visual Drift",
  "Build Packet Issue",
  "Asset Issue",
  "Data Binding Issue",
  "Approval Delay",
  "QA Failure",
  "Time Saver",
  "Template Opportunity",
];

export const opsPageContent = {
  production: {
    eyebrow: "Production Ops",
    title: "Internal Production Dashboard",
    summary:
      "Track the sales-to-build path from discovery through delivery while keeping internal prompts, QA notes, and build machinery inside SHS.",
    status: "V1 admin workflow",
    primary: "Current workflow pressure",
    bullets: [
      "Keep approved client-facing demos separate from internal implementation packets.",
      "Move projects from discovery to build-ready scope with fewer handoff gaps.",
      "Capture QA findings and learning signals for the next production cycle.",
    ],
    cards: [
      { label: "Active production lanes", value: "3", detail: "Discovery, mock review, screenshot QA" },
      { label: "Build packets ready", value: "2", detail: "Awaiting Codex implementation window" },
      { label: "Learning signals", value: "18", detail: "Reusable corrections from recent builds" },
    ],
  },
  projects: {
    eyebrow: "Intake",
    title: "Project Setup",
    summary:
      "Create the internal project spine before any demo or build work starts: audience, buyer, owner, outcome, scope, risk, and approval path.",
    status: "Discovery intake",
    primary: "Setup checklist",
    bullets: [
      "Record client-visible promise separately from internal execution notes.",
      "Name the SHS owner, sales owner, and build owner.",
      "Define what is in scope, out of scope, and deferred.",
    ],
  },
  brandProfile: {
    eyebrow: "Discovery",
    title: "Brand Profile",
    summary:
      "Capture the client or product identity in a structured internal profile before visual work begins.",
    status: "Brand inputs",
    primary: "Profile fields",
    bullets: [
      "Audience, tone, vocabulary, trust signals, logo usage, and visual constraints.",
      "Approved references and prohibited references.",
      "Client-facing language that can be reused in demos and final delivery.",
    ],
  },
  pageIntent: {
    eyebrow: "Planning",
    title: "Page Intent",
    summary:
      "Define what each page must help the user do so the mock and build do not drift into generic marketing screens.",
    status: "Intent mapping",
    primary: "Intent rules",
    bullets: [
      "Name the primary user action for every screen.",
      "Separate first-visit explanation from repeated operational use.",
      "Mark proof points, conversion points, and decision support zones.",
    ],
  },
  layoutBlueprint: {
    eyebrow: "Planning",
    title: "Layout Blueprint",
    summary:
      "Turn approved page intent into a buildable layout plan before visual polish or implementation starts.",
    status: "Blueprinting",
    primary: "Blueprint outputs",
    bullets: [
      "Screen list, section order, major components, and responsive priorities.",
      "Required states for empty, loading, active, success, and review conditions.",
      "Layout constraints that Codex should preserve during implementation.",
    ],
  },
  visualTreatment: {
    eyebrow: "Design",
    title: "Visual Treatment",
    summary:
      "Choose the internal visual direction for the demo while keeping public Foundation and Solutions styles untouched.",
    status: "Visual system",
    primary: "Treatment controls",
    bullets: [
      "Define color, density, motion, imagery, and component feel for this project only.",
      "Document what must not be borrowed from public SHS or SHF surfaces.",
      "Confirm readability and executive-demo polish before approval.",
    ],
  },
  assets: {
    eyebrow: "Governance",
    title: "Asset Governance",
    summary:
      "Track which images, logos, exports, screenshots, and generated assets are approved for demos, build packets, and delivery.",
    status: "Asset control",
    primary: "Governance checks",
    bullets: [
      "Separate internal-only assets from client-approved deliverables.",
      "Record source, usage rights, replacement status, and approval owner.",
      "Prevent placeholder art from leaking into final delivery.",
    ],
  },
  dataBinding: {
    eyebrow: "Implementation",
    title: "Data Binding",
    summary:
      "Map static mock content to future data sources, local demo data, API contracts, and backend work that is intentionally deferred.",
    status: "Mock data",
    primary: "Binding map",
    bullets: [
      "Use local mock data for V1 demos until backend scope is approved.",
      "Mark every field as static, mock, computed, imported, or future API.",
      "Keep client promises aligned with what the build can actually support.",
    ],
  },
  mockReview: {
    eyebrow: "Approval",
    title: "Mock Review",
    summary:
      "Review the quick demo/mock with internal stakeholders before client approval and build packet creation.",
    status: "Review loop",
    primary: "Review criteria",
    bullets: [
      "Confirm page purpose, audience fit, executive clarity, and visual credibility.",
      "Capture approval notes and required changes before implementation begins.",
      "Reject mocks that look good but do not support the workflow.",
    ],
  },
  buildPacket: {
    eyebrow: "Build",
    title: "Build Packet",
    summary:
      "Package the approved scope, mock, copy, assets, constraints, and QA expectations into a Codex-ready implementation brief.",
    status: "Implementation packet",
    primary: "Packet instruction",
    callout: "Do not redesign. Build from this packet.",
    bullets: [
      "Include approved route list, component scope, data assumptions, and non-goals.",
      "List files that are allowed to change and files that must not be touched.",
      "Attach screenshot expectations and functional acceptance checks.",
    ],
  },
  screenshotQa: {
    eyebrow: "QA",
    title: "Screenshot QA",
    summary:
      "Compare implementation screenshots against the approved mock and record visual regressions before functional QA.",
    status: "Visual QA",
    primary: "Screenshot checks",
    bullets: [
      "Verify desktop and mobile framing, text fit, density, hierarchy, and brand alignment.",
      "Record exact viewport, route, screenshot file, and correction note.",
      "Escalate mismatches before delivery or client review.",
    ],
  },
  learning: {
    eyebrow: "Learning",
    title: "Adaptive Learning Dashboard",
    summary:
      "Capture what SHS learned from discovery, mock review, build, QA, and delivery so the next workflow starts smarter.",
    status: "Adaptive loop",
    primary: "Learning signals",
    bullets: [
      "Turn repeated QA fixes into reusable build guidance.",
      "Track which demo patterns helped approval and which created confusion.",
      "Feed project outcomes back into future scope, packet, and QA defaults.",
    ],
    cards: [
      { label: "Reusable QA lessons", value: "7", detail: "Spacing, route protection, screenshot parity" },
      { label: "Approval accelerators", value: "4", detail: "Demo-first framing, clear packet constraints" },
      { label: "Scope risks captured", value: "5", detail: "Backend deferrals and public/private boundaries" },
    ],
  },
};
