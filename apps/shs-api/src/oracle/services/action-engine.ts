import { getTruth, setTruth } from "../repositories/truth.repo";
import type { TruthPackage } from "../domain/types";

export function applyOracleAction(entityId: string, action: string): TruthPackage {
  const current = getTruth(entityId);

  if (!current) {
    throw new Error("Entity not found for action");
  }

  let updated: TruthPackage = { ...current };

  switch (action) {
    case "execute":
      updated.confidenceScore = Math.min(100, current.confidenceScore + 5);
      updated.readinessStatus = "funder_ready";
      updated.recommendedNextAction = "Proceed with reporting and institutional review.";
      break;

    case "hold":
      updated.readinessStatus = "internally_ready";
      updated.recommendedNextAction = "Hold for internal review.";
      break;

    case "request_data":
      updated.unresolvedItems = [
        ...(current.unresolvedItems || []),
        "additional_data_requested",
      ];
      updated.recommendedNextAction = "Await additional data before proceeding.";
      break;

    case "resolve":
      updated.unresolvedItems = [];
      updated.contradictionStatus = "none";
      updated.recommendedNextAction = "All issues resolved. Ready for next step.";
      break;

    default:
      throw new Error("Unknown action type");
  }

  updated.lastTruthRefresh = new Date().toISOString();

  return setTruth(updated);
}
