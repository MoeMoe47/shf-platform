-- Policy v1 is approved through the server authority after institutional
-- sign-offs. This migration only hardens sign-off identity and uniqueness.
ALTER TABLE report_public_disclosure_policy_signoffs
  DROP CONSTRAINT IF EXISTS report_public_disclosure_policy_signoffs_signoff_type_check;

ALTER TABLE report_public_disclosure_policy_signoffs
  ADD CONSTRAINT report_public_disclosure_policy_signoffs_signoff_type_check
  CHECK (signoff_type IN ('PRIVACY_DATA_GOVERNANCE', 'LEGAL_PRIVACY_REVIEW', 'EXECUTIVE_APPROVAL'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_public_disclosure_policy_signoff_type
  ON report_public_disclosure_policy_signoffs (policy_id, signoff_type)
  WHERE status <> 'REJECTED';
