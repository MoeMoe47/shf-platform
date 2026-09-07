# SHU U6B Program Certificate Live Acceptance

## Result

U6B adds an opt-in disposable acceptance fixture for the canonical Data Center
pathway. The fixture populates the existing specialization assignment, lesson
completion, prepare/prove evidence, and demonstrated competency authorities.
The test invokes `ProgramCompletionService` through the API and does not insert
or update a completion record directly.

Live command:

```text
npm run test:phase8:acceptance:env -- --u6b-certificate-fixture tests/phase8/u6b-program-certificates.spec.mjs
```

The run passed 1/1 against a disposable PostgreSQL database with migrations
001-109 applied and no pending, drift, or unknown migrations.

## Data Center Proof

The canonical program is `data-center-specialization-11`, assigned to the
`technical-operations` specialization. The fixture satisfies the real U6A
policy: five shared-core lessons, three technical-operations lessons, and
three `DEMONSTRATED` competency decisions backed by reviewed prepare/prove
evidence.

The live route produced a `COMPLETED` `program_completion_records` row bound
to the `grade12-entry-v1:technical-operations` requirements version. Repeating
evaluation returned the same completion identity. Eligibility returned
`ELIGIBLE` with `program-completion:<completion-id>`, and the credential route
created one immutable issued certificate. Repeated issuance returned the same
certificate.

The acceptance also verified:

- HTML and PDF rendering, SHA-256 hashes, safe filename, issuer, title, learner display identity, QR SVG, and text verification reference.
- The scoped file download endpoint, MIME type, and PDF bytes.
- Test-transport email delivery with the canonical learner email and rendered attachment hash.
- Privacy-safe public verification without learner email or evidence payload.
- An incomplete learner remains `IN_PROGRESS` and cannot issue.

The render route now returns its persisted render identifier as response
metadata. This only enables acceptance to exercise the existing scoped
download endpoint; it does not change issuance or renderer ownership.

## Second Program Decision

Summer STEM Camp (`program_seed_001`) is an actual seeded program, but the
repository does not currently contain a canonical completion requirements
definition, learner enrollment-to-requirement mapping, completion evaluator,
or program-specific completion facts for it. Its existing reporting and
certificate profile is therefore not sufficient evidence for credential
issuance. U6B does not invent requirements or treat a reporting profile as a
completion authority.

The second-program end-to-end acceptance remains blocked until an actual
educational program completion authority is provided. The existing Data
Center capstone policy is explicitly an entry evaluation, not a completion or
credential authority, so it is not used as a substitute second program.

## Boundary Checks

Program completion remains separate from certificate issuance. Eligibility,
rendering, download, email, QR generation, and Reporting do not create
completion or certificate records. Certificate profiles remain trusted
server-side definitions, and migration 109 remains the latest migration.

Competency credential issuance remains deferred because no separate canonical
verified-competency credential authority was found.

## Verification

The U6B focused live acceptance passed after the existing U6/U6A regressions,
API typecheck/build, root build, UI validation, and diff checks. The complete
U6B acceptance is partial because the repository-backed second program cannot
be proven without adding unsupported domain truth.

## U7 Readiness

Before U7, add or identify canonical completion requirements for a second
educational program, then repeat this same fixture-through-authority path.
Registry and Solutions remain compatibility work; Legal and cross-product
authority remain separate prerequisites.
