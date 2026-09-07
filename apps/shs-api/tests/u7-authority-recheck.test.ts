import assert from "node:assert/strict";
import test from "node:test";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.js";
import { RegistryReportAdapter, SolutionsReportAdapter } from "../src/domain/reporting/registry-solutions-report-adapter.js";

test("U7 preserves Registry and Solutions compatibility while unsupported families fail closed", () => {
  const registry = new ReportTemplateRegistry();
  assert.equal(registry.resolve("registry", "registry-record").productKey, "registry");
  assert.equal(registry.resolve("registry", "registration-summary").productKey, "registry");
  for (const family of ["client-operating", "service-delivery", "implementation", "executive-business-review", "assurance-control"]) {
    assert.equal(registry.resolve("solutions", family).productKey, "solutions");
  }
  for (const family of ["status-history", "verification-history", "ownership-stewardship"]) assert.throws(() => registry.resolve("registry", family), /REPORT_TEMPLATE_NOT_FOUND/);
  for (const family of ["legal-artifact-summary", "legal-readiness", "cross-product-executive", "cross-product-assurance"]) assert.throws(() => registry.resolve("legal", family), /REPORT_PRODUCT_KEY_INVALID|REPORT_TEMPLATE_NOT_FOUND/);
  assert.equal(new RegistryReportAdapter().supports("registry-record"), true);
  assert.equal(new SolutionsReportAdapter().supports("client-operating"), true);
});

test("U7 does not introduce Legal or cross-product adapter authorities", async () => {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(new URL("../src/domain/reporting/", import.meta.url));
  assert.equal(entries.some((entry) => /legal|cross.?product|composition/i.test(entry)), false);
});
