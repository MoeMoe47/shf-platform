import test from "node:test";
import assert from "node:assert/strict";
import {
  AX3_AUTHORITY_BOUNDARIES,
  REPRESENTATION_TYPES,
  SOURCE_TYPES,
  createRepresentation,
  createSourceContract,
  evaluateTransformation,
  getRepresentationSupport,
  isAccessAtMostAsOpen,
  markSourceChanged,
  projectAccessibleHtml,
  projectPlainText,
  representationReuseKey,
} from "../src/system/accessibility/accessibilityContentEngine.js";

const source = createSourceContract({ sourceType: "CURRICULUM_LESSON", sourceId: "lesson-1", sourceVersion: "7", sourceHash: "hash-7", ownerDomain: "curriculum", organizationId: "org-a", tenantId: "tenant-a", visibility: "AUTHENTICATED", language: "en", mimeType: "application/json" });

test("AX-3 exposes bounded representation, source, status, and validation vocabularies", () => {
  assert.ok(REPRESENTATION_TYPES.includes("ACCESSIBLE_HTML"));
  assert.ok(SOURCE_TYPES.includes("CURRICULUM_LESSON"));
  const representation = createRepresentation({ source, representationType: "ACCESSIBLE_HTML", status: "READY", validationStatus: "AUTOMATED_CHECKED", mimeType: "text/html" });
  assert.equal(representation.source.sourceVersion, "7");
  assert.equal(representation.validationStatus, "AUTOMATED_CHECKED");
  assert.equal(representation.provenance.sourceRef, "CURRICULUM_LESSON:lesson-1");
});

test("source contracts require canonical identity and metadata", () => {
  assert.throws(() => createSourceContract({ sourceType: "HTML", sourceId: "x" }), /requires sourceVersion/);
});

test("eligibility honestly separates supported, partial, external, and future formats", () => {
  assert.deepEqual(getRepresentationSupport("CURRICULUM_LESSON", "ACCESSIBLE_HTML"), { status: "SUPPORTED", eligible: true });
  assert.deepEqual(getRepresentationSupport("CURRICULUM_LESSON", "SIMPLIFIED_READING"), { status: "PARTIAL", eligible: true });
  assert.deepEqual(getRepresentationSupport("CURRICULUM_LESSON", "BRAILLE_READY"), { status: "EXTERNAL_DEPENDENCY", eligible: true });
  assert.deepEqual(getRepresentationSupport("CURRICULUM_LESSON", "EPUB"), { status: "FUTURE_PHASE", eligible: true });
});

test("transformation policy requires source access and provider permission", () => {
  assert.equal(evaluateTransformation({ source, representationType: "ACCESSIBLE_HTML", actor: {} }).reason, "SOURCE_ACCESS_DENIED");
  assert.equal(evaluateTransformation({ source, representationType: "TRANSLATED_TEXT", actor: { canAccessSource: true } }).reason, "EXTERNAL_PROVIDER_REQUIRED");
  assert.equal(evaluateTransformation({ source, representationType: "TRANSLATED_TEXT", provider: "provider", actor: { canAccessSource: true } }).reason, "PROVIDER_POLICY_DENIED");
  assert.equal(evaluateTransformation({ source, representationType: "ACCESSIBLE_HTML", actor: { canAccessSource: true } }).allowed, true);
});

test("derived representation access cannot exceed source access", () => {
  assert.equal(isAccessAtMostAsOpen("PRIVATE", "PUBLIC"), false);
  assert.throws(() => createRepresentation({ source: { ...source, visibility: "PRIVATE" }, representationType: "ACCESSIBLE_HTML", accessPolicy: { visibility: "PUBLIC" } }), /cannot exceed/);
});

test("provenance and reuse key make equivalent requests reusable", () => {
  const key = representationReuseKey({ source, representationType: "PLAIN_TEXT" });
  assert.equal(key, "CURRICULUM_LESSON::lesson-1::7::PLAIN_TEXT::en::ax3-v1");
  assert.equal(createRepresentation({ source, representationType: "PLAIN_TEXT" }).reuseKey, key);
});

test("source changes stale derived representations", () => {
  const representation = createRepresentation({ source, representationType: "ACCESSIBLE_HTML", status: "READY" });
  assert.equal(markSourceChanged(representation, "7").status, "READY");
  assert.equal(markSourceChanged(representation, "8").status, "STALE");
});

test("accessible HTML is structured and escaped, while plain text preserves reading order", () => {
  const content = { title: "Lesson <one>", blocks: [{ type: "heading", text: "Start" }, { type: "list", items: ["One", "<two>"] }, { type: "paragraph", text: "Finish" }] };
  const html = projectAccessibleHtml(content);
  assert.match(html, /aria-labelledby/);
  assert.match(html, /&lt;one&gt;/);
  assert.doesNotMatch(html, /<two>/);
  assert.equal(projectPlainText(content), "Lesson <one>\n\nStart\n\nOne\n\n<two>\n\nFinish");
});

test("AX-3 cannot own source, evidence, truth, accommodation, or lifecycle authority", () => {
  assert.deepEqual(AX3_AUTHORITY_BOUNDARIES.forbiddenWrites, ["Evidence", "Truth", "accommodation", "DGAL lifecycle", "signature", "assessment", "credential", "verification"]);
});
