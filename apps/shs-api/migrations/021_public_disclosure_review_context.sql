-- Store only the bounded policy-evaluation metadata and public representation;
-- never report contents, participant data, Truth, or Evidence payloads.
ALTER TABLE report_public_disclosure_decisions
  ADD COLUMN IF NOT EXISTS review_context JSONB;

ALTER TABLE report_public_disclosure_decisions
  DROP CONSTRAINT IF EXISTS report_public_disclosure_decisions_review_context_check;

ALTER TABLE report_public_disclosure_decisions
  ADD CONSTRAINT report_public_disclosure_decisions_review_context_check
  CHECK (review_context IS NULL OR jsonb_typeof(review_context) = 'object');
