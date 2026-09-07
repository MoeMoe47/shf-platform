import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getOutboundMailProvider } from "../src/domain/notifications/service/email-provider.ts";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.ts";

const legalMigration = readFileSync(new URL("../migrations/111_legal_runtime_authority.sql", import.meta.url), "utf8");
const compositionMigration = readFileSync(new URL("../migrations/112_cross_product_composition_authority.sql", import.meta.url), "utf8");

test("post-lock Legal authority is scoped metadata-only and never claims privilege", () => {
  assert.match(legalMigration, /CREATE TABLE IF NOT EXISTS legal_artifacts/);
  assert.match(legalMigration, /confidentiality IN \('PUBLIC','INTERNAL','CONFIDENTIAL'\)/);
  assert.match(legalMigration, /privilege_state TEXT NOT NULL DEFAULT 'NOT_ASSESSED'/);
  assert.match(legalMigration, /CREATE TABLE IF NOT EXISTS legal_holds/);
});

test("post-lock composition definitions are versioned and source-contract bound", () => {
  assert.match(compositionMigration, /cross_product_composition_definitions/);
  assert.match(compositionMigration, /sources_json JSONB NOT NULL/);
  assert.match(compositionMigration, /definition_hash TEXT NOT NULL/);
  assert.match(compositionMigration, /status TEXT NOT NULL CHECK \(status IN \('DRAFT','ACTIVE','RETIRED'\)/);
});

test("Legal report families are registered without cross-product families", () => {
  const registry = new ReportTemplateRegistry();
  assert.equal(registry.resolve("legal", "legal-artifact-summary").productKey, "legal");
  assert.equal(registry.resolve("legal", "legal-evidence-decision-trace").productKey, "legal");
  assert.throws(() => registry.resolve("legal", "cross-product-assurance"), /REPORT_TEMPLATE_NOT_FOUND/);
});

test("email provider defaults to the safe test transport outside production", async () => {
  const previous = process.env.SHS_EMAIL_PROVIDER;
  delete process.env.SHS_EMAIL_PROVIDER;
  const result = await getOutboundMailProvider().send({ to: "learner@example.test", subject: "Certificate", templateKey: "certificate", certificateReference: "ref-1" });
  assert.equal(result.delivered, true);
  assert.equal(result.provider, "test");
  if (previous === undefined) delete process.env.SHS_EMAIL_PROVIDER; else process.env.SHS_EMAIL_PROVIDER = previous;
});
