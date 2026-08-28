-- Public governance registrations are enforced by the server-owned registry.
-- These checks keep the projection schema generic without authorizing new reports.
ALTER TABLE shf_public_impact_projections
  DROP CONSTRAINT IF EXISTS shf_public_impact_projections_report_id_check,
  DROP CONSTRAINT IF EXISTS shf_public_impact_projections_report_version_check,
  DROP CONSTRAINT IF EXISTS shf_public_impact_projections_metric_label_check;

ALTER TABLE shf_public_impact_projections
  ADD CONSTRAINT shf_public_impact_projections_report_id_check
    CHECK (length(report_id) > 0),
  ADD CONSTRAINT shf_public_impact_projections_report_version_check
    CHECK (report_version > 0),
  ADD CONSTRAINT shf_public_impact_projections_metric_label_check
    CHECK (length(metric_label) > 0);
