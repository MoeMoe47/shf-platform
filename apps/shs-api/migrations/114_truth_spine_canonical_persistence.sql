-- Wave 0C: durable persistence owned by the canonical Truth Spine boundary.
-- GPA tables remain compatibility/lineage records and are not institutional Truth.
CREATE TABLE IF NOT EXISTS truth_spine_records (
  record_id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  tenant_id TEXT,
  organization_id TEXT,
  payload JSONB NOT NULL,
  payload_digest TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (namespace, entity_id, payload_digest)
);

CREATE INDEX IF NOT EXISTS truth_spine_records_scope_idx
  ON truth_spine_records (namespace, tenant_id, organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS truth_spine_records_entity_idx
  ON truth_spine_records (namespace, entity_id, created_at DESC);
