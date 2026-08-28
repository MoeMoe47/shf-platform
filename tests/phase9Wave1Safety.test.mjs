import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");

test("SHS reports do not silently expose seed records", () => {
  const source = read("src/data/shsReports/shsReportStorage.js");
  assert.match(source, /return \[\];/);
  assert.doesNotMatch(source, /return \[\.\.\.shsReportSeedRecords\]/);
  assert.doesNotMatch(read("src/pages/admin/reports/shsPremiumReportData.js"), /shsReportSeedRecords/);
  assert.match(read("src/pages/admin/reports/ShsPremiumReportPreviewPage.jsx"), /\?\.reportId \|\| ""/);
});

test("simulation surfaces identify estimates as noncanonical", () => {
  assert.match(read("src/components/sales/ImpactForecaster.jsx"), /not verified institutional data/i);
  assert.match(read("src/components/sales/FundingCalculator.jsx"), /not verified institutional data/i);
});

test("retained demo surfaces are visibly noncanonical", () => {
  assert.match(read("src/layouts/LordOutcomesLayout.jsx"), /demonstration data/i);
  assert.match(read("src/pages/iep/IEPDashboardPage.jsx"), /demonstration data/i);
  assert.match(read("src/pages/iep-command-v2/IEPCommandCenterV2.jsx"), /demonstration data/i);
});

test("public impact and imported reporting values fail closed", () => {
  assert.match(read("src/pages/shf-command/components/SHFImpactOhioMap.jsx"), /data pending verification/i);
  assert.match(read("src/pages/shf-command/SHFImpactCommandCenter.jsx"), /data pending verification/i);
  assert.match(read("src/pages/hub/HubFilesImports.jsx"), /reporting metrics unavailable/i);
});
