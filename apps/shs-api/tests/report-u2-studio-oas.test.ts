import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { OasReportProjectionAdapter, StudioReportProjectionAdapter } from "../src/domain/reporting/studio-oas-report-adapters.ts";
import { CivicSureRenderAdapter } from "../src/domain/reporting/report-renderer.ts";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.ts";

const actor = { user_id: "user-1", organization_id: "org-1", tenant_id: "tenant:org-1", permissions: ["studio.project.view", "reports.export"] };

test("U2 registers all Studio and OAS families through the shared template registry", () => {
  const registry = new ReportTemplateRegistry();
  for (const family of ["project-report", "qa-report", "review-report", "project-completion", "build-packet-evidence"]) {
    const definition = registry.resolve("studio", family, 1);
    assert.equal(definition.rendererIdentifier, "shu-universal-r1");
    assert.deepEqual(definition.supportedFormats, ["JSON", "HTML", "PDF"]);
  }
  for (const family of ["conformance", "traceability", "testing-evidence"]) {
    assert.equal(registry.resolve("oas", family, 1).productKey, "oas");
  }
  assert.throws(() => registry.resolve("oas", "project-report", 1), /REPORT_TEMPLATE_NOT_FOUND/);
});

test("U2 Studio adapter delegates to Studio authorities and gates completion on canonical delivery", async () => {
  const calls: string[] = [];
  const service: any = {
    get: async (_actor: any, projectId: string) => { calls.push("project"); return { projectId, title: "Demo Project", projectType: "WEBSITE", status: "BUILDING" }; },
    getBuildPacket: async () => { calls.push("build-packet"); return { packetId: "packet-1", version: 1, requirements: {}, resources: [] }; },
    getWorkspace: async () => { calls.push("workspace"); return { revision: 2, revisionId: "rev-2", work: {} }; },
    getCurrentQa: async () => { calls.push("qa"); return { status: "PASSED", workspaceRevision: 2, run: { qaRunId: "qa-1", rulesetVersion: "studio-qa-v1", findings: [] } }; },
    getCurrentReview: async () => { calls.push("review"); return { currentWorkspaceRevision: 2, submission: null }; },
    getDelivery: async () => { calls.push("delivery"); return { status: "NOT_READY", record: null }; },
  };
  const adapter = new StudioReportProjectionAdapter(service);
  const projection = await adapter.project({ reportFamily: "project-report", projectId: "project-1" }, actor);
  assert.equal(projection.productKey, "studio");
  assert.equal(projection.reportFamily, "project-report");
  assert.equal(projection.payload.presentation.brand.headerLabel, "Studio");
  assert.deepEqual(calls, ["project", "build-packet", "workspace", "qa", "review", "delivery"]);
  await assert.rejects(() => adapter.project({ reportFamily: "project-completion", projectId: "project-1" }, actor), /STUDIO_COMPLETION_NOT_AVAILABLE/);
});

test("U2 OAS adapter is deterministic and cannot imply Registry or Trust Bureau authority", async () => {
  const adapter = new OasReportProjectionAdapter();
  const projection = await adapter.project({ reportFamily: "conformance", subjectReference: "agent-spec-1", standardVersion: "OAS-1" }, actor);
  assert.equal(projection.productKey, "oas");
  assert.equal(projection.payload.oas.status, "NOT_EVALUATED");
  assert.equal((projection.payload as any).presentation.metadata.registryStatus, "NOT_APPLICABLE");
  assert.match((projection.payload as any).presentation.methodology.evaluation, /canonical OAS evidence/);
  await assert.rejects(() => adapter.project({ reportFamily: "conformance", subjectReference: "agent-1", standardVersion: "OAS-9" }, actor), /OAS_STANDARD_VERSION_NOT_FOUND/);
});

test("U2 product reports use the shared renderer and product branding", () => {
  const registry = new ReportTemplateRegistry();
  const template = registry.resolve("oas", "conformance", 1);
  const immutablePayload: any = {
    reportType: "OAS_CONFORMANCE", reportVersion: 1,
    metadata: { product: "Open Autonomous Standard", classification: "INTERNAL", reportType: "OAS_CONFORMANCE" },
    presentation: {
      reportTitle: "Conformance Report", subjectLabel: "agent-spec-1", reportingPeriod: "OAS-1", classification: "INTERNAL", generatedAt: "2026-09-07T00:00:00Z",
      brand: { displayName: "Open Autonomous Standard", headerLabel: "OAS", subtitle: "Open Autonomous Standard" },
      summary: { status: "NOT_EVALUATED" }, sections: [], references: [], metadata: { standardVersion: "OAS-1" },
    },
  };
  const renderer = new CivicSureRenderAdapter();
  const html = renderer.render({ immutablePayload, template, format: "HTML" });
  assert.match(html.bytes.toString("utf8"), /Open Autonomous Standard/);
  assert.match(html.bytes.toString("utf8"), /NOT_EVALUATED/);
  assert.equal(html.mimeType, "text\/html; charset=utf-8");
  assert.throws(() => registry.resolve("studio", "conformance", 1), /REPORT_TEMPLATE_NOT_FOUND/);
});

test("U2 shared renderer produces hashed Letter PDF for an OAS family", async () => {
  const template = new ReportTemplateRegistry().resolve("oas", "traceability", 1);
  const immutablePayload: any = {
    reportType: "OAS_TRACEABILITY", reportVersion: 1,
    metadata: { product: "Open Autonomous Standard", classification: "INTERNAL", reportType: "OAS_TRACEABILITY" },
    presentation: {
      reportTitle: "Traceability Report", subjectLabel: "agent-spec-1", reportingPeriod: "OAS-1", classification: "INTERNAL", generatedAt: "2026-09-07T00:00:00Z",
      brand: { displayName: "Open Autonomous Standard", headerLabel: "OAS", subtitle: "Open Autonomous Standard" },
      summary: { status: "NOT_EVALUATED" }, sections: [{ title: "Requirements", tables: [{ headers: ["Requirement", "Status"], rows: [["01", "NOT_EVALUATED"]] }] }], references: [], metadata: { standardVersion: "OAS-1" },
    },
  };
  const rendered = await new CivicSureRenderAdapter().renderPdf({ immutablePayload, template });
  assert.equal(rendered.mimeType, "application/pdf");
  assert.equal(rendered.hash, (await import("../src/domain/reporting/report-renderer.ts")).hashBytes(rendered.bytes));
  assert.ok((await PDFDocument.load(rendered.bytes)).getPageCount() >= 1);
});
