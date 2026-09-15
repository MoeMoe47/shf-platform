import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const controlsSource = readFileSync(new URL("../src/components/metaverse/MetaverseCameraControls.jsx", import.meta.url), "utf8");
const passportSource = readFileSync(new URL("../src/components/metaverse/MetaverseWorkPassport.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/metaverse/metaversePassportClient.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("MET-10 Work Passport client is read-only and sends no learner/source authority fields", () => {
  assert.match(clientSource, /\/metaverse\/passport\/me/);
  assert.match(clientSource, /credentials: "include"/);
  assert.match(clientSource, /readOnlyProjection:\s*true/);
  assert.match(clientSource, /clientAuthorityFieldsSent:\s*false/);
  assert.doesNotMatch(clientSource, /method:\s*"POST"/);
  assert.doesNotMatch(clientSource, /learner_user_id\s*:/);
  assert.doesNotMatch(clientSource, /verification_level\s*:/);
});

test("MET-10 city shell fetches and opens Work Passport from the metaverse controls", () => {
  assert.match(pageSource, /getMyWorkPassport\(\)/);
  assert.match(pageSource, /<MetaverseWorkPassport/);
  assert.match(controlsSource, /Work Passport/);
  assert.match(controlsSource, /passportClaimCount/);
});

test("MET-10 UI renders only provided claims and labels verification levels with non-color text", () => {
  assert.match(passportSource, /passport\?\.claims \|\| \[\]/);
  assert.match(passportSource, /Verified/);
  assert.match(passportSource, /Source Confirmed/);
  assert.match(passportSource, /Evidence Candidate/);
  assert.match(passportSource, /Practice Signal/);
  assert.doesNotMatch(passportSource, /const claims = \[/);
});

test("MET-10 UI keeps SHF Credits, reputation and market activity separate from capability", () => {
  assert.match(passportSource, /SHF Credits, Arcade practice, mission completion, opportunity awards, and market fulfillment are not displayed as verified skills/);
  assert.match(passportSource, /Reliability Facts/);
  assert.doesNotMatch(passportSource, /global student ranking/i);
  assert.doesNotMatch(passportSource, /leaderboard/i);
});

test("MET-10 UI supports Program Mission, Side Mission, Opportunity, Arcade, credential and career sections honestly", () => {
  assert.match(passportSource, /MISSIONS & PROGRAMS/);
  assert.match(passportSource, /OPPORTUNITIES/);
  assert.match(passportSource, /ARCADE PRACTICE/);
  assert.match(passportSource, /CREDENTIAL/);
  assert.match(passportSource, /CAREER CONNECTIONS/);
  assert.match(passportSource, /does not directly verify a capability|not displayed as verified skills/);
});

test("MET-10 source details, credential/evidence trace and graph list equivalent are keyboard and screen-reader accessible", () => {
  assert.match(passportSource, /Inspect source/);
  assert.match(passportSource, /aria-expanded/);
  assert.match(passportSource, /aria-controls/);
  assert.match(passportSource, /Source/);
  assert.match(passportSource, /Verification/);
  assert.match(passportSource, /Capability graph list equivalent/);
  assert.match(passportSource, /aria-hidden="true"/);
  assert.doesNotMatch(passportSource, /<div[^>]*onClick=/);
});

test("MET-10 CSS provides mobile path and visible focus-ready panel classes", () => {
  assert.match(cssSource, /\.met-passport\s*\{/);
  assert.match(cssSource, /\.met-passport\.is-open/);
  assert.match(cssSource, /\.met-passport__trust--evidence_candidate/);
  assert.match(cssSource, /\.met-passport/);
  assert.match(cssSource, /max-width: 620px/);
  assert.match(cssSource, /\.met-passport\s*\{/);
});
