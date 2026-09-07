# SHU Universal Reporting + Credentialing U6

## Decision

U6 extends the existing Credentials authority. It does not create a second credential or Reporting authority. `learner_credentials` remains the existing general credential authority; `issued_certificates` is the bounded authority for educational certificate issuance records, while `certificate_renders` and `certificate_delivery_events` are renditions and delivery history only.

The flow is:

`canonical completion facts -> trusted eligibility evaluator -> authorized issuance -> immutable issued certificate -> profile-bound presentation -> certificate renderer -> PDF/HTML/download/print/email delivery -> minimal verification`

Rendering, downloading, printing, emailing, and verification never issue a certificate.

## Trusted Profiles

`ProgramCertificateProfile` and `ProgramCertificateProfileRegistry` are server-side definitions. Resolution requires profile key, canonical program reference, certificate type, and version. Caller-supplied title, issuer, signer, rule, template, HTML, CSS, QR target, issue date, status, or skills are rejected.

The initial trusted profiles are:

* `foundation.course-completion` for an authorized published Curriculum course.
* `foundation.data-center-ai-infrastructure-pathway` for the canonical pathway reference.
* `foundation.summer-stem-community` for the seeded Foundation program reference.

The latter two are registered designs, but issuance fails closed because the repository does not yet expose an executable canonical program-completion authority. Verified skill credentials are also deferred until a canonical competency issuance authority exists.

## Eligibility and Issuance

Course eligibility reads the immutable published curriculum release and the canonical lesson-completion table, resolves lesson IDs from the release's stable keys, and requires every published lesson to be complete. Missing or unavailable requirements return an explicit blocked/incomplete result. Program completion does not infer from course completion.

Issuance requires `credential.issue`, organization/tenant scope, a learner in that organization, and a confirmed eligible result. A transaction advisory lock plus a qualification uniqueness index prevents duplicate issuance. The issued record stores a presentation snapshot, source/qualification references, profile/template versions, verification reference, serial, status, and content hash.

## Rendering and Delivery

Certificate rendering uses a dedicated certificate presentation contract and reuses the existing Playwright/PDF and SHA-256 infrastructure. It is separate from report-family rendering and separate from the Report Artifact model. Re-rendering creates a rendition, never a new certificate. Downloads verify the stored hash and create a download event. Print is a presentation action; it does not assert physical printing.

The email endpoint resolves the learner's stored email only; recipient overrides are not accepted. Delivery events are recorded. No external mail provider is configured in this repository, so the endpoint records a governed failure rather than pretending delivery occurred. QR encoding is deferred because no existing approved QR architecture is present; the certificate carries a text verification reference suitable for a future QR adapter.

## Verification, Revocation, Replacement

`GET /certificates/verify/:reference` returns only minimal verification facts and never academic records. Revocation is restricted to `credential.revoke`; old PDFs remain historical but verify as revoked. Replacement creates a successor record and marks the original `REPLACED`; it never overwrites issuance history.

## Privacy and Boundaries

Certificates use only necessary learner identity and accomplishment fields. No assessment responses, protected profile data, guardian data, private evidence, or secrets are rendered. Public verification is not learner-record access. Program reports remain `ProgramReportProfile` artifacts and cannot determine eligibility or issue a certificate.

## Migration and U7

Migration `108_educational_certificates_credential_delivery.sql` is bounded to Credential/Certificate authority and preserves Reporting tables. It creates immutable issuance, rendition, and delivery history records. U7 should first re-audit Registry and Solutions compatibility, then determine whether canonical Legal and cross-product composition authorities exist. A future certificate profile may share approved branding and canonical program references with `ProgramReportProfile`, but it must remain a distinct credential authority.
