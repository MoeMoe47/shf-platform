-- Wave 3F: allow the existing derived risk signal to record authorized escalation.
-- Findings, corrective actions, and decisions remain owned by their existing tables.
ALTER TABLE gpa_risk_signals DROP CONSTRAINT IF EXISTS gpa_risk_signals_status_check;
ALTER TABLE gpa_risk_signals ADD CONSTRAINT gpa_risk_signals_status_check
  CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED','DISMISSED','ESCALATED'));
