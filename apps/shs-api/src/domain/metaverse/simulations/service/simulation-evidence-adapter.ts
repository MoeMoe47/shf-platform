// MET-13 §5/§6 — evidence/assessment boundary description.
//
// Pure, read-only, descriptive only — mirrors missions/mission-evidence-
// adapter.ts. Never writes to verified-evidence, portfolio, credentials,
// or completion-policy tables. It only describes what a completed
// simulation *may* become, from the simulation's own declared
// evidenceOutputs/assessmentBoundary, so the runtime and UI can be honest
// without the metaverse ever asserting verification itself.

import type { SimulationAssessmentBoundary, SimulationDefinition, SimulationEvidenceOutputKind } from "../model/simulation-contract.js";

export type SimulationEvidenceBoundaryDescription = {
  evidenceOutputs: SimulationEvidenceOutputKind[];
  assessmentBoundary: SimulationAssessmentBoundary;
  canBecomeEvidenceCandidate: boolean;
  isVerifiedEvidence: false;
  isVerifiedSkill: false;
  isCredential: false;
  isCourseCompletion: false;
  isCareerEligibility: false;
  isJobReadiness: false;
  isCivicAuthority: false;
  notes: string;
};

export function describeSimulationEvidenceBoundary(simulation: SimulationDefinition): SimulationEvidenceBoundaryDescription {
  const canBecomeEvidenceCandidate = simulation.evidenceOutputs.includes("EVIDENCE_CANDIDATE") || simulation.evidenceOutputs.includes("PORTFOLIO_CANDIDATE");
  return {
    evidenceOutputs: simulation.evidenceOutputs,
    assessmentBoundary: simulation.assessmentBoundary,
    canBecomeEvidenceCandidate,
    isVerifiedEvidence: false,
    isVerifiedSkill: false,
    isCredential: false,
    isCourseCompletion: false,
    isCareerEligibility: false,
    isJobReadiness: false,
    isCivicAuthority: false,
    notes: simulation.assessmentBoundary === "EVIDENCE_CANDIDATE_ONLY"
      ? "Completing this simulation records an operational fact and, where declared, an evidence candidate for canonical review — it never verifies a skill, issues a credential, or completes a course by itself."
      : `This simulation is classified ${simulation.assessmentBoundary}; if it backs an actual assessment, verification remains the canonical assessment/completion-policy domain's authority, never this runtime's.`,
  };
}
