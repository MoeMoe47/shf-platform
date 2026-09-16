-- MET-14: SHF Civic canonical student-government and city-operations authority.
--
-- These tables are intentionally named shf_civic_* because SHF Civic is the
-- canonical authority for student civic government in Silicon Heartland.
-- CivicSure/government-assurance remains separate and is not referenced here.
-- Scope is city-level educational simulation only: no real voter registration,
-- public election administration, partisan party infrastructure, fundraising,
-- endorsements, or real campaign-finance mechanics.

CREATE TABLE IF NOT EXISTS shf_civic_offices (
  civic_office_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  city_id TEXT NOT NULL DEFAULT 'silicon-heartland',
  title TEXT NOT NULL,
  office_type TEXT NOT NULL CHECK (office_type IN ('EXECUTIVE','COUNCIL','COMMITTEE','CLERK','BUDGET','INFRASTRUCTURE','TECHNOLOGY','COMMUNITY','EDUCATION','ACCESSIBILITY','SUSTAINABILITY')),
  representation_scope TEXT NOT NULL CHECK (representation_scope IN ('SCHOOL','SCHOOL_DISTRICT','PROGRAM','COHORT','CITY_AT_LARGE','CIVIC_DISTRICT')),
  representation_ref TEXT,
  term_length_days INTEGER NOT NULL CHECK (term_length_days > 0),
  eligibility_policy_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  seat_count INTEGER NOT NULL DEFAULT 1 CHECK (seat_count > 0),
  election_method TEXT NOT NULL CHECK (election_method IN ('SINGLE_CHOICE','MULTI_SEAT')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','ARCHIVED')),
  description TEXT NOT NULL DEFAULT '',
  responsibilities_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS shf_civic_candidacies (
  candidacy_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  office_id TEXT NOT NULL REFERENCES shf_civic_offices(civic_office_id),
  student_user_id TEXT NOT NULL REFERENCES users(user_id),
  representation_ref TEXT NOT NULL,
  statement TEXT NOT NULL DEFAULT '',
  platform_summary TEXT NOT NULL DEFAULT '',
  priority_topics_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  artifact_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  filed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','DECLINED','WITHDRAWN','DISQUALIFIED','ELECTION_COMPLETE')),
  eligibility_snapshot_json JSONB NOT NULL,
  reviewed_by_user_id TEXT REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  moderation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING','APPROVED','DECLINED','REMOVED')),
  visibility_boost_purchased BOOLEAN NOT NULL DEFAULT FALSE CHECK (visibility_boost_purchased = FALSE),
  contact_info_public BOOLEAN NOT NULL DEFAULT FALSE CHECK (contact_info_public = FALSE),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS shf_civic_elections (
  civic_election_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  office_id TEXT NOT NULL REFERENCES shf_civic_offices(civic_office_id),
  title TEXT NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  eligible_voter_scope TEXT NOT NULL CHECK (eligible_voter_scope IN ('SCHOOL','SCHOOL_DISTRICT','PROGRAM','COHORT','CITY_AT_LARGE','CIVIC_DISTRICT')),
  candidate_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  seat_count INTEGER NOT NULL DEFAULT 1 CHECK (seat_count > 0),
  ballot_method TEXT NOT NULL DEFAULT 'SINGLE_CHOICE' CHECK (ballot_method IN ('SINGLE_CHOICE','MULTI_SEAT')),
  status TEXT NOT NULL CHECK (status IN ('DRAFT','SCHEDULED','OPEN','CLOSED','CERTIFICATION_PENDING','CERTIFIED','CANCELLED','ARCHIVED')),
  results_release_policy TEXT NOT NULL DEFAULT 'AFTER_CERTIFICATION' CHECK (results_release_policy IN ('AFTER_CERTIFICATION')),
  candidate_ordering_policy TEXT NOT NULL DEFAULT 'ALPHABETIC_BY_DISPLAY_NAME' CHECK (candidate_ordering_policy IN ('ALPHABETIC_BY_DISPLAY_NAME','FILING_ORDER','SEEDED_RANDOM')),
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  CHECK (opens_at < closes_at)
);

-- Participation is deliberately separate from secret vote choice. Ordinary
-- audit/outbox events should reference shf_civic_vote_participation only.
CREATE TABLE IF NOT EXISTS shf_civic_vote_participation (
  vote_participation_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  election_id TEXT NOT NULL REFERENCES shf_civic_elections(civic_election_id),
  voter_user_id TEXT NOT NULL REFERENCES users(user_id),
  voter_scope_ref TEXT NOT NULL,
  eligibility_snapshot_json JSONB NOT NULL,
  cast_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key TEXT NOT NULL,
  CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, tenant_id, election_id, voter_user_id),
  UNIQUE (organization_id, tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS shf_civic_vote_choice_vault (
  vote_choice_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  election_id TEXT NOT NULL REFERENCES shf_civic_elections(civic_election_id),
  vote_participation_id TEXT NOT NULL REFERENCES shf_civic_vote_participation(vote_participation_id),
  encrypted_choice_ref TEXT NOT NULL,
  choice_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (vote_participation_id)
);

CREATE TABLE IF NOT EXISTS shf_civic_terms (
  civic_term_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  office_id TEXT NOT NULL REFERENCES shf_civic_offices(civic_office_id),
  office_holder_user_id TEXT NOT NULL REFERENCES users(user_id),
  representation_scope TEXT NOT NULL,
  representation_ref TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('CERTIFIED_STUDENT_ELECTION','GOVERNED_APPOINTMENT','SPECIAL_ELECTION')),
  source_ref TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','ACTIVE','COMPLETED','VACATED','SUSPENDED','REMOVED')),
  CHECK (tenant_id = 'tenant:' || organization_id),
  CHECK (starts_at < ends_at)
);

CREATE TABLE IF NOT EXISTS shf_civic_proposals (
  civic_proposal_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL REFERENCES users(user_id),
  sponsor_ref TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  proposal_type TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  estimated_cost NUMERIC(14,2),
  simulated_shf_credit_budget NUMERIC(14,2),
  district_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','SUBMITTED','COMMITTEE_REVIEW','AGENDA_READY','DEBATE','VOTING','APPROVED','DECLINED','RETURNED','IMPLEMENTATION_PENDING','IMPLEMENTING','COMPLETED','ARCHIVED')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS shf_civic_council_sessions (
  civic_session_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  agenda_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  minutes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','OPEN','CLOSED','MINUTES_APPROVED','ARCHIVED')),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS shf_civic_council_votes (
  civic_council_vote_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  proposal_id TEXT NOT NULL REFERENCES shf_civic_proposals(civic_proposal_id),
  term_id TEXT NOT NULL REFERENCES shf_civic_terms(civic_term_id),
  office_holder_user_id TEXT NOT NULL REFERENCES users(user_id),
  vote TEXT NOT NULL CHECK (vote IN ('YES','NO','ABSTAIN')),
  roll_call_public BOOLEAN NOT NULL DEFAULT TRUE,
  cast_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id),
  UNIQUE (organization_id, tenant_id, proposal_id, office_holder_user_id)
);

CREATE TABLE IF NOT EXISTS shf_civic_public_comments (
  civic_public_comment_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  proposal_id TEXT REFERENCES shf_civic_proposals(civic_proposal_id),
  submitted_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  body TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING','APPROVED','DECLINED','REMOVED')),
  accessible_alternative_requested BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS shf_civic_city_projects (
  civic_city_project_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  source_proposal_id TEXT NOT NULL REFERENCES shf_civic_proposals(civic_proposal_id),
  project_authority TEXT NOT NULL CHECK (project_authority IN ('MET8_OPPORTUNITY_EXCHANGE','PROJECT_DOMAIN','MISSION_DOMAIN')),
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','OPPORTUNITY_PENDING','ACTIVE','COMPLETED','ARCHIVED')),
  budget_boundary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE TABLE IF NOT EXISTS shf_civic_city_operations (
  civic_city_operation_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(organization_id),
  tenant_id TEXT NOT NULL,
  operational_area TEXT NOT NULL CHECK (operational_area IN ('INFRASTRUCTURE','TECHNOLOGY','DATA_CENTER','PUBLIC_REALM','COMMUNITY_PROGRAMS','EVENTS','ACCESSIBILITY','SUSTAINABILITY','TRANSIT','EDUCATION')),
  state TEXT NOT NULL CHECK (state IN ('NORMAL','PLANNED','ACTIVE_PROJECT','ATTENTION_REQUIRED','SIMULATED_INCIDENT','RESOLVED')),
  source_ref TEXT,
  public_summary TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tenant_id = 'tenant:' || organization_id)
);

CREATE INDEX IF NOT EXISTS shf_civic_offices_scope_idx ON shf_civic_offices (organization_id, tenant_id, representation_scope, representation_ref);
CREATE INDEX IF NOT EXISTS shf_civic_candidacies_office_idx ON shf_civic_candidacies (organization_id, tenant_id, office_id, status);
CREATE INDEX IF NOT EXISTS shf_civic_elections_status_idx ON shf_civic_elections (organization_id, tenant_id, status, opens_at, closes_at);
CREATE INDEX IF NOT EXISTS shf_civic_terms_holder_idx ON shf_civic_terms (organization_id, tenant_id, office_holder_user_id, status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS shf_civic_proposals_status_idx ON shf_civic_proposals (organization_id, tenant_id, status, proposal_type);
CREATE INDEX IF NOT EXISTS shf_civic_city_operations_area_idx ON shf_civic_city_operations (organization_id, tenant_id, operational_area, state);
