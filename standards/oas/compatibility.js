import catalog from "./catalog.json" with { type: "json" };

export const publicDomains = catalog.domains.map((domain) => ({
  n: domain.ordinal, label: domain.domain_name, domainId: domain.domain_id,
}));
// Legacy report ordinals are not aliases for canonical OAS domain IDs.
export const legacyReportingDomains = catalog.legacy_taxonomies[0].domains.map(
  (domain) => [domain.legacy_id, domain.legacy_label],
);
