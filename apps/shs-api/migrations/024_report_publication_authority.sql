-- Institutional authority and exact-snapshot release approval are governance
-- references. They are not publication or public projection actions.
CREATE TABLE IF NOT EXISTS report_publication_authorities (
  authority_id TEXT PRIMARY KEY,
  authority_type TEXT NOT NULL CHECK (authority_type IN ('SHF_EXECUTIVE_AUTHORITY', 'PUBLIC_REPORTING_RELEASE_AUTHORITY')),
  parent_authority_id TEXT REFERENCES report_publication_authorities(authority_id),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  authority_reference TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
  effective_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  recorded_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS report_publication_release_approvals (
  release_approval_id TEXT PRIMARY KEY,
  public_snapshot_id TEXT NOT NULL REFERENCES report_public_snapshots(public_snapshot_id),
  snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
  snapshot_hash TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  authority_id TEXT NOT NULL REFERENCES report_publication_authorities(authority_id),
  approval_category TEXT NOT NULL CHECK (approval_category = 'PUBLIC_REPORTING_RELEASE_APPROVAL'),
  status TEXT NOT NULL CHECK (status IN ('APPROVED', 'REVOKED')),
  approved_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_report_publication_release_approval_scope
  ON report_publication_release_approvals (tenant_id, organization_id, public_snapshot_id, approved_at DESC);

CREATE TABLE IF NOT EXISTS report_publication_authorizations (
  publication_authorization_id TEXT PRIMARY KEY,
  public_snapshot_id TEXT NOT NULL REFERENCES report_public_snapshots(public_snapshot_id),
  snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
  snapshot_hash TEXT NOT NULL,
  report_id TEXT NOT NULL,
  report_version INTEGER NOT NULL CHECK (report_version > 0),
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  public_eligibility_decision_id TEXT NOT NULL REFERENCES report_public_eligibility_decisions(public_eligibility_decision_id),
  public_disclosure_decision_id TEXT NOT NULL REFERENCES report_public_disclosure_decisions(public_disclosure_decision_id),
  disclosure_policy_reference TEXT NOT NULL,
  disclosure_policy_version TEXT NOT NULL,
  institutional_authority_reference TEXT NOT NULL,
  release_approval_reference TEXT NOT NULL REFERENCES report_publication_release_approvals(release_approval_id),
  status TEXT NOT NULL CHECK (status IN ('PUBLICATION_AUTHORIZED', 'PUBLICATION_REVOKED')),
  authorized_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purpose_reference TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (tenant_id, organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_report_publication_authorization_scope
  ON report_publication_authorizations (tenant_id, organization_id, public_snapshot_id, authorized_at DESC);
