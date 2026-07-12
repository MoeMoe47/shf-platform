import { clampScore, statusFromScore } from "./shsExecutiveCommandCenterTypes";

export function calculateExecutiveHealth(layers = []) {
  let score = 100;
  const deductions = [];
  const unavailable = layers.filter((layer) => layer.status === "unavailable");
  const degraded = layers.filter((layer) => layer.status === "degraded");
  const blocked = layers.filter((layer) => layer.status === "blocked");
  const unknown = layers.filter((layer) => ["unavailable", "needs_review"].includes(layer.data_posture));
  const warnings = layers.reduce((sum, layer) => sum + (layer.warnings?.length || 0), 0);

  if (unavailable.length) {
    const points = unavailable.length * 5;
    score -= points;
    deductions.push({ reason: "unavailable_layers", points, layers: unavailable.map((layer) => layer.layer_id) });
  }
  if (degraded.length) {
    const points = degraded.length * 8;
    score -= points;
    deductions.push({ reason: "degraded_layers", points, layers: degraded.map((layer) => layer.layer_id) });
  }
  if (blocked.length) {
    const points = blocked.length * 12;
    score -= points;
    deductions.push({ reason: "blocked_layers", points, layers: blocked.map((layer) => layer.layer_id) });
  }
  if (unknown.length >= Math.ceil(layers.length / 3)) {
    score -= 10;
    deductions.push({ reason: "stale_or_unknown_source_status", points: 10, count: unknown.length });
  }
  if (warnings) {
    const points = Math.min(20, warnings * 2);
    score -= points;
    deductions.push({ reason: "unresolved_safety_warnings", points, count: warnings });
  }

  const health_score = clampScore(score);
  return {
    health_score,
    status: statusFromScore(health_score, blocked.length > 0),
    deductions,
    unavailable_layers: unavailable.length,
    degraded_layers: degraded.length,
    blocked_layers: blocked.length,
  };
}
