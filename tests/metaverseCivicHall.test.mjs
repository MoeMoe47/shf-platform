import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const civicSource = readFileSync(new URL("../src/components/metaverse/MetaverseCivicHall.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/metaverse/metaverseCivicClient.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("MET-14 Civic Hall renders from SHF Civic authority inside the metaverse shell", () => {
  assert.match(pageSource, /MetaverseCivicHall/);
  assert.match(pageSource, /Civic Hall/);
  assert.match(clientSource, /authority:\s*"SHF_CIVIC"/);
  assert.match(clientSource, /civicSureAuthority:\s*false/);
  assert.doesNotMatch(civicSource, /CivicSure.*authority/i);
});

test("MET-14 office directory, representation, course state, projects, operations, and missions render", () => {
  for (const text of ["Offices", "Representation", "Course", "City Projects & Operations", "My Civic Status"]) {
    assert.match(civicSource, new RegExp(text));
  }
  assert.match(civicSource, /cityOperations/);
  assert.match(civicSource, /course\?\.enrolled/);
});

test("MET-14 candidate profiles are neutral and never ranked or favored", () => {
  assert.match(civicSource, /Neutral alphabetical presentation/);
  assert.match(civicSource, /No ranking, favored indicator, prediction, or paid boost/);
  assert.doesNotMatch(civicSource, /best candidate|recommended candidate|favored candidate|momentum|likely winner|score/i);
  assert.match(clientSource, /sendsCandidateRanking:\s*false/);
  assert.match(clientSource, /sendsCampaignBoostPayment:\s*false/);
});

test("MET-14 candidacy form, proposal form, public comment, and no contact leaks are present", () => {
  assert.match(civicSource, /Candidate Filing/);
  assert.match(civicSource, /Submit candidacy/);
  assert.match(civicSource, /Submit city proposal/);
  assert.match(civicSource, /Written public comment/);
  assert.match(civicSource, /No contact information is shown/);
  assert.doesNotMatch(civicSource, /email|phone|address/i);
});

test("MET-14 ballot is keyboard and screen-reader accessible and only displays approved server candidates", () => {
  assert.match(civicSource, /<fieldset>/);
  assert.match(civicSource, /<legend>/);
  assert.match(civicSource, /type="radio"/);
  assert.match(civicSource, /aria-describedby="met-civic-ballot-privacy"/);
  assert.match(civicSource, /ballot\.candidates\.map/);
  assert.match(civicSource, /Ballot choices are private/);
});

test("MET-14 vote confirmation and certified results are aggregate/private", () => {
  assert.match(civicSource, /Your vote choice is not displayed in public views/);
  assert.match(civicSource, /certified results are aggregate only/i);
  assert.doesNotMatch(civicSource, /publicChoiceExposure:\s*true|individual vote choice/i);
});

test("MET-14 council vote controls are office-holder gated and public-comment accessible", () => {
  assert.match(civicSource, /Only active office holders receive council vote controls/);
  assert.match(civicSource, /disabled title=/);
  assert.match(civicSource, /Written alternatives are available/);
  assert.match(civicSource, /viewpoint-neutral/);
});

test("MET-14 SHF Credits cannot boost campaigns and partisan recommendation UI is absent", () => {
  assert.match(civicSource, /SHF Credits cannot buy office, votes, eligibility, or campaign visibility/);
  assert.doesNotMatch(civicSource, /party|partisan|ideology|donor|fundraising|endorsement|recommend.*candidate/i);
});

test("MET-14 mobile layout and non-spatial access exist", () => {
  assert.match(css, /met-civic/);
  assert.match(css, /@media \(max-width:\s*620px\)/);
  assert.match(css, /bottom:\s*0/);
  assert.match(civicSource, /textarea aria-label/);
});
