/** Public GPA reads are projections only; internal GPA rows are never public DTOs. */
export const PUBLIC_PROJECTION_AUTHORITY = "reporting-public-disclosure";

const PUBLIC_FIELDS = [
  "public_reference",
  "report_id", "report_version", "metric_label", "reporting_period_start",
  "reporting_period_end", "reporting_period", "reporting_period_label",
  "data_as_of", "geography_level", "program_granularity",
  "public_representation_type", "public_display_value", "suppression_state",
  "published_at",
];

export function toPublicProjection(row: any) {
  if (!row || row.projection_status !== "PUBLISHED" || row.source_type !== "CANONICAL_PUBLICATION") return null;
  return Object.fromEntries(PUBLIC_FIELDS.filter((field) => row[field] !== undefined).map((field) => [field, row[field]]));
}

export function requirePublicScope(input: any) {
  const organizationId = String(input?.organizationId || input?.organization_id || "").trim();
  const jurisdiction = String(input?.jurisdiction || input?.jurisdiction_reference || "").trim();
  if (!organizationId && !jurisdiction) throw new Error("PUBLIC_PROJECTION_SCOPE_REQUIRED");
  return { organizationId: organizationId || null, jurisdiction: jurisdiction || null };
}
