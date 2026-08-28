import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const contract = fs.readFileSync(new URL("../docs/SHF_RESTRICTED_REPORT_DISTRIBUTION_CONTRACT.md", import.meta.url), "utf8");
const shared = fs.readFileSync(new URL("../docs/SHF_REPORT_DISTRIBUTION_AUTHORITY_CONTRACT.md", import.meta.url), "utf8");
const artifactService = fs.readFileSync(new URL("../apps/shs-api/src/domain/reporting/report-artifact-service.ts", import.meta.url), "utf8");
const artifactMigration = fs.readFileSync(new URL("../apps/shs-api/migrations/012_report_artifacts.sql", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../apps/shs-api/src/domain/reporting/routes.ts", import.meta.url), "utf8");
const dashboard = fs.readFileSync(new URL("../src/pages/shf-command/SHFImpactCommandCenter.jsx", import.meta.url), "utf8");
const normalizedContract = contract.replace(/\s+/g, " ");

test("authority layers and classifications remain distinct", () => {
  assert.match(normalizedContract, /classification != recipient authorization != distribution authorization != distribution audit/);
  assert.match(shared, /VIEW != GENERATE != EXPORT != DISTRIBUTE != PUBLISH/);
  assert.match(contract, /INTERNAL/);
  assert.match(contract, /RESTRICTED_EXTERNAL/);
  assert.match(contract, /PUBLIC/);
  assert.match(normalizedContract, /distinct from `reports\.export`/i);
  assert.match(normalizedContract, /does not grant publication/i);
});

test("recipient and disclosure gates fail closed without creating a recipient system", () => {
  assert.match(contract, /CONTACT_ONLY/);
  assert.match(contract, /REQUIRES_AUTHORITY_HARDENING/);
  assert.match(contract, /authorized recipient\/audience/);
  assert.match(contract, /PRIVACY_DISCLOSURE_POLICY_REQUIRED/);
  assert.match(contract, /client cannot override/i);
  assert.doesNotMatch(routes, /reporting\/(?:distributions|recipients|publish)/);
  assert.doesNotMatch(artifactMigration, /report_distributions/);
});

test("future distribution is traceable and content-minimized", () => {
  assert.match(normalizedContract, /artifact ID and artifact version/);
  assert.match(contract, /append-only `report_distributions`/);
  assert.match(contract, /must contain no report contents/);
  assert.match(contract, /server-owned distribution ID/);
  assert.match(artifactService, /tenant_id: scope\.tenant_id/);
  assert.match(artifactService, /organization_id: scope\.organization_id/);
  assert.match(artifactService, /actor_id: scope\.actor_id/);
  assert.match(artifactService, /artifact_\$\{randomUUID\(\)\}/);
});

test("public publication, delivery, and revocation remain bounded", () => {
  assert.match(contract, /cannot be distributed externally/);
  assert.match(contract, /can never become public/);
  assert.match(contract, /no email sending, share links, public URLs, donor portal/);
  assert.match(normalizedContract, /cannot remotely destroy a file already downloaded/);
  assert.match(contract, /Oracle\/LLM output cannot authorize/);
  assert.doesNotMatch(routes, /share-token|public-url|send-email|publishArtifact/);
});

test("Donor Summary artifact registration remains separate from distribution", () => {
  assert.match(contract, /Donor Summary now has a server-authoritative artifact-registration path/);
  assert.match(shared, /Donor Summary.*artifact registration is now a governed/s);
  assert.match(dashboard, /label: "Donor Summary", value: "Unavailable"/);
  assert.match(dashboard, /Board Brief/);
  assert.match(dashboard, /Grant Narrative/);
  assert.match(dashboard, /Program Health Memo/);
});

test("no numeric small-n policy is invented", () => {
  assert.doesNotMatch(contract, /small.?n[^\n]{0,100}\b\d+\b/i);
  assert.match(normalizedContract, /without this contract inventing a numeric threshold/);
});
