-- DGAL-1: canonical registry metadata and deterministic requirement rules.
-- This migration stores definitions only. It does not create document instances,
-- acknowledgments, signatures, Evidence records, Truth facts, or retention logic.

CREATE TABLE IF NOT EXISTS dgal_document_types (
  document_type_id TEXT PRIMARY KEY,
  document_type_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owning_domain TEXT NOT NULL,
  default_classification TEXT NOT NULL DEFAULT 'INTERNAL',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dgal_guidance_items (
  guidance_item_id TEXT PRIMARY KEY,
  guidance_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  owning_domain TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  action_reference TEXT,
  audience_roles TEXT[] NOT NULL DEFAULT '{}',
  service_key TEXT,
  organization_id TEXT REFERENCES organizations(organization_id),
  tenant_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dgal_guidance_scope_pair CHECK (
    (organization_id IS NULL AND tenant_id IS NULL) OR
    (organization_id IS NOT NULL AND tenant_id = 'tenant:' || organization_id)
  ),
  CONSTRAINT dgal_guidance_action_reference_safe CHECK (
    action_reference IS NULL OR action_reference !~ '^(https?:|javascript:|data:|//)'
  )
);

CREATE INDEX IF NOT EXISTS idx_dgal_guidance_scope
  ON dgal_guidance_items (organization_id, tenant_id, service_key, status);

CREATE TABLE IF NOT EXISTS dgal_guidance_collections (
  guidance_collection_id TEXT PRIMARY KEY,
  collection_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  owning_domain TEXT NOT NULL,
  service_key TEXT,
  organization_id TEXT REFERENCES organizations(organization_id),
  tenant_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dgal_collection_scope_pair CHECK (
    (organization_id IS NULL AND tenant_id IS NULL) OR
    (organization_id IS NOT NULL AND tenant_id = 'tenant:' || organization_id)
  )
);

CREATE TABLE IF NOT EXISTS dgal_guidance_collection_items (
  guidance_collection_id TEXT NOT NULL REFERENCES dgal_guidance_collections(guidance_collection_id) ON DELETE CASCADE,
  guidance_item_id TEXT NOT NULL REFERENCES dgal_guidance_items(guidance_item_id),
  display_order INTEGER NOT NULL CHECK (display_order >= 0),
  PRIMARY KEY (guidance_collection_id, guidance_item_id),
  UNIQUE (guidance_collection_id, display_order)
);

CREATE TABLE IF NOT EXISTS dgal_document_templates (
  template_id TEXT PRIMARY KEY,
  document_type_id TEXT NOT NULL REFERENCES dgal_document_types(document_type_id),
  template_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  owning_domain TEXT NOT NULL,
  service_key TEXT,
  canonical_source_owner TEXT NOT NULL,
  content_reference TEXT NOT NULL,
  organization_id TEXT REFERENCES organizations(organization_id),
  tenant_id TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','SUPERSEDED','RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dgal_template_scope_pair CHECK (
    (organization_id IS NULL AND tenant_id IS NULL) OR
    (organization_id IS NOT NULL AND tenant_id = 'tenant:' || organization_id)
  )
);

CREATE INDEX IF NOT EXISTS idx_dgal_templates_scope
  ON dgal_document_templates (organization_id, tenant_id, service_key, status);

CREATE TABLE IF NOT EXISTS dgal_template_versions (
  template_version_id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES dgal_document_templates(template_id),
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  revision TEXT NOT NULL,
  effective_at TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','SUPERSEDED','RETIRED')),
  source_reference TEXT NOT NULL,
  content_hash TEXT,
  classification TEXT NOT NULL DEFAULT 'INTERNAL',
  approval_reference TEXT,
  created_by_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, version_number),
  UNIQUE (template_id, revision)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dgal_one_active_template_version
  ON dgal_template_versions (template_id)
  WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS dgal_requirement_rules (
  requirement_rule_id TEXT PRIMARY KEY,
  rule_key TEXT NOT NULL UNIQUE,
  owning_domain TEXT NOT NULL,
  service_key TEXT,
  organization_type TEXT,
  relationship_type TEXT,
  audience_roles TEXT[] NOT NULL DEFAULT '{}',
  workflow_type TEXT,
  workflow_stage TEXT,
  resource_type TEXT,
  policy_reference TEXT,
  document_type_id TEXT REFERENCES dgal_document_types(document_type_id),
  template_id TEXT REFERENCES dgal_document_templates(template_id),
  guidance_item_id TEXT REFERENCES dgal_guidance_items(guidance_item_id),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('REFERENCE','GUIDANCE','REQUIRED_DOCUMENT','REQUIRED_ACKNOWLEDGMENT','REQUIRED_SIGNATURE','OPTIONAL_DOCUMENT')),
  required BOOLEAN NOT NULL DEFAULT FALSE,
  requires_entitlement BOOLEAN NOT NULL DEFAULT TRUE,
  source_reference TEXT NOT NULL,
  action_reference TEXT,
  effective_from TIMESTAMPTZ,
  effective_until TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT','ACTIVE','SUPERSEDED','RETIRED')),
  organization_id TEXT REFERENCES organizations(organization_id),
  tenant_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dgal_rule_scope_pair CHECK (
    (organization_id IS NULL AND tenant_id IS NULL) OR
    (organization_id IS NOT NULL AND tenant_id = 'tenant:' || organization_id)
  ),
  CONSTRAINT dgal_rule_time_order CHECK (
    effective_until IS NULL OR effective_from IS NULL OR effective_until >= effective_from
  ),
  CONSTRAINT dgal_rule_action_reference_safe CHECK (
    action_reference IS NULL OR action_reference !~ '^(https?:|javascript:|data:|//)'
  ),
  CONSTRAINT dgal_rule_target_required CHECK (
    document_type_id IS NOT NULL
    OR template_id IS NOT NULL
    OR guidance_item_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_dgal_rules_resolution
  ON dgal_requirement_rules (organization_id, tenant_id, service_key, workflow_type, workflow_stage, status, priority);
