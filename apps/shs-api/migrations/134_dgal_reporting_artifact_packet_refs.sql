-- DGAL-3: allow packet manifests to reference Reporting-owned artifacts.
-- This is metadata-only composition; report snapshots and rendered bytes remain
-- owned and served by Reporting.

ALTER TABLE dgal_packet_definition_items
  DROP CONSTRAINT IF EXISTS dgal_packet_definition_items_item_type_check;
ALTER TABLE dgal_packet_definition_items
  ADD CONSTRAINT dgal_packet_definition_items_item_type_check
  CHECK (item_type IN ('DOCUMENT_TEMPLATE','GUIDANCE','DOMAIN_ARTIFACT_REFERENCE','REPORT_ARTIFACT_REFERENCE'));

ALTER TABLE dgal_packet_instance_items
  DROP CONSTRAINT IF EXISTS dgal_packet_instance_items_item_type_check;
ALTER TABLE dgal_packet_instance_items
  ADD CONSTRAINT dgal_packet_instance_items_item_type_check
  CHECK (item_type IN ('DOCUMENT_INSTANCE','DOMAIN_ARTIFACT_REFERENCE','GUIDANCE','REPORT_ARTIFACT_REFERENCE'));
