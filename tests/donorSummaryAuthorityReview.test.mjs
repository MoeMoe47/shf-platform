import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const command = fs.readFileSync(new URL("../src/pages/shf-command/SHFImpactCommandCenter.jsx", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../docs/SHF_REPORTS_BRIEFINGS_COMPOSITION_CONTRACT.md", import.meta.url), "utf8");

test("Donor Summary uses the bounded authority UX and fails closed", () => {
  assert.match(command, /donorSummary: true/);
  assert.match(command, /Generate Restricted Donor Summary/);
  assert.match(command, /Authorize for Distribution/);
  assert.match(command, /Unavailable/);
  assert.match(contract, /Donor Summary \| `RESTRICTED_EXTERNAL_CANONICAL`/);
  assert.match(contract, /recipient, disclosure, and authorization remain separate/i);
});

test("authenticated access, generation, export, distribution, and publication remain distinct", () => {
  assert.match(command, /onExportClick/);
  assert.match(command, /Send to leadership/);
  assert.doesNotMatch(command, /donorPermission|authorizedDonor|publicDonor/);
  assert.match(contract, /Donor Summary.*RESTRICTED_EXTERNAL/s);
  assert.match(contract, /Public Impact Snapshot \| `PUBLIC_APPROVAL_REQUIRED`/);
  assert.match(contract, /small-n threshold/);
});

test("workforce report remains historical and aggregate-only for any future donor review", () => {
  assert.match(contract, /historical count of distinct canonical employment-start/);
  assert.match(contract.replace(/\s+/g, " "), /not a placement rate, current employment count, retention, wage, transfer, settlement, ROI, impact/);
  assert.match(contract.replace(/\s+/g, " "), /No participant PII, employer details, verification artifacts/);
  assert.match(contract, /Unavailable/);
});
