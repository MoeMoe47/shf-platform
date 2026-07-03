import { SHS_SYSTEM_REGISTRY_SAFETY_COPY } from "./shsSystemRegistryTypes";
import {
  detectCircularDependencies,
  detectMissingDependencies,
  detectMissingDocs,
  detectMissingValidators,
  listLayers,
} from "./shsSystemDependencyGraph";

export function scanSystemRegistrySafety(layers = listLayers()) {
  const issues = [];
  const cycles = detectCircularDependencies();
  const missingDependencies = detectMissingDependencies();
  const missingDocs = detectMissingDocs();
  const missingValidators = detectMissingValidators();

  cycles.forEach((layer_id) => issues.push({ layer_id, severity: "critical", reason: "dependency cycle" }));
  missingDependencies.forEach((item) => issues.push({ ...item, severity: "high", reason: "missing dependency" }));
  missingDocs.forEach((layer) => issues.push({ layer_id: layer.layer_id, severity: "medium", reason: "missing docs" }));
  missingValidators.forEach((layer) => issues.push({ layer_id: layer.layer_id, severity: "medium", reason: "missing validator" }));

  layers.forEach((layer) => {
    if (layer.admin_route && layer.owner_surface !== "admin" && layer.owner_surface !== "hub_admin") {
      issues.push({ layer_id: layer.layer_id, severity: "medium", reason: "unknown owner surface" });
    }
    if (layer.public_route && layer.category !== "public") {
      issues.push({ layer_id: layer.layer_id, severity: "high", reason: "public route with internal layer" });
    }
    Object.entries(layer.dangerous_capabilities || {}).forEach(([flag, enabled]) => {
      if (enabled) issues.push({ layer_id: layer.layer_id, severity: "critical", reason: `dangerous capability true: ${flag}` });
    });
  });

  return {
    safe: issues.filter((issue) => issue.severity === "critical").length === 0,
    issue_count: issues.length,
    issues,
    safety_copy: SHS_SYSTEM_REGISTRY_SAFETY_COPY,
  };
}

export function hasCriticalUnsafeFlags(result = scanSystemRegistrySafety()) {
  return result.issues.some((issue) => issue.severity === "critical");
}

