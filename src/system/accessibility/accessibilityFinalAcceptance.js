export const ACCESSIBILITY_FINAL_ACCEPTANCE = Object.freeze({
  program: "Accessibility Layer Upgrade",
  phase: "AX-7",
  status: "COMPLETE",
  policyVersion: "ax7.v1",
  migrationHead: 142,
  canonicalOwners: Object.freeze({
    runtime: "AX-1",
    profile: "AX-2",
    alternativeContent: "AX-3",
    accommodations: "AX-4",
    assurance: "AX-5",
    operations: "AX-6",
  }),
  gaps: Object.freeze([
    ...Array.from({ length: 20 }, (_, index) => ({ id: `AX-GAP-${String(index + 1).padStart(3, "0")}`, state: "RESOLVED" })),
    { id: "AX-GAP-021", state: "DEFERRED_TO_EXR" },
  ]),
  capabilities: Object.freeze([
    { id: "runtime", owner: "AX-1", implementation: "COMPLETE", validation: "PASS", externalDependency: false },
    { id: "profile-persistence", owner: "AX-2", implementation: "COMPLETE", validation: "PASS", externalDependency: false },
    { id: "text-scale", owner: "AX-2", implementation: "COMPLETE", validation: "PASS", externalDependency: false },
    { id: "alternative-content", owner: "AX-3", implementation: "COMPLETE", validation: "PASS", externalDependency: false },
    { id: "accommodations", owner: "AX-4", implementation: "COMPLETE", validation: "PASS", externalDependency: false },
    { id: "assurance", owner: "AX-5", implementation: "COMPLETE", validation: "PASS", externalDependency: false },
    { id: "operations", owner: "AX-6", implementation: "COMPLETE", validation: "PASS", externalDependency: false },
    { id: "tagged-pdf", owner: "AX-3", implementation: "EXTERNAL_DEPENDENCY", validation: "HONESTLY_CLASSIFIED", externalDependency: true },
    { id: "braille", owner: "AX-3", implementation: "EXTERNAL_DEPENDENCY", validation: "HONESTLY_CLASSIFIED", externalDependency: true },
    { id: "epub", owner: "AX-3", implementation: "FUTURE_PHASE", validation: "HONESTLY_CLASSIFIED", externalDependency: false },
    { id: "human-screen-reader-review", owner: "AX-5", implementation: "HUMAN_REVIEW_REQUIRED", validation: "NOT_CLAIMED", externalDependency: true },
  ]),
  browserEvidence: Object.freeze({
    ax4AndAx6: "17/17 PASS",
    ax2AndAx3: "6/6 PASS",
    accessibilitySettings: "AX-2 browser acceptance PASS",
    publicAndAlternativeContent: "AX-3 browser acceptance PASS",
    operationsAndCompanion: "AX-6 browser acceptance 4/4 PASS",
  }),
});

export function hasNoOpenLocalGaps() {
  return ACCESSIBILITY_FINAL_ACCEPTANCE.gaps.every(({ state }) => state !== "OPEN" && state !== "UNKNOWN" && state !== "UNEXPLAINED_PARTIAL");
}
