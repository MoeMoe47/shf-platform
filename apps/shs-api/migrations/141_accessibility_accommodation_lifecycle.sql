-- AX-4: institutional accommodation request/fulfillment lifecycle.
-- Existing authorized_accommodations remains the active grant projection.
CREATE TABLE IF NOT EXISTS accessibility_accommodation_cases (
  accommodation_case_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  subject_user_id TEXT NOT NULL,
  requested_by_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','INFORMATION_REQUESTED','APPROVED','DECLINED','ACTIVE','SUSPENDED','EXPIRED','SUPERSEDED','CLOSED','WITHDRAWN')),
  request_type TEXT NOT NULL CHECK (request_type IN ('ALTERNATIVE_FORMAT','CAPTIONS','TRANSCRIPT','INTERPRETER','EXTENDED_TIME','REDUCED_DISTRACTION','ACCESSIBLE_MATERIALS','ASSISTIVE_TECH_SUPPORT','LIVE_SESSION_SUPPORT','OTHER_REVIEWED')),
  request_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  scope_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by_user_id TEXT REFERENCES users(user_id),
  approved_by_user_id TEXT REFERENCES users(user_id),
  decision_at TIMESTAMPTZ,
  effective_from TIMESTAMPTZ,
  effective_until TIMESTAMPTZ,
  review_at TIMESTAMPTZ,
  assigned_owner_user_id TEXT REFERENCES users(user_id),
  supersedes_case_id TEXT REFERENCES accessibility_accommodation_cases(accommodation_case_id),
  privacy_classification TEXT NOT NULL DEFAULT 'SENSITIVE',
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  CHECK (effective_until IS NULL OR effective_from IS NULL OR effective_until > effective_from),
  FOREIGN KEY (organization_id, subject_user_id) REFERENCES users(organization_id, user_id),
  FOREIGN KEY (organization_id, requested_by_user_id) REFERENCES users(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS accessibility_accommodation_requirements (
  accommodation_requirement_id TEXT PRIMARY KEY,
  accommodation_case_id TEXT NOT NULL REFERENCES accessibility_accommodation_cases(accommodation_case_id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('ALTERNATIVE_FORMAT','CAPTIONS','TRANSCRIPT','INTERPRETER','EXTENDED_TIME','REDUCED_DISTRACTION','ACCESSIBLE_MATERIALS','ASSISTIVE_TECH_SUPPORT','LIVE_SESSION_SUPPORT','OTHER_REVIEWED')),
  requirement_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'REQUIRED' CHECK (status IN ('REQUIRED','APPROVED','DECLINED','SUPERSEDED')),
  fulfillment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (fulfillment_status IN ('NOT_REQUIRED','PENDING','IN_PROGRESS','DELIVERED','PARTIAL','BLOCKED','UNAVAILABLE','EXTERNAL_DEPENDENCY')),
  fulfillment_owner_user_id TEXT REFERENCES users(user_id),
  external_dependency TEXT,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accessibility_accommodation_cases_scope_idx
  ON accessibility_accommodation_cases (organization_id, tenant_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS accessibility_accommodation_cases_subject_idx
  ON accessibility_accommodation_cases (organization_id, subject_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS accessibility_accommodation_requirements_case_idx
  ON accessibility_accommodation_requirements (accommodation_case_id, fulfillment_status);

-- Add only the bounded AX-4 permissions to existing role records when present.
-- No role is created and no wildcard authority is granted by this migration.
INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT 'rp_ax4_' || md5(r.role_id || ':request'), r.role_id, 'accessibility.accommodation.request'
FROM roles r WHERE r.role_name IN ('student', 'instructor')
ON CONFLICT (role_id, permission_name) DO NOTHING;
INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT 'rp_ax4_' || md5(r.role_id || ':review'), r.role_id, 'accessibility.accommodation.review'
FROM roles r WHERE r.role_name IN ('reviewer', 'program_manager')
ON CONFLICT (role_id, permission_name) DO NOTHING;
INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT 'rp_ax4_' || md5(r.role_id || ':approve'), r.role_id, 'accessibility.accommodation.approve'
FROM roles r WHERE r.role_name IN ('org_admin')
ON CONFLICT (role_id, permission_name) DO NOTHING;
INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT 'rp_ax4_' || md5(r.role_id || ':fulfill'), r.role_id, 'accessibility.accommodation.fulfill'
FROM roles r WHERE r.role_name IN ('org_admin', 'instructor')
ON CONFLICT (role_id, permission_name) DO NOTHING;
