import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { requirementsForProgram } from "../src/domain/programs/model/program-completion-policy.ts";
import { certificateHtml, renderCertificate } from "../src/domain/credentials/service/certificate-renderer.ts";

test("U6A binds Data Center completion to trusted requirements and refuses unsupported programs", () => {
  const definition = requirementsForProgram("data-center-specialization-11", "technical-operations");
  assert.equal(definition?.version, "grade12-entry-v1:technical-operations");
  assert.equal(definition?.requirements.length, 3);
  assert.equal(requirementsForProgram("program_seed_001", null), null);
});

test("U6A certificate presentation contains a local verification QR and safe text fallback", async () => {
  const presentation = { learnerDisplayName: "Learner", certificateTitle: "Completion", programName: "Program", issuer: "Issuer", accomplishment: "Completed", issuedAt: "2026-09-07", certificateReference: "REF-1", competencies: [], status: "ISSUED", verificationReference: "shs-cert-reference", profileKey: "foundation.data-center-ai-infrastructure-pathway", profileVersion: "1.0", verificationUrl: "https://verify.example/certificates/verify/shs-cert-reference" };
  const html = certificateHtml(presentation);
  assert.match(html, /shs-cert-reference/);
  assert.doesNotMatch(html, /Learner@example|student_id|assessment/);
  const rendered = await renderCertificate(presentation, "HTML");
  assert.match(rendered.bytes.toString("utf8"), /<svg/);
  assert.equal(rendered.hash.length, 64);
});

test("U6A migration owns completion persistence without changing Reporting tables", async () => {
  const migration = await readFile(new URL("../migrations/109_program_completion_authority.sql", import.meta.url), "utf8");
  assert.match(migration, /program_completion_records/);
  assert.match(migration, /requirements_version/);
  assert.doesNotMatch(migration, /issued_certificates|report_artifacts|report_payload_snapshots/);
});
