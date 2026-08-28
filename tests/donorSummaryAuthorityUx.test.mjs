import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  authorizeDonorSummaryDistribution,
  createDonorSummaryArtifact,
  listApprovedDonorDisclosures,
  listAuthorizedReportRecipients,
} from "../src/shared/reporting/donorSummaryAuthorizationClient.js";

const command = fs.readFileSync(new URL("../src/pages/shf-command/SHFImpactCommandCenter.jsx", import.meta.url), "utf8");
const client = fs.readFileSync(new URL("../src/shared/reporting/donorSummaryAuthorizationClient.js", import.meta.url), "utf8");

function response(body, ok = true, status = 200) {
  return { ok, status, text: async () => JSON.stringify(body) };
}

test("Donor authority client uses only governed endpoints and preserves exact selections", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith("/compositions/donor-summary/artifacts")) return response({ data: { artifact_id: "artifact-1", artifact_version: 1 } }, true, 201);
    if (url.endsWith("/distribution-recipients")) return response({ data: { items: [{ recipient_authorization_id: "r1", status: "AUTHORIZED" }, { recipient_authorization_id: "r2", status: "REVOKED" }] } });
    if (url.endsWith("/disclosure-decisions")) return response({ data: { items: [{ disclosure_decision_id: "d1", artifact_id: "artifact-1", artifact_version: 1, decision: "APPROVED" }, { disclosure_decision_id: "d2", artifact_id: "artifact-1", artifact_version: 1, decision: "BLOCKED" }, { disclosure_decision_id: "d3", artifact_id: "artifact-1", artifact_version: 2, decision: "APPROVED" }] } });
    return response({ data: { distribution_id: "distribution-1", status: "AUTHORIZED_FOR_DISTRIBUTION" } }, true, 201);
  };

  const artifact = await createDonorSummaryArtifact("generation-1", { fetchImpl });
  const recipients = await listAuthorizedReportRecipients({ fetchImpl });
  const disclosures = await listApprovedDonorDisclosures("artifact-1", 1, { fetchImpl });
  const result = await authorizeDonorSummaryDistribution("artifact-1", { artifact_version: 1, recipient_authorization_id: "r1", disclosure_decision_id: "d1", idempotency_key: "authorization-1" }, { fetchImpl });

  assert.equal(artifact.artifact_id, "artifact-1");
  assert.deepEqual(recipients.map((item) => item.recipient_authorization_id), ["r1"]);
  assert.deepEqual(disclosures.map((item) => item.disclosure_decision_id), ["d1"]);
  assert.equal(result.status, "AUTHORIZED_FOR_DISTRIBUTION");
  assert.equal(calls[0].options.credentials, "include");
  assert.equal(JSON.stringify(calls).includes("tenant_id"), false);
  assert.equal(JSON.stringify(calls).includes("organization_id"), false);
});

test("authority UX is bounded and does not expose delivery or unsupported semantics", () => {
  assert.match(command, /donorSummary/);
  assert.match(command, /Generate Restricted Donor Summary/);
  assert.match(command, /Authorize for Distribution/);
  assert.match(command, /AUTHORIZED_FOR_DISTRIBUTION/);
  assert.match(command, /Historical verified employment starts/);
  assert.doesNotMatch(command, /Donor Summary[\s\S]{0,500}(Sent|Delivered|Shared|Distributed|Published)/);
  assert.doesNotMatch(client, /localStorage|Truth|Evidence|participant_ref|employer_ref/);
  assert.doesNotMatch(client, /public_approved|PUBLIC/);
});
