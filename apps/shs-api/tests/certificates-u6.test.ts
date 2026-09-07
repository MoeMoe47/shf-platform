import assert from "node:assert/strict";
import test from "node:test";
import { programCertificateProfileRegistry } from "../src/domain/credentials/model/certificate-profile.ts";
import { certificateHtml } from "../src/domain/credentials/service/certificate-renderer.ts";

test("U6 certificate profiles are trusted and resolve exactly", () => {
  const profile = programCertificateProfileRegistry.resolve("foundation.course-completion", "course-1", "COURSE_COMPLETION", "1.0");
  assert.equal(profile.templateKey, "foundation-course-certificate");
  assert.throws(() => programCertificateProfileRegistry.resolve("foundation.data-center-ai-infrastructure-pathway", "course-1", "PROGRAM_COMPLETION"), /CERTIFICATE_PROFILE_PROGRAM_MISMATCH/);
  assert.throws(() => programCertificateProfileRegistry.resolve("unknown", "course-1", "COURSE_COMPLETION"), /CERTIFICATE_PROFILE_NOT_FOUND/);
  assert.throws(() => programCertificateProfileRegistry.resolveForRequest({ profileKey: profile.profileKey, canonicalProgramReference: "course-1", certificateType: "COURSE_COMPLETION", profileVersion: "1.0", productKey: "oas" }), /CERTIFICATE_PROFILE_PRODUCT_MISMATCH/);
  assert.throws(() => programCertificateProfileRegistry.resolveForRequest({ profileKey: profile.profileKey, canonicalProgramReference: "course-1", certificateType: "COURSE_COMPLETION" }), /CERTIFICATE_PROFILE_VERSION_REQUIRED/);
  assert.throws(() => programCertificateProfileRegistry.assertTrustedInput({ profileKey: profile.profileKey, certificateTitle: "Injected" }), /CERTIFICATE_PROFILE_UNTRUSTED_CONFIGURATION/);
});

test("U6 certificate presentation is escaped and contains text verification", () => {
  const html = certificateHtml({ learnerDisplayName: "A <Learner>", certificateTitle: "Course Completion", programName: "Course", issuer: "SHF", accomplishment: "Completed", issuedAt: "2026-09-07", certificateReference: "SHF-1", competencies: ["Skill"], status: "ISSUED", verificationReference: "shs-cert-abc", profileKey: "foundation.course-completion", profileVersion: "1.0" });
  assert.match(html, /A &lt;Learner&gt;/);
  assert.match(html, /shs-cert-abc/);
  assert.doesNotMatch(html, /<script/i);
});
