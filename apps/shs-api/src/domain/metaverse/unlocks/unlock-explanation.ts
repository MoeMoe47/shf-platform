import type { MetaverseUnlockDecision, MetaverseUnlockReasonCode } from "./unlock-contract.js";
import type { MetaverseUnlockRequirement } from "./unlock-requirements.js";

export const METAVERSE_UI_STATE_TOKENS = {
  AVAILABLE: { label: "Available", iconToken: "unlock-available", accessibleText: "Available to enter" },
  LOCKED: { label: "Locked", iconToken: "unlock-locked", accessibleText: "Locked until requirements are complete" },
  RESTRICTED: { label: "Restricted", iconToken: "unlock-restricted", accessibleText: "Restricted to authorized participants" },
  ASSIGNED: { label: "Assigned", iconToken: "unlock-assigned", accessibleText: "Assigned by your instructor or program" },
  TEMPORARILY_UNAVAILABLE: { label: "Temporarily unavailable", iconToken: "unlock-temporary", accessibleText: "Temporarily unavailable" },
  HIDDEN: { label: "Hidden", iconToken: "unlock-hidden", accessibleText: "Not shown in this context" },
  COMPLETED_ACCESSIBLE: { label: "Completed", iconToken: "unlock-completed", accessibleText: "Completed and available to revisit" },
} as const satisfies Record<MetaverseUnlockDecision, { label: string; iconToken: string; accessibleText: string }>;

export function explainUnlockDecision(input: {
  decision: MetaverseUnlockDecision;
  reasonCode: MetaverseUnlockReasonCode;
  firstRemaining: MetaverseUnlockRequirement | null;
  assigned?: boolean;
  completed?: boolean;
}): string {
  if (input.decision === "AVAILABLE") return "Available because your canonical learning, role, or organization context satisfies the requirements.";
  if (input.decision === "ASSIGNED") return "Your instructor assigned this experience.";
  if (input.decision === "COMPLETED_ACCESSIBLE") return "You may revisit this completed experience. Completion here is not verified mastery unless canonical evidence says so.";
  if (input.decision === "RESTRICTED") return "This area is limited to authorized participants.";
  if (input.decision === "TEMPORARILY_UNAVAILABLE") return "This activity is currently closed.";
  if (input.decision === "HIDDEN") return "This resource is not available in your current authorized context.";
  if (input.firstRemaining?.next_action) return `${input.firstRemaining.description}`;
  if (input.reasonCode === "NOT_ENROLLED") return "Enroll in the required program to unlock this experience.";
  if (input.reasonCode === "CREDENTIAL_REQUIRED") return "A verified credential from the canonical credential authority is required.";
  return "Complete the required prerequisite in the canonical learning system to unlock this experience.";
}
