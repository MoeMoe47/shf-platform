-- 061_completion_policy_engine.sql
--
-- SHF Lesson + Assignment + Curriculum — Phase 4: Completion Policy
-- Engine. Institutional completion requirements are a distinct concept
-- from curriculum content (migration 059) and from assignment targeting
-- (migration 060) — see completion-policy-service.ts's own header for the
-- ownership boundary this schema encodes.
--
-- Lifecycle mirrors curriculum_releases exactly (migration 059): DRAFT is
-- editable, ACTIVE is immutable (DB-trigger-enforced below), RETIRED means
-- "no longer offered for new assignment bindings" without deleting
-- history. An assignment binds to one specific policy row for its entire
-- life (assignments.completion_policy_id, set once at creation, never
-- updated by any route) — exactly the same immutable-binding pattern
-- already proven for curriculum_release_id in migration 060.

CREATE TABLE IF NOT EXISTS completion_policies (
  policy_id               TEXT PRIMARY KEY,
  organization_id         TEXT NOT NULL REFERENCES organizations(organization_id),
  curriculum_release_id   TEXT NOT NULL,
  assigned_content_type   TEXT NOT NULL CHECK (assigned_content_type IN ('COURSE', 'UNIT', 'LESSON')),
  -- Same format as assignments.assigned_content_id (migration 060): NULL
  -- for COURSE, a unit stable_key for UNIT, "<unitKey>:<lessonKey>" for
  -- LESSON — resolved against the release snapshot, never live tables.
  assigned_content_id     TEXT,
  version                 INTEGER NOT NULL CHECK (version >= 1),
  status                  TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'RETIRED')),
  created_by_user_id      TEXT NOT NULL REFERENCES users(user_id),
  activated_by_user_id    TEXT REFERENCES users(user_id),
  activated_at            TIMESTAMPTZ,
  CHECK ((status = 'DRAFT' AND activated_by_user_id IS NULL AND activated_at IS NULL) OR (status IN ('ACTIVE', 'RETIRED') AND activated_by_user_id IS NOT NULL AND activated_at IS NOT NULL)),
  revision                INTEGER NOT NULL DEFAULT 1,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_completion_policies_id_org UNIQUE (policy_id, organization_id),
  CONSTRAINT uq_completion_policies_scope_version UNIQUE (organization_id, curriculum_release_id, assigned_content_type, assigned_content_id, version),
  CONSTRAINT fk_completion_policies_release_same_org
    FOREIGN KEY (curriculum_release_id, organization_id) REFERENCES curriculum_releases(release_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_completion_policies_org_status
  ON completion_policies (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_completion_policies_release_scope
  ON completion_policies (curriculum_release_id, assigned_content_type, assigned_content_id);

-- Immutability guard: once ACTIVE, a policy's scope/version identity can
-- never change — only the RETIRE transition (status + activated_* stay
-- fixed, only status may move ACTIVE -> RETIRED) is permitted. Mirrors
-- curriculum_releases_prevent_mutation from migration 059 exactly.
CREATE OR REPLACE FUNCTION completion_policies_prevent_mutation() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'DRAFT' THEN
    RETURN NEW; -- freely editable while DRAFT
  END IF;
  IF NEW.policy_id IS DISTINCT FROM OLD.policy_id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.curriculum_release_id IS DISTINCT FROM OLD.curriculum_release_id
     OR NEW.assigned_content_type IS DISTINCT FROM OLD.assigned_content_type
     OR NEW.assigned_content_id IS DISTINCT FROM OLD.assigned_content_id
     OR NEW.version IS DISTINCT FROM OLD.version
     OR NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id
     OR NEW.activated_by_user_id IS DISTINCT FROM OLD.activated_by_user_id
     OR NEW.activated_at IS DISTINCT FROM OLD.activated_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR (OLD.status = 'RETIRED')
  THEN
    RAISE EXCEPTION 'completion_policies rows are immutable once ACTIVE, except the one-way ACTIVE -> RETIRED status transition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_completion_policies_prevent_mutation ON completion_policies;
CREATE TRIGGER trg_completion_policies_prevent_mutation
  BEFORE UPDATE ON completion_policies
  FOR EACH ROW
  EXECUTE FUNCTION completion_policies_prevent_mutation();

CREATE TABLE IF NOT EXISTS completion_policy_requirements (
  requirement_id    TEXT PRIMARY KEY,
  policy_id         TEXT NOT NULL,
  organization_id   TEXT NOT NULL REFERENCES organizations(organization_id),
  requirement_type  TEXT NOT NULL CHECK (requirement_type IN (
    'CONTENT', 'ARCADE', 'PROJECT', 'LIVE_ATTENDANCE',
    'INSTRUCTOR_VERIFICATION', 'EVIDENCE', 'ASSESSMENT', 'REFLECTION', 'PRACTICE'
  )),
  -- Meaning depends on requirement_type: an arcade_activity_id, a
  -- project_id, a live_session_id, or a competency_id. NULL for CONTENT/
  -- ASSESSMENT/REFLECTION/PRACTICE, which apply to the policy's own
  -- assigned content scope rather than a separate external target.
  target_reference  TEXT,
  -- Type-specific tuning (e.g. {"minScore": 80}) — validated at the
  -- application layer per requirement_type (requirement-registry.ts),
  -- never treated as arbitrary executable policy.
  configuration     JSONB NOT NULL DEFAULT '{}'::jsonb,
  required          BOOLEAN NOT NULL DEFAULT true,
  sequence          INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_completion_policy_requirements_policy_same_org
    FOREIGN KEY (policy_id, organization_id) REFERENCES completion_policies(policy_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_completion_policy_requirements_policy
  ON completion_policy_requirements (policy_id, sequence);

-- Assignment -> Completion Policy binding (Step 25). Nullable: an
-- assignment with no policy behaves exactly as it did before this phase
-- (no institutional gating — preserves legacy/demo compatibility per
-- Step 10). Never updated after creation by any route (see
-- assignment-service.ts's updateAssignment, which strips this field
-- exactly like curriculum_release_id already is).
ALTER TABLE assignments
  ADD COLUMN completion_policy_id TEXT;
ALTER TABLE assignments
  ADD CONSTRAINT fk_assignments_completion_policy_same_org
    FOREIGN KEY (completion_policy_id, organization_id) REFERENCES completion_policies(policy_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_completion_policy
  ON assignments (completion_policy_id)
  WHERE completion_policy_id IS NOT NULL;

-- Historical completion lineage (Step 36). Additive, nullable columns on
-- the Phase 0 canonical table — every pre-existing row and every future
-- non-institutional (no-policy-applies) completion keeps these NULL,
-- exactly the same honest, backward-compatible pattern used for
-- authorized_accommodations.membership_id: informational only, not
-- FK'd, because curriculum_lesson_completions' own curriculum_id/
-- lesson_id are historically free-text (Phase 0), not FK'd to anything
-- either, and retrofitting strict referential integrity onto that column
-- pair is out of this phase's scope. No historical row is altered by
-- this ALTER TABLE.
ALTER TABLE curriculum_lesson_completions
  ADD COLUMN assignment_id TEXT,
  ADD COLUMN curriculum_release_id TEXT,
  ADD COLUMN release_version INTEGER,
  ADD COLUMN completion_policy_id TEXT,
  ADD COLUMN completion_policy_version INTEGER;
