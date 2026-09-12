import test from "node:test";
import assert from "node:assert/strict";
import { buildDocumentCenterItems } from "../src/domain/documentation/service/document-center-service.js";

test("Document Center projection keeps required, waiting, complete, and archived items distinct", () => {
  const items = buildDocumentCenterItems({
    guidance: [{ guidanceId: "g1", title: "Upload evidence", category: "REQUIRED_NOW", sourceDomain: "CIVICSURE", actorResponsibility: "YOU" }],
    manualSignatures: [{ manual_signature_id: "m1", verification_status: "UPLOADED", owning_domain: "ONBOARDING" }, { manual_signature_id: "m2", verification_status: "VERIFIED", owning_domain: "ONBOARDING" }],
    documents: [{ document_instance_id: "d1", title: "Old packet", state: "ARCHIVED", owning_domain: "REPORTING", template_version_id: "v1" }],
  });
  assert.equal(items.find((item) => item.id === "guidance:g1")?.status, "Action required");
  assert.equal(items.find((item) => item.id === "manual:m1")?.owner, "AUTHORIZED_VERIFIER");
  assert.equal(items.find((item) => item.id === "manual:m2")?.status, "Complete");
  assert.equal(items.find((item) => item.id === "document:d1")?.status, "Archived");
});

test("Document Center projection does not expose arbitrary external action URLs", () => {
  const item = buildDocumentCenterItems({ guidance: [{ guidanceId: "g1", title: "Unsafe", category: "REQUIRED_NOW", actionTarget: { route: "https://outside.example" } }] })[0];
  assert.equal(item.actionTarget, null);
});

test("Document Center projection uses authorized item routes and preserves historical state", () => {
  const items = buildDocumentCenterItems({
    documents: [{ document_instance_id: "d1", title: "Generated reference", state: "GENERATED", owning_domain: "REPORTING", template_version_id: "v1" }, { document_instance_id: "d2", title: "Old version", state: "SUPERSEDED", owning_domain: "REPORTING", template_version_id: "v0" }],
    packets: [{ packet_instance_id: "p1", title: "Incomplete packet", state: "PARTIAL", owning_domain: "ONBOARDING" }],
    signatures: [{ signature_request_id: "s1", status: "SENT", owning_domain: "ONBOARDING", template_version_id: "v1" }],
  });
  assert.equal(items.find((item) => item.id === "document:d1")?.required, false);
  assert.equal(items.find((item) => item.id === "document:d2")?.status, "Superseded");
  assert.match(items.find((item) => item.id === "document:d1")?.actionTarget.route, /^\/documentation\/items\/document%3Ad1$/);
  assert.equal(items.find((item) => item.id === "packet:p1")?.category, "BLOCKED");
  assert.match(items.find((item) => item.id === "signature:s1")?.actionTarget.route, /^\/documentation\/items\/signature%3As1$/);
});
