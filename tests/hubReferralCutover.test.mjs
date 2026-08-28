import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const intake = fs.readFileSync(new URL("../src/pages/hub/IntakeNavigatorConsole.jsx", import.meta.url), "utf8");
const truthAdapter = fs.readFileSync(new URL("../src/shared/truth-spine/truthSpineApi.js", import.meta.url), "utf8");

test("Hub intake uses SHS API and never writes browser Truth on referral creation", () => {
  assert.match(intake, /createBackendReferral\(/);
  assert.match(intake, /from "@\/shared\/truth-spine\/truthSpineApi\.js"/);
  assert.equal(intake.includes('from "@/shared/truth-spine"'), false);
  assert.equal(intake.includes("createTruthSpineReferralFromIntake"), false);
  assert.equal(intake.includes("getTruthSpineSnapshot"), false);
  assert.equal(intake.includes("case_local_"), false);
  assert.equal(intake.includes("Truth Spine fallback"), false);
  assert.equal(intake.includes("verification_status"), false);
  assert.equal(intake.includes("public_approved"), false);
  assert.equal(intake.includes("approved_at"), false);
  assert.match(intake, /reporting_delivery_status/);
  assert.match(intake, /Trusted reporting delivery pending/);
  assert.match(intake, /Referral could not be created/);
});

test("shared Truth adapter remains only while other Hub readers exist", () => {
  assert.match(truthAdapter, /export async function createBackendReferral/);
  const hubReports = fs.readFileSync(new URL("../src/pages/hub/HubReports.jsx", import.meta.url), "utf8");
  assert.match(hubReports, /getTruthSpineSnapshot/);
});
