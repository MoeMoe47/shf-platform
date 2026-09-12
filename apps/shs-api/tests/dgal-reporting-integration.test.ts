import test from "node:test";
import assert from "node:assert/strict";
import { CivicSureRenderAdapter, hashBytes } from "../src/domain/reporting/report-renderer.js";
import { DocumentationInstanceService } from "../src/domain/documentation/service/documentation-instance-service.js";
import { DocumentationRenderer } from "../src/domain/documentation/service/documentation-renderer.js";
import { ReportingArtifactReferenceService } from "../src/domain/documentation/service/reporting-artifact-reference.js";

const actor = {
  user_id: "user-a",
  organization_id: "org-a",
  active_organization_id: "org-a",
  tenant_id: "tenant:org-a",
  permissions: ["reports.view"],
};

function reportReference() {
  return {
    itemType: "REPORT_ARTIFACT_REFERENCE" as const,
    sourceOwner: "REPORTING" as const,
    artifactId: "report-artifact-1",
    artifactVersion: 2,
    snapshotId: "report-snapshot-7",
    reportVersion: 3,
    reportType: "CIVICSURE_ASSURANCE",
    reportFamily: "ASSURANCE",
    productKey: "civicsure",
    contentHash: "a".repeat(64),
    renderedFileId: "rendered-file-pdf-1",
    format: "PDF",
    mimeType: "application/pdf",
    rendererVersion: "civicsure-r2-renderer-1",
    storageReference: "reports/org-a/snapshot-7/report.pdf",
  };
}

function harness() {
  const packets: any[] = [];
  const repo: any = {
    async createPacket(input: any) { const row = { ...input, packet_instance_id: input.packetInstanceId, state: "PENDING" }; packets.push(row); return row; },
    async createPacketItems(_id: string, items: any[]) { packets[0].items = items; },
    async finalizePacket(_id: string, _actor: any, state: string) { packets[0].state = state; return packets[0]; },
  };
  return { repo, packets };
}

test("DGAL packet references Reporting artifact metadata without cloning or mutating report state", async () => {
  const h = harness();
  const calls: any[] = [];
  const reportingReader = {
    async resolve(scopedActor: any, artifactId: string) { calls.push({ scopedActor, artifactId }); return reportReference(); },
  };
  const service = new DocumentationInstanceService(h.repo, new DocumentationRenderer(), { } as any, reportingReader as any);
  const packet: any = await service.createPacket(actor, {
    title: "CivicSure verification packet",
    items: [
      { itemKey: "report", itemType: "REPORT_ARTIFACT_REFERENCE", referenceId: "report-artifact-1", required: true },
      { itemKey: "guide", itemType: "GUIDANCE", referenceId: "civicsure-guide", sourceOwner: "CIVICSURE", required: false, state: "EXTERNAL" },
    ],
  });
  const reportItem = packet.manifest[0];
  assert.equal(packet.state, "GENERATED");
  assert.equal(reportItem.sourceOwner, "REPORTING");
  assert.equal(reportItem.state, "EXTERNAL");
  assert.equal(reportItem.reportArtifact.snapshotId, "report-snapshot-7");
  assert.equal(reportItem.reportArtifact.artifactVersion, 2);
  assert.equal(reportItem.reportArtifact.renderedFileId, "rendered-file-pdf-1");
  assert.equal(reportItem.reportArtifact.contentHash, "a".repeat(64));
  assert.equal(reportItem.reportArtifact.format, "PDF");
  assert.equal("payload" in reportItem.reportArtifact, false);
  assert.equal(calls[0].scopedActor.active_organization_id, "org-a");
  assert.equal(calls[0].scopedActor.tenant_id, "tenant:org-a");
  assert.equal(h.packets[0].items[0].contentHash, "a".repeat(64));
});

test("Reporting artifact reference resolution is scoped and reads metadata only", async () => {
  const calls: any[] = [];
  const reports: any = {
    async getArtifact(id: string, scope: any) { calls.push(["artifact", id, scope]); return { artifact_id: id, artifact_version: 4, lifecycle_status: "GENERATED", report_version: 5, report_type: "REPORT", report_family: "FAMILY", product_key: "civicsure", content_hash: "b".repeat(64) }; },
    async getPayloadSnapshot(id: string, scope: any) { calls.push(["snapshot", id, scope]); return { snapshot_id: "snapshot-4", report_version: 5, report_type: "REPORT", payload: { secret: "must-not-be-copied" }, payload_hash: "c".repeat(64) }; },
    async listRenderedFiles(id: string, scope: any) { calls.push(["files", id, scope]); return [{ rendered_file_id: "file-4", snapshot_id: "snapshot-4", format: "PDF", mime_type: "application/pdf", content_hash: "d".repeat(64), renderer_version: "report-r1", storage_reference: "reports/scoped/file-4.pdf", report_version: 5, report_type: "REPORT" }]; },
  };
  const result = await new ReportingArtifactReferenceService(reports).resolve(actor, "report-4");
  assert.equal(result?.snapshotId, "snapshot-4");
  assert.equal(result?.contentHash, "d".repeat(64));
  assert.equal("payload" in (result || {}), false);
  assert.deepEqual(calls[0][2], { organization_id: "org-a", tenant_id: "tenant:org-a" });
});

test("DGAL and Reporting renderers share the canonical hash and print-ready HTML contract", () => {
  const adapter = new CivicSureRenderAdapter();
  const report = adapter.render({
    immutablePayload: { reportVersion: 3, presentation: { reportTitle: "CivicSure report", classification: "INTERNAL", brand: { displayName: "Silicon Heartland" } }, payload: { status: "verified" } },
    template: { supportedFormats: ["HTML", "PDF"], rendererIdentifier: "shu-universal-r1", templateVersion: "r1" },
    format: "HTML",
  });
  assert.equal(report.mimeType, "text/html; charset=utf-8");
  assert.match(report.bytes.toString(), /<!doctype html>/i);
  assert.equal(report.hash, hashBytes(report.bytes));
  const dgal = new DocumentationRenderer().renderHtml({ title: "DGAL packet", documentType: "Packet", templateVersion: "r1", organizationId: "org-a", classification: "INTERNAL", structuredData: { status: "ready" } });
  assert.equal(dgal.hash, hashBytes(dgal.bytes));
  assert.match(dgal.bytes.toString(), /@media print/);
});
