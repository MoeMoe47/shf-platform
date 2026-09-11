import { requirePermission } from "../../auth/permission-guard.js";
import { requireOrganizationServiceEntitlement } from "../../auth/service-entitlement-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../auth/security-permissions.js";
import { addExport, getExports } from "./export-history.store.js";
import { writeSecurityAuditEvent } from "../../auth/security-audit.js";
import { ReportDraftService } from "./report-draft-service.js";
import { ReportArtifactService } from "./report-artifact-service.js";
import { ReportR1Service } from "./report-r1-service.js";
import { ReportDistributionService } from "./report-distribution-service.js";
import { ReportPublicEligibilityService } from "./report-public-eligibility-service.js";
import { ReportPublicDisclosureService } from "./report-public-disclosure-service.js";
import { ReportPublicDisclosurePolicyService } from "./report-public-disclosure-policy-service.js";
import { ReportPublicSnapshotService } from "./report-public-snapshot-service.js";
import { ReportPublicationService } from "./report-publication-service.js";
import { ProductReportService } from "./product-report-service.js";
import { TrustedReportingRecoveryService } from "../trusted-reporting/recovery-service.js";

const reportDraftService = new ReportDraftService();
const reportArtifactService = new ReportArtifactService();
const reportR1Service = new ReportR1Service();
const reportDistributionService = new ReportDistributionService();
const reportPublicEligibilityService = new ReportPublicEligibilityService();
const reportPublicDisclosureService = new ReportPublicDisclosureService();
const reportPublicDisclosurePolicyService = new ReportPublicDisclosurePolicyService();
const reportPublicSnapshotService = new ReportPublicSnapshotService();
const reportPublicationService = new ReportPublicationService();
const productReportService = new ProductReportService();
const trustedReportingRecoveryService = new TrustedReportingRecoveryService();

export function registerReportingRoutes(app: any) {
  app.use("/reporting", requireOrganizationServiceEntitlement("reporting"));

  for (const productKey of ["studio", "oas", "foundation", "bos", "registry", "solutions", "legal"] as const) {
    app.post(
      `/reporting/${productKey}/reports`,
      requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT),
      async (req: any, res: any) => {
        try {
          const result = await productReportService.generate(productKey, req.body || {}, req.user);
          return res.status(201).json({ ok: true, data: result });
        } catch (err: any) {
          const message = err.message || "Product report rejected";
          const status = /FORBIDDEN|required|NOT_FOUND|SCOPE|PERMISSION|UNSUPPORTED|MISMATCH|VERSION/.test(message) ? 400 : 500;
          return res.status(status).json({ ok: false, error: { code: "PRODUCT_REPORT_REJECTED", message } });
        }
      },
    );
  }
  app.post(
    "/reporting/publications",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLICATION_EXECUTE),
    async (req: any, res: any) => {
      try {
        const result = await reportPublicationService.publish(req.body || {}, req.user);
        return res.status(result.replayed ? 200 : 201).json({ ok: true, data: result, idempotent_replay: result.replayed });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLICATION_REJECTED", message: err.message || "Publication rejected" } });
      }
    },
  );

  app.get(
    "/reporting/publications",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLICATION_EXECUTE),
    async (req: any, res: any) => {
      const items = await reportPublicationService.listPublications(req.user);
      return res.json({ ok: true, data: { items } });
    },
  );

  app.get(
    "/reporting/publications/:publicationId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLICATION_EXECUTE),
    async (req: any, res: any) => {
      const publication = await reportPublicationService.getPublication(req.params.publicationId, req.user);
      if (!publication) return res.status(404).json({ ok: false, error: { code: "REPORT_PUBLICATION_NOT_FOUND", message: "Publication not found" } });
      return res.json({ ok: true, data: publication });
    },
  );

  // Public Impact is a read-only projection of published, governed snapshots.
  app.get("/public/impact/curriculum-lesson-completions", async (_req: any, res: any) => {
    try {
      const items = await reportPublicationService.listPublicImpactProjections();
      return res.json({ ok: true, data: { items } });
    } catch (err: any) {
      return res.status(503).json({ ok: false, error: { code: "PUBLIC_IMPACT_UNAVAILABLE", message: "Public impact data unavailable" } });
    }
  });

  app.get("/public/assurance/projections", async (req: any, res: any) => {
    try {
      const items = await reportPublicationService.listPublicAssuranceProjections(req.query || {});
      return res.json({ ok: true, data: { items } });
    } catch (_err: any) {
      return res.status(503).json({ ok: false, error: { code: "PUBLIC_ASSURANCE_UNAVAILABLE", message: "Public assurance data unavailable" } });
    }
  });

  app.get("/public/assurance/projections/:projectionId", async (req: any, res: any) => {
    try {
      const item = await reportPublicationService.getPublicAssuranceProjection(req.params.projectionId);
      if (!item) return res.status(404).json({ ok: false, error: { code: "PUBLIC_ASSURANCE_NOT_FOUND", message: "Public assurance projection not found" } });
      return res.json({ ok: true, data: item });
    } catch (_err: any) {
      return res.status(503).json({ ok: false, error: { code: "PUBLIC_ASSURANCE_UNAVAILABLE", message: "Public assurance data unavailable" } });
    }
  });

  app.post(
    "/reporting/publication-authorizations",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLICATION_AUTHORIZE),
    async (req: any, res: any) => {
      try {
        const result = await reportPublicationService.authorize(req.body || {}, req.user);
        return res.status(result.replayed ? 200 : 201).json({ ok: true, data: result.authorization, idempotent_replay: result.replayed });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLICATION_AUTHORIZATION_REJECTED", message: err.message || "Publication authorization rejected" } });
      }
    },
  );

  app.get(
    "/reporting/publication-authorizations",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLICATION_AUTHORIZE),
    async (req: any, res: any) => {
      const items = await reportPublicationService.listAuthorizations(req.user);
      return res.json({ ok: true, data: { items } });
    },
  );

  app.get(
    "/reporting/publication-authorizations/:authorizationId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLICATION_AUTHORIZE),
    async (req: any, res: any) => {
      const authorization = await reportPublicationService.getAuthorization(req.params.authorizationId, req.user);
      if (!authorization) return res.status(404).json({ ok: false, error: { code: "REPORT_PUBLICATION_AUTHORIZATION_NOT_FOUND", message: "Publication authorization not found" } });
      return res.json({ ok: true, data: authorization });
    },
  );
  app.post(
    "/reporting/publication-authorizations/:authorizationId/revoke",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLICATION_AUTHORIZE),
    async (req: any, res: any) => {
      try {
        const result = await reportPublicationService.revokeAuthorization(req.params.authorizationId, req.user, req.body?.rationale);
        return res.status(result.replayed ? 200 : 200).json({ ok: true, data: result.authorization, idempotent_replay: result.replayed });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLICATION_REVOCATION_REJECTED", message: err.message || "Publication revocation rejected" } });
      }
    },
  );
  app.post(
    "/reporting/public-snapshots",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_SNAPSHOT_GENERATE),
    async (req: any, res: any) => {
      try {
        const result = await reportPublicSnapshotService.createSnapshot(req.body || {}, req.user);
        return res.status(result.replayed ? 200 : 201).json({ ok: true, data: result.snapshot, idempotent_replay: result.replayed });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_SNAPSHOT_REJECTED", message: err.message || "Public snapshot rejected" } });
      }
    },
  );

  app.get(
    "/reporting/public-snapshots",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_SNAPSHOT_VIEW),
    async (req: any, res: any) => {
      try {
        const reportVersion = req.query?.report_version === undefined ? undefined : Number(req.query.report_version);
        const items = await reportPublicSnapshotService.listSnapshots(req.user, req.query?.report_id, reportVersion);
        return res.json({ ok: true, data: { items } });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_SNAPSHOT_READ_REJECTED", message: err.message || "Public snapshots unavailable" } });
      }
    },
  );

  app.get(
    "/reporting/public-snapshots/:snapshotId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_SNAPSHOT_VIEW),
    async (req: any, res: any) => {
      const snapshot = await reportPublicSnapshotService.getSnapshot(req.params.snapshotId, req.user);
      if (!snapshot) return res.status(404).json({ ok: false, error: { code: "REPORT_PUBLIC_SNAPSHOT_NOT_FOUND", message: "Public snapshot not found" } });
      return res.json({ ok: true, data: snapshot });
    },
  );
  app.post(
    "/reporting/public-disclosure-policies",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_DISCLOSURE_POLICY_MANAGE),
    async (req: any, res: any) => {
      try {
        const policy = await reportPublicDisclosurePolicyService.createPolicy(req.body || {}, req.user);
        return res.status(201).json({ ok: true, data: policy });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_POLICY_REJECTED", message: err.message || "Public disclosure policy rejected" } });
      }
    },
  );

  app.post(
    "/reporting/public-disclosure-policies/:policyId/signoffs",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_DISCLOSURE_POLICY_MANAGE),
    async (req: any, res: any) => {
      try {
        const signoff = await reportPublicDisclosurePolicyService.createSignoff(req.params.policyId, req.body || {}, req.user);
        return res.status(201).json({ ok: true, data: signoff });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_POLICY_SIGNOFF_REJECTED", message: err.message || "Policy sign-off rejected" } });
      }
    },
  );

  app.get(
    "/reporting/public-disclosure-policies/:policyId/signoffs",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const signoffs = await reportPublicDisclosurePolicyService.listSignoffs(req.params.policyId, req.user);
        return res.json({ ok: true, data: { items: signoffs } });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_POLICY_SIGNOFF_READ_REJECTED", message: err.message || "Policy sign-offs unavailable" } });
      }
    },
  );

  app.post(
    "/reporting/public-disclosure-policies/signoffs/:signoffId/approve",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_DISCLOSURE_POLICY_MANAGE),
    async (req: any, res: any) => {
      try {
        const signoff = await reportPublicDisclosurePolicyService.approveSignoff(req.params.signoffId, req.user);
        return res.json({ ok: true, data: signoff });
      } catch (err: any) {
        return res.status(409).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_POLICY_SIGNOFF_APPROVAL_REJECTED", message: err.message || "Policy sign-off approval rejected" } });
      }
    },
  );

  app.get(
    "/reporting/public-disclosure-policies",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const reportId = req.query?.report_id;
        const reportVersion = req.query?.report_version === undefined ? undefined : Number(req.query.report_version);
        const items = await reportPublicDisclosurePolicyService.listPolicies(req.user, reportId, reportVersion);
        return res.json({ ok: true, data: { items } });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_POLICY_READ_REJECTED", message: err.message || "Public disclosure policies unavailable" } });
      }
    },
  );

  app.get(
    "/reporting/public-disclosure-policies/:policyId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      const policy = await reportPublicDisclosurePolicyService.getPolicy(req.params.policyId, req.user);
      if (!policy) return res.status(404).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_POLICY_NOT_FOUND", message: "Public disclosure policy not found" } });
      return res.json({ ok: true, data: policy });
    },
  );

  app.post(
    "/reporting/public-disclosure-policies/:policyId/approve",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_DISCLOSURE_POLICY_MANAGE),
    async (req: any, res: any) => {
      try {
        const policy = await reportPublicDisclosurePolicyService.approvePolicy(req.params.policyId, req.user);
        return res.json({ ok: true, data: policy });
      } catch (err: any) {
        return res.status(409).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_POLICY_APPROVAL_REJECTED", message: err.message || "Public disclosure policy approval rejected" } });
      }
    },
  );

  app.post(
    "/reporting/public-disclosure-policies/:policyId/retire",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_DISCLOSURE_POLICY_MANAGE),
    async (req: any, res: any) => {
      try {
        const policy = await reportPublicDisclosurePolicyService.retirePolicy(req.params.policyId, req.user);
        return res.json({ ok: true, data: policy });
      } catch (err: any) {
        return res.status(409).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_POLICY_RETIRE_REJECTED", message: err.message || "Public disclosure policy retirement rejected" } });
      }
    },
  );

  app.post(
    "/reporting/public-disclosure-decisions",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_DISCLOSURE_MANAGE),
    async (req: any, res: any) => {
      try {
        const decision = await reportPublicDisclosureService.createDecision(req.body || {}, req.user);
        return res.status(201).json({ ok: true, data: decision });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_REJECTED", message: err.message || "Public disclosure decision rejected" } });
      }
    },
  );

  app.get(
    "/reporting/public-disclosure-decisions",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const reportId = req.query?.report_id;
        const reportVersion = req.query?.report_version === undefined ? undefined : Number(req.query.report_version);
        const items = await reportPublicDisclosureService.listDecisions(req.user, reportId, reportVersion);
        return res.json({ ok: true, data: { items } });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_READ_REJECTED", message: err.message || "Public disclosure decisions unavailable" } });
      }
    },
  );

  app.get(
    "/reporting/public-disclosure-decisions/:decisionId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      const decision = await reportPublicDisclosureService.getDecision(req.params.decisionId, req.user);
      if (!decision) return res.status(404).json({ ok: false, error: { code: "REPORT_PUBLIC_DISCLOSURE_NOT_FOUND", message: "Public disclosure decision not found" } });
      return res.json({ ok: true, data: decision });
    },
  );

  app.post(
    "/reporting/public-eligibility-decisions",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLIC_ELIGIBILITY_MANAGE),
    async (req: any, res: any) => {
      try {
        const decision = await reportPublicEligibilityService.createDecision(req.body || {}, req.user);
        return res.status(201).json({ ok: true, data: decision });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_ELIGIBILITY_REJECTED", message: err.message || "Public eligibility decision rejected" } });
      }
    },
  );

  app.get(
    "/reporting/public-eligibility-decisions",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const reportId = req.query?.report_id;
        const reportVersion = req.query?.report_version === undefined ? undefined : Number(req.query.report_version);
        const items = await reportPublicEligibilityService.listDecisions(req.user, reportId, reportVersion);
        return res.json({ ok: true, data: { items } });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PUBLIC_ELIGIBILITY_READ_REJECTED", message: err.message || "Public eligibility decisions unavailable" } });
      }
    },
  );

  app.get(
    "/reporting/public-eligibility-decisions/:decisionId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      const decision = await reportPublicEligibilityService.getDecision(req.params.decisionId, req.user);
      if (!decision) return res.status(404).json({ ok: false, error: { code: "REPORT_PUBLIC_ELIGIBILITY_NOT_FOUND", message: "Public eligibility decision not found" } });
      return res.json({ ok: true, data: decision });
    },
  );

  app.post(
    "/reporting/distribution-recipients",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_DISTRIBUTION_MANAGE),
    async (req: any, res: any) => {
      try {
        const recipient = await reportDistributionService.createRecipient(req.body || {}, req.user);
        return res.status(201).json({ ok: true, data: recipient });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_RECIPIENT_REJECTED", message: err.message || "Recipient authorization rejected" } });
      }
    },
  );

  app.get(
    "/reporting/distribution-recipients",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const items = await reportDistributionService.listRecipients(req.user);
        return res.json({ ok: true, data: { items } });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_RECIPIENT_READ_REJECTED", message: err.message || "Recipients unavailable" } });
      }
    },
  );

  app.get(
    "/reporting/distribution-recipients/:recipientAuthorizationId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      const recipient = await reportDistributionService.getRecipient(req.params.recipientAuthorizationId, req.user);
      if (!recipient) return res.status(404).json({ ok: false, error: { code: "REPORT_RECIPIENT_NOT_FOUND", message: "Recipient authorization not found" } });
      return res.json({ ok: true, data: recipient });
    },
  );

  app.post(
    "/reporting/distribution-recipients/:recipientAuthorizationId/revoke",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_DISTRIBUTION_MANAGE),
    async (req: any, res: any) => {
      try {
        const recipient = await reportDistributionService.revokeRecipient(req.params.recipientAuthorizationId, Number(req.body?.expectedVersion), req.user);
        return res.json({ ok: true, data: recipient });
      } catch (err: any) {
        return res.status(409).json({ ok: false, error: { code: "REPORT_RECIPIENT_REVOKE_REJECTED", message: err.message || "Recipient revocation rejected" } });
      }
    },
  );

  app.post(
    "/reporting/artifacts/:artifactId/disclosure-decisions",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_DISTRIBUTION_MANAGE),
    async (req: any, res: any) => {
      try {
        const decision = await reportDistributionService.createDisclosureDecision(req.params.artifactId, req.body || {}, req.user);
        return res.status(201).json({ ok: true, data: decision });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_DISCLOSURE_REJECTED", message: err.message || "Disclosure decision rejected" } });
      }
    },
  );

  app.get(
    "/reporting/artifacts/:artifactId/disclosure-decisions",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      const decisions = await reportDistributionService.listDisclosureDecisions(req.params.artifactId, req.user);
      return res.json({ ok: true, data: { items: decisions } });
    },
  );

  app.post(
    "/reporting/artifacts/:artifactId/distributions",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_DISTRIBUTE),
    async (req: any, res: any) => {
      try {
        const result = await reportDistributionService.authorizeDistribution(req.params.artifactId, req.body || {}, req.user);
        return res.status(result.replayed ? 200 : 201).json({ ok: true, data: result.record, idempotent_replay: result.replayed });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_DISTRIBUTION_AUTHORIZATION_REJECTED", message: err.message || "Distribution authorization rejected" } });
      }
    },
  );

  app.get(
    "/reporting/artifacts/:artifactId/distributions",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      const items = await reportDistributionService.listDistributions(req.params.artifactId, req.user);
      return res.json({ ok: true, data: { items } });
    },
  );

  app.post(
    "/reporting/compositions/donor-summary/artifacts",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT),
    async (req: any, res: any) => {
      try {
        const artifact = await reportArtifactService.createDonorSummaryArtifact(req.user, { idempotency_key: req.body?.idempotency_key });
        return res.status(201).json({ ok: true, data: artifact });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "DONOR_SUMMARY_ARTIFACT_CREATE_REJECTED", message: err.message || "Donor Summary artifact rejected" } });
      }
    },
  );

  app.post(
    "/reporting/artifacts",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT),
    async (req: any, res: any) => {
      try {
        const artifact = await reportArtifactService.createArtifact(req.body || {}, req.user);
        return res.status(201).json({ ok: true, data: artifact });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_ARTIFACT_CREATE_REJECTED", message: err.message || "Report artifact rejected" } });
      }
    },
  );

  app.get(
    "/reporting/artifacts",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const items = await reportArtifactService.listArtifacts(req.user, { productKey: req.query?.product_key, reportFamily: req.query?.report_family });
        return res.json({ ok: true, data: { items } });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_ARTIFACT_READ_REJECTED", message: err.message || "Report artifacts unavailable" } });
      }
    },
  );

  app.get(
    "/reporting/artifacts/:artifactId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const artifact = await reportArtifactService.getArtifact(req.params.artifactId, req.user);
        if (!artifact) return res.status(404).json({ ok: false, error: { code: "REPORT_ARTIFACT_NOT_FOUND", message: "Report artifact not found" } });
        return res.json({ ok: true, data: artifact });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_ARTIFACT_READ_REJECTED", message: err.message || "Report artifact unavailable" } });
      }
    },
  );

  app.get(
    "/reporting/artifacts/:artifactId/snapshot",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const snapshot = await reportR1Service.getSnapshot(req.params.artifactId, req.user);
        if (!snapshot) return res.status(404).json({ ok: false, error: { code: "REPORT_PAYLOAD_SNAPSHOT_NOT_FOUND", message: "Report payload snapshot not found" } });
        return res.json({ ok: true, data: snapshot });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_PAYLOAD_SNAPSHOT_READ_REJECTED", message: err.message || "Report payload snapshot unavailable" } });
      }
    },
  );

  app.get(
    "/reporting/artifacts/:artifactId/rendered-files",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const files = await reportR1Service.listRenderedFiles(req.params.artifactId, req.user);
        return res.json({ ok: true, data: { items: files } });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_RENDERED_FILE_READ_REJECTED", message: err.message || "Rendered files unavailable" } });
      }
    },
  );

  app.get(
    "/reporting/rendered-files/:fileId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const result = await reportR1Service.getRenderedFile(req.params.fileId, req.user);
        if (!result) return res.status(404).json({ ok: false, error: { code: "REPORT_RENDERED_FILE_NOT_FOUND", message: "Rendered file not found" } });
        const file = result.file;
        const disposition = req.query?.download === "1" ? "attachment" : "inline";
        const filename = String(file.filename || `${file.report_type || "report"}.${String(file.format).toLowerCase()}`).replace(/[^a-zA-Z0-9._-]+/g, "-");
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
        res.setHeader("Content-Type", file.mime_type);
        return res.send(result.bytes);
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_RENDERED_FILE_READ_REJECTED", message: err.message || "Rendered file unavailable" } });
      }
    },
  );

  app.post(
    "/reporting/drafts",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW),
    async (req: any, res: any) => {
      try {
        const report = await reportDraftService.createDraft(req.body || {}, req.user);
        res.status(201).json({ ok: true, data: report, correlation_id: `corr_${report.report_id}` });
      } catch (err: any) {
        res.status(400).json({ ok: false, error: { code: "REPORT_DRAFT_REJECTED", message: err.message || "Report draft rejected" } });
      }
    }
  );

  app.get(
    "/reporting/drafts",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const items = await reportDraftService.listDrafts(req.user);
        res.json({ ok: true, data: { items } });
      } catch (err: any) {
        res.status(400).json({ ok: false, error: { code: "REPORT_DRAFT_READ_REJECTED", message: err.message || "Report draft read rejected" } });
      }
    }
  );

  app.get(
    "/reporting/drafts/:reportId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const report = await reportDraftService.getDraft(req.params.reportId, req.user);
        if (!report) return res.status(404).json({ ok: false, error: { code: "REPORT_DRAFT_NOT_FOUND", message: "Report draft not found" } });
        return res.json({ ok: true, data: report });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_DRAFT_READ_REJECTED", message: err.message || "Report draft read rejected" } });
      }
    }
  );

  app.get(
    "/reporting/drafts/:reportId/revisions",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const items = await reportDraftService.listRevisions(req.params.reportId, req.user);
        return res.json({ ok: true, data: { items } });
      } catch (err: any) {
        return res.status(400).json({ ok: false, error: { code: "REPORT_DRAFT_REVISION_READ_REJECTED", message: err.message || "Report draft revisions unavailable" } });
      }
    }
  );

  app.put(
    "/reporting/drafts/:reportId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW),
    async (req: any, res: any) => {
      try {
        const report = await reportDraftService.updateDraft(
          req.params.reportId,
          req.body || {},
          req.user,
          Number(req.body?.expectedVersion)
        );
        return res.json({ ok: true, data: report });
      } catch (err: any) {
        return res.status(409).json({ ok: false, error: { code: "REPORT_DRAFT_UPDATE_REJECTED", message: err.message || "Report draft update rejected" } });
      }
    }
  );

  app.post(
    "/reporting/drafts/:reportId/review",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLICATION_AUTHORIZE),
    async (req: any, res: any) => {
      try {
        const report = await reportDraftService.transitionReview(req.params.reportId, req.body?.status, req.body?.rationale, req.user);
        return res.json({ ok: true, data: report });
      } catch (err: any) {
        return res.status(409).json({ ok: false, error: { code: "REPORT_REVIEW_REJECTED", message: err.message || "Report review rejected" } });
      }
    },
  );

  app.post(
    "/reporting/drafts/:reportId/correction",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW),
    async (req: any, res: any) => {
      try {
        const report = await reportDraftService.beginCorrection(req.params.reportId, req.body?.rationale, req.user);
        return res.json({ ok: true, data: report });
      } catch (err: any) {
        return res.status(409).json({ ok: false, error: { code: "REPORT_CORRECTION_REJECTED", message: err.message || "Report correction rejected" } });
      }
    },
  );

  app.post(
    "/reporting/outbox/:outboxEventId/recover",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PUBLICATION_AUTHORIZE),
    async (req: any, res: any) => {
      try {
        const event = await trustedReportingRecoveryService.recoverQuarantined(req.params.outboxEventId, req.user, req.body?.reason);
        return res.json({ ok: true, data: event });
      } catch (err: any) {
        return res.status(409).json({ ok: false, error: { code: "REPORT_OUTBOX_RECOVERY_REJECTED", message: err.message || "Outbox recovery rejected" } });
      }
    },
  );

  app.get(
    "/reporting/exports",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    (_req: any, res: any) => {
      res.json({ items: getExports() });
    }
  );

  app.post(
    "/reporting/exports",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT),
    async (req: any, res: any) => {
      const record = {
        id: Date.now().toString(),
        exportKind: req.body.exportKind,
        artifactId: req.body.artifactId,
        status: req.body.status || "generated",
        requestedBy: req.body.requestedBy || req.user?.user_id || req.user?.id || "system",
        createdAt: new Date().toISOString(),
      };

      addExport(record);

      await writeSecurityAuditEvent(req, {
        action_type: "reports.export",
        target_object_type: "report_artifact",
        target_object_id: record.artifactId || record.id,
        new_state_json: record,
        reason_code: String(record.exportKind || "report_export"),
        reason_text: `Report export generated: ${record.exportKind || "unknown"}`,
      });

      res.json({ ok: true, record });
    }
  );
}
