-- SYS-3A4B: preserve public publication history while enforcing one current
-- publication per scoped report lineage.
ALTER TABLE report_publications
  ADD COLUMN IF NOT EXISTS supersedes_publication_id TEXT REFERENCES report_publications(publication_id),
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT TRUE;

WITH ranked AS (
  SELECT publication_id,
         row_number() OVER (PARTITION BY tenant_id, organization_id, report_id ORDER BY published_at DESC, publication_id DESC) AS position
  FROM report_publications
)
UPDATE report_publications publication
SET is_current = ranked.position = 1
FROM ranked
WHERE ranked.publication_id = publication.publication_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_report_publications_one_current
  ON report_publications (tenant_id, organization_id, report_id)
  WHERE is_current = TRUE;

CREATE INDEX IF NOT EXISTS idx_report_publications_lineage
  ON report_publications (tenant_id, organization_id, report_id, published_at DESC);
