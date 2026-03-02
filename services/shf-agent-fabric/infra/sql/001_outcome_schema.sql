-- =========================================================
-- SHF Outcome Infrastructure: Outcome Data Schema (Postgres)
-- =========================================================

-- -------------------------
-- 0) Extensions (optional)
-- -------------------------
-- NOTE: If you want uuid-ossp instead of gen_random_uuid(), enable uuid-ossp and switch defaults.
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- IMPORTANT:
-- This schema uses gen_random_uuid(). On Postgres, ensure pgcrypto is available:
--   CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------
-- 0b) Extensions (recommended)
-- -------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------
-- 1) Organizations & Programs
-- -------------------------
CREATE TABLE organizations (
  org_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name         text NOT NULL,
  org_type         text NOT NULL CHECK (org_type IN ('nonprofit','county','foundation','school','employer','other')),
  ein              text NULL,
  city             text NULL,
  state            text NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE programs (
  program_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  program_name     text NOT NULL,
  category         text NOT NULL CHECK (category IN ('workforce','housing','recovery','youth','education','other')),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cohorts (
  cohort_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       uuid NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,
  cohort_name      text NOT NULL,                     -- e.g., "Summer 2026 Cohort A"
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  target_age_min   int NULL,
  target_age_max   int NULL,
  target_population text NULL,                        -- "opportunity youth", "housing-impacted", etc.
  reporting_period text NULL,                         -- e.g. "2026-Q2"
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, cohort_name)
);

-- -------------------------
-- 2) Participants & Enrollment
-- -------------------------
CREATE TABLE participants (
  participant_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref     text NULL,                         -- if org has internal ID
  first_name       text NULL,
  last_name        text NULL,
  dob              date NULL,
  gender           text NULL,
  zip_code         text NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE enrollments (
  enrollment_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id        uuid NOT NULL REFERENCES cohorts(cohort_id) ON DELETE CASCADE,
  participant_id   uuid NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
  enrolled_at      timestamptz NOT NULL DEFAULT now(),
  exited_at        timestamptz NULL,
  exit_reason      text NULL,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','withdrawn','removed')),
  UNIQUE (cohort_id, participant_id)
);

-- -------------------------
-- 3) Sessions & Attendance (Engagement Evidence)
-- -------------------------
CREATE TABLE sessions (
  session_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id        uuid NOT NULL REFERENCES cohorts(cohort_id) ON DELETE CASCADE,
  session_date     date NOT NULL,
  minutes_planned  int NULL,
  session_type     text NULL,                         -- workshop, mentoring, internship-day, etc.
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, session_date, session_type)
);

CREATE TABLE attendance (
  attendance_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  enrollment_id    uuid NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  status           text NOT NULL CHECK (status IN ('present','absent','late','excused')),
  minutes_attended int NULL,
  notes            text NULL,
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, enrollment_id)
);

-- -------------------------
-- 4) Milestones (Progress Markers)
-- -------------------------
CREATE TABLE milestones (
  milestone_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id        uuid NOT NULL REFERENCES cohorts(cohort_id) ON DELETE CASCADE,
  milestone_key    text NOT NULL,                     -- e.g., "resume_completed", "mock_interview_passed"
  milestone_label  text NOT NULL,
  category         text NOT NULL DEFAULT 'general',    -- workforce/housing/etc
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, milestone_key)
);

CREATE TABLE milestone_events (
  milestone_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id    uuid NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  milestone_id     uuid NOT NULL REFERENCES milestones(milestone_id) ON DELETE CASCADE,
  achieved_at      timestamptz NOT NULL DEFAULT now(),
  evidence         jsonb NULL,                         -- optional proof metadata
  UNIQUE (enrollment_id, milestone_id)
);

-- -------------------------
-- 5) Outcome Events (Modular Outcomes)
-- -------------------------
CREATE TABLE outcome_events (
  outcome_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id    uuid NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  outcome_type     text NOT NULL,                      -- e.g., job_placement, certification_earned, housing_placed
  outcome_date     date NOT NULL,
  outcome_value    numeric NULL,                       -- wage, score, etc. (optional)
  outcome_unit     text NULL,                          -- "USD/hr", "certificate", etc.
  details          jsonb NULL,                         -- structured per module
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Helpful index for queries by cohort via enrollment
CREATE INDEX idx_outcome_events_enrollment ON outcome_events(enrollment_id);
CREATE INDEX idx_outcome_events_type_date ON outcome_events(outcome_type, outcome_date);

-- -------------------------
-- 6) Verification (Outcome Verification Layer)
-- -------------------------
CREATE TABLE verification_events (
  verification_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_event_id uuid NOT NULL REFERENCES outcome_events(outcome_event_id) ON DELETE CASCADE,
  verifier_type    text NOT NULL CHECK (verifier_type IN ('employer','school','case_manager','system','document','other')),
  verifier_ref     text NULL,
  verification_status text NOT NULL CHECK (verification_status IN ('pending','verified','rejected')),
  verified_at      timestamptz NULL,
  evidence         jsonb NULL,                         -- links, docs metadata, signatures, etc.
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_outcome ON verification_events(outcome_event_id);

-- -------------------------
-- 7) Follow-ups (Longitudinal Tracking)
-- -------------------------
CREATE TABLE followups (
  followup_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id    uuid NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  followup_months  int NOT NULL CHECK (followup_months IN (3,6,12)),
  followup_date    date NOT NULL,
  status           text NULL,                          -- employed, housed, in_school, etc.
  details          jsonb NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, followup_months)
);

-- -------------------------
-- 8) Costs (Cost-Per-Impact Engine)
-- -------------------------
CREATE TABLE costs (
  cost_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id        uuid NOT NULL REFERENCES cohorts(cohort_id) ON DELETE CASCADE,
  cost_type        text NOT NULL CHECK (cost_type IN ('staff','stipends','materials','transport','facility','admin','other')),
  amount           numeric NOT NULL CHECK (amount >= 0),
  currency         text NOT NULL DEFAULT 'USD',
  incurred_date    date NOT NULL,
  notes            text NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_costs_cohort ON costs(cohort_id);

CREATE TABLE stipend_payments (
  stipend_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id    uuid NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  amount           numeric NOT NULL CHECK (amount >= 0),
  currency         text NOT NULL DEFAULT 'USD',
  paid_date        date NOT NULL,
  method           text NULL,                          -- check, card, ACH
  notes            text NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- -------------------------
-- 9) OMS Metric Definitions
-- -------------------------
CREATE TABLE metric_definitions (
  metric_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key       text NOT NULL UNIQUE,               -- e.g., "completion_rate"
  metric_name      text NOT NULL,
  description      text NOT NULL,
  scope            text NOT NULL CHECK (scope IN ('cohort','program','org','network')),
  category         text NOT NULL CHECK (category IN ('universal','workforce','housing','recovery','youth','education','other')),
  unit             text NULL,                          -- %, count, USD, etc.
  formula_hint     text NULL,                          -- human-readable
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- -------------------------
-- 10) Metric Values (Computed + Auditable)
-- -------------------------
CREATE TABLE metric_values (
  metric_value_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id        uuid NOT NULL REFERENCES metric_definitions(metric_id) ON DELETE RESTRICT,
  cohort_id        uuid NULL REFERENCES cohorts(cohort_id) ON DELETE CASCADE,
  program_id       uuid NULL REFERENCES programs(program_id) ON DELETE CASCADE,
  org_id           uuid NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  value_numeric    numeric NULL,
  value_text       text NULL,
  computed_at      timestamptz NOT NULL DEFAULT now(),
  computed_by      text NOT NULL DEFAULT 'system',      -- system/user/service name
  provenance       jsonb NULL,                          -- inputs, query hashes, etc.
  CHECK (
    (cohort_id IS NOT NULL)::int +
    (program_id IS NOT NULL)::int +
    (org_id IS NOT NULL)::int
    = 1
  )
);

CREATE INDEX idx_metric_values_metric ON metric_values(metric_id);
CREATE INDEX idx_metric_values_cohort ON metric_values(cohort_id);

-- -------------------------
-- 11) Scores (Funding Readiness, Program Health)
-- -------------------------
CREATE TABLE scores (
  score_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id        uuid NOT NULL REFERENCES cohorts(cohort_id) ON DELETE CASCADE,
  score_type       text NOT NULL CHECK (score_type IN ('funding_readiness','program_health')),
  score_value      numeric NOT NULL CHECK (score_value >= 0 AND score_value <= 100),
  components       jsonb NULL,                          -- breakdown: sub-scores
  computed_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, score_type)
);

-- -------------------------
-- 12) Risk Flags (Early Risk Indicators)
-- -------------------------
CREATE TABLE risk_flags (
  risk_flag_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id        uuid NOT NULL REFERENCES cohorts(cohort_id) ON DELETE CASCADE,
  risk_type        text NOT NULL,                       -- attendance_drop, cost_overrun, completion_risk
  severity         text NOT NULL CHECK (severity IN ('low','medium','high')),
  detected_at      timestamptz NOT NULL DEFAULT now(),
  details          jsonb NULL
);

CREATE INDEX idx_risk_flags_cohort ON risk_flags(cohort_id);

-- -------------------------
-- 13) Benchmarks (Cross-Program Benchmarking / Network Averages)
-- -------------------------
CREATE TABLE benchmarks (
  benchmark_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id        uuid NOT NULL REFERENCES metric_definitions(metric_id) ON DELETE RESTRICT,
  benchmark_scope  text NOT NULL CHECK (benchmark_scope IN ('program_category','org','network')),
  category         text NULL,                          -- workforce/housing/etc when scope=program_category
  org_id           uuid NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  period           text NOT NULL,                       -- e.g. "2026-Q2"
  p25              numeric NULL,
  p50              numeric NULL,
  p75              numeric NULL,
  avg              numeric NULL,
  computed_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (benchmark_scope = 'network' AND org_id IS NULL)
    OR (benchmark_scope = 'org' AND org_id IS NOT NULL)
    OR (benchmark_scope = 'program_category')
  )
);

-- -------------------------
-- 14) Outcome Funding Engine (Simulation + Contract Models)
-- -------------------------
CREATE TABLE funding_models (
  funding_model_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_org_id     uuid NULL REFERENCES organizations(org_id) ON DELETE SET NULL, -- county/foundation
  model_name       text NOT NULL,
  currency         text NOT NULL DEFAULT 'USD',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE funding_model_rules (
  rule_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_model_id uuid NOT NULL REFERENCES funding_models(funding_model_id) ON DELETE CASCADE,
  metric_key       text NOT NULL,                       -- ties to metric_definitions.metric_key
  pay_type         text NOT NULL CHECK (pay_type IN ('base','bonus','penalty')),
  amount_per_unit  numeric NOT NULL,                    -- e.g., $2500 per job placement
  cap_amount       numeric NULL,                        -- optional cap
  conditions       jsonb NULL,                          -- thresholds, eligibility, etc.
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE funding_simulations (
  simulation_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_model_id uuid NOT NULL REFERENCES funding_models(funding_model_id) ON DELETE CASCADE,
  cohort_id        uuid NULL REFERENCES cohorts(cohort_id) ON DELETE SET NULL,
  program_id       uuid NULL REFERENCES programs(program_id) ON DELETE SET NULL,
  period           text NULL,                           -- if simulating across period vs cohort
  assumptions      jsonb NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE funding_simulation_results (
  result_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id    uuid NOT NULL REFERENCES funding_simulations(simulation_id) ON DELETE CASCADE,
  total_payment    numeric NOT NULL,
  breakdown        jsonb NOT NULL,                      -- rule-by-rule payments
  computed_at      timestamptz NOT NULL DEFAULT now()
);
