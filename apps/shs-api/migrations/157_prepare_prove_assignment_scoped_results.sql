-- 157_prepare_prove_assignment_scoped_results.sql
--
-- Prepare/Prove assignment-scoped result identity.
--
-- Existing Data Center Prepare/Prove results remain assignment-neutral:
--   organization + learner + activity_type + activity_id
--
-- Curriculum-assignment-backed proofs require an additional immutable
-- assignment identity so a later assignment cannot silently reuse the
-- source result/provenance from an earlier assignment.
--
-- This extends the existing Prepare/Prove authority. It does not create a
-- new result, evidence, competency, completion, or verification authority.

ALTER TABLE prepare_prove_activity_results
  ADD COLUMN IF NOT EXISTS assignment_id TEXT;

-- Remove the historical four-column UNIQUE constraint without depending
-- on PostgreSQL's automatically generated/truncated constraint name.
DO $$
DECLARE
  legacy_constraint_name TEXT;
BEGIN
  SELECT c.conname
    INTO legacy_constraint_name
    FROM pg_constraint c
   WHERE c.conrelid = 'prepare_prove_activity_results'::regclass
     AND c.contype = 'u'
     AND (
       SELECT array_agg(a.attname::text ORDER BY u.ord)
         FROM unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord)
         JOIN pg_attribute a
           ON a.attrelid = c.conrelid
          AND a.attnum = u.attnum
     ) = ARRAY[
       'organization_id',
       'user_id',
       'activity_type',
       'activity_id'
     ]::text[]
   LIMIT 1;

  IF legacy_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE prepare_prove_activity_results DROP CONSTRAINT %I',
      legacy_constraint_name
    );
  END IF;
END
$$;

-- Assignment lineage must resolve to an assignment in the same
-- organization. NULL remains valid for legacy/Data Center proof results.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'prepare_prove_activity_results_assignment_same_org_fk'
  ) THEN
    ALTER TABLE prepare_prove_activity_results
      ADD CONSTRAINT prepare_prove_activity_results_assignment_same_org_fk
      FOREIGN KEY (organization_id, assignment_id)
      REFERENCES assignments (organization_id, assignment_id);
  END IF;
END
$$;

-- Preserve exact historical uniqueness for assignment-neutral results.
CREATE UNIQUE INDEX IF NOT EXISTS
  prepare_prove_activity_results_legacy_identity_uq
ON prepare_prove_activity_results (
  organization_id,
  user_id,
  activity_type,
  activity_id
)
WHERE assignment_id IS NULL;

-- Curriculum-backed proofs are distinct per canonical Assignment.
CREATE UNIQUE INDEX IF NOT EXISTS
  prepare_prove_activity_results_assignment_identity_uq
ON prepare_prove_activity_results (
  organization_id,
  user_id,
  activity_type,
  activity_id,
  assignment_id
)
WHERE assignment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  prepare_prove_activity_results_assignment_idx
ON prepare_prove_activity_results (
  organization_id,
  user_id,
  assignment_id,
  created_at DESC
)
WHERE assignment_id IS NOT NULL;
