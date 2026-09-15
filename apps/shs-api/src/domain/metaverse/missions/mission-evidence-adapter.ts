// MET-7 — evidence boundary description (build brief §11/§17).
//
// Pure, read-only. Never writes to curriculum_lesson_completions,
// arcade_results, project_submissions, studio_delivery_records, or the
// verified-evidence domain. It only *describes*, from the assignment's
// own shape, which of the verified-evidence domain's existing
// SOURCE_TABLES keys (apps/shs-api/src/domain/verified-evidence/service/
// verified-evidence-service.ts) a real completion of this mission would
// land in — so the UI can be honest about "this may become evidence"
// without the metaverse ever asserting verification itself.
import type { MissionEvidenceExpectation } from "./mission-contract.js";
import type { AssignedContentType, AssignmentType } from "../../assignments/model/assignment.js";

export function describeMissionEvidenceExpectation(input: {
  assignmentType: AssignmentType;
  assignedContentType: AssignedContentType | null;
  hasStudioProject: boolean;
}): MissionEvidenceExpectation {
  if (input.assignmentType === "artifact" || input.hasStudioProject) {
    return {
      possibleSourceType: "STUDIO_DELIVERY",
      canBecomeEvidenceCandidate: true,
      isVerifiedEvidence: false,
      notes: "A finalized Studio delivery for this assignment may be projected into evidence by the verified-evidence domain (STUDIO_DELIVERY), governed by Studio's own review authority — never by the metaverse.",
    };
  }
  if (input.assignedContentType) {
    return {
      possibleSourceType: "LESSON_COMPLETION",
      canBecomeEvidenceCandidate: true,
      isVerifiedEvidence: false,
      notes: "A real curriculum_lesson_completions row for this mission's bound lesson may be projected into evidence if an evidence rule exists for this organization — the metaverse never creates that row or that rule.",
    };
  }
  return {
    possibleSourceType: null,
    canBecomeEvidenceCandidate: false,
    isVerifiedEvidence: false,
    notes: "This assignment has no institutional curriculum binding; it carries no known evidence source type.",
  };
}

// Arcade practice specifically: an arcade_results row with
// mastery_achieved=true is ALSO a known verified-evidence source type
// (ARCADE_RESULT), independent of the assignment it's linked to.
export function describeArcadePracticeEvidenceExpectation(): MissionEvidenceExpectation {
  return {
    possibleSourceType: "ARCADE_RESULT",
    canBecomeEvidenceCandidate: true,
    isVerifiedEvidence: false,
    notes: "A mastered Arcade result (arcade_results.mastery_achieved=true) may be projected into evidence by the verified-evidence domain if an evidence rule exists for this organization. Arcade mastery is not, by itself, verified mastery.",
  };
}
