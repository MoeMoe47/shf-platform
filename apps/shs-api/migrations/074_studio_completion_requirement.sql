-- Phase 10.1: reconcile the canonical completion requirement constraint with
-- the existing STUDIO_PROJECT registry entry. Historical migrations remain
-- unchanged; this additive migration is safe for fresh and upgraded stores.
ALTER TABLE completion_policy_requirements
  DROP CONSTRAINT IF EXISTS completion_policy_requirements_requirement_type_check;

ALTER TABLE completion_policy_requirements
  ADD CONSTRAINT completion_policy_requirements_requirement_type_check CHECK (requirement_type IN (
    'CONTENT', 'ARCADE', 'PROJECT', 'STUDIO_PROJECT', 'LIVE_ATTENDANCE',
    'INSTRUCTOR_VERIFICATION', 'EVIDENCE', 'ASSESSMENT', 'REFLECTION', 'PRACTICE'
  ));
