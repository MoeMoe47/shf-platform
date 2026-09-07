# SHU Universal Reporting + Credential Final Design Lock

## Status

This document locks the Universal Reporting and educational credential architecture after U7 authority recheck. The current implementation is accepted for the canonical authorities present in the repository. Legal reporting and cross-product reporting remain intentionally deferred until their runtime authorities exist.

## Locked Reporting Architecture

Product or domain authority -> authorized projection adapter -> optional `ProgramReportProfile` -> Shared Reporting -> immutable snapshot -> versioned template -> HTML/PDF/JSON/print -> durable artifact -> history/retrieval. Public Disclosure and publication remain separate authorities.

Shared Reporting owns the report registry, renderer, snapshots, hashes, storage namespace, filenames, history, classification enforcement, retrieval, and universal document mechanics. It does not query product tables directly or create domain facts.

## Locked Credential Architecture

Canonical completion facts -> certificate eligibility -> Credential Authority -> immutable certificate record -> trusted `ProgramCertificateProfile` -> certificate renderer -> PDF/download/print/email -> QR/verification. Completion, rendering, delivery, QR, and reporting cannot issue credentials.

Credential records are distinct from report artifacts. Issued records retain the certificate profile version, template version, issuer, issue date, verification reference, completion/qualification reference, and integrity hashes. Re-rendering and delivery retries reuse the same certificate identity.

## Locked Program Completion Architecture

Educational Program Authority -> versioned `ProgramCompletionDefinition` -> registered canonical requirement evaluators -> `ProgramCompletionService` -> durable program completion record -> certificate eligibility. Completion definitions belong to the Programs/Curriculum authority boundary, not Reporting or Credentials.

Definitions are trusted, program-bound, versioned, lifecycle-managed, hash-protected, and fail closed when no active definition exists. Historical completions retain their definition version and evidence provenance.

## Registries and Extension Rules

The product registry and report template registry are the sole report-family registration points. The ProgramReportProfile registry is the sole trusted program-report presentation configuration point. The ProgramCertificateProfile registry is the sole trusted certificate presentation configuration point. The completion-definition authority is the sole source of completion requirements.

Future extensions may add a registered adapter, report family, program profile, certificate profile, or completion definition only when backed by a canonical authority. They must reuse the shared renderer, artifact storage, hashes, history, classification, authorization, and publication boundaries.

## Product Scope

CivicSure, Studio, OAS, Foundation/Curriculum/Career, BOS/AI Governance, Registry, and Solutions retain their current adapters and supported families. Registry remains separate from OAS and Trust Bureau. Solutions remains separate from Foundation and BOS authorities. Program-specific reports remain profile-driven and cannot silently fall back to generic product reports when a registered profile applies.

Legal reporting is locked as deferred: `LEGAL REPORTING DEFERRED — CANONICAL LEGAL RUNTIME AUTHORITY REQUIRED`. Documentation, legal names, generic evidence fields, and hold references do not constitute Legal authority. Future Legal reporting requires canonical legal artifacts, decisions/obligations, privilege/confidentiality, retention, hold, authorization, and scoped projection services.

Cross-product reporting is locked as deferred: `CROSS-PRODUCT REPORTING DEFERRED — CANONICAL COMPOSITION AUTHORITY REQUIRED`. Independent adapters and relationship/provenance primitives are not enough. Future composition requires trusted definitions, independent source authorization, subject-link authority, period reconciliation, classification reconciliation, duplicate-fact identity, and provenance preservation.

## Security, Privacy, and Accessibility

Profiles may narrow and present authorized data but never widen product, organization, tenant, learner, participant, project, client, evidence, metric, completion, or publication authority. Arbitrary HTML, CSS, JavaScript, SQL, formulas, renderer identifiers, QR targets, issuers, recipients, and evidence are rejected. Sensitive prompts, credentials, secrets, learner records, assessment responses, accommodation data, guardian data, and internal notes remain excluded from public or unauthorized projections.

Classification is source-controlled and cannot be downgraded by callers. PUBLIC classification is not publication. Report and certificate views retain semantic headings, readable contrast, text verification alternatives, keyboard-accessible actions, safe pagination, and print-safe layouts.

## Design Lock Rules

1. Do not create a second Reporting, Credential, Program Completion, Registry, Solutions, or Public Disclosure authority.
2. Do not add Legal or cross-product families from documentation-only or primitive-only support.
3. Do not bypass canonical completion for program certificates.
4. Do not let profiles create facts, requirements, evidence, credentials, permissions, or publication decisions.
5. Do not make PUBLIC equal publication.
6. Do not infer equivalence among OAS, Registry, Trust Bureau, assurance, or legal concepts.
7. Keep migration changes bounded to the owning authority; do not add product-specific payload columns to Shared Reporting.
8. Future visual changes belong in versioned templates or profiles, not authority rearchitecture.

## Deferred Configuration and Deployment

Programs without an active completion definition are `PROGRAM_CONFIGURATION_REQUIRED`, not platform defects. Verified competency credential issuance remains a future feature unless a separate canonical authority is added. Production email provider credentials remain `DEPLOYMENT_CONFIGURATION_REQUIRED`; the governed provider abstraction and safe test transport are accepted.

## Checkpoint Guidance

Create a scoped checkpoint containing only the final design-lock documents and any intentionally related implementation changes. Preserve unrelated dirty owner work. A clean checkpoint should be reviewed with `git diff --check`, the focused regression suite, migration replay through 110, API/UI builds, and the current branch/head recorded in its message or release notes.
