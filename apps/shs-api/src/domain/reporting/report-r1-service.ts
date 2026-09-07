import { randomUUID } from "node:crypto";
import { withTransaction } from "../../db/transaction.js";
import { writeAuditEvent } from "../audit/service/audit-helper.js";
import { ReportArtifactRepo } from "./report-artifact-repo.js";
import { ReportFileStorage, safeReportFilename, safeReportStorageReference } from "./report-file-storage.js";
import { CivicSureRenderAdapter, hashBytes } from "./report-renderer.js";
import { PRODUCT_BRANDS, ReportTemplateRegistry } from "./report-template-registry.js";
import { buildExecutiveAssurancePresentation, isExecutiveAssurance } from "./executive-assurance-presentation.js";
import { buildCivicSureR3Presentation, isCivicSureR3 } from "./civicsure-r3-presentations.js";
import { createAuthorizedReportProjection, reportFamilyForType, type AuthorizedReportProjection } from "./product-report-contract.js";

function scopeFromActor(actor: any) {
  const userId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  const tenantId = actor?.tenant_id || actor?.tenant || `tenant:${organizationId}`;
  if (!userId || !organizationId || !tenantId) throw new Error("REPORT_SCOPE_REQUIRED");
  return { user_id: userId, organization_id: organizationId, tenant_id: tenantId };
}

function period(report: any) {
  const value = report?.scope?.reportingPeriod;
  if (value && typeof value === "object") return { start: value.start || null, end: value.end || null, label: value.label || null };
  return { start: null, end: null, label: typeof value === "string" ? value : null };
}

function immutablePayload(report: any, artifact: any, scope: any, projection: AuthorizedReportProjection) {
  const reportPeriod = period(report);
  const snapshot: any = {
    metadata: {
      product: PRODUCT_BRANDS[projection.productKey].displayName,
      productKey: projection.productKey,
      reportFamily: projection.reportFamily,
      reportType: report.reportType,
      reportVersion: Number(report.reportVersion || 1),
      programProfile: report.programProfile || null,
      programProfileKey: report.programProfile?.profileKey || null,
      programProfileVersion: report.programProfile?.profileVersion || null,
      canonicalProgramReference: report.programProfile?.canonicalProgramReferences?.[0] || null,
      organization: scope.organization_id,
      tenant: scope.tenant_id,
      jurisdiction: report.scope?.jurisdiction || null,
      subject: report.scope?.subjectReference || null,
      reportingPeriod: reportPeriod,
      generatedAt: report.generatedAt,
      generatedBy: scope.user_id,
      classification: report.classification,
      canonicalReferences: report.canonicalReferences || [],
      metricDefinitionVersions: report.metricDefinitionVersions || [],
      verificationSummary: report.verificationState || {},
      aiInvolvement: report.aiInvolvement || null,
      artifactId: artifact.artifact_id,
    },
    reportType: report.reportType,
    reportVersion: Number(report.reportVersion || 1),
    productKey: projection.productKey,
    reportFamily: projection.reportFamily,
    payload: report,
  };
  if (isExecutiveAssurance(report)) snapshot.presentation = buildExecutiveAssurancePresentation({ ...report, artifactId: artifact.artifact_id });
  if (isCivicSureR3(report)) snapshot.presentation = buildCivicSureR3Presentation({ ...report, artifactId: artifact.artifact_id });
  if (report.presentation) snapshot.presentation = report.presentation;
  return snapshot;
}

function normalizeProjection(report: any, scope: any): AuthorizedReportProjection {
  if (report?.productKey && report?.reportFamily && report?.payload) {
    if (report.scope?.organizationId !== scope.organization_id || report.scope?.tenantId !== scope.tenant_id) throw new Error("REPORT_SCOPE_MISMATCH");
    return createAuthorizedReportProjection(report);
  }
  const reportFamily = reportFamilyForType(report?.reportType);
  if (!reportFamily) throw new Error("REPORT_FAMILY_REQUIRED");
  return createAuthorizedReportProjection({
    productKey: "civicsure",
    reportFamily,
    subject: report?.scope?.subjectReference,
    scope: { ...(report?.scope || {}), organizationId: scope.organization_id, tenantId: scope.tenant_id },
    reportingPeriod: report?.scope?.reportingPeriod,
    classification: report?.classification,
    generatedAt: report?.generatedAt || new Date().toISOString(),
    canonicalReferences: report?.canonicalReferences || [],
    sourceVersions: report?.sourceVersions || [],
    provenance: report?.provenance || {},
    payload: report,
  });
}

export class ReportR1Service {
  constructor(
    private repo = new ReportArtifactRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
    private registry = new ReportTemplateRegistry(),
    private renderer = new CivicSureRenderAdapter(),
    private storage = new ReportFileStorage(),
  ) {}

  async snapshotAndRender(report: any, artifact: any, actor: any, formats = ["JSON", "HTML"]) {
    const scope = scopeFromActor(actor);
    const projection = normalizeProjection(report, scope);
    const reportPayload: any = projection.payload;
    const template = this.registry.resolve(projection.productKey, projection.reportFamily, Number(reportPayload.reportVersion || 1));
    const immutable = immutablePayload(reportPayload, artifact, scope, projection);
    const payloadJson = Buffer.from(JSON.stringify(immutable), "utf8");
    const payloadHash = hashBytes(payloadJson);
    const reportPeriod = period(reportPayload);
    const snapshotId = `snapshot_${randomUUID()}`;

    return this.transaction(async (db: any) => {
      await this.registry.ensurePersisted(db);
      const snapshot = await this.repo.createPayloadSnapshot({
        snapshot_id: snapshotId,
        artifact_id: artifact.artifact_id,
        tenant_id: scope.tenant_id,
        organization_id: scope.organization_id,
        report_type: reportPayload.reportType,
        report_version: reportPayload.reportVersion || 1,
        product_key: projection.productKey,
        report_family: projection.reportFamily,
        jurisdiction: reportPayload.scope?.jurisdiction,
        subject_reference: reportPayload.scope?.subjectReference,
        reporting_period_start: reportPeriod.start,
        reporting_period_end: reportPeriod.end,
        reporting_period_label: reportPeriod.label,
        generated_at: reportPayload.generatedAt || new Date().toISOString(),
        generated_by_user_id: scope.user_id,
        classification: reportPayload.classification,
        payload: immutable,
      payload_hash: payloadHash,
        canonical_reference_manifest: { references: reportPayload.canonicalReferences || [] },
        metric_definition_versions: reportPayload.metricDefinitionVersions || [],
        verification_summary: reportPayload.verificationState || {},
        ai_involvement: reportPayload.aiInvolvement || null,
      }, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: scope.organization_id,
        actor_user_id: scope.user_id,
        target_object_type: "report_payload_snapshot",
        target_object_id: snapshotId,
        action_type: "report_payload_snapshot.created",
        new_state_json: { artifact_id: artifact.artifact_id, report_type: reportPayload.reportType, product_key: projection.productKey, report_family: projection.reportFamily, program_profile_key: reportPayload.programProfile?.profileKey || null, program_profile_version: reportPayload.programProfile?.profileVersion || null, payload_hash: payloadHash },
        reason_text: "CivicSure R1 immutable report payload snapshot created",
        correlation_id: `corr_${randomUUID()}`,
        source_channel: "shs-api",
      }, db);

      const rendered = [];
      let artifactContentHash: string | null = null;
      for (const requestedFormat of formats) {
        const format = String(requestedFormat).toUpperCase();
        if (!template.supportedFormats.includes(format)) throw new Error("REPORT_FORMAT_UNSUPPORTED");
        const fileId = `rendered_${randomUUID()}`;
        await this.auditWriter({
          audit_event_id: `audit_${randomUUID()}`,
          organization_id: scope.organization_id,
          actor_user_id: scope.user_id,
          target_object_type: "report_rendered_file",
          target_object_id: fileId,
          action_type: "report_render.requested",
          new_state_json: { artifact_id: artifact.artifact_id, snapshot_id: snapshotId, format, product_key: projection.productKey, report_family: projection.reportFamily },
          reason_text: "CivicSure R1 render requested",
          correlation_id: `corr_${randomUUID()}`,
          source_channel: "shs-api",
        }, db);
        const output = format === "PDF"
          ? await this.renderer.renderPdf({ immutablePayload: immutable, template })
          : this.renderer.render({ immutablePayload: immutable, template, format });
        if (format === "JSON") artifactContentHash = output.hash;
        const storageReference = safeReportStorageReference({ productKey: projection.productKey, organizationId: scope.organization_id, tenantId: scope.tenant_id, artifactId: artifact.artifact_id, renderedFileId: fileId, format });
        const filename = safeReportFilename({ productKey: projection.productKey, filenamePrefix: reportPayload.programProfile?.filenamePrefix || template.filenamePrefix, jurisdiction: reportPayload.scope?.jurisdiction, reportType: reportPayload.reportType, period: reportPeriod.label, version: reportPayload.reportVersion || 1, format });
        await this.storage.put(storageReference, output.bytes);
        const file = await this.repo.createRenderedFile({
          rendered_file_id: fileId,
          artifact_id: artifact.artifact_id,
          snapshot_id: snapshotId,
          tenant_id: scope.tenant_id,
          organization_id: scope.organization_id,
          format,
          mime_type: output.mimeType,
          byte_length: output.byteLength,
          content_hash: output.hash,
          template_id: template.templateId,
          template_version: template.templateVersion,
          renderer_version: output.rendererVersion,
          filename,
          storage_reference: storageReference,
          classification: reportPayload.classification,
          product_key: projection.productKey,
          report_family: projection.reportFamily,
          created_by_user_id: scope.user_id,
        }, db);
        rendered.push({ ...file, filename });
        await this.auditWriter({
          audit_event_id: `audit_${randomUUID()}`,
          organization_id: scope.organization_id,
          actor_user_id: scope.user_id,
          target_object_type: "report_rendered_file",
          target_object_id: fileId,
          action_type: "report_render.completed",
          new_state_json: { artifact_id: artifact.artifact_id, snapshot_id: snapshotId, format, content_hash: output.hash, byte_length: output.byteLength, product_key: projection.productKey, report_family: projection.reportFamily },
          reason_text: "CivicSure R1 rendered file completed",
          correlation_id: `corr_${randomUUID()}`,
          source_channel: "shs-api",
        }, db);
      }
      const updatedArtifact = await this.repo.updateR1Metadata(artifact.artifact_id, {
        report_type: reportPayload.reportType,
        report_version: reportPayload.reportVersion || 1,
        product_key: projection.productKey,
        report_family: projection.reportFamily,
        jurisdiction: reportPayload.scope?.jurisdiction,
        subject_reference: reportPayload.scope?.subjectReference,
        reporting_period_start: reportPeriod.start,
        reporting_period_end: reportPeriod.end,
        reporting_period_label: reportPeriod.label,
        ai_involvement: reportPayload.aiInvolvement,
        content_hash: artifactContentHash,
      }, db);
      return { artifact: updatedArtifact || artifact, snapshot: { ...snapshot, payload_hash: payloadHash }, template, renderedFiles: rendered };
    });
  }

  async getSnapshot(artifactId: string, actor: any) { return this.repo.getPayloadSnapshot(artifactId, scopeFromActor(actor)); }
  async listRenderedFiles(artifactId: string, actor: any) { return this.repo.listRenderedFiles(artifactId, scopeFromActor(actor)); }
  async getRenderedFile(fileId: string, actor: any) {
    const file = await this.repo.getRenderedFile(fileId, scopeFromActor(actor));
    if (!file || file.retrieval_state !== "AVAILABLE") return null;
    const bytes = await this.storage.get(file.storage_reference);
    if (hashBytes(bytes) !== file.content_hash) throw new Error("REPORT_RENDERED_FILE_HASH_MISMATCH");
    const scope = scopeFromActor(actor);
    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: scope.organization_id,
      actor_user_id: scope.user_id,
      target_object_type: "report_rendered_file",
      target_object_id: fileId,
      action_type: "report_rendered_file.retrieved",
      new_state_json: { artifact_id: file.artifact_id, format: file.format, product_key: file.product_key, report_family: file.report_family, content_hash: file.content_hash },
      reason_text: "CivicSure rendered report file retrieved",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "shs-api",
    });
    return { file, bytes };
  }
}
