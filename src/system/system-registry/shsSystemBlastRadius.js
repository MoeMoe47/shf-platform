import { getDependents, getLayerById, getTransitiveDependents } from "./shsSystemDependencyGraph";

const criticalCategories = new Set(["governance", "truth", "security", "persistence", "tracking", "orchestrator", "registry"]);

export function getBlastRadius(layerId) {
  const layer = getLayerById(layerId);
  if (!layer) {
    return {
      layer_id: layerId,
      direct_dependents: [],
      transitive_dependents: [],
      shared_routes: [],
      shared_files: [],
      validators_to_run: [],
      manual_reviews_required: ["unknown layer review"],
      risk_level: "needs_review",
      safe_change_guidance: ["Register the layer before changing related files."],
    };
  }
  const direct = getDependents(layerId);
  const transitive = getTransitiveDependents(layerId);
  const sharedRoutes = [layer.admin_route, layer.public_route].filter(Boolean);
  const sharedFiles = [...(layer.source_files || []), ...(layer.data_contracts || [])];
  const validators = Array.from(new Set([...(layer.validators || []), ...direct.flatMap((item) => item.validators || [])]));
  const risk_level = getRiskLevel(layer, direct, transitive);
  return {
    layer_id: layer.layer_id,
    direct_dependents: direct.map((item) => item.layer_id),
    transitive_dependents: transitive.map((item) => item.layer_id),
    shared_routes: sharedRoutes,
    shared_files: sharedFiles,
    validators_to_run: validators,
    manual_reviews_required: manualReviews(layer, risk_level),
    risk_level,
    safe_change_guidance: guidance(layer, risk_level),
  };
}

export function getRiskLevel(layer, direct = [], transitive = []) {
  if (criticalCategories.has(layer.category) || layer.layer_id.includes("public_approval") || layer.layer_id.includes("truth")) {
    return "critical";
  }
  if (layer.admin_route || direct.length > 2 || transitive.length > 4 || layer.source_files?.some((file) => file.startsWith("src/system/"))) {
    return "high";
  }
  if (layer.source_files?.length || layer.admin_route) return "medium";
  return "low";
}

function manualReviews(layer, riskLevel) {
  const reviews = [];
  if (riskLevel === "critical") reviews.push("owner review", "governance review", "security/privacy review");
  if (layer.admin_route) reviews.push("route/identity boundary review");
  if (layer.docs?.some((doc) => doc.includes("REPORT")) || layer.category === "reports") reviews.push("reports/public approval review");
  return Array.from(new Set(reviews));
}

function guidance(layer, riskLevel) {
  const base = ["Keep changes local and review-first.", "Run listed validators before packaging.", "Do not widen access or enable external delivery."];
  if (riskLevel === "critical") base.push("Require owner review before commit.");
  if (layer.admin_route) base.push("Smoke the protected admin route as shs_admin and blocked roles.");
  return base;
}

