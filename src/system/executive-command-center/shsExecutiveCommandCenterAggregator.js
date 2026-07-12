import { readExecutiveSourceSummaries } from "./shsExecutiveCommandCenterSources";
import { calculateExecutiveHealth } from "./shsExecutiveCommandCenterHealth";
import { calculateExecutiveReadiness } from "./shsExecutiveCommandCenterReadiness";
import { calculateExecutiveMetrics } from "./shsExecutiveCommandCenterMetrics";
import { rankExecutivePriorities } from "./shsExecutiveCommandCenterPriorities";
import { summarizeExecutiveRisks } from "./shsExecutiveCommandCenterRisks";
import { buildSafeNextActions } from "./shsExecutiveCommandCenterActions";
import { buildExecutiveSafetySummary } from "./shsExecutiveCommandCenterSafety";
import { listExecutiveNavigationLinks } from "./shsExecutiveCommandCenterNavigation";
import { getExecutiveNotes, getExecutiveSnapshots, getReviewedPriorities } from "./shsExecutiveCommandCenterStorage";

export function getExecutiveCommandCenterState() {
  const layers = readExecutiveSourceSummaries();
  const safety = buildExecutiveSafetySummary(layers);
  const readiness = calculateExecutiveReadiness(layers, safety);
  const health = calculateExecutiveHealth(layers);
  const reviewed = getReviewedPriorities();
  const priorities = rankExecutivePriorities(layers, reviewed);
  const risks = summarizeExecutiveRisks(layers);
  const metrics = calculateExecutiveMetrics(layers);
  const safe_next_actions = buildSafeNextActions(priorities, layers);
  const overall_status = readiness.status === "blocked" ? "blocked" : health.status;
  return {
    generated_at: new Date().toISOString(),
    overall_status,
    layers,
    source_group_count: layers.length,
    health,
    readiness,
    metrics,
    priorities,
    risks,
    safe_next_actions,
    navigation: listExecutiveNavigationLinks(layers),
    safety,
    notes: getExecutiveNotes(),
    snapshots: getExecutiveSnapshots(),
    data_posture: metrics.data_posture_summary,
  };
}
