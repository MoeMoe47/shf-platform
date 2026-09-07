import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ReportR1Service } from "../src/domain/reporting/report-r1-service.ts";
import { CivicSureRenderAdapter, hashBytes } from "../src/domain/reporting/report-renderer.ts";
import { ReportFileStorage, safeReportFilename } from "../src/domain/reporting/report-file-storage.ts";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.ts";

function report() {
  return {
    reportType: "EXECUTIVE_ASSURANCE",
    reportVersion: 1,
    generatedAt: "2026-09-07T12:00:00.000Z",
    classification: "INTERNAL",
    scope: { organizationId: "org-a", tenantId: "tenant:org-a", subjectReference: null, reportingPeriod: { label: "2026-H1" } },
    canonicalFacts: { summary: { verifiedExpenditure: 72 } },
    canonicalReferences: [{ type: "TruthFact", id: "truth-1" }],
    verificationState: { truthFacts: 1, claims: 1 },
  };
}

test("R1 registry and renderer preserve versioned formats and hash bytes", () => {
  const template = new ReportTemplateRegistry().get("EXECUTIVE_ASSURANCE");
  assert.equal(template.templateVersion, 1);
  assert.deepEqual(template.supportedFormats, ["JSON", "HTML", "PDF"]);
  const renderer = new CivicSureRenderAdapter();
  const rendered = renderer.render({ immutablePayload: { payload: report() }, template, format: "HTML" });
  assert.equal(rendered.mimeType, "text/html; charset=utf-8");
  assert.equal(rendered.hash, hashBytes(rendered.bytes));
  assert.match(rendered.bytes.toString("utf8"), /CivicSure/);
  assert.throws(() => renderer.render({ immutablePayload: { payload: report() }, template, format: "PDF" }), /R2/);
});

test("R1 snapshot and rendered files are immutable and scoped", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "civicsure-r1-"));
  const records: any = { snapshots: [], files: [], artifacts: [] };
  const repo: any = {
    async createPayloadSnapshot(input: any) { const row = structuredClone(input); records.snapshots.push(row); return row; },
    async createRenderedFile(input: any) { const row = structuredClone(input); records.files.push(row); return row; },
    async updateR1Metadata(id: string, metadata: any) { const row = { artifact_id: id, ...metadata }; records.artifacts.push(row); return row; },
    async getPayloadSnapshot() { return records.snapshots[0] || null; },
    async listRenderedFiles() { return records.files; },
    async getRenderedFile() { return records.files[0] || null; },
  };
  const storage = new ReportFileStorage(root);
  const service = new ReportR1Service(repo, async (fn: any) => fn({ query: async () => ({ rows: [] }) }), async () => {}, new ReportTemplateRegistry(), new CivicSureRenderAdapter(), storage);
  const original = report();
  const result = await service.snapshotAndRender(original, { artifact_id: "artifact-1" }, { user_id: "user-a", organization_id: "org-a", tenant_id: "tenant:org-a" });
  original.canonicalFacts.summary.verifiedExpenditure = 999;
  assert.equal(result.snapshot.payload.payload.canonicalFacts.summary.verifiedExpenditure, 72);
  assert.equal(result.renderedFiles.length, 2);
  const htmlFile = result.renderedFiles.find((file: any) => file.format === "HTML");
  const html = await readFile(path.join(root, htmlFile.storage_reference));
  assert.equal(hashBytes(html), htmlFile.content_hash);
  assert.match(safeReportFilename({ jurisdiction: "Franklin County", reportType: "EXECUTIVE_ASSURANCE", period: "2026-H1", version: 1, format: "HTML" }), /^CivicSure_Franklin-County_EXECUTIVE_ASSURANCE_2026-H1_v1\.html$/);
});
