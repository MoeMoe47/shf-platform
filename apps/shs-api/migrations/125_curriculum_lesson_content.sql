-- SYS-4C5: preserve structured lesson content through canonical catalog
-- persistence and publication. Additive and backward-compatible; existing
-- manually-authored lessons default to an empty content object.
ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS content JSONB NOT NULL DEFAULT '{}'::jsonb;
