import assert from "node:assert/strict";
import test from "node:test";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.js";
import { MetaverseCityReportAdapter } from "../src/domain/reporting/metaverse-city-report-adapter.js";

test("MET-12 registers the metaverse city participation family under foundation", () => {
  const registry = new ReportTemplateRegistry();
  const definition = registry.resolve("foundation", "metaverse-city-participation", 1);
  assert.equal(definition.productKey, "foundation");
  assert.deepEqual(definition.supportedFormats, ["JSON", "HTML", "PDF"]);
  assert.equal(definition.rendererIdentifier, "shu-universal-r1");
  assert.throws(() => registry.resolve("foundation", "metaverse-city-elections", 1), /REPORT_TEMPLATE_NOT_FOUND/);
});

test("MET-12 adapter fails closed for unsupported families and unscoped/unauthorized actors", async () => {
  const adapter = new MetaverseCityReportAdapter(async () => ({ rows: [] } as any));
  assert.equal(adapter.productKey, "foundation");
  assert.equal(adapter.supports("metaverse-city-participation"), true);
  assert.equal(adapter.supports("career-readiness"), false);
  await assert.rejects(
    adapter.project({ reportFamily: "metaverse-city-participation" }, { user_id: "u1", roles: ["org_admin"] }),
    /REPORT_SCOPE_REQUIRED/,
  );
  await assert.rejects(
    adapter.project(
      { reportFamily: "metaverse-city-participation" },
      { user_id: "u1", organization_id: "org1", tenant_id: "tenant:org1", roles: ["student"] },
    ),
    /REPORT_SUBJECT_FORBIDDEN/,
  );
  await assert.rejects(
    adapter.project({ reportFamily: "registry-status" }, { user_id: "u1", organization_id: "org1", tenant_id: "tenant:org1", roles: ["org_admin"] }),
    /REPORT_FAMILY_NOT_SUPPORTED/,
  );
});

test("MET-12 adapter produces an org-scoped projection without a live database", async () => {
  const adapter = new MetaverseCityReportAdapter(async () => ({ rows: [] } as any));
  const projection = await adapter.project(
    { reportFamily: "metaverse-city-participation" },
    { user_id: "u1", organization_id: "org1", tenant_id: "tenant:org1", roles: ["org_admin"] },
  );
  assert.equal(projection.productKey, "foundation");
  assert.equal(projection.reportFamily, "metaverse-city-participation");
  assert.equal(projection.scope.organizationId, "org1");
  assert.ok(Array.isArray(projection.canonicalReferences) && projection.canonicalReferences.length > 0);
  const rows = (projection.payload as any).metaverse.rows;
  assert.ok(rows.some((row: any[]) => row[0] === "City districts"));
  assert.ok(rows.some((row: any[]) => row[0] === "Treasury ledger balance" && row[1] === "Not available"));
  assert.ok(rows.some((row: any[]) => row[0] === "Civic governance evidence" && row[1] === "Owned by SHF Civic"));
});

test("MET-12 adapter is honest about treasury persistence and does not duplicate civic authority", () => {
  const source = MetaverseCityReportAdapter.toString();
  assert.match(source, /Durable ledger persistence pending/);
  assert.match(source, /MET-1 Civic Government Boundary/);
});
