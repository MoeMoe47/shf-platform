import type { ContradictionStatus } from "../domain/types.js";

export function deriveContradictionStatus(input: {
  conflictCount?: number;
  escalated?: boolean;
  resolved?: boolean;
}): ContradictionStatus {
  const conflictCount = input.conflictCount || 0;

  if (input.resolved) return "resolved";
  if (input.escalated) return "escalated";
  if (conflictCount >= 2) return "unresolved_conflict";
  if (conflictCount === 1) return "minor_conflict";
  return "none";
}
