# OAS source discovery — before implementation

Discovery date: 2026-10-26. Source baseline: `efe541e5174b65d2da371db1951ed6d8bcdbf691`.

## Repository and working state

Actual OAS host repository: `/Users/mikeslate/Projects/shrv1` (confirmed by git rev-parse).
Remote: `git@github.com:MoeMoe47/shf-platform.git` (origin, fetch/push).
Original branch: `feature/autonomous-registry-phase1`. This is a shared ecosystem repository, not a separate OAS repository. The source checkout has substantial unrelated tracked and untracked work. No diffs affect the inspected OAS pages or reporting adapter. Implementation uses an isolated worktree `/private/tmp/oas-canonical-catalog`, branch `feature/oas-canonical-catalog`, from the committed baseline. Unrelated working changes are excluded.

## Actual application and routes

Vite/React multi-page app, root package.json and vite.config.js. `/oas.html` → `src/entries/oas.main.jsx` → `src/pages/oas/OASLandingPage.jsx` is the current OAS entry. Additional real entries: `/oas-1.html`, `/oas-control-domains.html`, `/oas-purpose-boundaries.html`, `/oas-risk-classification.html`, each with a corresponding src/entries module and OAS page. No production hostname is established by these sources; route paths are not host authority.

## Models and versions

Public data is embedded in JSX: OAS1Page DOMAINS/QUICK_FACTS/TOC_FULL; OASControlDomainsPage DOMAINS; OASLandingPage FOUNDATIONS; OASPurposeBoundariesPage SECTION_NAV/WHY_IT_MATTERS/IN_PRACTICE; OASRiskClassificationPage LEVELS/MATRIX_ROWS/MATRIX_COLUMNS. Shared footer and unavailable actions are in oasShared.jsx.

Observed standard identifier: `OAS-1`. QUICK_FACTS says `OAS-1 (Working Draft)` and `Public Review`; page comments explicitly say Public Working Draft. Publication artwork alt text mentions Version 1.0, but does not establish a released version. No immutable release index, canonical profile catalog, individually identified normative requirements, declaration schema or conformance authority was found in inspected source. Full Specification, PDF, JSON and Version History are unavailable/planned. OAS1Page expressly says the page is an overview and the unavailable specification contains normative requirements. Do not promote overview or matrix guidance into adopted requirements.

## Taxonomy and R-levels

Public eight-domain taxonomy: 01 Identity & Ownership; 02 Purpose & Boundaries; 03 Capabilities & Resources; 04 Permissions & Access; 05 Safety & Prohibited Actions; 06 Human Authority; 07 Validation & Evidence; 08 Lifecycle & Accountability.
Reporting taxonomy in `apps/shs-api/src/domain/reporting/studio-oas-report-adapters.ts`: 01 Identity and Purpose; 02 Autonomy and Agency; 03 Safety and Risk; 04 Transparency and Explainability; 05 Human Oversight; 06 Data and Privacy; 07 Interoperability; 08 Accountability and Governance. Equal ordinals are not semantic equivalence.
R0–R4 are a legitimate descriptive risk-classification concept: Minimal/Informational, Low, Moderate, High, Critical. MATRIX_ROWS has five guidance bands (Purpose & Boundaries, Permissions & Access, Human Oversight, Validation & Evidence, Deployment). Human Oversight is contextual language for Human Authority; Deployment is cross-domain guidance, not a ninth domain. Matrix controls are not certification rules or individual normative requirements.

## Reporting and machine outputs

OasReportProjectionAdapter supports conformance, traceability, testing-evidence for the legacy string OAS-1; all results are NOT_EVALUATED. SHS `/reporting/oas/reports` is tenant/entitlement-scoped product reporting, not an OAS public catalog API. Report JSON/HTML/PDF are projections, not adopted releases. `docs/architecture/SHU_UNIVERSAL_REPORTING_U2_STUDIO_OAS_ADAPTERS.md` confirms no subject/evidence/test authority. No canonical public machine catalog/schema was found. No canonical profile population or declaration authority was found.

## Tests, conventions and checks

Existing focused test: `apps/shs-api/tests/report-u2-studio-oas.test.ts` asserts NOT_EVALUATED and authority boundaries. Root tests use node:test .mjs; API uses TS/tsx. Root includes Ajv 8, ajv-formats, TypeScript and Vite. Schemas exist in contracts and docs; no OAS schema convention exists. Use JSON Schema Draft 2020-12. Root commands: manifests:validate, ui:validate, build, check:registry, check:proposal, check:truth and other ecosystem checks. No root general unit-test/typecheck command is defined. API tsconfig targets NodeNext. CI contracts currently targets Registry UI; add an isolated OAS catalog check, not another Registry catalog.

## Change contract

OAS owns identifiers, versions, domain taxonomy, requirements, profiles, declaration shape and supersession. Create an OAS-only catalog source, strict schemas, deterministic public artifact and validation with source digests. Preserve existing routes, rendering, reporting input/output compatibility, NOT_EVALUATED and institutional separation. No Registry changes, deployment, credentials, scores or normative invention. Empty profiles and requirements explicitly describe missing source authority, not conformance or lack of applicable obligations. Publication of normative requirements and governed release adoption remain separate prerequisites.
