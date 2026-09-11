-- SYS-4C4: additive, versioned credential eligibility requirements.
ALTER TABLE credential_definitions
  ADD COLUMN IF NOT EXISTS eligibility_policy_version TEXT NOT NULL DEFAULT 'accepted-capstone.v1',
  ADD COLUMN IF NOT EXISTS eligibility_requirements_json JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS credential_definitions_policy_idx
  ON credential_definitions (eligibility_policy_version, status);
