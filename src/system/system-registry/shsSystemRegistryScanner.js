import { SHS_SYSTEM_REGISTRY_ENTRIES } from "./shsSystemRegistryEntries";
import { scanSystemRegistrySafety } from "./shsSystemRegistrySafety";

export function scanDeclaredSystemRegistry() {
  return scanSystemRegistrySafety(SHS_SYSTEM_REGISTRY_ENTRIES);
}

export function getValidatorMatrix(layers = SHS_SYSTEM_REGISTRY_ENTRIES) {
  return layers.map((layer) => ({
    layer_id: layer.layer_id,
    name: layer.name,
    validators: layer.validators || [],
    package_scripts: layer.package_scripts || [],
    docs: layer.docs || [],
    route: layer.admin_route || layer.public_route || "",
    status: layer.validators?.length || layer.docs?.length ? "covered" : "needs_review",
  }));
}

