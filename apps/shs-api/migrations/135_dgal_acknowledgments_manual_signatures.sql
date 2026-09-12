-- DGAL-4: durable acknowledgments and manual/paper signature workflow.
-- Agreement meaning, Evidence, Truth, retention, and legal hold remain owned
-- by their existing authorities. No electronic-signature provider state lives here.

CREATE TABLE IF NOT EXISTS documentation_acknowledgments (
  acknowledgment_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(user_id),
  actor_role TEXT NOT NULL,
  represented_party_reference TEXT,
  owning_domain TEXT NOT NULL,
  requirement_rule_id TEXT,
  document_instance_id TEXT REFERENCES dgal_document_instances(document_instance_id),
  agreement_reference TEXT,
  agreement_version TEXT,
  template_version_id TEXT,
  content_hash TEXT,
  subject_reference TEXT,
  service_key TEXT,
  workflow_type TEXT,
  workflow_stage TEXT,
  resource_type TEXT,
  resource_id TEXT,
  source_action TEXT NOT NULL,
  acknowledgment_method TEXT NOT NULL DEFAULT 'DIGITAL_ACKNOWLEDGMENT' CHECK (acknowledgment_method = 'DIGITAL_ACKNOWLEDGMENT'),
  status TEXT NOT NULL DEFAULT 'ACKNOWLEDGED' CHECK (status IN ('PENDING','ACKNOWLEDGED','VOIDED','INVALIDATED','SUPERSEDED')),
  acknowledged_at TIMESTAMPTZ,
  invalidated_at TIMESTAMPTZ,
  invalidated_by_user_id TEXT REFERENCES users(user_id),
  invalidation_reason TEXT,
  retention_policy_key TEXT,
  legal_hold_reference TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT documentation_ack_scope_pair CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT documentation_ack_version_binding CHECK (document_instance_id IS NOT NULL OR agreement_reference IS NOT NULL),
  CONSTRAINT documentation_ack_action_time CHECK (status <> 'ACKNOWLEDGED' OR acknowledged_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS documentation_ack_idempotency_idx
  ON documentation_acknowledgments (organization_id, tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documentation_ack_exact_obligation_idx
  ON documentation_acknowledgments (organization_id, tenant_id, actor_user_id, owning_domain, requirement_rule_id, document_instance_id, agreement_reference, agreement_version, content_hash)
  WHERE status = 'ACKNOWLEDGED';
CREATE INDEX IF NOT EXISTS documentation_ack_scope_idx
  ON documentation_acknowledgments (organization_id, tenant_id, actor_user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS documentation_manual_signature_records (
  manual_signature_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  document_instance_id TEXT NOT NULL REFERENCES dgal_document_instances(document_instance_id),
  original_template_version_id TEXT NOT NULL,
  original_content_hash TEXT NOT NULL,
  signed_artifact_reference TEXT NOT NULL,
  signed_artifact_hash TEXT NOT NULL CHECK (signed_artifact_hash ~ '^[0-9a-f]{64}$'),
  signed_artifact_media_type TEXT NOT NULL,
  signed_artifact_byte_length BIGINT NOT NULL CHECK (signed_artifact_byte_length > 0),
  signer_reference TEXT NOT NULL,
  signer_role TEXT NOT NULL,
  signer_capacity TEXT,
  signing_date DATE,
  uploaded_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (verification_status IN ('PENDING','UPLOADED','VERIFIED','REJECTED','VOIDED')),
  verified_by_user_id TEXT REFERENCES users(user_id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  verification_category TEXT,
  owning_domain TEXT NOT NULL,
  requirement_rule_id TEXT,
  evidence_reference TEXT,
  retention_policy_key TEXT,
  legal_hold_reference TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT documentation_manual_signature_scope_pair CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT documentation_manual_signature_verified_actor CHECK ((verification_status = 'VERIFIED') = (verified_by_user_id IS NOT NULL AND verified_at IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS documentation_manual_signature_idempotency_idx
  ON documentation_manual_signature_records (organization_id, tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS documentation_manual_signature_scope_idx
  ON documentation_manual_signature_records (organization_id, tenant_id, document_instance_id, verification_status, created_at DESC);

CREATE TABLE IF NOT EXISTS documentation_manual_signature_events (
  event_id TEXT PRIMARY KEY,
  manual_signature_id TEXT NOT NULL REFERENCES documentation_manual_signature_records(manual_signature_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(user_id),
  reason_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT documentation_manual_signature_event_scope_pair CHECK (tenant_id = 'tenant:' || organization_id)
);
