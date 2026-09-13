// AX-1: the ownership and runtime contract for accessibility state.
// This registry describes the current implementation and its safe boundaries;
// it is not a replacement for the profile API or institutional domain state.

export const ACCESSIBILITY_CONSTITUTION_VERSION = 1;
export const ACCESSIBILITY_CONSTITUTION_LIFECYCLE = "ACTIVE";

export const PREFERENCE_SOURCES = Object.freeze([
  "USER_PROFILE",
  "SESSION",
  "SYSTEM",
  "ORGANIZATION_DEFAULT",
  "PRODUCT_DEFAULT",
  "NOT_AVAILABLE",
]);

export const CAPABILITY_SUPPORT_STATUS = Object.freeze([
  "SUPPORTED",
  "PARTIAL",
  "UNSUPPORTED",
  "EXTERNAL_DEPENDENCY",
  "FUTURE_PHASE",
]);

export const ACCESSIBILITY_CAPABILITIES = Object.freeze([
  { key: "reducedMotion", status: "SUPPORTED", owner: "accessibility-runtime", sources: ["USER_PROFILE", "SYSTEM", "PRODUCT_DEFAULT"] },
  { key: "textScale", status: "PARTIAL", owner: "accessibility-runtime", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "lineHeight", status: "FUTURE_PHASE", owner: "accessibility-runtime", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "letterSpacing", status: "FUTURE_PHASE", owner: "accessibility-runtime", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "readingWidth", status: "FUTURE_PHASE", owner: "accessibility-runtime", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "highContrast", status: "PARTIAL", owner: "accessibility-runtime", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "simplifiedUI", status: "PARTIAL", owner: "accessibility-runtime", sources: ["USER_PROFILE", "SESSION", "PRODUCT_DEFAULT"] },
  { key: "reducedDensity", status: "FUTURE_PHASE", owner: "sea-experience", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "readAloud", status: "PARTIAL", owner: "content-components", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "focusEnhancement", status: "PARTIAL", owner: "shell-and-components", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "captions", status: "PARTIAL", owner: "content-provider", sources: ["USER_PROFILE", "PRODUCT_DEFAULT", "NOT_AVAILABLE"] },
  { key: "transcripts", status: "PARTIAL", owner: "content-provider", sources: ["USER_PROFILE", "PRODUCT_DEFAULT", "NOT_AVAILABLE"] },
  { key: "preferredAlternativeFormat", status: "FUTURE_PHASE", owner: "accessibility-runtime", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "keyboardFirst", status: "PARTIAL", owner: "shell-and-components", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "screenReaderOptimization", status: "FUTURE_PHASE", owner: "design-system-and-content", sources: ["USER_PROFILE", "PRODUCT_DEFAULT"] },
  { key: "audioDescription", status: "FUTURE_PHASE", owner: "content-provider", sources: ["USER_PROFILE", "PRODUCT_DEFAULT", "NOT_AVAILABLE"] },
]);

export const ACCESSIBILITY_RUNTIME_OWNER = Object.freeze({
  id: "accessibility-profile-effective-runtime",
  rawProvider: "AccessibilityProfileProvider",
  effectiveProvider: "EffectiveAccessibilityContextProvider",
  mount: "src/entries/RootProviders.jsx",
  publicFallback: "SYSTEM then PRODUCT_DEFAULT; no authenticated profile required",
  persistenceOwner: "accessibility-profile-domain",
});

export const ACCESSIBILITY_RUNTIME_CONTRACT = Object.freeze({
  version: ACCESSIBILITY_CONSTITUTION_VERSION,
  lifecycle: ACCESSIBILITY_CONSTITUTION_LIFECYCLE,
  owner: ACCESSIBILITY_RUNTIME_OWNER.id,
  mount: ACCESSIBILITY_RUNTIME_OWNER.mount,
  interfaceStatus: "CURRENT_PROVIDER_SHAPE_WITH_NORMALIZED_CONTRACT",
  state: ["preferences", "systemPreferences", "effectivePreferences", "capabilities", "source", "loading", "error", "version"],
  operations: ["setPreference", "resetPreference", "supports"],
  publicFallback: ACCESSIBILITY_RUNTIME_OWNER.publicFallback,
  accommodationIsolation: "institutional accommodation is never merged into effective preference state",
});

export const EFFECTIVE_PREFERENCE_PRECEDENCE = Object.freeze([
  "USER_PROFILE",
  "SESSION",
  "SYSTEM",
  "ORGANIZATION_DEFAULT",
  "PRODUCT_DEFAULT",
]);

export const RUNTIME_MECHANISMS = Object.freeze([
  { id: "profile-provider", file: "src/context/AccessibilityProfileContext.jsx", treatment: "CANONICAL", scope: "shared authenticated apps" },
  { id: "effective-context", file: "src/context/EffectiveAccessibilityContext.jsx", treatment: "CANONICAL", scope: "shared provider tree" },
  { id: "flat-preferences-adapter", file: "src/context/AccessibilityPreferences.jsx", treatment: "ADAPTER_TO_CANONICAL", scope: "legacy lesson/settings consumers" },
  { id: "reading-level-adapter", file: "src/context/ReadingLevelProvider.jsx", treatment: "ADAPTER_TO_CANONICAL", scope: "content reading variants" },
  { id: "iep-toolbar", file: "src/components/iep/AccessibilityToolbar.jsx", treatment: "KEEP_LOCAL_BY_DESIGN", scope: "IEP demonstration surface" },
  { id: "focus-mode", file: "src/shared/ui/focusMode.js", treatment: "KEEP_LOCAL_BY_DESIGN", scope: "local focus presentation" },
  { id: "live-announcer", file: "src/components/ally/A11yTools.jsx", treatment: "KEEP_LOCAL_BY_DESIGN", scope: "announcement infrastructure" },
  { id: "shell-skip-links", file: "src/components/SkipLinks.jsx", treatment: "ADAPTER_TO_CANONICAL", scope: "application shells" },
  { id: "curriculum-skip-link", file: "src/layouts/CurriculumLayout.jsx", treatment: "ADAPTER_TO_CANONICAL", scope: "Curriculum shell" },
  { id: "companion-motion-observer", file: "src/companion/CompanionProvider.jsx", treatment: "DEPRECATED", scope: "Companion motion fallback" },
]);

export const OWNERSHIP_MATRIX = Object.freeze([
  ["Reduced Motion", "Accessibility Runtime", "EffectiveAccessibilityContextProvider", "motion-sensitive components", "Companion and CSS readers", "AX-1"],
  ["Text Scale", "Accessibility Runtime + app CSS", "profile/effective data attributes", "layout and content rendering", "IEP inline scale", "AX-2"],
  ["Line Height", "Accessibility Runtime vocabulary", "future normalized context", "content/layout components", "none", "AX-2"],
  ["Letter Spacing", "Accessibility Runtime vocabulary", "future normalized context", "content/layout components", "none", "AX-2"],
  ["Reading Width", "Accessibility Runtime vocabulary", "future normalized context", "content/layout components", "none", "AX-2"],
  ["High Contrast", "Accessibility Runtime + design tokens", "profile/effective context", "shell and components", "IEP toolbar", "AX-2"],
  ["Simplified UI", "Accessibility Runtime vocabulary", "profile plus bounded adapters", "content/presentation components", "ReadingLevel and IEP", "AX-2"],
  ["Reduced Density", "SEA experience contracts", "service projection", "role-specific pages", "none", "AX-2"],
  ["Read Aloud", "content components", "profile preference", "content/TTS component", "none", "AX-3"],
  ["Focus Enhancement", "shell/components", "profile preference", "focusable controls", "useFocusVisibleClass", "AX-5"],
  ["Captions", "content/live-learning provider", "content capability + preference", "media/session domain", "none", "AX-3"],
  ["Transcripts", "content/live-learning provider", "content capability + preference", "media/session domain", "none", "AX-3"],
  ["Alternative Format Preference", "Accessibility Runtime", "future normalized preference", "DGAL/Curriculum fulfillment", "none", "AX-3"],
  ["Keyboard First", "shell/components", "profile preference", "interaction patterns", "none", "AX-5"],
  ["Screen Reader Optimization", "design system/content", "semantic implementation", "landmarks/names/status", "none", "AX-5"],
  ["Audio Description", "content provider", "future capability", "media domain", "none", "AX-3"],
  ["Accommodation", "Institutional Accessibility domain", "authorized accommodation projection", "institutional workflow", "authorized_accommodations schema", "AX-4"],
  ["Accessibility Testing", "Accessibility Assurance", "test/validator infrastructure", "release evidence", "focused AIEL tests", "AX-5"],
  ["Release Gate", "Accessibility Assurance", "future gate", "release process", "none", "AX-5"],
  ["Operations", "Accessibility Operations", "future operations center", "defect lifecycle", "none", "AX-6"],
  ["Human Support", "Accessibility Support", "future escalation", "support workflow", "general help", "AX-6"],
]);

export const AUTHORITY_BOUNDARIES = Object.freeze({
  can: ["normalize user preferences", "derive effective presentation state", "expose capability/source status", "apply bounded adaptive presentation", "consume authorized accommodation projections"],
  cannot: ["identity", "authentication", "permissions", "organization membership", "service entitlements", "curriculum completion", "attendance", "assignment state", "assessment score", "Learning Arcade mastery", "portfolio evidence", "career outcomes", "verification", "Evidence", "Truth", "DGAL signatures", "OGL workflow", "release", "CivicSure decisions", "Studio review", "Agent Fabric policy"],
});

export const PRIVACY_CONSTITUTION = Object.freeze({
  rules: [
    "preferences are user-specific and least-privilege",
    "accommodation data is sensitive and institutionally scoped",
    "public experiences use system/product defaults without requiring a profile",
    "no cross-user or cross-organization preference leakage",
    "no accommodation inference from preference telemetry",
    "no advertising or marketing use",
    "raw assistive-technology details are not stored unless operationally required and consented",
  ],
  telemetryAllowed: ["aggregate feature use", "accessibility error counts", "test failures", "remediation status"],
  telemetryProhibitedByDefault: ["disability inference", "accommodation details", "raw screen-reader content", "unnecessary identifying assistive-technology data"],
});

export const INTEGRATION_BOUNDARIES = Object.freeze({
  SEA: "presentation, density, motion, text and alternative presentation only; never workflow authority or next-action eligibility",
  OGL: "may consume normalized preferences; owns tour, orientation and guidance state",
  DGAL: "may consume rendering/format preferences; owns document lifecycle, acknowledgment, signature, retention and requirements",
  Companion: "may consume contextual preference signals; remains bounded, contextual and non-authoritative",
});

export const AX1_GAP_CLOSURE = Object.freeze([
  { id: "AX-GAP-001", status: "RESOLVED_FOR_AX1", note: "canonical owner and mount selected" },
  { id: "AX-GAP-002", status: "RESOLVED_FOR_AX1", note: "all duplicates classified with adapter/local/deprecated treatment" },
  { id: "AX-GAP-011", status: "RESOLVED_FOR_AX1", note: "focus responsibility split between shell, components and OGL" },
  { id: "AX-GAP-013", status: "RESOLVED_FOR_AX1", note: "contrast ownership and forced-colors boundary defined" },
  { id: "AX-GAP-014", status: "RESOLVED_FOR_AX1", note: "text-scale owner defined; full rollout remains AX-2" },
  { id: "AX-GAP-019", status: "RESOLVED_FOR_AX1", note: "privacy constitution and profile/accommodation boundary defined" },
]);

export function validateAccessibilityConstitution() {
  const errors = [];
  if (ACCESSIBILITY_RUNTIME_OWNER.id !== "accessibility-profile-effective-runtime") errors.push("canonical runtime owner is not unique");
  if (ACCESSIBILITY_RUNTIME_OWNER.mount !== "src/entries/RootProviders.jsx") errors.push("canonical runtime mount is unresolved");
  if (ACCESSIBILITY_RUNTIME_CONTRACT.state.length < 7 || ACCESSIBILITY_RUNTIME_CONTRACT.operations.length < 3) errors.push("runtime contract is incomplete");
  if (!ACCESSIBILITY_RUNTIME_CONTRACT.publicFallback) errors.push("public fallback is missing");
  const sources = new Set(PREFERENCE_SOURCES);
  const statuses = new Set(CAPABILITY_SUPPORT_STATUS);
  for (const capability of ACCESSIBILITY_CAPABILITIES) {
    if (!capability.key || !statuses.has(capability.status)) errors.push(`${capability.key || "capability"}: invalid support status`);
    for (const source of capability.sources) if (!sources.has(source)) errors.push(`${capability.key}: invalid source ${source}`);
    if (/accommodation/i.test(capability.key)) errors.push("institutional accommodation is not a preference capability");
  }
  if (new Set(RUNTIME_MECHANISMS.filter((item) => item.treatment === "CANONICAL").map((item) => item.id)).size !== 2) errors.push("canonical runtime mechanisms are ambiguous");
  if (!AUTHORITY_BOUNDARIES.cannot.includes("Evidence") || !AUTHORITY_BOUNDARIES.cannot.includes("Truth")) errors.push("Evidence/Truth authority boundary missing");
  if (!PRIVACY_CONSTITUTION.rules.some((rule) => /leakage/i.test(rule))) errors.push("privacy leakage rule missing");
  if (!INTEGRATION_BOUNDARIES.SEA || !INTEGRATION_BOUNDARIES.OGL || !INTEGRATION_BOUNDARIES.DGAL || !INTEGRATION_BOUNDARIES.Companion) errors.push("integration boundary missing");
  return errors;
}

export const ACCESSIBILITY_CONSTITUTION_ERRORS = Object.freeze(validateAccessibilityConstitution());
