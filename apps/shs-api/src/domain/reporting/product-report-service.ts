import { ReportArtifactService } from "./report-artifact-service.js";
import { ReportR1Service } from "./report-r1-service.js";
import { ReportTemplateRegistry } from "./report-template-registry.js";
import { studioOasAdapters } from "./studio-oas-report-adapters.js";
import { foundationCurriculumCareerAdapter } from "./foundation-curriculum-career-report-adapter.js";
import { bosAiGovernanceAdapter } from "./bos-ai-governance-report-adapter.js";
import { registrySolutionsAdapters } from "./registry-solutions-report-adapter.js";
import { applyProgramReportProfile, programReportProfileRegistry, type ProgramReportProfile } from "./program-report-profile-registry.js";
import { legalReportAdapter } from "./legal-report-adapter.js";

const FORMAT_SET = new Set(["JSON", "HTML", "PDF"]);

function formats(input: any, supported: string[]) {
  const requested = Array.isArray(input) && input.length ? input : ["JSON", "HTML", "PDF"];
  const normalized = requested.map((value) => String(value).toUpperCase());
  if (normalized.some((value) => !FORMAT_SET.has(value) || !supported.includes(value))) throw new Error("REPORT_FORMAT_UNSUPPORTED");
  return Array.from(new Set(normalized));
}

export class ProductReportService {
  constructor(
    private artifactService = new ReportArtifactService(),
    private renderService = new ReportR1Service(),
    private registry = new ReportTemplateRegistry(),
    private adapters = [...studioOasAdapters, foundationCurriculumCareerAdapter, bosAiGovernanceAdapter, ...registrySolutionsAdapters, legalReportAdapter],
    private profileRegistry = programReportProfileRegistry,
  ) {}

  async generate(productKey: "studio" | "oas" | "foundation" | "bos" | "registry" | "solutions" | "legal", input: any, actor: any) {
    const reportFamily = String(input?.reportFamily || input?.report_family || "").trim();
    if (!reportFamily) throw new Error("REPORT_FAMILY_REQUIRED");
    const definition = this.registry.resolve(productKey, reportFamily, 1);
    const adapter = this.adapters.find((candidate) => candidate.productKey === productKey && candidate.supports(reportFamily));
    if (!adapter) throw new Error("REPORT_PROJECTION_ADAPTER_NOT_FOUND");
    const sourceProjection = await adapter.project({ ...input, reportFamily }, actor);
    if (sourceProjection.productKey !== productKey || sourceProjection.reportFamily !== reportFamily) throw new Error("REPORT_PRODUCT_FAMILY_MISMATCH");
    const profile: ProgramReportProfile | null = this.profileRegistry.resolveForRequest(productKey, reportFamily, input, sourceProjection);
    const projection = profile ? applyProgramReportProfile(sourceProjection, profile) : sourceProjection;
    const references = projection.canonicalReferences.map((item: any) => ({
      report_id: String(item?.id || item?.report_id || "").trim(),
      report_version: Number(item?.version || item?.report_version || 1),
    })).filter((item: any) => item.report_id && Number.isInteger(item.report_version) && item.report_version > 0);
    if (!references.length) throw new Error("REPORT_CANONICAL_REFERENCES_REQUIRED");
    const artifact = await this.artifactService.createArtifact({
      composition_type: definition.reportType,
      composition_version: 1,
      product_key: productKey,
      report_family: reportFamily,
      report_type: definition.reportType,
      classification: projection.classification,
      canonical_input_manifest: { reports: references, programProfile: profile ? { profileKey: profile.profileKey, profileVersion: profile.version } : null },
    }, actor);
    const rendered = await this.renderService.snapshotAndRender({
      ...projection.payload,
      productKey: projection.productKey,
      reportFamily: projection.reportFamily,
      reportVersion: 1,
      scope: { ...(typeof projection.payload.scope === "object" && projection.payload.scope ? projection.payload.scope : {}), organizationId: projection.scope.organizationId, tenantId: projection.scope.tenantId },
      classification: projection.classification,
      generatedAt: projection.generatedAt,
      canonicalReferences: projection.canonicalReferences,
      sourceVersions: projection.sourceVersions,
      provenance: projection.provenance,
      payload: projection.payload,
    }, artifact, actor, formats(input?.formats, definition.supportedFormats));
    return { productKey, reportFamily, artifact: rendered.artifact, snapshot: rendered.snapshot, template: rendered.template, renderedFiles: rendered.renderedFiles };
  }
}
