import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

export const PLATFORM_METRIC_REGISTRY_AUTHORITY = "platform-metric-registry";
const REGISTRY_URL = new URL("../../../../../../services/shf-agent-fabric/contracts/reporting/metric_registry.v1.json", import.meta.url);

export class PlatformMetricRegistryAdapter {
  constructor(private readRegistry: () => any = () => JSON.parse(readFileSync(REGISTRY_URL, "utf8"))) {}

  registrationMetadata(input: any) {
    const metricId = String(input?.metric_id || input?.metricId || "").trim();
    const version = Number(input?.version || 1);
    const registry = this.readRegistry();
    const definition = registry?.definitions?.find((item: any) => item?.metric_id === metricId && Number(item?.version) === version && item?.status === "active");
    if (!definition) throw new Error("GPA_METRIC_NOT_REGISTERED_IN_PLATFORM_REGISTRY");
    return metricRegistryMetadata({
      ...input,
      metric_id: definition.metric_id,
      version: definition.version,
      metadata: {
        ...(input?.metadata || {}),
        canonicalDefinitionDigest: stableDigest(definition),
        canonicalOwner: definition.owner,
        canonicalFormula: definition.formula,
        canonicalFormulaType: definition.formula_type,
        canonicalPublicEligibility: definition.public_eligibility,
      },
    });
  }
}

export function metricRegistryMetadata(input: any) {
  const metricId = String(input?.metric_id || input?.metricId || "").trim();
  const version = Number(input?.version || 1);
  if (!metricId || !Number.isInteger(version) || version < 1) throw new Error("GPA_METRIC_REGISTRY_ID_REQUIRED");
  const existing = input?.metadata && typeof input.metadata === "object" ? input.metadata : {};
  if (existing.metricRegistryAuthority && existing.metricRegistryAuthority !== PLATFORM_METRIC_REGISTRY_AUTHORITY) {
    throw new Error("GPA_METRIC_REGISTRY_AUTHORITY_CONFLICT");
  }
  return {
    ...existing,
    metricRegistryAuthority: PLATFORM_METRIC_REGISTRY_AUTHORITY,
    metricRegistryReference: existing.metricRegistryReference || `${metricId}:${version}`,
    definitionVersion: version,
  };
}

function stableDigest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
