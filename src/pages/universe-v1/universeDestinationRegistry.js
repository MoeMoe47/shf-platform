// src/pages/universe-v1/universeDestinationRegistry.js
// ------------------------------------------------------------
// Ported, byte-for-byte behavior preserved, from the approved reference
// implementation:
//   /Users/mikeslate/Desktop/silicon-heartland-universe-3d/browser-preview/
//   shu-cinematic-browser-preview-v1/src/universeDestinationRegistry.js
//
// This is the single destination authority for the canonical Universe —
// every navigation decision (available/unavailable, href resolution) goes
// through the two functions at the bottom of this file. Nothing else in
// the app should hardcode a destination URL.
//
// Two corrections made during the canonical migration, both required
// strictly for routing/integration (no visual/interaction change):
//
// 1. BOS and SHF are now served BY this same application (shrv1 —
//    solutions.html / foundation.html), since the canonical Universe was
//    ported into shrv1 rather than staying a separate origin on port
//    5175. They no longer need cross-origin resolution — `productionPath`
//    is now used directly as a same-origin relative href. The reference
//    registry's `localDevelopmentOrigin: 'http://127.0.0.1:5175'` for
//    both of these was pointing at the *Universe preview's own port*
//    (itself), not at shrv1 — a bug inherited from when the registry was
//    authored against a `/Users/mikeslate/Desktop/shrv1` checkout on a
//    different assumed port than this repository's actual 5173.
//
// 2. Autonomous Registry remains a genuinely separate application/port
//    (a different git repository entirely: ~/Desktop/autonomous-registry,
//    which hard-codes `vite --port 5174 --strictPort` in its own
//    package.json). That cross-origin resolution is preserved, still
//    centralized here (not hardcoded in components), and still
//    overridable via VITE_AUTONOMOUS_REGISTRY_ORIGIN.
export const CANONICAL_UNIVERSE_ROUTE = '/universe';
export const V1_LAB_ROUTE = '/universe/v1-lab';
export const V2_LAB_ROUTE = '/universe/v2-lab';
export const UNIVERSE_DIRECTORY_ROUTE = '/universe/directory';
export const RETURN_TO_UNIVERSE_LABEL = 'RETURN TO UNIVERSE';

// ------------------------------------------------------------
// Ecosystem audit and registry expansion (2026-08-27)
// ------------------------------------------------------------
// The six original records below (bos, silicon-heartland-foundation, aos,
// open-autonomous-standard, autonomous-registry, autonomous-trust-bureau)
// were authored for the cinematic V1 lab's five-world journey plus SHF,
// and their `label`/`title`/`description`/`route`/`destinationType`/
// `availability`/`publicNavigationStatus`/`productionPath`/`x`/`y`/
// `radius`/`sceneAvailable` fields are read directly by the cinematic
// scene (UniverseV1Lab, V1LabTarget, V1DestinationPreview in
// UniverseApp.jsx) and by tests/ui/universe-canonical.spec.mjs. Per this
// audit's explicit guardrail against changing the cinematic /universe,
// none of those fields were altered on the six original records — not
// even where the audit found a real title/entity mismatch (see the `bos`
// record's own comment below). Only new, additive fields were appended.
//
// A full repo-wide census (see the audit report delivered alongside this
// change) found many more real, reachable, evidenced destinations. Every
// new record added below:
//   - sets `sceneAvailable: false`, so it is never read by the cinematic
//     scene's `destinations.filter(d => d.sceneAvailable)` and can never
//     appear as a planet in `/universe` — it renders only in the
//     `/universe/directory` gateway (UniverseGateway.jsx), which reads
//     the full `universeDestinations` array regardless of scene
//     eligibility;
//   - carries real `sourceEvidence` (a file path or route this audit
//     actually verified), never an invented route.
//
// Taxonomy (Phase 5): every record now carries `entityType`, one of:
//   'institution'      — owns/governs/represents part of the ecosystem
//   'platform'          — a major operating environment / infrastructure
//   'application'       — a user-facing product surface
//   'standard'          — a formal standard or governance surface
//   'public-surface'    — public-facing, not itself an org or product
//   'internal-surface'  — operational/privileged; excluded from the
//                          Universe by default (none are registered here)
//   'future'            — conceptually real, no reachable route yet
//
// Status/access model (Phase 6/7) — kept deliberately separate from
// entityType and from the legacy availability/publicNavigationStatus
// fields the cinematic scene depends on:
//   status: 'live' | 'dormant' | 'planned' | 'restricted'
//   access: 'public' | 'authenticated' | 'admin-only' | 'unknown'
// `access: 'unknown'` is used rather than a guess wherever this audit
// could not confidently verify the real access boundary.
export const ENTITY_TYPES = Object.freeze({
  INSTITUTION: 'institution',
  PLATFORM: 'platform',
  APPLICATION: 'application',
  STANDARD: 'standard',
  PUBLIC_SURFACE: 'public-surface',
  INTERNAL_SURFACE: 'internal-surface',
  FUTURE: 'future',
});

export const universeDestinations = [
  {
    id: 'bos',
    bodyClass: 'focus-bos',
    label: 'BOS',
    title: 'SHS Business Operating System',
    route: '/universe/bos',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/solutions.html#/home',
    sourceEvidence: 'src/router/SolutionsRoutes.jsx (this repository)',
    description: 'Business operating destination for coordinated workflows and institutional execution.',
    entryActionLabel: 'ENTER BOS',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter SHS Business Operating System',
    sceneAvailable: true,
    x: 0.094,
    y: 0.281,
    radius: 0.072,
    // Audit note (2026-08-27): the real page this record routes to
    // (solutions.html#/home) is Silicon Heartland Solutions' public
    // organization/marketing site (SolutionsHome.jsx — "Silicon Heartland
    // Solutions", "Why Organizations Choose SHS") — not the internal SHS
    // BOS operating console, which really lives at
    // admin.html#/ops/executive-command (see the new
    // 'shs-bos-executive-command' record below, entityType 'platform').
    // `label`/`title`/`description`/`route` above are preserved verbatim
    // for cinematic-scene stability; entityType here reflects what this
    // record's real productionPath actually is.
    entityType: ENTITY_TYPES.INSTITUTION,
    owner: 'Silicon Heartland Solutions',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'silicon-heartland-foundation',
    bodyClass: 'focus-foundation',
    label: 'SHF',
    name: 'Silicon Heartland Foundation',
    shortName: 'SHF',
    title: 'Silicon Heartland Foundation',
    celestialBody: 'Earth',
    route: '/universe/silicon-heartland-foundation',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/foundation.html#reports',
    sourceEvidence: 'foundation.html (this repository)',
    description: 'Public foundation-facing information for impact, reporting, access, and opportunity without exposing internal SHS operations.',
    accessibilityLabel: 'Enter Silicon Heartland Foundation',
    analyticsId: 'destination_shf_enter',
    entryActionLabel: 'ENTER FOUNDATION',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    canonicalOwner: 'Silicon Heartland Foundation',
    sceneAvailable: true,
    x: 0.756,
    y: 0.671,
    radius: 0.104,
    entityType: ENTITY_TYPES.INSTITUTION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'aos',
    bodyClass: 'focus-aos',
    label: 'AOS',
    title: 'Autonomous Operating System',
    route: '/universe/aos',
    destinationType: 'planned-unavailable',
    availability: 'planned',
    publicNavigationStatus: 'unavailable',
    sourceEvidence: 'Candidate SHRV1 admin route /admin.html#/ops/agents exists but currently resolves through an auth boundary with /api/auth/me 500 in local verification.',
    description: 'Agent-side operating destination for autonomous coordination and execution.',
    sceneAvailable: true,
    x: 0.37,
    y: 0.188,
    radius: 0.047,
    // Audit note (2026-08-27): the real admin candidate this record's
    // sourceEvidence points to (admin.html#/ops/agents) renders as "SHS
    // Agent Command Center" / "Agent Workbench"
    // (src/pages/admin/agents/AgentWorkbenchPage.jsx) — a genuinely real,
    // reachable, admin-gated page, not a broken/nonexistent route. The
    // legacy availability/publicNavigationStatus fields above are left as
    // 'planned'/'unavailable' for cinematic-scene stability; access/status
    // below reflect the real, verified access boundary instead.
    entityType: ENTITY_TYPES.PLATFORM,
    owner: 'Silicon Heartland Solutions',
    parentPlatform: null,
    status: 'restricted',
    access: 'admin-only',
    universeVisible: true,
  },
  {
    id: 'open-autonomous-standard',
    bodyClass: 'focus-standard',
    label: 'Standard',
    title: 'Open Autonomous Standard',
    route: '/universe/open-autonomous-standard',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/oas.html',
    sourceEvidence: 'oas.html title "Open Autonomous Standard" + src/entries/oas.main.jsx + src/pages/oas/OASLandingPage.jsx (public mounted OAS landing page).',
    description: 'Neutral constitutional standards foundation for autonomous systems.',
    entryActionLabel: 'ENTER OAS',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Open Autonomous Standard',
    sceneAvailable: true,
    x: 0.634,
    y: 0.226,
    radius: 0.026,
    // FE-0 correction (2026-09-11): the previously planned record now
    // resolves to the existing public OAS landing entry. OAS remains an
    // independent standards authority; this navigation assignment does not
    // grant it SHS or Agent Fabric authority.
    entityType: ENTITY_TYPES.STANDARD,
    owner: 'Open Autonomous Standard',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'autonomous-registry',
    bodyClass: 'focus-registry',
    label: 'Registry',
    title: 'Autonomous Registry',
    route: '/universe/autonomous-registry',
    destinationType: 'independent-local-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/',
    localDevelopmentOrigin: 'http://127.0.0.1:5174',
    originEnv: 'VITE_AUTONOMOUS_REGISTRY_ORIGIN',
    sourceEvidence: '/Users/mikeslate/Desktop/autonomous-registry (separate repository, vite --port 5174 --strictPort)',
    description: 'Independent registration, identity, provenance, and traceability authority.',
    entryActionLabel: 'ENTER REGISTRY',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Autonomous Registry',
    sceneAvailable: true,
    x: 0.716,
    y: 0.211,
    radius: 0.024,
    // Audit note (2026-08-27): confirmed genuinely independent — its own
    // separate git repository/dev server (see sourceEvidence above), and
    // referenced in-app as "a real, independent" project (see
    // src/pages/arcade/ArcadeDashboard.jsx, src/data/arcadeHomeFixtures.js).
    // Classified as an institution (a registration/identity/provenance
    // authority), not an application — it is not a single product surface,
    // it is an independent authority the rest of the ecosystem defers to.
    entityType: ENTITY_TYPES.INSTITUTION,
    owner: 'Autonomous Registry',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'autonomous-trust-bureau',
    bodyClass: 'focus-bureau',
    label: 'Bureau',
    title: 'Autonomous Trust Bureau',
    route: '/universe/autonomous-trust-bureau',
    destinationType: 'planned-unavailable',
    availability: 'planned',
    publicNavigationStatus: 'unavailable',
    sourceEvidence: 'Candidate SHRV1 admin route /admin.html#/verification-audit exists but currently resolves through an auth boundary with /api/auth/me 500 in local verification.',
    description: 'Independent assessment, evidence, trust, and reporting authority.',
    sceneAvailable: true,
    x: 0.83,
    y: 0.372,
    radius: 0.034,
    // Audit note (2026-08-27): the admin candidate this record's
    // sourceEvidence points to (admin.html#/verification-audit) is a real
    // page ("Verification Audit Surface",
    // src/pages/admin/reporting/VerificationAuditSurface.jsx) but its
    // mapping to "Autonomous Trust Bureau" is this repo's own approximate
    // narrative pairing, not a literal brand match — no page anywhere
    // uses the words "Autonomous Trust Bureau". Kept planned/unconfirmed
    // rather than promoted to live, matching the original author's own
    // caution in sourceEvidence above.
    entityType: ENTITY_TYPES.INSTITUTION,
    owner: null,
    parentPlatform: null,
    status: 'planned',
    access: 'unknown',
    universeVisible: true,
  },

  // ------------------------------------------------------------
  // New records added by the 2026-08-27 ecosystem audit. Every record in
  // this block has `sceneAvailable: false` — none of them can appear in
  // the cinematic /universe scene; they render only in
  // /universe/directory (UniverseGateway.jsx). See this file's top
  // comment and the audit report for the full census/evidence.
  // ------------------------------------------------------------

  {
    id: 'shs-bos-executive-command',
    label: 'BOS OPS',
    title: 'SHS BOS Executive Command Center',
    route: '/universe/shs-bos-executive-command',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/admin.html#/ops/executive-command',
    sourceEvidence: 'src/pages/admin/executive-command/ShsBosExecutiveCommandCenterPage.jsx (self-titled "SHS BOS Executive Command Center") + src/router/AdminRoutes.jsx:210 (admin.html#/ops/executive-command, admin-only via SHS_SECURITY_PERMISSIONS.AUDIT_VIEW)',
    description: 'Internal readiness, health, safety, and governance command center for the Silicon Heartland Solutions Business Operating System. Requires SHS administrator sign-in.',
    entryActionLabel: 'ENTER (ADMIN SIGN-IN REQUIRED)',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter SHS BOS Executive Command Center (admin sign-in required)',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.PLATFORM,
    owner: 'Silicon Heartland Solutions',
    parentPlatform: null,
    status: 'restricted',
    access: 'admin-only',
    universeVisible: true,
  },

  {
    id: 'agent-fabric',
    label: 'AGENT FABRIC',
    title: 'Agent Fabric Control Center',
    route: '/universe/agent-fabric',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/admin.html#/agent-fabric',
    sourceEvidence: 'src/pages/admin/agent-fabric/AgentFabricPage.jsx + src/router/AdminRoutes.jsx (/agent-fabric, admin-only via SHS_SECURITY_PERMISSIONS.AUDIT_VIEW).',
    description: 'Admin control surface for bounded, governed Agent Fabric coordination and policy state.',
    entryActionLabel: 'ENTER (ADMIN SIGN-IN REQUIRED)',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Agent Fabric Control Center (admin sign-in required)',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.PLATFORM,
    owner: 'Silicon Heartland Solutions',
    parentPlatform: null,
    status: 'restricted',
    access: 'admin-only',
    universeVisible: true,
  },

  // -- Applications (src/data/apps.registry.js / foundation.html#/apps, --
  // -- Foundation's own public "Apps" gallery — PublicApps.jsx) --------
  // apps.registry.js is this repo's own pre-existing canonical list of
  // public-facing applications, already publicly surfaced by the
  // Foundation at foundation.html#/apps. Every href below was
  // independently re-verified against each app's real router file and
  // confirmed unauthenticated (no AuthProvider/protect() wrapper) during
  // this audit. "Solutions Marketplace", "Foundation Dashboard", and
  // "Admin App Gallery" entries in that file were deliberately not
  // duplicated here — Solutions and Foundation are already represented
  // above (bos, silicon-heartland-foundation), and the Admin App Gallery
  // is the curation tool for this very list, not a distinct destination.
  {
    id: 'career',
    label: 'Career',
    title: 'Career Center',
    route: '/universe/career',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/career.html#/',
    sourceEvidence: 'src/data/apps.registry.js ("Career Center") + career.html title "SHF Career" + src/router/CareerRoutes.jsx public entry; personal routes classified separately',
    description: 'Plan careers, track skills, and prove readiness.',
    entryActionLabel: 'ENTER CAREER CENTER',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Career Center',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'curriculum',
    label: 'Curriculum',
    title: 'Curriculum Hub',
    route: '/universe/curriculum',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/curriculum.html#/dashboard',
    sourceEvidence: 'src/data/apps.registry.js ("Curriculum Hub") + curriculum.html title "Curriculum — Silicon Heartland" + src/router/CurriculumRoutes.jsx (public, no auth wrapper)',
    description: 'Accredited courses with portfolio evidence baked in.',
    entryActionLabel: 'ENTER CURRICULUM',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Curriculum Hub',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'arcade',
    label: 'Arcade',
    title: 'Workforce Arcade',
    route: '/universe/arcade',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/arcade.html#/',
    sourceEvidence: 'src/data/apps.registry.js ("Workforce Arcade") + arcade.html title "Arcade — Silicon Heartland" + src/router/ArcadeRoutes.jsx (public, no auth wrapper)',
    description: 'Skill-building games with real-world badges.',
    entryActionLabel: 'ENTER ARCADE',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Workforce Arcade',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'civic',
    label: 'Civic Lab',
    title: 'Civic Lab',
    route: '/universe/civic',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/civic.html#/dashboard',
    sourceEvidence: 'src/data/apps.registry.js ("Civic Lab") + civic.html title "Civic — Silicon Heartland" + src/router/CivicRoutes.jsx (public, no auth wrapper)',
    description: 'Build civic DNA, missions, and impact portfolios.',
    entryActionLabel: 'ENTER CIVIC LAB',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Civic Lab',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'credit',
    label: 'Credit',
    title: 'Credit Lab',
    route: '/universe/credit',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/credit.html#/dashboard',
    sourceEvidence: 'src/data/apps.registry.js ("Credit Lab") + credit.html title "Credit — Silicon Heartland" + src/router/CreditRoutes.jsx (public, no auth wrapper)',
    description: 'Simulate reports, disputes, and score moves.',
    entryActionLabel: 'ENTER CREDIT LAB',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Credit Lab',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'debt',
    label: 'Debt Clock',
    title: 'Debt Clock',
    route: '/universe/debt',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/debt.html#/dashboard',
    sourceEvidence: 'src/data/apps.registry.js ("Debt Clock") + debt.html title "Debt — Silicon Heartland" + src/router/DebtRoutes.jsx (public, no auth wrapper)',
    description: 'See the path out of debt in real time.',
    entryActionLabel: 'ENTER DEBT CLOCK',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Debt Clock',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'employer',
    label: 'Employer',
    title: 'Employer Hub',
    route: '/universe/employer',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/employer.html#/dashboard',
    sourceEvidence: 'src/data/apps.registry.js ("Employer Hub") + employer.html title "Employer — Silicon Heartland" + src/router/EmployerRoutes.jsx (public, no auth wrapper)',
    description: 'Internships, reimbursement, and hiring pipelines.',
    entryActionLabel: 'ENTER EMPLOYER HUB',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Employer Hub',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'treasury',
    label: 'Treasury',
    title: 'Treasury',
    route: '/universe/treasury',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/treasury.html#/dashboard',
    sourceEvidence: 'src/data/apps.registry.js ("Treasury") + treasury.html title "Treasury — Silicon Heartland" + src/router/TreasuryRoutes.jsx (public, no auth wrapper). Note: ledger.html is a duplicate/alias build entry for this same app (ledger.main.jsx sets data-app="treasury" and reuses treasury CSS; Treasury itself already has a nested "ledger" route) and was deliberately not added as a second destination.',
    description: 'Track grants, donations, and blockchain proofs.',
    entryActionLabel: 'ENTER TREASURY',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Treasury',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'sales',
    label: 'Sales',
    title: 'Sales Studio',
    route: '/universe/sales',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/sales.html#/dashboard',
    sourceEvidence: 'src/data/apps.registry.js ("Sales Studio") + sales.html title "Sales — Silicon Heartland" + src/router/SalesRoutes.jsx (public, no auth wrapper)',
    description: 'Leads, pipelines, and impact-driven sales.',
    entryActionLabel: 'ENTER SALES STUDIO',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Sales Studio',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'store',
    label: 'Store',
    title: 'Store',
    route: '/universe/store',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/store.html#/catalog',
    sourceEvidence: 'src/data/apps.registry.js ("Store") + store.html title "Store — Silicon Heartland" + src/router/StoreRoutes.jsx (public, no auth wrapper)',
    description: 'Merch, bundles, and supporter gear.',
    entryActionLabel: 'ENTER STORE',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Store',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'ai-job-compass',
    label: 'AI',
    title: 'AI Job Compass',
    route: '/universe/ai-job-compass',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/ai.html#/job-compass',
    sourceEvidence: 'src/data/apps.registry.js ("AI Job Compass") + ai.html title "AI — Silicon Heartland" + src/router/AIRoutes.jsx (public, no auth wrapper)',
    description: 'See which jobs AI will change and how to react.',
    entryActionLabel: 'ENTER AI JOB COMPASS',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter AI Job Compass',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'allocation',
    label: 'Allocation',
    title: 'SHF Allocation Intelligence',
    route: '/universe/allocation',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/allocation.html',
    sourceEvidence: 'allocation.html title "SHF Allocation Intelligence — Franklin County" + src/apps/allocation/AllocationApp.jsx (public; a client-side "SHF-ADMIN" code string gates specific export actions only, not the page itself)',
    description: 'Franklin County resource allocation modeling and simulation.',
    entryActionLabel: 'ENTER ALLOCATION',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter SHF Allocation Intelligence',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },
  {
    id: 'verifier',
    label: 'Verifier',
    title: 'External Proof Verifier',
    route: '/universe/verifier',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/verifier.html',
    sourceEvidence: 'verifier.html title "Verifier • SHF" + src/pages/Verifier.jsx ("External Proof Verifier", public, no auth wrapper). Note: credit.html#/verifier mounts the same component under Credit\'s route tree — a duplicate entry point, not added as a second destination.',
    description: 'Independently verify external completion/credential proofs.',
    entryActionLabel: 'ENTER VERIFIER',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter External Proof Verifier',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.APPLICATION,
    owner: null,
    parentPlatform: null,
    status: 'live',
    access: 'public',
    universeVisible: true,
  },

  // -- Public surfaces ---------------------------------------------------
  {
    id: 'lord-of-outcomes',
    label: 'LOO',
    title: 'Lord of Outcomes',
    route: '/universe/lord-of-outcomes',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/lord-of-outcomes.html',
    sourceEvidence: 'lord-of-outcomes.html title "Lord of Outcomes" + src/router/LordOutcomesRoutes.jsx (public, no auth wrapper) + docs/COMMAND_DASHBOARD_ROUTE_ESTABLISHMENT_V1.md ("Existing public/non-admin Lord of Outcomes app remains separate at lord-of-outcomes.html"). Note: launch.html (LaunchRoutes.jsx) imports the identical LordOutcomesLayout/LordOutcomesHome/StateOutcomesPage/ProgramOutcomesPage/EmployerImpactPage/FundingImpactPage components — it is a duplicate/alias build entry for this same app (and has no <title>), not a distinct "Launchpad" destination, and was deliberately not added.',
    description: 'Public outcomes and impact reporting across states, programs, employers, and funding, plus pilot program tracking.',
    entryActionLabel: 'ENTER LORD OF OUTCOMES',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter Lord of Outcomes',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.PUBLIC_SURFACE,
    owner: null,
    parentPlatform: null,
    // Route verification (Phase 15, 2026-08-27): lord-of-outcomes.html
    // loads with no console error, but src/entries/lordOutcomes.main.jsx
    // renders <LordOutcomesRoutes/> (which uses <Routes>) with no
    // Router/HashRouter/BrowserRouter ancestor anywhere in that file or
    // LordOutcomesRoutes.jsx itself — #root is confirmed empty in a live
    // check. This is a pre-existing defect in already-shipped code, out
    // of this audit's scope to fix (registry/architecture task, not a
    // bug-fix task). Kept as a real, evidenced destination — link stays
    // live rather than being hidden — but status is honestly 'dormant',
    // not 'live', and the gateway surfaces this note (see
    // gateway/UniverseGateway.jsx's `dormantNote` handling).
    status: 'dormant',
    statusNote: 'Verified reachable, but currently renders blank in local verification (missing Router provider in lordOutcomes.main.jsx) — a pre-existing defect, not fixed by this audit.',
    access: 'public',
    // Public-directory correction (2026-08-27): Lord of Outcomes is not a
    // public-facing Universe destination — set to false so
    // gateway/UniverseGateway.jsx's existing `universeVisible === false`
    // filter (already there, unchanged) skips it. Every other field on
    // this record — route, productionPath, destinationType,
    // availability/publicNavigationStatus, status — is untouched: the
    // real app, its route, and its behavior are completely unaffected.
    // This only removes it from the /universe/directory presentation.
    universeVisible: false,
  },
  {
    id: 'shf-impact',
    label: 'Impact',
    title: 'SHF Impact Command Center',
    route: '/universe/shf-impact',
    destinationType: 'same-origin-app',
    availability: 'available-local',
    publicNavigationStatus: 'available',
    productionPath: '/foundation.html#/impact',
    sourceEvidence: 'src/router/FoundationRoutes.jsx ("Public foundation shell" comment; impact route not auth-wrapped) + src/pages/shf-command/SHFImpactCommandCenter.jsx + docs/COMMAND_DASHBOARD_ROUTE_ESTABLISHMENT_V1.md (confirms this exact page is also reachable, gated, at admin.html#/command — the public foundation.html#/impact entry point was chosen as canonical here, not the admin duplicate)',
    description: 'Public reporting, risk, and trust/verification surface for Silicon Heartland Foundation programs.',
    entryActionLabel: 'ENTER IMPACT CENTER',
    returnActionLabel: RETURN_TO_UNIVERSE_LABEL,
    returnPath: CANONICAL_UNIVERSE_ROUTE,
    accessibilityLabel: 'Enter SHF Impact Command Center',
    sceneAvailable: false,
    entityType: ENTITY_TYPES.PUBLIC_SURFACE,
    owner: 'Silicon Heartland Foundation',
    parentPlatform: null,
    // Route verification (Phase 15, 2026-08-27): a fresh direct navigation
    // to foundation.html#/impact (exactly what resolveDestinationHref's
    // hard navigation does) renders FoundationTop's homepage content
    // ("Empowering Pathways to Success"), not SHFImpactCommandCenter — the
    // in-app "Impact" nav link itself only scrolls to an in-page anchor
    // (#impact, no leading slash) on the same Top page, never actually
    // routing to this component either. This is a pre-existing routing
    // defect in already-shipped code (out of this audit's registry/
    // architecture scope to fix), not something this record fabricates.
    // Kept as a real, evidenced destination with the link left live —
    // visitors will honestly see the Foundation homepage rather than a
    // dead link — but status/statusNote disclose the gap.
    status: 'dormant',
    statusNote: 'Verified reachable, but a direct navigation currently renders the Foundation homepage instead of this page (pre-existing routing gap, not fixed by this audit).',
    access: 'public',
    universeVisible: true,
  },
];

export const universeV1BlackIvoryMaster = {
  scene: '01',
  title: 'Universe arrival black-and-ivory master',
  source: '/assets/universe/masters/SHU_UNIVERSE_V1_BLACK_IVORY_MASTER_V2.png',
  sourceSha256: '8eb63b8696550ca70d8f7e7f432897adf6106f46e6ceebfe1bb4c4068ec4f90d',
  sourceDimensions: { width: 1672, height: 941 },
  status: 'HUMAN_APPROVED_V1_BLACK_IVORY_MASTER',
  approval: 'human-approved Silicon Heartland Universe V1 black-and-ivory background master',
};

export function isDestinationAvailable(destination) {
  return destination.publicNavigationStatus === 'available';
}

// Both 'same-origin-app' (a different multi-page .html entry served by
// this same app — e.g. solutions.html, foundation.html) and
// 'independent-local-app' (a genuinely separate application/port) need a
// real browser navigation (a plain <a href> / window.location.assign),
// never the Universe SPA's own client-side pushState `navigate()` — the
// SPA has no internal route for either kind of destination. Centralized
// here so every call site (the enter button, the enter-key shortcut, the
// directory grid) makes the same decision instead of re-deriving it.
export function needsHardNavigation(destination) {
  return destination.destinationType === 'same-origin-app' || destination.destinationType === 'independent-local-app';
}

export function resolveDestinationHref(destination) {
  if (!isDestinationAvailable(destination)) return '';
  if (destination.destinationType === 'same-origin-app') {
    return destination.productionPath;
  }
  if (destination.destinationType === 'independent-local-app') {
    const configuredOrigin = import.meta.env[destination.originEnv];
    if (configuredOrigin) return `${configuredOrigin.replace(/\/$/, '')}${destination.productionPath}`;
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      return `${destination.localDevelopmentOrigin}${destination.productionPath}`;
    }
    return destination.productionPath;
  }
  return destination.route;
}
