-- Phase 6 remediation: make Evidence correction history executable without
-- mutating the original source result or creating a second evidence table.
ALTER TABLE prepare_prove_evidence
  DROP CONSTRAINT IF EXISTS prepare_prove_evidence_status_check;
ALTER TABLE prepare_prove_evidence
  ADD CONSTRAINT prepare_prove_evidence_status_check
  CHECK (status IN ('CANDIDATE', 'REVIEWABLE', 'REVIEWED', 'INSUFFICIENT', 'SUPERSEDED'));
ALTER TABLE prepare_prove_evidence
  DROP CONSTRAINT IF EXISTS prepare_prove_evidence_supersedes_fkey;
ALTER TABLE prepare_prove_evidence
  ADD CONSTRAINT prepare_prove_evidence_supersedes_fkey
  FOREIGN KEY (supersedes_evidence_id) REFERENCES prepare_prove_evidence(evidence_id);
DROP INDEX IF EXISTS prepare_prove_evidence_phase6_source_idx;
CREATE UNIQUE INDEX prepare_prove_evidence_phase6_source_idx
  ON prepare_prove_evidence (organization_id, source_type, source_record_id, evidence_rule_id)
  WHERE evidence_rule_id IS NOT NULL AND status <> 'SUPERSEDED';
