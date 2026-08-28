import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const command = fs.readFileSync(new URL("../src/pages/shf-command/SHFImpactCommandCenter.jsx", import.meta.url), "utf8");
const client = fs.readFileSync(new URL("../src/shared/reporting/donorSummaryAuthorizationClient.js", import.meta.url), "utf8");
const artifactService = fs.readFileSync(new URL("../apps/shs-api/src/domain/reporting/report-artifact-service.ts", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../apps/shs-api/src/domain/reporting/routes.ts", import.meta.url), "utf8");
const composition = fs.readFileSync(new URL("../docs/SHF_REPORTS_BRIEFINGS_COMPOSITION_CONTRACT.md", import.meta.url), "utf8");
const distributionContract = fs.readFileSync(new URL("../docs/SHF_RESTRICTED_REPORT_DISTRIBUTION_CONTRACT.md", import.meta.url), "utf8");

test("Donor Summary frontend authority path remains bounded by governed backend services", () => {
  assert.match(command, /label: "Donor Summary", value: "Unavailable"/);
  assert.match(command, /createDonorSummaryArtifact/);
  assert.match(command, /authorizeDonorSummaryDistribution/);
  assert.match(client, /reporting\/compositions\/donor-summary\/artifacts/);
  assert.match(composition, /Donor Summary \| `RESTRICTED_EXTERNAL_CANONICAL`/);
});

test("Donor-specific authority reuses the generic artifact service without distribution", () => {
  assert.match(artifactService, /canonicalManifest/);
  assert.match(artifactService, /classification/);
  assert.match(artifactService, /DONOR_SUMMARY_COMPOSITION/);
  assert.match(artifactService, /createDonorSummaryArtifact/);
  assert.doesNotMatch(artifactService, /authorizeDistribution|report_distributions/);
  assert.match(routes, /\/reporting\/compositions\/donor-summary\/artifacts/);
});

test("required Donor restricted path remains explicit and delivery-free", () => {
  assert.match(distributionContract, /RESTRICTED_EXTERNAL/);
  assert.match(composition, /RESTRICTED_EXTERNAL/);
  assert.match(distributionContract, /public.*publication/i);
  assert.doesNotMatch(command, /Donor Summary[\s\S]{0,500}(PUBLIC|DISTRIBUTED|SENT|DELIVERED)/);
});
