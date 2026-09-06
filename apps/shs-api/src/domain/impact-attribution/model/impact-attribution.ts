export const IMPACT_ATTRIBUTION_SCOPES = {
  SHF_DIRECT: "SHF_DIRECT",
  SHF_SUPPORTED_NETWORK: "SHF_SUPPORTED_NETWORK",
  WHOLE_NETWORK: "WHOLE_NETWORK",
  ORGANIZATION: "ORGANIZATION",
} as const;

export type ImpactAttributionScope = typeof IMPACT_ATTRIBUTION_SCOPES[keyof typeof IMPACT_ATTRIBUTION_SCOPES];

export const IMPACT_SUPPORT_REASONS = {
  NETWORK_MEMBERSHIP: "NETWORK_MEMBERSHIP",
  INCUBATION: "INCUBATION",
  SERVICE_AGREEMENT: "SERVICE_AGREEMENT",
  FUNDING: "FUNDING",
} as const;

export const IMPACT_METRICS = {
  TRUTH_FACT_COUNT: "truth.fact_count",
  LESSON_COMPLETION_COUNT: "lesson_completion.count",
  PROJECT_ACCEPTED_COUNT: "project_accepted.count",
} as const;

export function toImpactAttributionResponse(result: any) {
  return {
    metricKey: result.metricKey,
    scope: result.scope,
    period: result.period,
    total: result.total,
    directShf: result.directShf,
    supportedNetwork: result.supportedNetwork,
    wholeNetwork: result.wholeNetwork,
    producingOrganizations: result.producingOrganizations,
    sourceFactCount: result.sourceFactCount,
    items: result.items,
  };
}
