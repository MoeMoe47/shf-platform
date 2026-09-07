# SHU Universal Reporting U5 — Program-Specific Reporting Profiles

## Executive Result

U5 adds trusted, server-side program report profiles above the existing U1-U4 Shared Reporting contract. Profiles customize presentation and policy within an already-authorized product projection; they do not create facts, metrics, evidence, permissions, completion state, credentials, or publication approval.

## Architecture

The flow remains:

`Product Authority -> Authorized Product Projection -> Program Profile Resolution -> Program-Specific Presentation Projection -> Shared Reporting -> Immutable Artifact`

The canonical artifact, snapshot, renderer, storage, history, classification, retrieval, and Public Disclosure authorities remain in `apps/shs-api/src/domain/reporting/`.

## ProgramReportProfile Contract

`program-report-profile-registry.ts` defines the trusted contract. A profile contains a stable key, product binding, canonical program or project-type references, allowed report families, terminology, registered sections and order, allowed canonical metric keys, evidence types, audience labels, branding/methodology/disclosure keys, filename prefix, publication eligibility mode, status, and version.

Only checked-in definitions are accepted. The request may select a registered profile key, but cannot submit sections, formulas, metrics, evidence types, HTML, CSS, template keys, renderer keys, or publication state.

## Registry and Resolution

`ProgramReportProfileRegistry` resolves exact `profileKey + productKey + reportFamily + version` combinations and fails closed for unknown, inactive, mismatched, or disallowed combinations. When no explicit profile is supplied, it matches only trusted canonical program references or canonical Studio project types from the authorized projection request.

The generic fallback rule is explicit: a registered profile is automatically applied when its canonical subject binding matches. It is never silently replaced with a generic product presentation. Unmatched subjects receive no profile; they do not receive an invented profile.

## Registered Profiles

### Data Center & AI Infrastructure Pathway

`foundation.data-center-ai-infrastructure-pathway` binds to the existing curriculum/career references `data-center-specialization-11` and `data-center-specialization-12`. It emphasizes pathway progress, technical projects, credentials, employer exposure, career outcomes, evidence, and workforce-outcome limitations. No wage, placement, retention, or partner fact is fabricated.

### Summer STEM Community Program

`foundation.summer-stem-community` binds to the seeded canonical Foundation program `program_seed_001` (`Summer STEM Camp`). It emphasizes participation and reach, community impact, community projects, and evidence, with distinct community terminology and branding.

### Studio AI Agent Project

`studio.ai-agent-project` binds to the canonical Studio project type `AI_AGENT`. It emphasizes build packet/workspace, QA, human review, delivery assurance, and build evidence.

OAS education and BOS package profiles are deferred because the repository does not expose independent canonical program/package authorities for those identities. No invented OAS or BOS program binding is registered.

## Sections and Ordering

Profiles select only registered section IDs, including overview, participation, learning progress, assessments, credentials, projects, career outcomes, employer engagement, funding, community impact, QA, review, assurance, controls, exceptions, evidence, methodology, disclosures, and appendix. Required sections must occur in the trusted order. Optional sections are omitted when canonical rows are unavailable; methodology and disclosure sections may render a bounded empty notice.

## Terminology, Metrics, Evidence, and Audience

Terminology changes display labels only. Canonical storage names remain unchanged. Metric policy lists canonical metric keys; profiles do not contain formulas. Evidence policy lists approved evidence categories; profiles cannot inject references. Audience labels affect presentation only and cannot widen authorization, organization, tenant, learner, participant, project, client, or evidence scope.

## Branding, Methodology, and Disclosures

Branding keys, filename prefixes, methodology keys, and disclosure keys are trusted identifiers resolved by the report system. They do not accept caller CSS, HTML, JavaScript, remote assets, or renderer identifiers. Publication eligibility is descriptive only. `PUBLIC` classification remains distinct from publication approval.

## Snapshot, History, and Filename Metadata

Profile identity is carried in the generated payload and immutable snapshot metadata as `profileKey`, `profileVersion`, canonical program references, branding key, filename prefix, and allowed families. Rendered filenames use the trusted profile prefix through the existing safe filename helper. The existing product/family/artifact/snapshot/rendered-file relationships remain authoritative; no migration 108 was added.

Profile changes create a new profile version and new artifacts. Existing snapshots retain the prior profile identity and cannot be regenerated from live data into the old artifact.

## Security and Authority Boundaries

The product adapter remains responsible for domain authorization, scope, redaction, classification, canonical references, and provenance. Profiles can narrow presentation but cannot expand access. Existing renderer security, safe storage, hashes, classification markings, tenant isolation, Public Disclosure separation, and audit events remain in force.

No profile can modify Foundation, Curriculum, Career, Studio, BOS, OAS, Metric, Evidence, Truth, Credential, or publication authorities.

## Material Difference Proof

The Data Center pathway and Summer STEM profiles differ in section set and ordering, terminology, branding, methodology/disclosure identifiers, metric policy, evidence policy, and filename prefix. The Studio AI Agent profile is structurally distinct again through QA, review, assurance, workspace, and build-evidence sections.

## U6 Certificate Boundary

`ProgramReportProfile` is not `ProgramCertificateProfile`. U6 may reuse governed references such as canonical program ID, display name, approved logo, issuer identity, branding key, and terminology. Certificate eligibility, issuance, immutable certificate records, verification, delivery, and revocation remain certificate-authority responsibilities. Reporting never awards credentials.

## Verification

Focused profile tests cover exact resolution, canonical binding, material presentation differences, untrusted configuration rejection, trusted filename metadata, profile version identity, and unsupported OAS/BOS program-profile deferral. Full report regressions, typecheck, builds, UI validation, diff checks, and migration replay must continue to pass before U5 acceptance.
