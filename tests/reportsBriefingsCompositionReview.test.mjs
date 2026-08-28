import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const panel = fs.readFileSync(new URL("../src/pages/shf-command/sections/ReportsBriefingsPanel.jsx", import.meta.url), "utf8");
const command = fs.readFileSync(new URL("../src/pages/shf-command/SHFImpactCommandCenter.jsx", import.meta.url), "utf8");
const reportRegistry = JSON.parse(fs.readFileSync(new URL("../services/shf-agent-fabric/contracts/reporting/report_registry.v1.json", import.meta.url), "utf8"));
const metricRegistry = JSON.parse(fs.readFileSync(new URL("../services/shf-agent-fabric/contracts/reporting/metric_registry.v1.json", import.meta.url), "utf8"));
const contract = fs.readFileSync(new URL("../docs/SHF_REPORTS_BRIEFINGS_COMPOSITION_CONTRACT.md", import.meta.url), "utf8");

test("the actual panel is a renderer over static inputs, not a metric authority", () => {
  assert.match(panel, /items\.map/);
  assert.doesNotMatch(panel, /fetch\(|localStorage|reduce\(|filter\(/);
  assert.match(command, /const EXPORT_ITEMS = \[/);
  assert.match(command, /<ReportsBriefingsPanel/);
  assert.match(command, /items=\{briefingItems\}/);
});

test("Grant Narrative reuses the canonical workforce report with deterministic wording", () => {
  assert.match(command, /const grantNarrativeItem = \{/);
  assert.match(command, /verified employment starts were recorded during the reporting period/);
  assert.match(command, /const briefingItems = \[boardBriefItem, grantNarrativeItem, \.\.\.EXPORT_ITEMS\.slice\(2, 4\), programHealthMemoItem\]/);
  assert.match(command, /items=\{\[boardBriefItem, grantNarrativeItem, programHealthMemoItem\]\}/);
  assert.equal((command.match(/fetchWorkforceEmploymentStartedVerifiedCountReport\(\)/g) || []).length, 1);
  const grantNarrativeBlock = command.match(/const grantNarrativeItem = \{[\s\S]*?\n  \};/u)?.[0] || "";
  assert.doesNotMatch(grantNarrativeBlock, /placement|retention|wage|impact|jobs created/i);
});

test("Program Health Memo presents the report only as a bounded historical indicator", () => {
  assert.match(command, /const programHealthMemoItem = \{/);
  assert.match(command, /subtitle: "Historical Workforce Outcome"/);
  assert.match(command, /const briefingItems = \[boardBriefItem, grantNarrativeItem, \.\.\.EXPORT_ITEMS\.slice\(2, 4\), programHealthMemoItem\]/);
  assert.match(command, /items=\{\[boardBriefItem, grantNarrativeItem, programHealthMemoItem\]\}/);
  const programHealthBlock = command.match(/const programHealthMemoItem = \{[\s\S]*?\n  \};/u)?.[0] || "";
  assert.match(programHealthBlock, /verified employment starts were recorded during the reporting period/);
  assert.doesNotMatch(programHealthBlock, /health score|placement|retention|wage|impact|jobs created/i);
});

test("workforce report is the only reviewed report input and remains historical", () => {
  const report = reportRegistry.definitions.find((item) => item.report_definition_id === "workforce.employment.started_verified_count");
  const metric = metricRegistry.definitions.find((item) => item.metric_id === "workforce.employment.started_verified_count.v1");
  assert.deepEqual(report.metric_ids, ["workforce.employment.started_verified_count.v1"]);
  assert.equal(metric.time_window, "occurred_at inclusive period_start and period_end");
  assert.equal(metric.time_zone, "UTC");
  assert.match(metric.description, /employment-start/);
  assert.doesNotMatch(JSON.stringify(report), /placement|retention|wage|impact|current employment/i);
});

test("format-specific composition and public boundary are explicit", () => {
  for (const format of ["Board Brief", "Grant Narrative", "Donor Summary", "Public Impact Snapshot", "Program Health Memo"]) {
    assert.match(contract, new RegExp(format.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")));
  }
  assert.match(contract, /INTERNAL_CANONICAL_ALLOWED/);
  assert.match(contract, /Program Health Memo \| `INTERNAL_CANONICAL_ALLOWED`/);
  assert.match(contract, /RESTRICTED_EXTERNAL_CANONICAL/);
  assert.match(contract, /PUBLIC_APPROVAL_REQUIRED/);
  assert.match(contract, /public_approved/);
});

test("briefing prose cannot turn the report into another outcome", () => {
  const normalizedContract = contract.replace(/\s+/g, " ");
  assert.match(normalizedContract, /not a placement rate, current employment count, retention, wage, transfer, settlement, ROI, impact/);
  assert.match(normalizedContract, /must not claim long-term employment or program success/);
  assert.match(normalizedContract, /must not become zero, a mock value, a previous browser value, or an Oracle estimate/);
  assert.match(normalizedContract, /No participant PII, employer details, verification artifacts/);
  assert.match(normalizedContract, /`EXPORT_ITEMS` supplied/);
});
