import assert from "node:assert/strict";
import test from "node:test";
import {
  applyProgramReportProfile,
  programReportProfileRegistry,
} from "../src/domain/reporting/program-report-profile-registry.ts";
import { safeReportFilename } from "../src/domain/reporting/report-file-storage.ts";
import type { AuthorizedReportProjection } from "../src/domain/reporting/product-report-contract.ts";

const projection = (subject: string, productKey: "foundation" | "studio" = "foundation"): AuthorizedReportProjection => ({
  productKey,
  reportFamily: productKey === "studio" ? "project-report" : "program-impact",
  subject,
  scope: { organizationId: "org_profile", tenantId: "tenant:org_profile" },
  reportingPeriod: { label: "2026-Q3" },
  classification: "INTERNAL",
  generatedAt: "2026-09-07T12:00:00.000Z",
  canonicalReferences: [{ type: "profile_fixture", id: subject, version: 1 }],
  sourceVersions: [{ source: "fixture", version: 1 }],
  provenance: { source: "authorized-fixture" },
  payload: {
    reportType: productKey === "studio" ? "STUDIO_PROJECT_REPORT" : "FOUNDATION_PROGRAM_IMPACT",
    scope: { subjectReference: subject },
    presentation: {
      reportTitle: "Program Report",
      brand: { brandingKey: productKey },
      sections: [{
        title: "Canonical summary",
        tables: [{
          headers: ["Measure", "Value", "Authority"],
          rows: [
            ["Participant count", "12", "Program Authority"],
            ["Lesson progress", "8", "Curriculum Authority"],
            ["Technical project", "2", "Project Authority"],
            ["Credential earned", "1", "Credential Authority"],
            ["Verified workforce outcome", "1", "Career Authority"],
            ["Community project", "1", "Foundation Authority"],
            ["Evidence reference", "evidence_1", "Evidence Authority"],
          ],
        }],
      }],
    },
  },
});

test("U5 resolves exact profiles and fails closed for unknown or mismatched identities", () => {
  const registry = programReportProfileRegistry;
  assert.equal(registry.resolve("foundation.summer-stem-community", "foundation", "program-impact").version, "1.0");
  assert.equal(registry.resolve("studio.ai-agent-project", "studio", "project-report").productKey, "studio");
  assert.throws(() => registry.resolve("missing.profile", "foundation", "program-impact"), /REPORT_PROFILE_NOT_FOUND/);
  assert.throws(() => registry.resolve("foundation.summer-stem-community", "studio", "project-report"), /REPORT_PROFILE_NOT_FOUND/);
  assert.throws(() => registry.resolve("foundation.summer-stem-community", "foundation", "career-readiness"), /REPORT_PROFILE_FAMILY_NOT_ALLOWED/);
  assert.throws(() => registry.resolve("foundation.summer-stem-community", "foundation", "program-impact", "2.0"), /REPORT_PROFILE_NOT_FOUND/);
});

test("U5 binds profiles to canonical program or project identities without caller configuration", () => {
  const summer = programReportProfileRegistry.resolveForRequest("foundation", "program-impact", { programId: "program_seed_001" }, projection("program_seed_001"));
  const dataCenter = programReportProfileRegistry.resolveForRequest("foundation", "career-readiness", { programId: "data-center-specialization-11" }, projection("data-center-specialization-11"));
  const studio = programReportProfileRegistry.resolveForRequest("studio", "project-report", { projectType: "AI_AGENT" }, projection("project_1", "studio"));
  assert.equal(summer?.profileKey, "foundation.summer-stem-community");
  assert.equal(dataCenter?.profileKey, "foundation.data-center-ai-infrastructure-pathway");
  assert.equal(studio?.profileKey, "studio.ai-agent-project");
  assert.equal(programReportProfileRegistry.resolveForRequest("foundation", "program-impact", {}, projection("unknown")), null);
  assert.equal(programReportProfileRegistry.resolveForRequest("oas", "conformance", { programId: "program_seed_001" }, { ...projection("program_seed_001"), productKey: "oas", reportFamily: "conformance" }), null);
});

test("U5 profiles materially change structure, terminology, branding, and policy metadata", () => {
  const summer = programReportProfileRegistry.resolve("foundation.summer-stem-community", "foundation", "program-impact");
  const dataCenter = programReportProfileRegistry.resolve("foundation.data-center-ai-infrastructure-pathway", "foundation", "career-readiness");
  const summerProjection = applyProgramReportProfile(projection("program_seed_001"), summer);
  const dataCenterProjection = applyProgramReportProfile(projection("data-center-specialization-11"), dataCenter);
  const summerPresentation = (summerProjection.payload as any).presentation;
  const dataCenterPresentation = (dataCenterProjection.payload as any).presentation;
  assert.notDeepEqual(summerPresentation.sections.map((section: any) => section.title), dataCenterPresentation.sections.map((section: any) => section.title));
  assert.equal(summerPresentation.terminology.program, "community initiative");
  assert.equal(dataCenterPresentation.terminology.program, "pathway");
  assert.equal(summerPresentation.brand.brandingKey, "foundation-community");
  assert.equal(dataCenterPresentation.brand.brandingKey, "foundation-data-center");
  assert.equal((summerProjection.payload as any).programProfile.profileVersion, "1.0");
  assert.ok(dataCenterPresentation.methodology.metricPolicy.includes("career.workforce_outcomes.verified"));
});

test("U5 rejects caller-supplied sections, metrics, evidence, renderer, and publication configuration", () => {
  const badInputs = [
    { metrics: ["caller.metric"] },
    { metricFormula: "a + b" },
    { evidenceTypes: ["caller-evidence"] },
    { sections: ["caller-html"] },
    { rendererKey: "caller-renderer" },
    { publicationState: "RELEASED" },
  ];
  for (const input of badInputs) {
    assert.throws(
      () => programReportProfileRegistry.resolveForRequest("foundation", "program-impact", input, projection("program_seed_001")),
      /REPORT_PROFILE_UNTRUSTED_CONFIGURATION/,
    );
  }
});

test("U5 keeps filename identity trusted and profile version visible to the artifact layer", () => {
  const profile = programReportProfileRegistry.resolve("foundation.data-center-ai-infrastructure-pathway", "foundation", "career-readiness");
  const applied = applyProgramReportProfile(projection("data-center-specialization-11"), profile);
  const filename = safeReportFilename({ productKey: "foundation", filenamePrefix: (applied.payload as any).programProfile.filenamePrefix, jurisdiction: "Data Center / AI", reportType: "Career Readiness", period: "2026/Q3", version: 1, format: "PDF" });
  assert.equal(filename, "DataCenterAI_Data-Center-AI_Career-Readiness_2026-Q3_v1.pdf");
  assert.equal((applied.payload as any).programProfile.profileKey, "foundation.data-center-ai-infrastructure-pathway");
  assert.equal((applied.payload as any).programProfile.profileVersion, "1.0");
});

test("U5 defers OAS education and BOS package profiles until canonical program authorities exist", () => {
  const keys = programReportProfileRegistry.definitions().map((profile) => profile.profileKey);
  assert.equal(keys.some((key) => key.startsWith("oas.")), false);
  assert.equal(keys.some((key) => key.startsWith("bos.")), false);
});
