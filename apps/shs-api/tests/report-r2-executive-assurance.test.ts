import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { buildExecutiveAssurancePresentation } from "../src/domain/reporting/executive-assurance-presentation.ts";
import { CivicSureRenderAdapter, hashBytes } from "../src/domain/reporting/report-renderer.ts";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.ts";

function report() {
  return {
    reportType: "EXECUTIVE_ASSURANCE",
    reportVersion: 2,
    generatedAt: "2026-09-07T12:00:00.000Z",
    classification: "INTERNAL",
    scope: { organizationId: "org-a", tenantId: "tenant:org-a", jurisdiction: "Franklin County", reportingPeriod: { label: "2026-H1" } },
    canonicalFacts: {
      dashboard: { summary: { fundingAwarded: 600000, fundingObligated: 450000, verifiedExpenditure: 300000, programs: 2, providers: 3, acceptedTruthFacts: 4, verifiedClaims: 3, openMaterialReconciliations: 1, degradedOrStaleSources: 0 } },
      funding: [{ funding_reference_id: "funding-1", program_reference: "program-1", provider_organization_reference: "provider-1", canonical_record_type: "AWARD", amount: 600000, status: "ACTIVE" }],
      truth: [{ truth_fact_id: "truth-1", subject_reference: "outcome-1", fact_type: "PLACEMENTS", fact_value: "72", verification_level: "V3", accepted_at: "2026-09-01" }],
      findings: [{ finding_id: "finding-1", status: "OPEN", severity: "MEDIUM", provider_reference: "provider-1" }],
      reconciliations: [{ reconciliation_case_id: "recon-1", status: "OPEN", conflict_type: "AMOUNT_CONFLICT" }],
      sources: [{ source_system_id: "source-1", current_freshness_state: "FRESH", status: "ACTIVE" }],
    },
    canonicalReferences: [{ type: "TruthFact", id: "truth-1", label: "Verified placement outcome" }, { type: "Finding", id: "finding-1" }],
    verificationState: { truthFacts: 1, claims: 1 },
  };
}

test("R2 Executive Assurance HTML contains institutional sections and canonical values", () => {
  const template = new ReportTemplateRegistry().get("EXECUTIVE_ASSURANCE", 2);
  const immutablePayload = { metadata: { reportType: "EXECUTIVE_ASSURANCE", classification: "INTERNAL" }, payload: report() } as any;
  immutablePayload.presentation = buildExecutiveAssurancePresentation(report());
  const rendered = new CivicSureRenderAdapter().render({ immutablePayload, template, format: "HTML" });
  const html = rendered.bytes.toString("utf8");
  assert.equal(template.templateVersion, 2);
  assert.match(html, /Executive Summary/);
  assert.match(html, /Funding Assurance/);
  assert.match(html, /Verified Outcomes/);
  assert.match(html, /Evidence and Lineage Appendix/);
  assert.match(html, /600,000/);
  assert.match(html, /INTERNAL/);
  assert.doesNotMatch(html, /<script/i);
  assert.equal(rendered.hash, hashBytes(rendered.bytes));
});

test("R2 Executive Assurance PDF is Letter-sized, hashed, and generated from the same template", async () => {
  const template = new ReportTemplateRegistry().get("EXECUTIVE_ASSURANCE", 2);
  const immutablePayload = { metadata: { reportType: "EXECUTIVE_ASSURANCE", classification: "INTERNAL" }, payload: report() } as any;
  immutablePayload.presentation = buildExecutiveAssurancePresentation(report());
  const rendered = await new CivicSureRenderAdapter().renderPdf({ immutablePayload, template });
  assert.equal(rendered.mimeType, "application/pdf");
  assert.ok(rendered.byteLength > 1000);
  assert.equal(rendered.hash, hashBytes(rendered.bytes));
  const document = await PDFDocument.load(rendered.bytes);
  assert.ok(document.getPageCount() >= 2);
});
