import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const routes = fs.readFileSync(new URL("../src/routes/exchangeRoutes.jsx", import.meta.url), "utf8");
const layout = fs.readFileSync(new URL("../src/pages/exchange/ExchangeLayout.jsx", import.meta.url), "utf8");
const dashboard = fs.readFileSync(new URL("../src/pages/exchange/InvestorDashboard.jsx", import.meta.url), "utf8");
const reportingClient = fs.readFileSync(new URL("../src/shared/reporting/exchangeFundingCommitmentReportingClient.js", import.meta.url), "utf8");
const hook = fs.readFileSync(new URL("../src/hooks/exchange/useInvestorDashboard.js", import.meta.url), "utf8");
const api = fs.readFileSync(new URL("../src/lib/exchange/api/investorApi.js", import.meta.url), "utf8");
const metricsPanel = fs.readFileSync(new URL("../src/components/exchange/investor/OutcomeMetricsPanel.jsx", import.meta.url), "utf8");
const allocations = fs.readFileSync(new URL("../services/shf-agent-fabric/services/operator_allocations_service.py", import.meta.url), "utf8");
const allocationRoutes = fs.readFileSync(new URL("../services/shf-agent-fabric/api/routes/operator_allocations.py", import.meta.url), "utf8");
const treasury = fs.readFileSync(new URL("../services/shf-agent-fabric/services/operator_treasury_ledger_service.py", import.meta.url), "utf8");
const contracts = fs.readFileSync(new URL("../services/shf-agent-fabric/services/operator_contracts_service.py", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../services/shf-agent-fabric/services/operator_actions_service.py", import.meta.url), "utf8");
const authorityContract = fs.readFileSync(new URL("../docs/SHF_EXCHANGE_FINANCIAL_AUTHORITY_CONTRACT.md", import.meta.url), "utf8");
const surfaceRegistry = fs.readFileSync(new URL("../docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json", import.meta.url), "utf8");

test("Exchange Investor route mounts the dashboard and one historical commitment field", () => {
  assert.match(routes, /path="investor" element={<InvestorDashboard \/>}/);
  assert.match(layout, /to="\/exchange\/investor"/);
  assert.match(dashboard, /Investor Dashboard/);
  assert.match(dashboard, /will show pool performance/);
  assert.match(dashboard, /Funding Commitments/);
  assert.match(dashboard, /entered the committed state/);
});

test("mounted investor surface uses only the canonical Reporting Service field", () => {
  assert.doesNotMatch(dashboard, /\$|%|<strong>|<table|localStorage|Truth|Evidence/i);
  assert.match(reportingClient, /exchange\.funding-commitment-count/);
  assert.match(reportingClient, /credentials: "include"/);
  assert.match(reportingClient, /exchange\.funding\.commitment_count\.v1/);
  assert.match(dashboard, /fetchExchangeFundingCommitmentCountReport/);
  assert.match(hook, /data: null/);
  assert.match(api, /items: \[\]/);
  assert.match(metricsPanel, /return null/);
  assert.doesNotMatch(dashboard, /OutcomeMetricsPanel/);
});

test("remaining InvestorDashboard content is placeholder copy only", () => {
  for (const phrase of ["pool performance", "capital deployment", "verified outcomes", "rankings", "risk monitoring", "allocation controls"]) {
    assert.match(dashboard, new RegExp(phrase, "i"));
  }
  assert.doesNotMatch(dashboard, /[0-9]+\s*(%|commitments|dollars)|\$[0-9]|reduce\(|filter\(|\.length|Oracle|localStorage/i);
  assert.match(surfaceRegistry, /"surface_id":"surface\.exchange\.investor"[\s\S]*"migration_status":"PARTIAL_CANONICAL"/);
  assert.match(surfaceRegistry, /"metric_id":"exchange\.funding\.commitment_count\.v1"/);
  assert.match(surfaceRegistry, /remaining dashboard content is placeholder\/noncanonical/);
});

test("investor outcomes remain blocked before producer, population, and provenance exist", () => {
  assert.doesNotMatch(routes, /OutcomeMetricsPanel/);
  assert.match(dashboard, /future|will show/i);
});

test("adjacent allocation services are not investor reporting authority", () => {
  assert.match(allocations, /allocations\.json/);
  assert.match(allocations, /allocation_created/);
  assert.match(allocationRoutes, /created_by: str/);
  assert.doesNotMatch(allocations, /tenant_id|organization_id|currency|investor_id/);
  assert.doesNotMatch(allocationRoutes, /Depends\(|require.*auth|tenant|organization/);
});

test("adjacent treasury and contract records do not establish canonical financial semantics", () => {
  assert.match(treasury, /treasury_ledger\.json/);
  assert.match(treasury, /pool_balances\.json/);
  assert.match(treasury, /reserve_funds|settle_reserved_funds/);
  assert.doesNotMatch(treasury, /"tenant_id"|"organization_id"|"currency"|"payer"|"recipient"|"reversal"|"cancel(?:led|ed)?"/);

  assert.match(contracts, /contracts\.json/);
  assert.match(contracts, /currency/);
  assert.match(contracts, /contract_created/);
  assert.doesNotMatch(contracts, /"tenant_id"|"organization_id"|"investor_id"|"payer"|"recipient"|"settlement"|"reversal"/);

  assert.match(actions, /capital_allocated/);
  assert.doesNotMatch(actions, /tenant_id|organization_id|investor_id|transfer_id|payment_id/);
});

test("investor placeholders remain separate from the one canonical field", () => {
  assert.match(dashboard, /pool performance|capital deployment|verified outcomes|risk monitoring/i);
  assert.doesNotMatch(dashboard, /ROI|investment|settlement|outcome record|financial ledger/i);
  assert.doesNotMatch(routes, /InvestorDashboard[^\n]*OutcomeMetricsPanel/);
  assert.doesNotMatch(api, /investment|funding|capital|outcome|roi/i);
  assert.doesNotMatch(hook, /investment|funding|capital|outcome|roi/i);
});

test("financial authority contract keeps adjacent concepts and advisory outputs bounded", () => {
  assert.match(authorityContract, /authorized canonical fact is an \*\*Exchange Funding Commitment\*\*/);
  assert.match(authorityContract, /Funding commitment.*CANONICAL_DOMAIN_CANDIDATE/s);
  assert.match(authorityContract, /Allocation authorization.*SUPPORTING_OPERATIONAL_RECORD/s);
  assert.match(authorityContract, /Funds transfer.*REQUIRES_EXTERNAL_FINANCIAL_AUTHORITY/s);
  assert.match(authorityContract, /Settlement.*REQUIRES_EXTERNAL_FINANCIAL_AUTHORITY/s);
  assert.match(authorityContract, /Investment record.*NOT_JUSTIFIED/s);
  assert.match(authorityContract, /allocation is not a commitment/);
  assert.match(authorityContract, /Oracle output, simulation, forecast, advisory allocation/);
  assert.match(authorityContract, /## Producer contract/);
  assert.match(authorityContract, /funding_commitment\.committed.*schema `v1`/s);
  assert.match(authorityContract, /surface\.exchange\.investor.*REPORTING_SERVICE_REQUIRED/s);
});
