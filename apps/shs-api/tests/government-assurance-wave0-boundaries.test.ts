import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createTruthSpineHandoff } from "../src/domain/government-assurance/adapters/truth-spine-boundary.js";
import { metricRegistryMetadata, PlatformMetricRegistryAdapter } from "../src/domain/government-assurance/adapters/metric-registry-boundary.js";
import { assertAdvisoryAgentResult } from "../src/domain/government-assurance/adapters/agent-fabric-boundary.js";
import { requirePublicScope, toPublicProjection } from "../src/domain/government-assurance/adapters/public-projection-boundary.js";
import { PilotReportingService } from "../src/domain/government-assurance/service/pilot-reporting-service.js";

const root = new URL("../../../", import.meta.url);
const routes = readFileSync(new URL("apps/shs-api/src/domain/government-assurance/api/routes.ts", root), "utf8");
const reporting = readFileSync(new URL("apps/shs-api/src/domain/government-assurance/service/pilot-reporting-service.ts", root), "utf8");
const contract = readFileSync(new URL("docs/government-program-assurance/CIVICSURE_WAVE_0_CANONICAL_AUTHORITY_CONTRACT.md", root), "utf8");
const explorer = readFileSync(new URL("apps/shf-web/src/pages/civicsure/explorer/civicsureExplorerMockData.js", root), "utf8");

test("Wave 0 records the five canonical authority decisions", () => {
  for (const term of ["Truth Spine", "Shared Agent Fabric", "Platform Metric Registry", "Reporting / Public Disclosure", "Source and Reconciliation Boundary"]) assert.match(contract, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(readFileSync(new URL("docs/MASTER_LAYER_REGISTRY.md", root), "utf8"), /CivicSure Wave 0 ownership contract/);
});

test("Truth handoff requires passed verification and tenant scope", () => {
  assert.throws(() => createTruthSpineHandoff({ truthFactId: "t", determinationId: "d", organizationId: "o", tenantId: "tenant:o", decision: "ACCEPTED", verificationStatus: "FAILED" }), /VERIFICATION_REQUIRED/);
  const handoff = createTruthSpineHandoff({ truthFactId: "t", determinationId: "d", organizationId: "o", tenantId: "tenant:o", decision: "ACCEPTED", verificationStatus: "PASSED" });
  assert.equal(handoff.status, "PENDING_TRUTH_SPINE_INGESTION");
  assert.equal(handoff.authority, "shs-truth-spine-v1");
});

test("metric and Agent Fabric boundaries are explicit", () => {
  const metadata = metricRegistryMetadata({ metric_id: "completion", version: 2, metadata: {} });
  assert.equal(metadata.metricRegistryAuthority, "platform-metric-registry");
  assert.throws(() => metricRegistryMetadata({ metric_id: "completion", version: 2, metadata: { metricRegistryAuthority: "gpa-local" } }), /AUTHORITY_CONFLICT/);
  const result = assertAdvisoryAgentResult({ status: "GROUNDED", recommendation: "Review" });
  assert.equal(result.authority, "ADVISORY_ONLY");
  assert.equal(result.mayDetermineTruth, false);
  assert.throws(() => assertAdvisoryAgentResult({ status: "GROUNDED", decision: "APPROVED" }), /CONSEQUENTIAL_DECISION_FORBIDDEN/);
});

test("GPA metric registration resolves identity and version from the platform registry", () => {
  const adapter = new PlatformMetricRegistryAdapter(() => ({ definitions: [{ metric_id: "gpa.metric.v1", version: 1, status: "active", owner: "platform-owner", formula: "count(distinct subject_id)", formula_type: "distinct_subject_count", public_eligibility: "private_only" }] }));
  const metadata = adapter.registrationMetadata({ metric_id: "gpa.metric.v1", version: 1, metadata: {} });
  assert.equal(metadata.metricRegistryReference, "gpa.metric.v1:1");
  assert.equal(metadata.canonicalOwner, "platform-owner");
  assert.equal(metadata.canonicalFormulaType, "distinct_subject_count");
  assert.throws(() => adapter.registrationMetadata({ metric_id: "unregistered", version: 1 }), /NOT_REGISTERED/);
});

test("public GPA output is scoped, projection-only, and sanitized", () => {
  assert.throws(() => requirePublicScope({}), /SCOPE_REQUIRED/);
  const projection = toPublicProjection({ projection_status: "PUBLISHED", source_type: "CANONICAL_PUBLICATION", report_id: "r", public_display_value: "10", tenant_id: "private", organization_id: "private", evidence_payload: "private" });
  assert.deepEqual(projection, { report_id: "r", public_display_value: "10" });
  assert.match(reporting, /listPublicProjections/);
  assert.doesNotMatch(reporting, /FROM gpa_truth_facts/);
  assert.match(routes, /pilotReporting\.publicSummary\(\{ \.\.\.req\.query \}\)/);
  assert.match(explorer, /DEMO|FRAME DATA/);
});

test("GPA public summary requires a Reporting public-governance registration", async () => {
  const queried: string[] = [];
  const service = new PilotReportingService({ listPublicProjections: async (reportId: string) => { queried.push(reportId); return []; } } as any);
  const unavailable = await service.publicSummary({ organizationId: "org-a", reportId: "report.gpa.unregistered.v1", reportVersion: 1 });
  assert.equal(unavailable.availability, "NOT_PUBLISHED");
  assert.deepEqual(queried, []);

  const registered = await service.publicSummary({ organizationId: "org-a", reportId: "report.curriculum.lesson_completion_count.v1", reportVersion: 1 });
  assert.equal(registered.availability, "NOT_PUBLISHED");
  assert.deepEqual(queried, ["report.curriculum.lesson_completion_count.v1"]);
});
