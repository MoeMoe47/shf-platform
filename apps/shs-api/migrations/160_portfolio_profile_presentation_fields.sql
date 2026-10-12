-- PORTFOLIO-3: learner-owned presentation fields for Student Portfolio.
-- These fields are explicitly not Curriculum, Evidence, Mastery, Credential,
-- or Career readiness authority.
ALTER TABLE portfolio_profiles
  ADD COLUMN IF NOT EXISTS about_text TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_reference TEXT;
