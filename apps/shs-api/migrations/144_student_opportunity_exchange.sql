-- MET-8: Student Opportunity Exchange.
-- Governed student work/project bid marketplace. Distinct from `opportunities`
-- (046_career_events_opportunities_foundation.sql — external internship/job
-- board with actionUrl/actionRoute) and from `exchange_funding_commitments`
-- (010 — org-to-org funding). Table prefix `student_opportunity_*` keeps all
-- three unambiguous.

CREATE TABLE IF NOT EXISTS student_opportunities (
  opportunity_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  sponsor_org_id TEXT NOT NULL,
  sponsor_user_id TEXT NOT NULL REFERENCES users(user_id),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 500),
  description TEXT,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN (
    'PROJECT','CITY_MISSION','PROGRAM_MISSION','SIDE_MISSION','EVENT',
    'CAREER_EXPERIENCE','STUDENT_ENTERPRISE_CONTRACT','COMMUNITY_PROJECT','ARCADE_CHALLENGE_CONTRACT'
  )),
  source_type TEXT NOT NULL CHECK (source_type IN (
    'CAREER_PATHWAY','PROGRAM_MISSION','SIDE_MISSION','PROJECT','EVENT',
    'INSTRUCTOR','ORGANIZATION','STUDENT_ENTERPRISE','ARCADE','CIVIC','COMMUNITY'
  )),
  source_ref TEXT,
  district_id TEXT,
  facility_id TEXT,
  mission_projection_id TEXT,
  program_id TEXT REFERENCES programs(program_id),
  career_id TEXT REFERENCES careers(career_id),
  required_skills_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_skills_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_evidence_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  eligibility_rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  difficulty_tier TEXT NOT NULL CHECK (difficulty_tier IN ('BEGINNER','DEVELOPING','ADVANCED','VERIFIED_SKILL')),
  participation_mode TEXT NOT NULL CHECK (participation_mode IN ('INDIVIDUAL','TEAM','EITHER')),
  team_size_min INTEGER CHECK (team_size_min IS NULL OR team_size_min > 0),
  team_size_max INTEGER CHECK (team_size_max IS NULL OR team_size_max >= team_size_min),
  deliverables_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  deadline TIMESTAMPTZ NOT NULL,
  application_open_at TIMESTAMPTZ,
  application_close_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','OPEN','PAUSED','CLOSED','AWARD_PENDING','AWARDED','COMPLETED','CANCELLED','ARCHIVED')),
  compensation_type TEXT NOT NULL CHECK (compensation_type IN ('SHF_CREDITS','PROGRAM_POINTS','NON_MONETARY','NONE','FUTURE_EXTERNAL_PAYMENT_REFERENCE')),
  compensation_amount NUMERIC,
  currency_type TEXT,
  selection_method TEXT NOT NULL CHECK (selection_method IN ('BEST_FIT','SPONSOR_SELECTS','ROTATION','LOTTERY','FIRST_TIME_PRIORITY','INSTRUCTOR_ASSIGNMENT','TEAM_SELECTION')),
  max_awards INTEGER NOT NULL DEFAULT 1 CHECK (max_awards > 0),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  CHECK (tenant_id = 'tenant:' || organization_id),
  CHECK (application_open_at IS NULL OR application_open_at <= application_close_at),
  CHECK (application_close_at <= deadline)
);
CREATE INDEX IF NOT EXISTS student_opportunity_scope_idx ON student_opportunities (organization_id, tenant_id, status);
CREATE INDEX IF NOT EXISTS student_opportunity_program_idx ON student_opportunities (organization_id, program_id) WHERE program_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS student_opportunity_bids (
  bid_id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL REFERENCES student_opportunities(opportunity_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  bidder_type TEXT NOT NULL CHECK (bidder_type IN ('INDIVIDUAL','TEAM')),
  student_id TEXT REFERENCES users(user_id),
  team_id TEXT REFERENCES studio_teams(studio_team_id),
  proposal_summary TEXT NOT NULL CHECK (length(proposal_summary) BETWEEN 1 AND 4000),
  approach TEXT,
  requested_compensation_amount NUMERIC,
  requested_compensation_type TEXT CHECK (requested_compensation_type IS NULL OR requested_compensation_type IN ('SHF_CREDITS','PROGRAM_POINTS','NON_MONETARY','NONE','FUTURE_EXTERNAL_PAYMENT_REFERENCE')),
  estimated_completion_days INTEGER CHECK (estimated_completion_days IS NULL OR estimated_completion_days > 0),
  portfolio_evidence_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  skill_evidence_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  availability TEXT,
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','SHORTLISTED','ACCEPTED','DECLINED','WITHDRAWN','EXPIRED')),
  revision INTEGER NOT NULL DEFAULT 1,
  withdrawn_at TIMESTAMPTZ,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  CHECK ((bidder_type = 'INDIVIDUAL' AND student_id IS NOT NULL AND team_id IS NULL) OR (bidder_type = 'TEAM' AND team_id IS NOT NULL AND student_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS student_opportunity_bid_individual_active_idx
  ON student_opportunity_bids (opportunity_id, student_id)
  WHERE bidder_type = 'INDIVIDUAL' AND status NOT IN ('WITHDRAWN','DECLINED','EXPIRED');
CREATE UNIQUE INDEX IF NOT EXISTS student_opportunity_bid_team_active_idx
  ON student_opportunity_bids (opportunity_id, team_id)
  WHERE bidder_type = 'TEAM' AND status NOT IN ('WITHDRAWN','DECLINED','EXPIRED');
CREATE INDEX IF NOT EXISTS student_opportunity_bid_scope_idx ON student_opportunity_bids (organization_id, tenant_id, opportunity_id);

CREATE TABLE IF NOT EXISTS student_opportunity_awards (
  award_id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL REFERENCES student_opportunities(opportunity_id),
  bid_id TEXT NOT NULL UNIQUE REFERENCES student_opportunity_bids(bid_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  student_id TEXT REFERENCES users(user_id),
  team_id TEXT REFERENCES studio_teams(studio_team_id),
  sponsor_user_id TEXT NOT NULL REFERENCES users(user_id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  work_scope_snapshot_json JSONB NOT NULL,
  deliverables_snapshot_json JSONB NOT NULL,
  compensation_snapshot_json JSONB NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AWARDED','ACTIVE','SUBMITTED','UNDER_REVIEW','COMPLETED','CANCELLED','EXPIRED')),
  project_ref TEXT REFERENCES projects(project_id),
  payment_intent_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  CHECK ((student_id IS NOT NULL) OR (team_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS student_opportunity_award_scope_idx ON student_opportunity_awards (organization_id, tenant_id, opportunity_id);
CREATE INDEX IF NOT EXISTS student_opportunity_award_student_idx ON student_opportunity_awards (organization_id, student_id) WHERE student_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS student_opportunity_submissions (
  submission_id TEXT PRIMARY KEY,
  award_id TEXT NOT NULL REFERENCES student_opportunity_awards(award_id),
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  submitted_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  artifact_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  student_comment TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED','NEEDS_REVISION','ACCEPTED','DECLINED')),
  reviewed_by_user_id TEXT REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  review_feedback TEXT,
  version INTEGER NOT NULL CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (award_id, version)
);
CREATE INDEX IF NOT EXISTS student_opportunity_submission_scope_idx ON student_opportunity_submissions (organization_id, tenant_id, award_id);
