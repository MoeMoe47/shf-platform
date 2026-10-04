-- AFCC-3 Phase 6: durable Agent Fabric run artifacts (option A — bounded JSON
-- artifact bodies in the shared Postgres run authority).
--
-- Owned by the Fabric artifact/evidence authority. Rows are written only in
-- the same transaction as the run's terminal event
-- (services/shf-agent-fabric/fabric/run_authority_pg.py), so an artifact row
-- never exists without its run's terminal record and a COMPLETED run never
-- exists without its artifact rows.
--
-- `body_canonical` is the exact canonical JSON text the executor hashed
-- (sorted keys, compact separators, UTF-8); `content_hash` is its SHA-256, so
-- integrity is verifiable byte-for-byte. Bounded to JSON artifacts up to
-- 1 MiB: binary/report files remain the platform object-store gap (PR0-GAP-010).
--
-- Forward-only and additive, like every migration in this directory.
-- No server file paths, credentials or exception text are stored.
CREATE TABLE IF NOT EXISTS fabric_run_artifacts (
  artifact_id TEXT PRIMARY KEY,
  canonical_ref TEXT NOT NULL,
  run_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'application/json',
  content_hash TEXT NOT NULL,
  content_length INTEGER NOT NULL,
  body_canonical TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'postgres_text',
  completeness TEXT NOT NULL DEFAULT 'COMPLETE',
  retention_class TEXT NOT NULL DEFAULT 'RUN_EVIDENCE',
  created_by_actor_id TEXT NOT NULL,
  tenant_id TEXT,
  organization_id TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fabric_run_artifacts_plan_fk FOREIGN KEY (plan_id) REFERENCES fabric_plans (plan_id),
  CONSTRAINT fabric_run_artifacts_canonical_ref_unique UNIQUE (canonical_ref),
  CONSTRAINT fabric_run_artifacts_hash_check CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT fabric_run_artifacts_length_check CHECK (content_length > 0 AND content_length <= 1048576),
  CONSTRAINT fabric_run_artifacts_media_check CHECK (media_type = 'application/json'),
  CONSTRAINT fabric_run_artifacts_provider_check CHECK (storage_provider = 'postgres_text'),
  CONSTRAINT fabric_run_artifacts_completeness_check CHECK (completeness IN ('COMPLETE', 'PARTIAL'))
);

CREATE INDEX IF NOT EXISTS fabric_run_artifacts_run_idx
  ON fabric_run_artifacts (run_id, created_at);

CREATE INDEX IF NOT EXISTS fabric_run_artifacts_scope_idx
  ON fabric_run_artifacts (tenant_id, organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS fabric_run_artifacts_hash_idx
  ON fabric_run_artifacts (content_hash);
