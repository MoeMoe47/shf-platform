import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/metaverse/metaverseOrchestrationClient.js", import.meta.url), "utf8");
const briefingSource = readFileSync(new URL("../src/components/metaverse/MetaverseDailyBriefing.jsx", import.meta.url), "utf8");
const nextSource = readFileSync(new URL("../src/components/metaverse/MetaverseNextAction.jsx", import.meta.url), "utf8");
const pulseSource = readFileSync(new URL("../src/components/metaverse/MetaverseDistrictPulse.jsx", import.meta.url), "utf8");
const eventsSource = readFileSync(new URL("../src/components/metaverse/MetaverseCityEvents.jsx", import.meta.url), "utf8");
const previewSource = readFileSync(new URL("../src/components/metaverse/MetaverseBuildingPreview.jsx", import.meta.url), "utf8");
const fastTravelSource = readFileSync(new URL("../src/components/metaverse/MetaverseFastTravel.jsx", import.meta.url), "utf8");
const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("MET-11 frontend uses the canonical orchestration endpoint and sends no authority state", () => {
  assert.match(clientSource, /\/metaverse\/orchestration/);
  assert.match(clientSource, /readOnlyProjection:\s*true/);
  assert.match(clientSource, /clientAuthorityFieldsSent:\s*false/);
  assert.match(clientSource, /fastTravelUsesProtectedEntry:\s*true/);
  assert.doesNotMatch(clientSource, /learner_id|organization_id|next_action|district_pulse|eligibility/);
});

test("MET-11 city shell renders briefing, next action, pulse, events, fast travel, minimap and building preview", () => {
  for (const token of ["<MetaverseDailyBriefing", "<MetaverseNextAction", "<MetaverseDistrictPulse", "<MetaverseCityEvents", "<MetaverseFastTravel", "<MetaverseMiniMap", "<MetaverseBuildingPreview"]) {
    assert.match(pageSource, new RegExp(token.replace("<", "\\<")));
  }
  assert.match(pageSource, /getCityOrchestration\(\)/);
  assert.match(pageSource, /fastTravelApi/);
});

test("MET-11 Daily City Briefing renders only provided source-backed sections", () => {
  assert.match(briefingSource, /briefing\?\.sections/);
  assert.match(briefingSource, /source_type/);
  assert.doesNotMatch(briefingSource, /const .*=\s*\[/);
  assert.doesNotMatch(briefingSource, /motivational|streak|fake/i);
});

test("MET-11 Next Action renders required state distinctly and remains server-driven", () => {
  assert.match(nextSource, /data-required/);
  assert.match(nextSource, /action\.is_required/);
  assert.match(nextSource, /action\.reason/);
  assert.doesNotMatch(nextSource, /useState|localStorage|sessionStorage/);
});

test("MET-11 optional Side Mission, Program Mission and source labels are displayable without client fabrication", () => {
  assert.match(briefingSource, /City Today/);
  assert.match(briefingSource, /item\.source_type/);
  assert.match(eventsSource, /event\.source/);
  assert.doesNotMatch(eventsSource, /career fair|tournament|showcase/i);
});

test("MET-11 district pulse and opportunity marker path uses real data only", () => {
  assert.match(pulseSource, /pulse\.learner_relevant_count/);
  assert.match(pageSource, /opportunity_markers|district_pulses|getCityOrchestration/);
  assert.doesNotMatch(pulseSource, /Math\.random|placeholder|fake/i);
});

test("MET-11 city event source is shown and no fake event count is rendered", () => {
  assert.match(eventsSource, /event\.source/);
  assert.match(eventsSource, /event\.status/);
  assert.doesNotMatch(eventsSource, /\d+\s+event/i);
});

test("MET-11 building preview respects privacy and does not expose identities", () => {
  assert.match(previewSource, /presence_count/);
  assert.doesNotMatch(previewSource, /participants|studentName|email|identity/i);
  assert.match(pageSource, /selectedBuildingPreview/);
});

test("MET-11 fast travel calls canonical entry and locked destinations do not open", () => {
  assert.match(pageSource, /fastTravelApi\(destination\.destination_id\)/);
  assert.match(pageSource, /!result\?\.can_enter/);
  assert.match(fastTravelSource, /protected_entry_required/);
  assert.match(fastTravelSource, /disabled=\{!destination\.available\}/);
});

test("MET-11 market and Passport remain read-only/supporting, not capability authority", () => {
  assert.match(pageSource, /setMarketOpen\(true\)/);
  assert.match(pageSource, /setPassportOpen\(true\)/);
  assert.match(pageSource, /MetaverseWorkPassport/);
  assert.doesNotMatch(pageSource, /credits.*capability|SHF Credits.*skill/i);
});

test("MET-11 accessibility, mini-map text equivalent, mobile path and reduced motion are present", () => {
  assert.match(miniMapSource, /aria-labelledby/);
  assert.match(miniMapSource, /Text equivalent district activity/);
  assert.match(fastTravelSource, /aria-label="Fast travel destinations"/);
  assert.match(cssSource, /@media \(max-width:\s*620px\)/);
  assert.match(cssSource, /data-reduced-motion="true"/);
  assert.match(cssSource, /\.met-orchestration/);
});
