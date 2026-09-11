export function toPublicAssuranceViewModel(record) {
  const period = record.reporting_period_label || record.reporting_period || "Current reporting period";
  const metric = record.metric_label || "Published assurance result";
  return {
    id: record.public_reference,
    name: metric,
    status: record.suppression_state && record.suppression_state !== "NONE" ? "Suppressed" : "Published",
    county: record.geography_level || "Public scope",
    category: record.program_granularity || "Aggregate result",
    description: `${metric} for ${period}. This public projection contains only approved, public-safe reporting data.`,
    tags: [period, record.public_representation_type || "Public-safe projection"].filter(Boolean),
    record,
  };
}
