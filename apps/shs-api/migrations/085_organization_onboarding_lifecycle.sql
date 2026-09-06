-- SHF Hybrid Roadmap Phase 4: organization onboarding and network lifecycle.
-- Additive only. Candidate intake remains distinct from canonical
-- organization identity, relationships, and service entitlements.

CREATE TABLE IF NOT EXISTS organization_onboarding_cases (
  onboarding_case_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  existing_organization_id TEXT REFERENCES organizations(organization_id),
  activated_organization_id TEXT REFERENCES organizations(organization_id),
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  website TEXT,
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,
  geography TEXT,
  mission_description TEXT,
  requested_relationship_type TEXT NOT NULL,
  submitted_by_user_id TEXT REFERENCES users(user_id),
  submitted_by_organization_id TEXT REFERENCES organizations(organization_id),
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_by_user_id TEXT REFERENCES users(user_id),
  reviewed_at TIMESTAMP,
  decision_reason TEXT,
  applicant_feedback TEXT,
  activation_relationship_id TEXT REFERENCES organization_relationships(relationship_id),
  activated_by_user_id TEXT REFERENCES users(user_id),
  activated_at TIMESTAMP,
  suspended_by_user_id TEXT REFERENCES users(user_id),
  suspended_at TIMESTAMP,
  exited_by_user_id TEXT REFERENCES users(user_id),
  exited_at TIMESTAMP,
  graduation_relationship_id TEXT REFERENCES organization_relationships(relationship_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT organization_onboarding_known_status CHECK (
    status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DECLINED', 'ACTIVATED', 'SUSPENDED', 'EXITED', 'GRADUATED')
  ),
  CONSTRAINT organization_onboarding_known_relationship CHECK (
    requested_relationship_type IN ('INCUBATES', 'NETWORK_MEMBER_OF', 'SHARED_SERVICES_PROVIDER_FOR')
  ),
  CONSTRAINT organization_onboarding_activation_org CHECK (
    (status NOT IN ('ACTIVATED', 'SUSPENDED', 'EXITED', 'GRADUATED'))
    OR activated_organization_id IS NOT NULL
  ),
  CONSTRAINT organization_onboarding_review_state CHECK (
    (status NOT IN ('APPROVED', 'DECLINED', 'ACTIVATED', 'SUSPENDED', 'EXITED', 'GRADUATED'))
    OR (reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL)
  ),
  CONSTRAINT organization_onboarding_activation_state CHECK (
    (status NOT IN ('ACTIVATED', 'SUSPENDED', 'EXITED', 'GRADUATED'))
    OR (activated_by_user_id IS NOT NULL AND activated_at IS NOT NULL AND activation_relationship_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_org_onboarding_status
  ON organization_onboarding_cases(status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_org_onboarding_existing_org
  ON organization_onboarding_cases(existing_organization_id, status);

CREATE INDEX IF NOT EXISTS idx_org_onboarding_activated_org
  ON organization_onboarding_cases(activated_organization_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_onboarding_one_open_existing_org
  ON organization_onboarding_cases(existing_organization_id)
  WHERE existing_organization_id IS NOT NULL
    AND status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED');

CREATE TABLE IF NOT EXISTS organization_onboarding_requested_services (
  onboarding_case_id TEXT NOT NULL REFERENCES organization_onboarding_cases(onboarding_case_id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES service_catalog(service_id),
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by_user_id TEXT REFERENCES users(user_id),
  approved_at TIMESTAMP,
  provisioned_entitlement_id TEXT REFERENCES organization_service_entitlements(entitlement_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (onboarding_case_id, service_id),
  CONSTRAINT organization_onboarding_service_approval_actor CHECK (
    (approved = FALSE AND approved_by_user_id IS NULL AND approved_at IS NULL)
    OR (approved = TRUE AND approved_by_user_id IS NOT NULL AND approved_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_org_onboarding_requested_services_service
  ON organization_onboarding_requested_services(service_id);

CREATE TABLE IF NOT EXISTS organization_onboarding_decisions (
  onboarding_decision_id TEXT PRIMARY KEY,
  onboarding_case_id TEXT NOT NULL REFERENCES organization_onboarding_cases(onboarding_case_id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(user_id),
  decided_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reason TEXT,
  internal_notes TEXT,
  applicant_feedback TEXT,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  CONSTRAINT organization_onboarding_decision_known CHECK (
    decision IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DECLINED', 'ACTIVATED', 'SUSPENDED', 'EXITED', 'GRADUATED')
  )
);

CREATE INDEX IF NOT EXISTS idx_org_onboarding_decisions_case
  ON organization_onboarding_decisions(onboarding_case_id, decided_at DESC);

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT permission_id, role_id, permission_name
FROM (
  VALUES
    ('rp_phase4_org_onboarding_submit_super', 'role_super_admin', 'organization.onboarding.submit'),
    ('rp_phase4_org_onboarding_view_super', 'role_super_admin', 'organization.onboarding.view'),
    ('rp_phase4_org_onboarding_review_super', 'role_super_admin', 'organization.onboarding.review'),
    ('rp_phase4_org_onboarding_activate_super', 'role_super_admin', 'organization.onboarding.activate'),
    ('rp_phase4_org_onboarding_suspend_super', 'role_super_admin', 'organization.onboarding.suspend'),
    ('rp_phase4_org_onboarding_exit_super', 'role_super_admin', 'organization.onboarding.exit'),
    ('rp_phase4_org_onboarding_submit_shf', 'role_shf_admin', 'organization.onboarding.submit'),
    ('rp_phase4_org_onboarding_view_shf', 'role_shf_admin', 'organization.onboarding.view'),
    ('rp_phase4_org_onboarding_review_shf', 'role_shf_admin', 'organization.onboarding.review'),
    ('rp_phase4_org_onboarding_activate_shf', 'role_shf_admin', 'organization.onboarding.activate'),
    ('rp_phase4_org_onboarding_suspend_shf', 'role_shf_admin', 'organization.onboarding.suspend'),
    ('rp_phase4_org_onboarding_exit_shf', 'role_shf_admin', 'organization.onboarding.exit'),
    ('rp_phase4_org_onboarding_submit_shs', 'role_shs_admin', 'organization.onboarding.submit'),
    ('rp_phase4_org_onboarding_view_shs', 'role_shs_admin', 'organization.onboarding.view'),
    ('rp_phase4_org_onboarding_review_shs', 'role_shs_admin', 'organization.onboarding.review'),
    ('rp_phase4_org_onboarding_activate_shs', 'role_shs_admin', 'organization.onboarding.activate'),
    ('rp_phase4_org_onboarding_submit_org_admin', 'role_org_admin', 'organization.onboarding.submit'),
    ('rp_phase4_org_onboarding_view_org_admin', 'role_org_admin', 'organization.onboarding.view'),
    ('rp_phase4_org_onboarding_submit_partner_admin', 'role_partner_org_admin', 'organization.onboarding.submit'),
    ('rp_phase4_org_onboarding_view_partner_admin', 'role_partner_org_admin', 'organization.onboarding.view')
) AS requested(permission_id, role_id, permission_name)
WHERE EXISTS (SELECT 1 FROM roles WHERE roles.role_id = requested.role_id)
ON CONFLICT (role_permission_id) DO NOTHING;
