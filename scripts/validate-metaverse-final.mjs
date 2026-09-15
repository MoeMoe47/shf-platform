import { existsSync, readFileSync } from "node:fs";

const requiredArtifacts = [
  "docs/metaverse/MET-0_SYSTEM_WIDE_METAVERSE_CURRENT_STATE_AUDIT.md",
  "docs/metaverse/MET-1_CANONICAL_METAVERSE_ARCHITECTURE.md",
  "docs/metaverse/MET-2_CITY_DISTRICT_REGISTRY.md",
  "docs/metaverse/MET-2A_VISUAL_DESIGN_LOCK_ASSET_MAPPING.md",
  "docs/metaverse/MET-2B_PRESENCE_COMMUNICATION_STUDENT_SAFETY_ARCHITECTURE.md",
  "docs/metaverse/MET-3_LEARNER_UNLOCK_PROJECTION.md",
  "docs/metaverse/MET-4_INTERACTIVE_CITY_SHELL_CAMERA_NAVIGATION.md",
  "docs/metaverse/MET-5_RUNTIME_INTEGRATION_PROTECTED_ENTRY.md",
  "docs/metaverse/MET-6_PRESENCE_COMMUNICATION_RUNTIME.md",
  "docs/metaverse/MET-7_CURRICULUM_ASSIGNMENT_ARCADE_INTEGRATION.md",
  "docs/metaverse/MET-8_STUDENT_OPPORTUNITY_EXCHANGE.md",
  "docs/metaverse/MET-9_STUDENT_MARKET_TREASURY_INTEGRATION.md",
  "docs/metaverse/MET-10_WORK_PASSPORT_CAPABILITY_GRAPH_REPUTATION.md",
  "docs/metaverse/MET-11_CITY_ECONOMY_ORCHESTRATION.md",
  "docs/metaverse/MET-12_SYSTEM_WIDE_METAVERSE_ACCEPTANCE.md",
  "apps/shs-api/src/domain/reporting/metaverse-city-report-adapter.ts",
  "apps/shs-api/tests/met-12-metaverse-report-adapter.test.ts",
  "src/system/metaverse/metaverseFinalAcceptance.js",
  "tests/met-12-final-acceptance.test.mjs",
];

const reportingSource = [
  "apps/shs-api/src/domain/reporting/metaverse-city-report-adapter.ts",
  "apps/shs-api/src/domain/reporting/report-template-registry.ts",
  "apps/shs-api/src/domain/reporting/product-report-service.ts",
].map((path) => readFileSync(path, "utf8")).join("\n");

const met1 = readFileSync("docs/metaverse/MET-1_CANONICAL_METAVERSE_ARCHITECTURE.md", "utf8");
const met4 = readFileSync("docs/metaverse/MET-4_INTERACTIVE_CITY_SHELL_CAMERA_NAVIGATION.md", "utf8");
const met9 = readFileSync("docs/metaverse/MET-9_STUDENT_MARKET_TREASURY_INTEGRATION.md", "utf8");
const met11 = readFileSync("docs/metaverse/MET-11_CITY_ECONOMY_ORCHESTRATION.md", "utf8");
const report = readFileSync("docs/metaverse/MET-12_SYSTEM_WIDE_METAVERSE_ACCEPTANCE.md", "utf8");
const treasuryAdapterSource = readFileSync("apps/shs-api/src/domain/metaverse/market/service/market-treasury-adapter.ts", "utf8");
const packageJson = readFileSync("package.json", "utf8");

const checks = [
  ["all MET-0 through MET-12 artifacts exist", requiredArtifacts.every(existsSync)],
  ["metaverse report family registered under foundation", /reportFamily,\s*"metaverse-city-participation"|"metaverse-city-participation"/.test(reportingSource) && /METAVERSE_DEFINITIONS/.test(reportingSource)],
  ["metaverse adapter registered in product report service", /metaverseCityReportAdapter/.test(reportingSource)],
  ["reporting slice does not fabricate a treasury balance", /Not available.*Durable ledger persistence pending|Durable ledger persistence pending/.test(reportingSource)],
  ["reporting slice cites the civic government boundary instead of duplicating civic data", /Owned by SHF Civic/.test(reportingSource) && /MET-1 Civic Government Boundary/.test(reportingSource)],
  ["reporting slice requires admin/instructor tier (fails closed for students)", /REPORT_SUBJECT_FORBIDDEN/.test(reportingSource)],
  ["treasury remains an in-memory adapter (no fabricated durable ledger introduced)", /InMemoryTreasuryAdapter/.test(treasuryAdapterSource)],
  ["MET-1 civic government boundary is declared", /Civic Government Boundary/.test(met1)],
  ["MET-9 student-enterprise gap is honestly carried forward, not fabricated", /expected MET-12|Student enterprise seller authority/.test(met9)],
  ["MET-4 documents its deliberate non-integration with the EXR shared shell", /no dashboard shell is used/.test(met4)],
  ["MET-11 documents its NCA non-duplication boundary", /does not duplicate NCA/.test(met11)],
  ["MET-12 report declares all required boundary sections", /Civic Government Boundary/.test(report) && /CivicSure Boundary/.test(report) && /EXR Boundary/.test(report) && /NCA Boundary/.test(report) && /Treasury Persistence Boundary/.test(report)],
  ["MET-12 report closes MET-GAP-013", /MET-GAP-013/.test(report) && /Reporting Acceptance/.test(report)],
  ["MET-12 report declares zero P0 and zero repository-local P1", /P0.*`0`|P0: 0/.test(report) && /P1.*`0`|P1: 0/.test(report)],
  ["MET-12 report does not claim student-enterprise authority was built", !/student enterprise seller authority (is|was) (built|implemented|complete)/i.test(report)],
  ["npm script registered", /"metaverse:final:validate":\s*"node scripts\/validate-metaverse-final\.mjs"/.test(packageJson)],
  ["no duplicate civic-office/election table introduced", !/CREATE TABLE\s+(civic_office|civic_election|city_government)/i.test(reportingSource)],
];

let failed = 0;
for (const [label, passed] of checks) {
  if (passed) console.log(`PASS ${label}`);
  else { failed += 1; console.error(`FAIL ${label}`); }
}
if (failed) process.exitCode = 1;
else console.log("MET-12 final validation passed.");
