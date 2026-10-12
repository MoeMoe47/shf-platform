-- 1C: curriculum evidence rules are logical, organization-scoped rules.
--
-- Migration 067 already declared the canonical logical identity as
-- UNIQUE (organization_id, evidence_rule_id, rule_version), but also made
-- evidence_rule_id a global primary key. That global primary key prevents
-- two organizations from using the same logical rule id and conflicts with
-- createEvidenceRule's org-scoped upsert contract.
ALTER TABLE curriculum_evidence_rules
  DROP CONSTRAINT IF EXISTS curriculum_evidence_rules_pkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'curriculum_evidence_rules'::regclass
      AND conname = 'curriculum_evidence_rules_org_rule_version_key'
  ) THEN
    ALTER TABLE curriculum_evidence_rules
      ADD CONSTRAINT curriculum_evidence_rules_org_rule_version_key
      UNIQUE (organization_id, evidence_rule_id, rule_version);
  END IF;
END $$;
