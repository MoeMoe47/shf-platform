export const AX0_AUDIT_SCHEMA_VERSION = 1;

export const AX0_RUNTIME_INVENTORY = Object.freeze([
  { mechanism: "AccessibilityProfileProvider", file: "src/context/AccessibilityProfileContext.jsx", capability: "Personal profile fetch/patch/reset", scope: "shared authenticated apps", stateSource: "API user_accessibility_profiles", persisted: true, active: true, duplicate: "legacy adapters remain", canonicalCandidate: "AX-1 canonical runtime" },
  { mechanism: "EffectiveAccessibilityContextProvider", file: "src/context/EffectiveAccessibilityContext.jsx", capability: "OS-aware effective presentation context", scope: "shared provider tree", stateSource: "profile plus prefers-reduced-motion", persisted: false, active: true, duplicate: "none identified", canonicalCandidate: "preserve as derived runtime" },
  { mechanism: "AccessibilityPreferencesProvider", file: "src/context/AccessibilityPreferences.jsx", capability: "flat compatibility adapter", scope: "Curriculum lesson settings", stateSource: "AccessibilityProfileContext", persisted: "indirectly", active: true, duplicate: "legacy API shape", canonicalCandidate: "retire after AX-1 consumers migrate" },
  { mechanism: "ReadingLevelProvider", file: "src/context/ReadingLevelProvider.jsx", capability: "content reading variant selection", scope: "Curriculum and selected apps", stateSource: "profile or localStorage sh:readingLevel", persisted: "mixed", active: true, duplicate: "local fallback", canonicalCandidate: "AX-1/AX-3 bounded consumer" },
  { mechanism: "useSystemReducedMotion", file: "src/context/EffectiveAccessibilityContext.jsx", capability: "OS motion signal", scope: "effective runtime", stateSource: "matchMedia", persisted: false, active: true, duplicate: "Companion also observes OS signal", canonicalCandidate: "derived runtime" },
  { mechanism: "LiveAnnouncer", file: "src/components/ally/A11yTools.jsx", capability: "polite dynamic announcements", scope: "RootProviders", stateSource: "a11y:announce events", persisted: false, active: true, duplicate: "page-local status regions", canonicalCandidate: "AX-1 shared announcement policy" },
  { mechanism: "SkipLinks", file: "src/components/SkipLinks.jsx", capability: "main/navigation skip links", scope: "shells that mount it", stateSource: "DOM anchors", persisted: false, active: true, duplicate: "AppLayout, A11yTools, CurriculumLayout variants", canonicalCandidate: "AX-1 shell contract" },
  { mechanism: "AccessibilityToolbar", file: "src/components/iep/AccessibilityToolbar.jsx", capability: "contrast, simple, sensory, voice, text controls", scope: "IEP demonstration surface", stateSource: "page React state", persisted: false, active: true, duplicate: "separate from profile", canonicalCandidate: "AX-1 bounded migration or retire" },
  { mechanism: "focusMode", file: "src/shared/ui/focusMode.js", capability: "focus-mode document flag", scope: "event consumers only", stateSource: "document dataset", persisted: false, active: true, duplicate: "simplified/reading concepts overlap", canonicalCandidate: "AX-1 decision" },
  { mechanism: "Companion motion handling", file: "src/companion/CompanionProvider.jsx", capability: "reduced animation behavior", scope: "Companion", stateSource: "effective profile plus OS signal", persisted: false, active: true, duplicate: "shares OS signal with effective context", canonicalCandidate: "consume effective runtime only" },
]);

export const AX0_DUPLICATION_MATRIX = Object.freeze([
  { capability: "reduced motion", implementations: ["EffectiveAccessibilityContext", "CompanionProvider", "curriculum-a11y.css", "legacy curriculum migration"], conflict: "multiple readers, one canonical profile plus OS precedence", owner: "AX-1" },
  { capability: "simplified UI/reading support", implementations: ["ReadingLevelProvider", "AccessibilityPreferences adapter", "IEP simpleMode", "focusMode"], conflict: "different scopes and semantics; not one global mode", owner: "AX-1/AX-3" },
  { capability: "skip links", implementations: ["AppLayout", "SkipLinks", "A11yTools", "CurriculumLayout"], conflict: "variant targets and mounting are not centrally governed", owner: "AX-1" },
  { capability: "focus", implementations: ["CSS focus-visible", "useFocusVisibleClass", "route focus", "dialog/tour focus handling"], conflict: "coverage is component-local and requires system inventory", owner: "AX-1/AX-5" },
  { capability: "contrast", implementations: ["curriculum-a11y.css", "IEP toolbar"], conflict: "profile-backed Curriculum path versus page-local IEP state", owner: "AX-1" },
  { capability: "text scaling", implementations: ["profile data attributes", "curriculum CSS", "IEP inline font size"], conflict: "different scopes and value models", owner: "AX-1/AX-2" },
  { capability: "accessibility settings", implementations: ["AccessibilityProfile", "flat adapter", "IEP toolbar", "reading-level local fallback"], conflict: "canonical and legacy controls coexist", owner: "AX-1/AX-2" },
  { capability: "accessibility help", implementations: ["OGL Guidance Center", "accessible guide references", "Companion", "inline checklists"], conflict: "help is distributed by design but ownership boundaries need explicit AX contract", owner: "AX-1/AX-6" },
  { capability: "caption/transcript", implementations: ["MediaRow", "LessonTemplate", "lesson metadata", "live-learning recording policy"], conflict: "content capability and provider capability are not one engine", owner: "AX-3" },
  { capability: "alternative formats", implementations: ["lesson variants", "transcript download", "semantic HTML document path"], conflict: "no universal transformation pipeline", owner: "AX-3" },
  { capability: "testing", implementations: ["focused AIEL tests", "Playwright semantic tests", "custom validators"], conflict: "no centralized axe/CI release gate identified", owner: "AX-5" },
]);

export const AX0_EXPERIENCE_MATRIX = Object.freeze([
  ["Student", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PARTIAL", "LEVEL 2"],
  ["Instructor", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PARTIAL", "LEVEL 2"],
  ["Parent", "UNKNOWN", "UNKNOWN", "UNKNOWN", "PASS", "PASS", "UNKNOWN", "LEVEL 0"],
  ["Career", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PASS", "PARTIAL", "LEVEL 1"],
  ["Calendar", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PASS", "UNKNOWN", "LEVEL 1"],
  ["Live Learning", "PARTIAL", "PARTIAL", "PARTIAL", "EXTERNAL_PROVIDER_DEPENDENCY", "PASS", "UNKNOWN", "LEVEL 1"],
  ["Arcade", "PARTIAL", "PARTIAL", "WEAK", "PARTIAL", "PASS", "PARTIAL", "LEVEL 1"],
  ["CivicSure", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PASS", "PARTIAL", "LEVEL 2"],
  ["Studio", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PARTIAL", "LEVEL 2"],
  ["Hub/BOS", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PASS", "UNKNOWN", "LEVEL 2"],
  ["Agent Fabric", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PASS", "UNKNOWN", "LEVEL 2"],
  ["ARAG", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PASS", "UNKNOWN", "LEVEL 2"],
  ["DGAL", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PARTIAL", "LEVEL 2"],
  ["Public/Foundation", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PASS", "PARTIAL", "LEVEL 1"],
  ["OAS", "PARTIAL", "PARTIAL", "PARTIAL", "PASS", "PASS", "UNKNOWN", "LEVEL 1"],
  ["Universe", "WEAK", "WEAK", "WEAK", "PARTIAL", "PASS", "UNKNOWN", "LEVEL 1"],
]);

export const AX0_GAPS = Object.freeze([
  ["AX-GAP-001", "P1", "AX-RUNTIME", "Shared runtime ownership is distributed across providers and adapters.", "src/entries/RootProviders.jsx; context inventory", "AX-1"],
  ["AX-GAP-002", "P1", "AX-DUPLICATION", "Canonical profile coexists with legacy/page-local accessibility controls.", "AccessibilityPreferences, ReadingLevel, IEP toolbar", "AX-1"],
  ["AX-GAP-003", "P2", "AX-PERSISTENCE", "Profile persistence exists but coverage is app-boundary dependent.", "migration 056; RootProviders and Curriculum nesting", "AX-2"],
  ["AX-GAP-004", "P1", "AX-ACCOMMODATION", "Accommodation table exists, but no complete operational grant/read/enforce workflow was found.", "migration 057; no corresponding domain API/service found", "AX-4"],
  ["AX-GAP-005", "P1", "AX-LIVE_LEARNING", "Live Learning provider exposes session/recording policy, not a canonical accessibility capability contract.", "live-learning provider/model search", "AX-3/EXTERNAL"],
  ["AX-GAP-006", "P1", "AX-CAPTIONS", "Caption availability is content-dependent; no universal capability registry exists.", "MediaRow and lesson metadata", "AX-3"],
  ["AX-GAP-007", "P1", "AX-TRANSCRIPTS", "Transcript support is lesson/component-specific, not system-wide.", "MediaRow, LessonTemplate, SpeakBtn", "AX-3"],
  ["AX-GAP-008", "P1", "AX-ALTERNATIVE_CONTENT", "No universal alternative-content transformation engine was found.", "lesson variants and transcript download only", "AX-3"],
  ["AX-GAP-009", "P2", "AX-DOCUMENT", "DGAL semantic HTML exists, but all generated/uploaded document accessibility is not assured.", "DGAL document tests and document inventory", "AX-3/AX-5"],
  ["AX-GAP-010", "P2", "AX-KEYBOARD", "Keyboard coverage is strong in tested islands but not system-wide measured.", "focused Playwright and component evidence", "AX-5"],
  ["AX-GAP-011", "P1", "AX-FOCUS", "Focus behavior is implemented in multiple local systems without a single cross-app contract.", "tour, guidance, dialogs, Curriculum route focus", "AX-1/AX-5"],
  ["AX-GAP-012", "P2", "AX-SCREEN_READER", "Semantic statuses exist, but live region and landmark coverage is not centrally assured.", "LiveAnnouncer plus route searches", "AX-5"],
  ["AX-GAP-013", "P2", "AX-CONTRAST", "Contrast support is profile-backed in Curriculum but not a shared all-app guarantee.", "curriculum-a11y.css and IEP CSS", "AX-1/AX-7"],
  ["AX-GAP-014", "P2", "AX-TEXT", "Text and reading controls use multiple scopes/value models.", "profile scale, reading level, IEP inline scale", "AX-1/AX-2"],
  ["AX-GAP-015", "P1", "AX-TESTING", "Focused accessibility tests exist, but axe/CI-wide coverage was not found.", "tests/aielPhase4CurriculumAccessibility.test.mjs and Playwright suites", "AX-5"],
  ["AX-GAP-016", "P1", "AX-RELEASE_GATE", "Accessibility is not a documented release-blocking gate.", "package/CI and test inventory", "AX-5"],
  ["AX-GAP-017", "P1", "AX-OPERATIONS", "No accessibility operations center or defect lifecycle was found.", "admin surface inventory", "AX-6"],
  ["AX-GAP-018", "P2", "AX-SUPPORT", "No dedicated accessibility accommodation/support escalation workflow was found.", "support and route inventory", "AX-6"],
  ["AX-GAP-019", "P1", "AX-PRIVACY", "Profile/accommodation privacy boundaries are documented but need operational assurance and audit review.", "AIEL constitution; migrations 056/057", "AX-4/AX-5"],
  ["AX-GAP-020", "P2", "AX-PUBLIC", "Public, Universe, and Arcade accessibility require representative system-wide acceptance.", "public/Universe/Arcade test inventory", "AX-7"],
  ["AX-GAP-021", "P3", "AX-EXR", "Accessibility requirements must survive future route/page/customer-journey restructuring.", "SEA-6 EXR handoff and AX dependency audit", "EXR"],
]);

export const AX0_MATURITY = Object.freeze([
  ["Runtime", "LEVEL 2", "Profile/effective providers are active; ownership is not yet constitutionally centralized.", "AX-1"],
  ["Preferences", "LEVEL 2", "Nested profile and compatibility adapter are functional.", "AX-2"],
  ["Persistence", "LEVEL 2", "User-scoped JSON profile and CAS API exist; app boundary coverage varies.", "AX-2"],
  ["Alternative Content", "LEVEL 1", "Lesson variants and transcript download are isolated capabilities.", "AX-3"],
  ["Accommodation", "LEVEL 1", "Schema boundary exists; operational workflow not found.", "AX-4"],
  ["Live Learning", "LEVEL 1", "Provider/session foundation exists; accessibility capability contract is absent.", "AX-3"],
  ["Automated Testing", "LEVEL 2", "Focused tests and semantic browser checks exist; no centralized axe gate.", "AX-5"],
  ["Release Gate", "LEVEL 0", "No accessibility-specific blocking gate identified.", "AX-5"],
  ["Operations", "LEVEL 0", "No accessibility operations center identified.", "AX-6"],
  ["Companion", "LEVEL 2", "Bounded contextual support and motion awareness exist.", "AX-6"],
  ["Human Support", "LEVEL 1", "General help exists; dedicated accessibility escalation is not defined.", "AX-6"],
]);

export const AX0_NO_OP_CONTROLS = Object.freeze([
  { control: "IEP AccessibilityToolbar", status: "CONNECTED_BUT_PAGE_LOCAL", evidence: "IEPDashboardPage state and child consumers" },
  { control: "ReadingLevelProvider local fallback", status: "CONNECTED_BUT_SCOPE_DEPENDENT", evidence: "canonical profile only when provider is inside RootProviders" },
]);

export function validateAx0Audit() {
  const errors = [];
  if (AX0_RUNTIME_INVENTORY.length !== 10) errors.push("runtime inventory is incomplete");
  if (AX0_DUPLICATION_MATRIX.length !== 11) errors.push("duplication matrix is incomplete");
  if (AX0_EXPERIENCE_MATRIX.length !== 16) errors.push("experience matrix is incomplete");
  if (AX0_GAPS.length !== 21) errors.push("gap register is incomplete");
  if (AX0_MATURITY.length !== 11) errors.push("maturity matrix is incomplete");
  const owners = new Set(["AX-1", "AX-2", "AX-3", "AX-4", "AX-5", "AX-6", "AX-7", "EXR", "EXTERNAL"]);
  for (const [id, severity, category, finding, evidence, owner] of AX0_GAPS) {
    if (!/^AX-GAP-\d{3}$/.test(id) || !/^P[0-3]$/.test(severity) || !category || !finding || !evidence || !owners.has(owner) && !owner.includes("/")) errors.push(`${id}: malformed gap`);
  }
  return errors;
}

export const AX0_AUDIT_ERRORS = Object.freeze(validateAx0Audit());
