// Website presentation only. Normative identity remains pinned to the frozen catalog.
import catalog from "../../../public/oas/catalogs/OAS-1@1.0.0.json";
import currentness from "../../../public/oas/currentness.json";
export const oasRelease = Object.freeze({
  name: catalog.release.publication_label,
  id: catalog.release_id,
  version: catalog.standard_version,
  publicationDate: catalog.release.release_date,
  requirements: catalog.requirement_ids.length,
  domains: catalog.domain_ids.length,
  declarationContract: catalog.declaration_contract_version,
  evaluationStatus: catalog.evaluation_status,
  artifactUrl: "/oas/catalogs/OAS-1@1.0.0.json",
  humanUrl: "/oas/OAS-1@1.0.0.md",
  currentnessUrl: "/oas/currentness.json",
  declarationSchemaUrl: "/oas/declaration.schema.json",
  // File checksum differs from the catalog's internal pre-publication content checksum.
  artifactChecksum: currentness.artifact_file_checksum,
  requirementsChecksum: catalog.requirements_checksum,
  scopeChecksum: catalog.scope_checksum,
});
