-- DGAL-3: durable document/packet instances, artifact metadata, Evidence links,
-- and retention references. This migration does not create acknowledgments,
-- signatures, Evidence records, or a retention engine.

CREATE TABLE IF NOT EXISTS dgal_document_instances (
  document_instance_id TEXT PRIMARY KEY,
  document_type_id TEXT NOT NULL REFERENCES dgal_document_types(document_type_id),
  template_id TEXT NOT NULL REFERENCES dgal_document_templates(template_id),
  template_version_id TEXT NOT NULL REFERENCES dgal_template_versions(template_version_id),
  owning_domain TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  service_key TEXT,
  workflow_type TEXT,
  workflow_stage TEXT,
  resource_type TEXT,
  resource_id TEXT,
  subject_reference TEXT,
  title TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (classification IN ('INTERNAL','RESTRICTED_EXTERNAL','PUBLIC')),
  state TEXT NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING','GENERATED','FAILED','VOIDED','SUPERSEDED','ARCHIVED')),
  artifact_reference TEXT,
  artifact_mime_type TEXT,
  artifact_byte_length BIGINT CHECK (artifact_byte_length IS NULL OR artifact_byte_length >= 0),
  content_hash TEXT,
  renderer_id TEXT,
  renderer_version TEXT,
  generated_at TIMESTAMPTZ,
  generated_by_user_id TEXT REFERENCES users(user_id),
  source_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  retention_policy_key TEXT,
  retention_start_at TIMESTAMPTZ,
  legal_hold_reference TEXT,
  disposition_state TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (disposition_state IN ('ACTIVE','ARCHIVAL_ELIGIBLE','DELETE_REQUESTED','DISPOSED')),
  supersedes_document_instance_id TEXT REFERENCES dgal_document_instances(document_instance_id),
  replaced_by_document_instance_id TEXT REFERENCES dgal_document_instances(document_instance_id),
  generation_idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dgal_document_instance_scope_pair CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT dgal_document_instance_public_guard CHECK (classification <> 'PUBLIC' OR disposition_state = 'ACTIVE')
);

CREATE INDEX IF NOT EXISTS idx_dgal_document_instances_scope
  ON dgal_document_instances (organization_id, tenant_id, service_key, state, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dgal_document_instances_template
  ON dgal_document_instances (template_id, template_version_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dgal_document_instance_idempotency
  ON dgal_document_instances (organization_id, tenant_id, generation_idempotency_key)
  WHERE generation_idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS dgal_packet_definitions (
  packet_definition_id TEXT PRIMARY KEY,
  packet_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  owning_domain TEXT NOT NULL,
  service_key TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  classification TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (classification IN ('INTERNAL','RESTRICTED_EXTERNAL','PUBLIC')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dgal_packet_definition_items (
  packet_definition_id TEXT NOT NULL REFERENCES dgal_packet_definitions(packet_definition_id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  display_order INTEGER NOT NULL CHECK (display_order >= 0),
  item_type TEXT NOT NULL CHECK (item_type IN ('DOCUMENT_TEMPLATE','GUIDANCE','DOMAIN_ARTIFACT_REFERENCE','REPORT_ARTIFACT_REFERENCE')),
  reference_id TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  source_owner TEXT NOT NULL,
  PRIMARY KEY (packet_definition_id, item_key),
  UNIQUE (packet_definition_id, display_order)
);

CREATE TABLE IF NOT EXISTS dgal_packet_instances (
  packet_instance_id TEXT PRIMARY KEY,
  packet_definition_id TEXT REFERENCES dgal_packet_definitions(packet_definition_id),
  packet_key TEXT NOT NULL,
  title TEXT NOT NULL,
  owning_domain TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  service_key TEXT,
  workflow_type TEXT,
  workflow_stage TEXT,
  resource_type TEXT,
  resource_id TEXT,
  classification TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (classification IN ('INTERNAL','RESTRICTED_EXTERNAL','PUBLIC')),
  state TEXT NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING','PARTIAL','GENERATED','FAILED','VOIDED','SUPERSEDED','ARCHIVED')),
  manifest JSONB NOT NULL DEFAULT '[]'::jsonb,
  manifest_hash TEXT,
  retention_policy_key TEXT,
  retention_start_at TIMESTAMPTZ,
  legal_hold_reference TEXT,
  created_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dgal_packet_instance_scope_pair CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS idx_dgal_packet_instances_scope
  ON dgal_packet_instances (organization_id, tenant_id, service_key, state, created_at DESC);

CREATE TABLE IF NOT EXISTS dgal_packet_instance_items (
  packet_instance_id TEXT NOT NULL REFERENCES dgal_packet_instances(packet_instance_id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  display_order INTEGER NOT NULL CHECK (display_order >= 0),
  item_type TEXT NOT NULL CHECK (item_type IN ('DOCUMENT_INSTANCE','DOMAIN_ARTIFACT_REFERENCE','GUIDANCE','REPORT_ARTIFACT_REFERENCE')),
  reference_id TEXT NOT NULL,
  source_owner TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  state TEXT NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING','GENERATED','MISSING','FAILED','EXTERNAL')),
  content_hash TEXT,
  PRIMARY KEY (packet_instance_id, item_key),
  UNIQUE (packet_instance_id, display_order)
);

CREATE TABLE IF NOT EXISTS dgal_artifact_links (
  artifact_link_id TEXT PRIMARY KEY,
  document_instance_id TEXT NOT NULL REFERENCES dgal_document_instances(document_instance_id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('HTML','PDF','JSON','EXTERNAL')),
  media_type TEXT NOT NULL,
  storage_reference TEXT,
  content_hash TEXT NOT NULL,
  byte_length BIGINT NOT NULL CHECK (byte_length >= 0),
  renderer_id TEXT,
  renderer_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_instance_id, artifact_type, content_hash)
);

CREATE TABLE IF NOT EXISTS dgal_evidence_links (
  evidence_link_id TEXT PRIMARY KEY,
  document_instance_id TEXT NOT NULL REFERENCES dgal_document_instances(document_instance_id) ON DELETE CASCADE,
  evidence_reference TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  owning_domain TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  linked_by_user_id TEXT REFERENCES users(user_id),
  source_reference TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dgal_evidence_link_scope_pair CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (document_instance_id, evidence_reference, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_dgal_evidence_links_scope
  ON dgal_evidence_links (organization_id, tenant_id, evidence_reference);
