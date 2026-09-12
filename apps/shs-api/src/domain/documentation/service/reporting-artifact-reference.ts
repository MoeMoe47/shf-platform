import { ReportArtifactRepo } from "../../reporting/report-artifact-repo.js";

export type ReportingArtifactReference = {
  itemType: "REPORT_ARTIFACT_REFERENCE";
  sourceOwner: "REPORTING";
  artifactId: string;
  artifactVersion: number | null;
  snapshotId: string | null;
  reportVersion: string | number | null;
  reportType: string | null;
  reportFamily: string | null;
  productKey: string | null;
  contentHash: string | null;
  renderedFileId: string | null;
  format: string | null;
  mimeType: string | null;
  rendererVersion: string | null;
  storageReference: string | null;
};

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { organization_id: organizationId, tenant_id: tenantId };
}

/**
 * Reads Reporting metadata through its existing scoped repository. It never
 * copies report payloads and never mutates Reporting-owned rows.
 */
export class ReportingArtifactReferenceService {
  constructor(private readonly reports = new ReportArtifactRepo()) {}

  async resolve(actor: any, artifactId: string): Promise<ReportingArtifactReference | null> {
    if (!actor?.permissions?.includes("reports.view")) throw new Error("REPORTING_ARTIFACT_VIEW_FORBIDDEN");
    const artifact = await this.reports.getArtifact(artifactId, scope(actor));
    if (!artifact || artifact.lifecycle_status !== "GENERATED") return null;
    const snapshot = await this.reports.getPayloadSnapshot(artifactId, scope(actor));
    const files = await this.reports.listRenderedFiles(artifactId, scope(actor));
    const file = files.find((candidate: any) => String(candidate.format).toUpperCase() === "PDF") || files.find((candidate: any) => String(candidate.format).toUpperCase() === "HTML") || files[0] || null;
    return {
      itemType: "REPORT_ARTIFACT_REFERENCE",
      sourceOwner: "REPORTING",
      artifactId: artifact.artifact_id,
      artifactVersion: artifact.artifact_version ?? null,
      snapshotId: file?.snapshot_id || snapshot?.snapshot_id || null,
      reportVersion: file?.report_version ?? snapshot?.report_version ?? artifact.report_version ?? null,
      reportType: file?.report_type ?? snapshot?.report_type ?? artifact.report_type ?? null,
      reportFamily: artifact.report_family ?? null,
      productKey: artifact.product_key ?? null,
      contentHash: file?.content_hash ?? artifact.content_hash ?? snapshot?.payload_hash ?? null,
      renderedFileId: file?.rendered_file_id ?? null,
      format: file?.format ?? null,
      mimeType: file?.mime_type ?? null,
      rendererVersion: file?.renderer_version ?? null,
      storageReference: file?.storage_reference ?? null,
    };
  }
}
