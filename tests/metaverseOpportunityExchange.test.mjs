import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/metaverse/metaverseOpportunityClient.js", import.meta.url), "utf8");
const exchangeSource = readFileSync(new URL("../src/components/metaverse/MetaverseOpportunityExchange.jsx", import.meta.url), "utf8");
const cardSource = readFileSync(new URL("../src/components/metaverse/MetaverseOpportunityCard.jsx", import.meta.url), "utf8");
const detailSource = readFileSync(new URL("../src/components/metaverse/MetaverseOpportunityDetail.jsx", import.meta.url), "utf8");
const bidFormSource = readFileSync(new URL("../src/components/metaverse/MetaverseBidForm.jsx", import.meta.url), "utf8");
const bidStatusSource = readFileSync(new URL("../src/components/metaverse/MetaverseBidStatus.jsx", import.meta.url), "utf8");
const hotspotSource = readFileSync(new URL("../src/components/metaverse/MetaverseHotspot.jsx", import.meta.url), "utf8");
const controlsSource = readFileSync(new URL("../src/components/metaverse/MetaverseCameraControls.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("MET-8 opportunity client talks to the real Exchange API only and sends no client-authority fields", () => {
  assert.match(clientSource, /\/metaverse\/opportunity-exchange\/opportunities/);
  assert.match(clientSource, /credentials: "include"/);
  assert.equal(/organization_id\s*:/.test(clientSource), false);
  assert.equal(/student_id\s*:\s*["']/.test(clientSource), false);
  assert.equal(/user_id\s*:\s*["']/.test(clientSource), false);
  assert.match(clientSource, /clientAuthorityFieldsSent:\s*false/);
});

test("MET-8 opportunity client exposes list/get/bid/withdraw/award/submit and nothing that self-asserts truth", () => {
  assert.match(clientSource, /export function listOpportunities/);
  assert.match(clientSource, /export function getOpportunity\(/);
  assert.match(clientSource, /export function submitBid\(/);
  assert.match(clientSource, /export function withdrawBid\(/);
  assert.match(clientSource, /export function listMyAwards/);
  assert.match(clientSource, /export function submitWork\(/);
});

test("MET-8 city page wires opportunity state through the real client, never a hardcoded opportunity array", () => {
  assert.match(pageSource, /listOpportunities\(\)/);
  assert.match(pageSource, /const \[opportunities, setOpportunities\] = useState\(\[\]\)/);
  assert.doesNotMatch(pageSource, /title:\s*["']met8/i);
  assert.doesNotMatch(pageSource, /opportunityId:\s*["']student_opportunity_/);
});

test("MET-8 district/facility opportunity counts are derived from the fetched list only, never fabricated", () => {
  assert.match(pageSource, /opportunityCountsByDistrict/);
  assert.match(pageSource, /opportunityCountsByFacility/);
  assert.match(pageSource, /opportunityCount:\s*opportunityCountsByDistrict\[district\.id\]\s*\|\|\s*0/);
  assert.match(pageSource, /opportunityCount:\s*opportunityCountsByFacility\[facility\.id\]\s*\|\|\s*0/);
  assert.doesNotMatch(pageSource, /opportunityCount:\s*\d+/);
});

test("MET-8 Exchange panel derives district counts purely from the opportunities prop, never a static count", () => {
  assert.match(exchangeSource, /for \(const item of opportunities\)/);
  assert.doesNotMatch(exchangeSource, /districtCounts\[.*\]\s*=\s*\d+;/);
});

test("MET-8 opportunity card renders real, server-computed eligibility with a non-color-only text label", () => {
  assert.match(cardSource, /opportunity\.eligibility\.result/);
  assert.match(cardSource, /ELIGIBILITY_LABEL\[opportunity\.eligibility\.result\]/);
  assert.doesNotMatch(cardSource, /eligible\s*=\s*true/i);
});

test("MET-8 opportunity detail always distinguishes an educational opportunity from employment/credential/verified skill", () => {
  assert.match(detailSource, /Educational opportunity/);
  assert.doesNotMatch(detailSource, /you\s+are\s+now\s+employed/i);
  assert.doesNotMatch(detailSource, /credential\s+earned/i);
  assert.doesNotMatch(detailSource, /verified\s+skill:\s*true/i);
});

test("MET-8 detail renders career_pathway_id / program linkage as optional, never required", () => {
  assert.doesNotMatch(detailSource, /if \(!opportunity\.careerId\) throw/);
  assert.doesNotMatch(detailSource, /if \(!opportunity\.programId\) throw/);
});

test("MET-8 bid form never collects or sends a student/team identity claim", () => {
  assert.doesNotMatch(bidFormSource, /student_id/);
  assert.doesNotMatch(bidFormSource, /studentId:\s*["']/);
  assert.match(bidFormSource, /never collect/i);
});

test("MET-8 bid form clearly labels requested compensation as a request, not a confirmed award", () => {
  assert.match(bidFormSource, /Requested compensation \(your ask/i);
});

test("MET-8 bid status never displays an employment, credential, or verified-skill claim from an accepted bid", () => {
  assert.match(bidStatusSource, /not employment, not a credential, and not a verified skill/i);
  assert.doesNotMatch(bidStatusSource, /you\s+are\s+hired/i);
  assert.match(bidStatusSource, /Treasury has not executed any payment/);
});

test("MET-8 Exchange panel and hotspot badge reuse the existing met-* design language, not a new system", () => {
  assert.match(cssSource, /\.met-opportunities\s*\{/);
  assert.match(cssSource, /\.met-opportunities__card\s*\{/);
  assert.match(cssSource, /\.met-hotspot__opportunity-count\s*\{/);
});

test("MET-8 opportunity hotspot badge is decorative-only and count is also exposed via the accessible label", () => {
  assert.match(hotspotSource, /item\.opportunityCount/);
  assert.match(hotspotSource, /aria-hidden="true">\{item\.opportunityCount\}/);
});

test("MET-8 camera controls expose an Opportunity Exchange toggle wired to real open state and count", () => {
  assert.match(controlsSource, /onToggleOpportunities/);
  assert.match(controlsSource, /opportunitiesOpen/);
  assert.match(controlsSource, /opportunityCount/);
});

test("MET-8 city page passes Exchange toggle props into camera controls and renders the Exchange panel", () => {
  assert.match(pageSource, /opportunitiesOpen=\{opportunitiesOpen\}/);
  assert.match(pageSource, /onToggleOpportunities=\{\(\) => setOpportunitiesOpen/);
  assert.match(pageSource, /opportunityCount=\{opportunities\.length\}/);
  assert.match(pageSource, /<MetaverseOpportunityExchange/);
});

test("MET-8 Exchange UI is keyboard/screen-reader operable — no click-only div handlers, real interactive elements", () => {
  for (const source of [exchangeSource, cardSource, detailSource, bidFormSource, bidStatusSource]) {
    assert.doesNotMatch(source, /<div[^>]*onClick=/);
  }
  assert.match(exchangeSource, /aria-label="Student Opportunity Exchange"/);
  assert.match(detailSource, /role="dialog"/);
  assert.match(cardSource, /aria-describedby=/);
});

test("MET-8 Exchange panel has a mobile full-width path, same convention as the mission panel", () => {
  assert.match(cssSource, /\.met-navigator,\s*\n\s*\.met-missions,\s*\n\s*\.met-opportunities\s*\{/);
});

test("MET-8 reuses MET-6 communication and MET-7 mission types — no duplicate room type or mission model was introduced", () => {
  for (const source of [exchangeSource, cardSource, detailSource, bidFormSource, bidStatusSource, clientSource]) {
    assert.doesNotMatch(source, /_ROOM"/);
    assert.doesNotMatch(source, /missionProjectionId:\s*["']/);
  }
});
