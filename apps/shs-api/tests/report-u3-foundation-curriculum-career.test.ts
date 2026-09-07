import assert from "node:assert/strict";
import test from "node:test";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.js";
import { FoundationCurriculumCareerReportAdapter } from "../src/domain/reporting/foundation-curriculum-career-report-adapter.js";

const families = [
  "program-impact", "grant-funder", "cohort-outcome", "community-impact",
  "curriculum-student-progress", "curriculum-course-completion", "curriculum-assessment-evidence",
  "curriculum-instructor-class", "curriculum-cohort-learning", "career-readiness",
  "career-skill-profile", "career-credential-evidence", "career-pathway-outcome", "career-employer-partner-outcome",
];

test("U3 registers Foundation-owned Foundation, Curriculum, and Career families", () => {
  const registry = new ReportTemplateRegistry();
  for (const family of families) {
    const definition = registry.resolve("foundation", family, 1);
    assert.equal(definition.productKey, "foundation");
    assert.deepEqual(definition.supportedFormats, ["JSON", "HTML", "PDF"]);
    assert.equal(definition.rendererIdentifier, "shu-universal-r1");
  }
  assert.throws(() => registry.resolve("foundation", "oas-conformance", 1), /REPORT_TEMPLATE_NOT_FOUND/);
});

test("U3 adapter fails closed for unsupported families and requires scoped subjects", async () => {
  const adapter = new FoundationCurriculumCareerReportAdapter(async () => ({ rows: [] } as any));
  assert.equal(adapter.productKey, "foundation");
  assert.equal(adapter.supports("career-readiness"), true);
  assert.equal(adapter.supports("registry-status"), false);
  await assert.rejects(
    adapter.project({ reportFamily: "career-readiness" }, { user_id: "u1", organization_id: "org1", tenant_id: "tenant:org1", roles: ["student"] }),
    /LEARNER_REQUIRED/,
  );
  await assert.rejects(
    adapter.project({ reportFamily: "program-impact", programId: "missing" }, { user_id: "u1", organization_id: "org1", tenant_id: "tenant:org1", roles: ["student"] }),
    /FOUNDATION_PROGRAM_NOT_FOUND/,
  );
});

test("U3 adapter does not imply credential issuance or career readiness scoring", () => {
  const source = FoundationCurriculumCareerReportAdapter.toString();
  assert.match(source, /Reporting cannot issue or revoke credentials/);
  assert.match(source, /No canonical readiness score exists/);
});
