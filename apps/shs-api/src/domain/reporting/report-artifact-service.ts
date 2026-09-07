import { randomUUID } from "crypto";
import { withTransaction } from "../../db/transaction.js";
import { writeAuditEvent } from "../audit/service/audit-helper.js";
import { ReportArtifactRepo } from "./report-artifact-repo.js";
import { isProductKey, reportFamilyForType } from "./product-report-contract.js";

const CLASSIFICATIONS = new Set(["INTERNAL", "RESTRICTED_EXTERNAL", "PUBLIC"]);

export const DONOR_SUMMARY_COMPOSITION = Object.freeze({
  type: "DONOR_SUMMARY",
  version: 1,
  classification: "RESTRICTED_EXTERNAL",
  report_id: "report.workforce.employment.started_verified_count.v1",
  report_version: 1,
});

function scopeFromActor(actor: any) {
  const actorId = actor?.user_id || actor?.id;
  const organizationId = actor?.organization_id;
  if (!actorId || !organizationId) throw new Error("Report artifact scope unavailable");
  return {
    actor_id: actorId,
    organization_id: organizationId,
    tenant_id: actor?.tenant_id || actor?.tenant || `tenant:${organizationId}`,
  };
}

function canonicalManifest(input: any) {
  const reports = input?.reports;
  if (!Array.isArray(reports) || reports.length === 0) {
    throw new Error("At least one canonical report input is required");
  }
  const normalized = reports.map((report: any) => {
    const reportId = String(report?.report_id || "").trim();
    const reportVersion = Number(report?.report_version);
    if (!reportId || !Number.isInteger(reportVersion) || reportVersion < 1) {
      throw new Error("Canonical report input requires report_id and report_version");
    }
    return { report_id: reportId, report_version: reportVersion };
  });
  return { reports: normalized };
}

function normalizedInput(input: any, scope: any) {
  const compositionType = String(input?.composition_type || input?.compositionType || "").trim();
  const compositionVersion = Number(input?.composition_version || input?.compositionVersion);
  const classification = String(input?.classification || "").trim().toUpperCase();
  if (!compositionType) throw new Error("Composition type is required");
  if (!Number.isInteger(compositionVersion) || compositionVersion < 1) throw new Error("Composition version is required");
  if (!CLASSIFICATIONS.has(classification)) throw new Error("Unsupported report artifact classification");
  const rawProductKey = String(input?.product_key || input?.productKey || "").trim().toLowerCase();
  const productKey = rawProductKey ? rawProductKey : null;
  if (productKey && !isProductKey(productKey)) throw new Error("REPORT_PRODUCT_KEY_INVALID");
  const reportFamily = String(input?.report_family || input?.reportFamily || reportFamilyForType(input?.report_type || input?.reportType) || "").trim() || null;
  return {
    artifact_id: `artifact_${randomUUID()}`,
    tenant_id: scope.tenant_id,
    organization_id: scope.organization_id,
    actor_id: scope.actor_id,
    generation_idempotency_key: input?.generation_idempotency_key || null,
    composition_type: compositionType,
    composition_version: compositionVersion,
    classification,
    product_key: productKey,
    report_family: reportFamily,
    canonical_input_manifest: canonicalManifest(input?.canonical_input_manifest || input?.canonicalInputManifest),
  };
}

export class ReportArtifactService {
  constructor(
    private repo = new ReportArtifactRepo(),
    private transaction = withTransaction,
    private auditWriter = writeAuditEvent,
  ) {}

  async createArtifact(input: any, actor: any) {
    const scope = scopeFromActor(actor);
    const normalized = normalizedInput(input, scope);
    return this.transaction(async (db: any) => {
      const created = await this.repo.createArtifact(normalized, db);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`,
        organization_id: scope.organization_id,
        actor_user_id: scope.actor_id,
        target_object_type: "report_artifact",
        target_object_id: created.artifact_id,
        action_type: "report_artifact.generated",
        new_state_json: {
          artifact_id: created.artifact_id,
          composition_type: created.composition_type,
          composition_version: created.composition_version,
          classification: created.classification,
          artifact_version: created.artifact_version,
          product_key: created.product_key,
          report_family: created.report_family,
        },
        reason_text: "Canonical report artifact metadata generated",
        correlation_id: `corr_${randomUUID()}`,
        source_channel: "shs-api",
      }, db);
      return created;
    });
  }

  async createDonorSummaryArtifact(actor: any, options: any = {}) {
    if (!Array.isArray(actor?.permissions) || !actor.permissions.includes("reports.export")) {
      throw new Error("Missing permission: reports.export");
    }
    const idempotencyKey = String(options?.idempotency_key || "").trim();
    if (!idempotencyKey) throw new Error("Donor Summary artifact idempotency key is required");
    const scope = scopeFromActor(actor);
    const existing = await this.repo.findByGenerationIdempotencyKey?.(idempotencyKey, scope);
    if (existing) return existing;

    // The composition owns its classification and report dependency. Client
    // manifests are intentionally not accepted on this bounded path.
    return this.createArtifact({
      composition_type: DONOR_SUMMARY_COMPOSITION.type,
      composition_version: DONOR_SUMMARY_COMPOSITION.version,
      classification: DONOR_SUMMARY_COMPOSITION.classification,
      canonical_input_manifest: {
        reports: [{
          report_id: DONOR_SUMMARY_COMPOSITION.report_id,
          report_version: DONOR_SUMMARY_COMPOSITION.report_version,
        }],
      },
      generation_idempotency_key: idempotencyKey,
    }, actor);
  }

  async getArtifact(artifactId: string, actor: any) {
    return this.repo.getArtifact(artifactId, scopeFromActor(actor));
  }

  async listArtifacts(actor: any, filters: any = {}) {
    const productKey = filters.productKey || filters.product_key;
    if (productKey && !isProductKey(productKey)) throw new Error("REPORT_PRODUCT_KEY_INVALID");
    const reportFamily = filters.reportFamily || filters.report_family;
    if (reportFamily !== undefined && (!reportFamily || typeof reportFamily !== "string")) throw new Error("REPORT_FAMILY_INVALID");
    return this.repo.listArtifacts(scopeFromActor(actor), { productKey, reportFamily });
  }
}
