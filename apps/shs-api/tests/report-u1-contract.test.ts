import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createAuthorizedReportProjection, PRODUCT_KEYS } from "../src/domain/reporting/product-report-contract.ts";
import { safeReportFilename, safeReportStorageReference } from "../src/domain/reporting/report-file-storage.ts";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.ts";

const migration = readFileSync(new URL("../migrations/107_shu_universal_reporting_contract.sql", import.meta.url), "utf8");

test("U1 product registry resolves exact CivicSure product/family pairs and fails closed", () => {
  const registry = new ReportTemplateRegistry();
  const definition = registry.resolve("civicsure", "program-assurance", 1);
  assert.equal(definition.productKey, "civicsure");
  assert.equal(definition.reportFamily, "program-assurance");
  assert.throws(() => registry.resolve("oas", "program-assurance", 1), /REPORT_TEMPLATE_NOT_FOUND/);
  assert.throws(() => registry.resolve("unknown", "program-assurance", 1), /REPORT_PRODUCT_KEY_INVALID/);
  assert.deepEqual(PRODUCT_KEYS, ["civicsure", "oas", "registry", "studio", "bos", "foundation", "solutions", "legal"]);
});

test("U1 projection envelope requires trusted product, family, scope, classification, and references", () => {
  const projection = createAuthorizedReportProjection({
    productKey: "civicsure",
    reportFamily: "program-assurance",
    scope: { organizationId: "org-1", tenantId: "tenant-1" },
    classification: "INTERNAL",
    generatedAt: "2026-09-07T12:00:00.000Z",
    canonicalReferences: [{ type: "program", id: "program-1" }],
    payload: { reportType: "PROGRAM_ASSURANCE" },
  });
  assert.equal(projection.productKey, "civicsure");
  assert.throws(() => createAuthorizedReportProjection({ ...projection, productKey: "unknown" as any }), /REPORT_PRODUCT_KEY_INVALID/);
  assert.throws(() => createAuthorizedReportProjection({ ...projection, scope: { organizationId: "org-1", tenantId: "" } }), /REPORT_SCOPE_REQUIRED/);
});

test("U1 filenames and storage references are product-scoped and traversal-safe", () => {
  const filename = safeReportFilename({ productKey: "oas", jurisdiction: "../Acme County", reportType: "Conformance/Report", period: "2026/H1", version: 1, format: "PDF" });
  const reference = safeReportStorageReference({ productKey: "oas", organizationId: "org/1", tenantId: "tenant/1", artifactId: "artifact/1", renderedFileId: "file/1", format: "PDF" });
  assert.equal(filename, "OAS_Acme-County_Conformance-Report_2026-H1_v1.pdf");
  assert.equal(reference, "oas/org-1/tenant-1/artifact-1/file-1.pdf");
  assert.match(reference, /^oas\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\.pdf$/);
});

test("U1 migration preserves unknown legacy ownership and backfills only known CivicSure families", () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS product_key TEXT/);
  assert.match(migration, /product_key IS NULL/);
  assert.match(migration, /report_type IN \('EXECUTIVE_ASSURANCE', 'PROGRAM_ASSURANCE', 'PROVIDER_ASSURANCE', 'FUNDING_LINEAGE', 'AUDIT_PACKET'\)/);
  assert.match(migration, /product_key IS NULL OR product_key IN/);
});
