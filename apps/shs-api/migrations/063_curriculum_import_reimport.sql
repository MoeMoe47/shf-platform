-- 063_curriculum_import_reimport.sql
--
-- SHF Lesson + Assignment + Curriculum — Phase 4.5B: Multi-Unit
-- Structured Curriculum Migration, Re-Import/Versioning, and Provenance
-- Completion.
--
-- Additive only. Does not edit migration 062 or earlier, and does not
-- touch curriculum_courses/units/lessons/resources/releases (migration
-- 059) or assignments/completion_policies (060/061) at all.
--
-- Three columns added to curriculum_import_candidates (062):
--
--   source_hash — SHA-256 of the candidate's canonicalized source
--   payload, computed by the structured source adapter. Lets a later
--   re-import detect UNCHANGED vs MODIFIED content without re-parsing or
--   diffing full JSON payloads on every comparison.
--
--   diff_status — set only when a candidate was generated as part of a
--   RE-IMPORT against an existing DRAFT course (NULL for a first-time
--   import, matching Phase 4.5A's behavior exactly). One of NEW /
--   UNCHANGED / MODIFIED / MISSING_FROM_SOURCE / CONFLICT. A
--   MISSING_FROM_SOURCE row represents an EXISTING catalog entity with no
--   matching file in the newer source — it is reported, never silently
--   deleted (Step 15).
--
--   previous_candidate_id — self-referencing, same-org pointer to the
--   candidate (from an earlier import job) that most recently produced
--   the same canonical catalog entity. Gives full candidate -> previous
--   catalog entity -> resulting catalog entity lineage across repeated
--   re-imports (Step 21), independent of created_entity_id alone (which
--   only ever points at ONE job's own candidates).
ALTER TABLE curriculum_import_candidates
  ADD COLUMN IF NOT EXISTS source_hash TEXT,
  ADD COLUMN IF NOT EXISTS diff_status TEXT
    CHECK (diff_status IS NULL OR diff_status IN ('NEW', 'UNCHANGED', 'MODIFIED', 'MISSING_FROM_SOURCE', 'CONFLICT')),
  ADD COLUMN IF NOT EXISTS previous_candidate_id TEXT;

ALTER TABLE curriculum_import_candidates
  ADD CONSTRAINT fk_curriculum_import_candidates_previous_same_org
    FOREIGN KEY (previous_candidate_id, organization_id) REFERENCES curriculum_import_candidates(import_candidate_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_import_candidates_previous
  ON curriculum_import_candidates (previous_candidate_id);

-- Supports "find the most recent candidate that produced catalog entity
-- X" (any job, same org) — the lookup the diff algorithm runs once per
-- existing entity on every re-import.
CREATE INDEX IF NOT EXISTS idx_curriculum_import_candidates_entity_lookup
  ON curriculum_import_candidates (organization_id, created_entity_type, created_entity_id);
