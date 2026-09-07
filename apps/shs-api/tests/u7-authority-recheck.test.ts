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
  for (const family of ["legal-artifact-summary", "legal-authority-obligation", "legal-readiness", "legal-evidence-decision-trace"]) assert.equal(registry.resolve("legal", family).productKey, "legal");
  for (const family of ["cross-product-executive", "cross-product-assurance"]) assert.throws(() => registry.resolve("legal", family), /REPORT_TEMPLATE_NOT_FOUND/);
  assert.equal(new RegistryReportAdapter().supports("registry-record"), true);
  assert.equal(new SolutionsReportAdapter().supports("client-operating"), true);
});

test("U7 exposes bounded Legal authority but no cross-product report adapter", async () => {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(new URL("../src/domain/reporting/", import.meta.url));
  assert.equal(entries.includes("legal-report-adapter.ts"), true);
  assert.equal(entries.some((entry) => /cross.?product|composition/i.test(entry)), false);
});
