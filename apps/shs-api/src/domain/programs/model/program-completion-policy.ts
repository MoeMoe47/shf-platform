import { BRANCH_REQUIREMENTS, GRADE12_POLICY_VERSION, GRADE12_PROGRAM_ID, SHARED_CORE_LESSONS } from "./grade12-eligibility-policy.js";

export const PROGRAM_COMPLETION_AUTHORITY_VERSION = "program-completion-authority-v1";

export type ProgramCompletionRequirement = {
  code: string;
  label: string;
  references: string[];
};

export function requirementsForProgram(programReference: string, specializationId: string | null): { version: string; requirements: ProgramCompletionRequirement[] } | null {
  if (programReference !== GRADE12_PROGRAM_ID || !specializationId || !BRANCH_REQUIREMENTS[specializationId]) return null;
  const branch = BRANCH_REQUIREMENTS[specializationId];
  return {
    version: `${GRADE12_POLICY_VERSION}:${specializationId}`,
    requirements: [
      { code: "SHARED_CORE_LESSONS", label: "Shared core lessons", references: [...SHARED_CORE_LESSONS] },
      { code: "SPECIALIZATION_LESSONS", label: "Specialization lessons", references: [...branch.lessons] },
      { code: "SPECIALIZATION_COMPETENCIES", label: "Demonstrated specialization competencies", references: [...branch.competencies] },
    ],
  };
}
