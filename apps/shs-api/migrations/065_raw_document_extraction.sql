-- 065_raw_document_extraction.sql
--
-- SHF Lesson + Assignment + Curriculum — Phase 4.6: Raw Document
-- Extraction, Structure Detection, and Draft Curriculum Transformation.
--
-- Additive only. Does not edit migrations 064 or earlier, and does not
-- touch curriculum_courses/units/lessons/resources/releases at all.
--
-- Two small, evidence-driven changes:
--
-- (1) source_document_versions.extraction_status gains one new value,
--     OCR_REQUIRED — a genuinely distinct terminal state from FAILED
--     (Step 13: a scanned/image PDF with no extractable text is not a
--     parser failure, it is an honest capability gap). No OCR
--     implementation exists in this phase (Step 14 — infeasible to
--     implement safely and locally within scope); documents in this
--     state are preserved, never fabricated, and wait for future OCR
--     processing. Every other extraction_status/processing_status value
--     Phase 1 already defined (NOT_STARTED/PENDING/SUCCEEDED/FAILED and
--     RECEIVED/VALIDATED/STORED/QUEUED/PROCESSING/PROCESSED/FAILED) is
--     reused completely unchanged — confirmed sufficient by fresh audit,
--     no other new state was needed.
--
-- (2) curriculum_import_jobs.import_type gains RAW_DOCUMENT alongside
--     the existing STATIC_JSON value, so a raw-document-sourced import
--     job is a first-class, distinguishable variant of the exact same
--     canonical Import Job the structured importer already uses — not a
--     competing job table.
--
-- Extraction/structure artifacts themselves are NOT stored in new
-- relational tables (Step 16: "prefer stored structured JSON if
-- relational querying is not needed" — nothing here ever queries into
-- block/heading internals with SQL). They are written as a single JSON
-- blob per Source Document Version into the EXISTING private storage
-- architecture (LocalPrivateSourceStorage), addressed by
-- source_document_versions.extracted_text_location exactly as that
-- column was always intended to be used.
ALTER TABLE source_document_versions
  DROP CONSTRAINT IF EXISTS source_document_versions_extraction_status_check,
  ADD CONSTRAINT source_document_versions_extraction_status_check
    CHECK (extraction_status IN ('NOT_STARTED', 'PENDING', 'SUCCEEDED', 'FAILED', 'UNAVAILABLE', 'OCR_REQUIRED'));

ALTER TABLE curriculum_import_jobs
  DROP CONSTRAINT IF EXISTS curriculum_import_jobs_import_type_check,
  ADD CONSTRAINT curriculum_import_jobs_import_type_check
    CHECK (import_type IN ('STATIC_JSON', 'RAW_DOCUMENT'));
