export const CANONICAL_SPECIALIZATION_IDS = [
  "technical-operations",
  "networking-fiber",
  "electrical-infrastructure",
  "mechanical-hvac",
  "cybersecurity-security",
  "ai-cloud-infrastructure",
] as const;

export type SpecializationAssignmentStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "TRANSFERRED" | "COMPLETED";
export type SpecializationAssignmentSource = "LEARNER_SELECTION" | "INSTRUCTOR_ASSIGNMENT" | "PROGRAM_ASSIGNMENT" | "ADVISOR_CHANGE";

export function isCanonicalSpecialization(value: string) {
  return (CANONICAL_SPECIALIZATION_IDS as readonly string[]).includes(value);
}
