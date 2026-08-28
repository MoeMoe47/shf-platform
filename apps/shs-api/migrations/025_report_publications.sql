-- Canonical publication records and the public Impact projection for governed snapshots.
-- This migration does not publish a URL or store private canonical values.
CREATE TABLE IF NOT EXISTS report_publications (
  publication_id TEXT PRIMARY KEY,
  publication_authorization_id TEXT NOT NULL REFERENCES report_publication_authorizations(publication_authorization_id),
  public_snapshot_id TEXT NOT NULL REFERENCES report_public_snapshots(public_snapshot_id),
  snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
  snapshot_hash TEXT NOT NULL CHECK (snapshot_hash ~ '^[0-9a-f]{64}$'),
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  publication_status TEXT NOT NULL CHECK (publication_status = 'PUBLISHED'),
  published_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  projection_reference TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (tenant_id, organization_id, idempotency_key),
  UNIQUE (tenant_id, organization_id, public_snapshot_id)
);

CREATE TABLE IF NOT EXISTS shf_public_impact_projections (
  projection_id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES report_publications(publication_id),
  public_snapshot_id TEXT NOT NULL REFERENCES report_public_snapshots(public_snapshot_id),
  snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
  snapshot_hash TEXT NOT NULL CHECK (snapshot_hash ~ '^[0-9a-f]{64}$'),
  report_id TEXT NOT NULL CHECK (report_id = 'report.curriculum.lesson_completion_count.v1'),
  report_version INTEGER NOT NULL CHECK (report_version = 1),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  metric_label TEXT NOT NULL CHECK (metric_label = 'Verified Lesson Completions'),
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  reporting_period TEXT NOT NULL CHECK (reporting_period IN ('QUARTERLY', 'ANNUAL')),
  reporting_period_label TEXT NOT NULL,
  data_as_of TIMESTAMPTZ NOT NULL,
  geography_level TEXT NOT NULL CHECK (geography_level IN ('COUNTY', 'STATE', 'ORGANIZATION_WIDE')),
  program_granularity TEXT NOT NULL CHECK (program_granularity IN ('FOUNDATION_WIDE', 'NAMED_PROGRAM')),
  public_representation_type TEXT NOT NULL CHECK (public_representation_type IN ('EXACT_COUNT', 'SUPPRESSED_LT_10')),
  public_display_value TEXT NOT NULL,
  suppression_state TEXT NOT NULL CHECK (suppression_state IN ('NONE', 'SUPPRESSED_LT_10')),
  source_type TEXT NOT NULL DEFAULT 'CANONICAL_PUBLICATION' CHECK (source_type = 'CANONICAL_PUBLICATION'),
  projection_status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (projection_status = 'PUBLISHED'),
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (tenant_id, organization_id, public_snapshot_id),
  UNIQUE (publication_id)
);

CREATE INDEX IF NOT EXISTS idx_report_publications_scope
  ON report_publications (tenant_id, organization_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_shf_public_impact_projections_public
  ON shf_public_impact_projections (report_id, report_version, projection_status, published_at DESC);
