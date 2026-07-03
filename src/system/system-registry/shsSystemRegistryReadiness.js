import { calculateSystemReadiness, listLayers } from "./shsSystemDependencyGraph";
import { scanSystemRegistrySafety } from "./shsSystemRegistrySafety";

export function calculateRegistryLayerReadiness(layer) {
  let score = 100;
  if (!layer.docs?.length) score -= 25;
  if (layer.source_files?.length && !layer.validators?.length) score -= 25;
  if (layer.admin_route && layer.owner_surface !== "admin" && layer.owner_surface !== "hub_admin") score -= 20;
  if (!layer.dependencies?.length) score -= 20;
  if (layer.validators?.length && !layer.package_scripts?.length && layer.validators.some((validator) => validator.endsWith(".py"))) score -= 15;
  if (!layer.safety_rules?.length) score -= 15;
  if (!layer.owner_surface) score -= 15;
  if (Object.values(layer.dangerous_capabilities || {}).some(Boolean)) score -= 50;
  if (layer.dangerous_capabilities?.shf_impact_mutation || layer.dangerous_capabilities?.public_approval_mutation) score -= 50;
  return Math.max(0, score);
}

export function calculateRegistrySystemReadiness(layers = listLayers()) {
  const safety = scanSystemRegistrySafety(layers);
  const score = calculateSystemReadiness();
  const unguardedInternalAdminRoutes = safety.issues.filter((issue) => issue.reason === "unknown owner surface");
  const publicApprovalMutationRisk = safety.issues.some((issue) => issue.reason.includes("public_approval_mutation"));
  const shfImpactMutationRisk = safety.issues.some((issue) => issue.reason.includes("shf_impact_mutation"));
  const authMutationRisk = safety.issues.some((issue) => issue.reason.includes("auth_mutation"));
  return {
    score,
    ready: score >= 85 && safety.safe && !publicApprovalMutationRisk && !shfImpactMutationRisk && !authMutationRisk && unguardedInternalAdminRoutes.length === 0,
    safety,
    publicApprovalMutationRisk,
    shfImpactMutationRisk,
    authMutationRisk,
    unguardedInternalAdminRoutes: unguardedInternalAdminRoutes.map((issue) => issue.layer_id),
  };
}

