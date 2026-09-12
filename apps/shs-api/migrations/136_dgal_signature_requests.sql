-- DGAL-5: provider-neutral electronic-signature requests and verified artifacts.
-- Provider state is normalized here; legal, Evidence, Truth, and workflow
-- authorities remain outside DGAL.

CREATE TABLE IF NOT EXISTS documentation_signature_requests (
  signature_request_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  owning_domain TEXT NOT NULL,
  requirement_rule_id TEXT,
  document_instance_id TEXT NOT NULL REFERENCES dgal_document_instances(document_instance_id),
  template_version_id TEXT NOT NULL,
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  agreement_reference TEXT,
  agreement_version TEXT,
  signer_reference TEXT NOT NULL,
  signer_role TEXT NOT NULL,
  signer_capacity TEXT,
  represented_party_reference TEXT,
  provider_key TEXT NOT NULL,
  provider_environment TEXT NOT NULL CHECK (provider_environment IN ('TEST','SANDBOX','PRODUCTION')),
  provider_request_reference TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','VIEWED','SIGNED','DECLINED','VOIDED','EXPIRED','FAILED')),
  provider_status TEXT,
  provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_event_reference TEXT,
  signed_artifact_reference TEXT,
  signed_artifact_hash TEXT CHECK (signed_artifact_hash IS NULL OR signed_artifact_hash ~ '^[0-9a-f]{64}$'),
  signed_artifact_media_type TEXT,
  signed_artifact_byte_length BIGINT CHECK (signed_artifact_byte_length IS NULL OR signed_artifact_byte_length > 0),
  evidence_reference TEXT,
  retention_policy_key TEXT,
  legal_hold_reference TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  idempotency_key TEXT,
  CONSTRAINT documentation_signature_scope_pair CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT documentation_signature_signed_time CHECK (status <> 'SIGNED' OR signed_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS documentation_signature_idempotency_idx
  ON documentation_signature_requests (organization_id, tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documentation_signature_provider_ref_idx
  ON documentation_signature_requests (provider_key, provider_environment, provider_request_reference)
  WHERE provider_request_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS documentation_signature_scope_idx
  ON documentation_signature_requests (organization_id, tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS documentation_signature_signers (
  signature_signer_id TEXT PRIMARY KEY,
  signature_request_id TEXT NOT NULL REFERENCES documentation_signature_requests(signature_request_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  signer_order INTEGER NOT NULL CHECK (signer_order > 0),
  signer_reference TEXT NOT NULL,
  signer_role TEXT NOT NULL,
  signer_capacity TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','VIEWED','SIGNED','DECLINED','VOIDED','EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (signature_request_id, signer_order),
  CONSTRAINT documentation_signature_signer_scope_pair CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS documentation_signature_provider_events (
  provider_event_id TEXT PRIMARY KEY,
  provider_key TEXT NOT NULL,
  provider_environment TEXT NOT NULL CHECK (provider_environment IN ('TEST','SANDBOX','PRODUCTION')),
  provider_event_reference TEXT NOT NULL,
  provider_request_reference TEXT,
  organization_id TEXT REFERENCES organizations(organization_id),
  tenant_id TEXT,
  normalized_status TEXT,
  raw_status TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_key, provider_environment, provider_event_reference),
  CONSTRAINT documentation_signature_event_scope_pair CHECK (organization_id IS NULL OR tenant_id = 'tenant:' || organization_id)
);
