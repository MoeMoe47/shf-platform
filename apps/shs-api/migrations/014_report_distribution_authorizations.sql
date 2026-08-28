-- Records an authorized restricted-distribution handoff. It is not delivery.
CREATE TABLE IF NOT EXISTS report_distributions (
  distribution_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES report_artifacts(artifact_id),
  artifact_version INTEGER NOT NULL CHECK (artifact_version > 0),
  recipient_authorization_id TEXT NOT NULL REFERENCES report_distribution_recipients(recipient_authorization_id),
  disclosure_decision_id TEXT NOT NULL REFERENCES report_disclosure_decisions(disclosure_decision_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  authorized_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  distribution_purpose TEXT,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AUTHORIZED_FOR_DISTRIBUTION'
    CHECK (status IN ('AUTHORIZED_FOR_DISTRIBUTION')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_report_distributions_artifact
  ON report_distributions (tenant_id, organization_id, artifact_id, authorized_at DESC);
