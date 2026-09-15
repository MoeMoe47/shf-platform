// MET-12 — Student Enterprise frontend focused tests. Follows this repo's
// established frontend convention (see tests/metaverseStudentMarket.test.mjs):
// static source-text assertions over the real component/client files, since
// there is no rendered-component test harness configured in this repo for
// the metaverse frontend.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/metaverse/metaverseEnterpriseClient.js", import.meta.url), "utf8");
const hubSource = readFileSync(new URL("../src/components/metaverse/enterprise/MetaverseEnterpriseHub.jsx", import.meta.url), "utf8");
const formSource = readFileSync(new URL("../src/components/metaverse/enterprise/EnterpriseFormationForm.jsx", import.meta.url), "utf8");
const profileSource = readFileSync(new URL("../src/components/metaverse/enterprise/MetaverseEnterpriseProfile.jsx", import.meta.url), "utf8");
const catalogSource = readFileSync(new URL("../src/components/metaverse/enterprise/EnterpriseCatalog.jsx", import.meta.url), "utf8");
const opportunitySource = readFileSync(new URL("../src/components/metaverse/enterprise/EnterpriseOpportunityPanel.jsx", import.meta.url), "utf8");
const historySource = readFileSync(new URL("../src/components/metaverse/enterprise/EnterpriseHistory.jsx", import.meta.url), "utf8");
const reviewSource = readFileSync(new URL("../src/components/metaverse/enterprise/MetaverseEnterpriseReviewPanel.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("MET-12 client uses protected APIs and never invents a local Treasury balance", () => {
  assert.match(clientSource, /\/metaverse\/enterprise\/enterprises/);
  assert.match(clientSource, /credentials: "include"/);
  assert.match(clientSource, /clientEditableBalance:\s*false/);
  assert.doesNotMatch(clientSource, /balance\s*:\s*\d/);
  assert.doesNotMatch(clientSource, /localStorage.*balance/i);
});

test("MET-12 formation flow labels the enterprise educational/simulated and requires boundary acknowledgement", () => {
  assert.match(formSource, /educational\/simulated/);
  assert.match(formSource, /legalBoundaryAcknowledged/);
  assert.match(formSource, /not a real business, employer, or legal entity/);
  assert.match(formSource, /myTeams/, "team picker uses canonical teams, not a free-text team id");
  assert.doesNotMatch(formSource, /<input[^>]+teamId[^>]*type="text"/);
});

test("MET-12 profile renders pending/active/paused/suspended/closed lifecycle state without implying employment", () => {
  for (const status of ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "PAUSED", "SUSPENDED", "CLOSED", "ARCHIVED"]) {
    assert.match(profileSource, new RegExp(status));
  }
  assert.match(profileSource, /not a legal business, employer, payroll entity/);
  assert.doesNotMatch(profileSource, /you\s+are\s+hired|employee\s+of/i);
});

test("MET-12 role labels never imply employment and roles come from server data only", () => {
  assert.match(profileSource, /role\.enterpriseRole/);
  assert.doesNotMatch(profileSource, /employee\s+of|salary|hourly\s+wage/i);
});

test("MET-12 catalog renders real server data and never fabricates counts", () => {
  assert.match(catalogSource, /items\.map|\(items \|\| \[\]\)\.map/);
  assert.doesNotMatch(catalogSource, /items:\s*\[\{/, "no inline fixture data");
  assert.match(catalogSource, /addEnterpriseCatalogItem/);
});

test("MET-12 opportunity panel filters to enterprise-sourced opportunities and reuses MET-8 bidding, not a new bid system", () => {
  assert.match(opportunitySource, /STUDENT_ENTERPRISE/);
  assert.match(opportunitySource, /no separate enterprise bid exists/);
  assert.doesNotMatch(opportunitySource, /submitEnterpriseBid|createEnterpriseBid/);
});

test("MET-12 history renders a plain timeline with no leaderboard or score", () => {
  assert.match(historySource, /No score, ranking,/);
  assert.match(historySource, /leaderboard is computed from it/);
  assert.doesNotMatch(historySource, /leaderboard:\s*true|reputationScore/i);
  assert.doesNotMatch(historySource, /\.sort\(/);
});

test("MET-12 hub and page never expose personal contact information", () => {
  for (const source of [hubSource, profileSource, catalogSource, historySource, formSource]) {
    assert.doesNotMatch(source, /email|phone\s*number|home\s+address/i);
  }
});

test("MET-12 UI is keyboard/screen-reader operable, non-spatial, and mobile responsive", () => {
  assert.match(hubSource, /aria-label="Student Enterprise"/);
  assert.match(profileSource, /aria-label=\{`\$\{enterprise\.name\} profile`\}/);
  assert.match(catalogSource, /aria-label="Enterprise catalog"/);
  assert.doesNotMatch(hubSource, /<div[^>]*onClick=/);
  assert.match(cssSource, /\.met-enterprise\s*\{/);
  assert.match(cssSource, /\.met-enterprise \{\s*\n\s*left: 0;\s*\n\s*right: 0;\s*\n\s*bottom: 0;\s*\n\s*width: 100%;/);
});

test("MET-12 city page wires the enterprise panel without touching required-mission-first orchestration", () => {
  assert.match(pageSource, /<MetaverseEnterpriseHub/);
  assert.match(pageSource, /listMyEnterprises\(\)/);
  assert.match(pageSource, /listMyStudioTeams\(\)/);
  assert.doesNotMatch(pageSource, /deriveGuidedNextAction/, "the page does not reimplement next-action logic client-side");
});

// --- MET-12 remediation: instructor/admin review surface ---

// 1, 11 — authorized instructor/admin sees the review surface; client cannot supply reviewer identity.
test("MET-12 review panel only renders after a server-authorized fetch, never from a client-asserted role", () => {
  assert.match(reviewSource, /listEnterprisesForReview/);
  assert.match(reviewSource, /if \(authorized !== true\) return null;/);
  assert.doesNotMatch(reviewSource, /isInstructor|isAdmin|role\s*===\s*["']instructor["']|localStorage.*role/i, "authorization is never derived from a client-side role guess");
});

// 2 — a student (denied by the server) does not see reviewer controls.
test("MET-12 review panel hides itself entirely on a 401/403 from the server, matching a STUDENT actor's denial", () => {
  assert.match(reviewSource, /err\?\.status === 401 \|\| err\?\.status === 403/);
  assert.match(reviewSource, /setAuthorized\(false\)/);
});

// 3, 4, 5, 6, 7 — approve / return-reject / pause / suspend / close are all
// reachable through the reused MetaverseEnterpriseProfile actions, not a
// second approval implementation.
test("MET-12 review panel reuses the existing lifecycle actions and creates no duplicate approval authority", () => {
  assert.match(reviewSource, /<MetaverseEnterpriseProfile/);
  assert.match(reviewSource, /canManage/);
  assert.match(reviewSource, /canReview/);
  assert.doesNotMatch(reviewSource, /approveEnterprise\(|returnEnterprise\(|suspendEnterprise\(|closeEnterprise\(|pauseEnterprise\(/, "the panel delegates every lifecycle action to MetaverseEnterpriseProfile, it does not call the client actions itself");
});

// 8 — lifecycle labels are accessible (text labels, not color-only).
test("MET-12 review panel shows lifecycle status as text for every state", () => {
  for (const status of ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "PAUSED", "SUSPENDED", "CLOSED", "ARCHIVED"]) {
    assert.match(reviewSource, new RegExp(status));
  }
  assert.match(reviewSource, /STATUS_LABEL\[enterprise\.lifecycleStatus\]/);
});

// 9 — legal/simulation boundary stays visible on the review surface itself.
test("MET-12 review panel shows the legal/simulation boundary", () => {
  assert.match(reviewSource, /governed educational\/simulated activity/);
});

// 10 — reviewer UI clearly distinguishes approval from legal-business verification.
test("MET-12 review panel never claims approval is legal-business, tax, or licensing verification", () => {
  assert.match(reviewSource, /not legal-business, tax, or licensing verification/);
});

// 12 — mobile/keyboard path: real buttons, aria-current, reuses the shared panel CSS.
test("MET-12 review panel is keyboard-operable and reuses the mobile-responsive enterprise panel", () => {
  assert.doesNotMatch(reviewSource, /<div[^>]*onClick=/);
  assert.match(reviewSource, /<button/);
  assert.match(reviewSource, /aria-current=/);
  assert.match(reviewSource, /aria-label="Student Enterprise review queue"/);
  assert.match(cssSource, /\.met-enterprise__review-list/);
});

test("MET-12 review panel is reachable through the existing Enterprise Hub entry point, not a new toolbar toggle", () => {
  assert.match(hubSource, /<MetaverseEnterpriseReviewPanel/);
  assert.doesNotMatch(pageSource, /reviewOpen|onToggleReview/, "no separate toolbar toggle was added for the review surface");
});
