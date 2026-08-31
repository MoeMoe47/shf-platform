-- SHF Ecosystem Phase 4 — canonical Career Event and Opportunity
-- foundation, replacing Calendar's DEMO_CAREER/DEMO_MENTOR/DEMO_OPPORTUNITIES
-- fixtures with real, tenant-isolated, Enrollment-entitled backend domains.
--
-- Career Event and Opportunity are kept as two distinct tables (not one
-- generic table) per the phase's own domain boundary: a Career Event is a
-- scheduled, time-based activity; an Opportunity is a pursuable thing with
-- a deadline, not inherently an event. See
-- docs/SHF_CAREER_EVENTS_OPPORTUNITIES_FOUNDATION.md for the full model.
--
-- Both reuse the canonical Enrollment/Cohort foundation from Phase 1
-- (cohorts, enrollments) for PROGRAM/COHORT eligibility — no second
-- membership model. Both reuse the existing `organizations` table (already
-- carrying org_type='partner' rows) as the host/source-organization
-- reference — no new employer/partner registry.
--
-- Deliberately NOT referencing `careers`/`career_families` (migration 033):
-- audited during this phase and found physically absent from shs_dev
-- despite a ledgered 'baseline-1' row (the same class of gap reconciled
-- for migration 031 in Phase 3.1). Adding an FK to an unverified table
-- would make this migration unsafe. The optional Career/pathway link is
-- deferred until that is reconciled in its own phase.

CREATE TABLE IF NOT EXISTS career_events (
  career_event_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'CAREER_FAIR', 'EMPLOYER_SESSION', 'WORKSHOP', 'SITE_VISIT', 'INTERVIEW',
    'HIRING_EVENT', 'MENTOR_SESSION', 'APPRENTICESHIP_INFO', 'NETWORKING'
  )),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'ARCHIVED')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('IN_PERSON', 'VIRTUAL', 'HYBRID')),
  location TEXT,
  host_organization_id TEXT REFERENCES organizations(organization_id),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  registration_required BOOLEAN NOT NULL DEFAULT FALSE,
  audience_scope TEXT NOT NULL DEFAULT 'ORGANIZATION' CHECK (audience_scope IN ('ORGANIZATION', 'PROGRAM', 'COHORT')),
  program_id TEXT,
  cohort_id TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT career_events_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT career_events_valid_dates CHECK (ends_at >= starts_at),
  CONSTRAINT career_events_audience_shape_check CHECK (
    (audience_scope = 'ORGANIZATION' AND program_id IS NULL AND cohort_id IS NULL)
    OR (audience_scope = 'PROGRAM' AND program_id IS NOT NULL AND cohort_id IS NULL)
    OR (audience_scope = 'COHORT' AND cohort_id IS NOT NULL AND program_id IS NULL)
  ),
  CONSTRAINT career_events_program_same_org_fk
    FOREIGN KEY (organization_id, program_id) REFERENCES programs(organization_id, program_id),
  CONSTRAINT career_events_cohort_same_org_fk
    FOREIGN KEY (organization_id, cohort_id) REFERENCES cohorts(organization_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS career_events_scope_idx
  ON career_events (organization_id, status, starts_at);

CREATE INDEX IF NOT EXISTS career_events_audience_idx
  ON career_events (organization_id, audience_scope, program_id, cohort_id);

CREATE TABLE IF NOT EXISTS opportunities (
  opportunity_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN (
    'INTERNSHIP', 'APPRENTICESHIP', 'SCHOLARSHIP', 'JOB', 'FELLOWSHIP', 'TRAINING', 'SPONSORED_PROGRAM', 'OTHER'
  )),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'ARCHIVED')),
  -- Deadlines are calendar dates, not moments in time (see phase brief
  -- §30) — DATE avoids UTC-midnight off-by-one bugs that a TIMESTAMPTZ
  -- "deadline" would invite.
  opens_at DATE,
  application_deadline DATE NOT NULL,
  starts_at DATE,
  ends_at DATE,
  delivery_mode TEXT CHECK (delivery_mode IS NULL OR delivery_mode IN ('IN_PERSON', 'VIRTUAL', 'HYBRID')),
  location TEXT,
  source_organization_id TEXT REFERENCES organizations(organization_id),
  action_url TEXT,
  action_route TEXT,
  audience_scope TEXT NOT NULL DEFAULT 'ORGANIZATION' CHECK (audience_scope IN ('ORGANIZATION', 'PROGRAM', 'COHORT')),
  program_id TEXT,
  cohort_id TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT opportunities_tenant_matches_org CHECK (tenant_id = 'tenant:' || organization_id),
  CONSTRAINT opportunities_valid_open_window CHECK (opens_at IS NULL OR opens_at <= application_deadline),
  CONSTRAINT opportunities_valid_program_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at),
  -- An Opportunity must lead somewhere real — never a dead informational
  -- record with no destination (phase brief §20/§32).
  CONSTRAINT opportunities_action_destination_check CHECK (action_url IS NOT NULL OR action_route IS NOT NULL),
  CONSTRAINT opportunities_audience_shape_check CHECK (
    (audience_scope = 'ORGANIZATION' AND program_id IS NULL AND cohort_id IS NULL)
    OR (audience_scope = 'PROGRAM' AND program_id IS NOT NULL AND cohort_id IS NULL)
    OR (audience_scope = 'COHORT' AND cohort_id IS NOT NULL AND program_id IS NULL)
  ),
  CONSTRAINT opportunities_program_same_org_fk
    FOREIGN KEY (organization_id, program_id) REFERENCES programs(organization_id, program_id),
  CONSTRAINT opportunities_cohort_same_org_fk
    FOREIGN KEY (organization_id, cohort_id) REFERENCES cohorts(organization_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS opportunities_scope_idx
  ON opportunities (organization_id, status, application_deadline);

CREATE INDEX IF NOT EXISTS opportunities_audience_idx
  ON opportunities (organization_id, audience_scope, program_id, cohort_id);

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT permission_id, role_id, permission_name
FROM (
  VALUES
    ('rp_phase4_career_event_view_student', 'role_student', 'careerEvent.view'),
    ('rp_phase4_career_event_view_instructor', 'role_instructor', 'careerEvent.view'),
    ('rp_phase4_career_event_manage_instructor', 'role_instructor', 'careerEvent.manage'),
    ('rp_phase4_career_event_manage_org_admin', 'role_org_admin', 'careerEvent.manage'),
    ('rp_phase4_opportunity_view_student', 'role_student', 'opportunity.view'),
    ('rp_phase4_opportunity_view_instructor', 'role_instructor', 'opportunity.view'),
    ('rp_phase4_opportunity_manage_instructor', 'role_instructor', 'opportunity.manage'),
    ('rp_phase4_opportunity_manage_org_admin', 'role_org_admin', 'opportunity.manage')
) AS requested(permission_id, role_id, permission_name)
WHERE EXISTS (SELECT 1 FROM roles WHERE roles.role_id = requested.role_id)
ON CONFLICT (role_permission_id) DO NOTHING;
