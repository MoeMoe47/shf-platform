# SHU Universal Reporting U3: Foundation, Curriculum, and Career

## Status

U3 extends the U1 contract and U2 adapter pattern without adding a second report engine or a migration. The canonical Reporting authority remains `apps/shs-api/src/domain/reporting/`.

## Product-key decision

Curriculum and Career are represented as report-family owners beneath the existing `foundation` product key. Their families use `curriculum-` and `career-` prefixes, while trusted presentation metadata and filenames distinguish Curriculum and Career. This matches the current SHU product architecture and avoids inventing first-class durable products or migration 108.

## Architecture

Foundation-owned authorities produce an authorized projection. The adapter supplies an immutable U1 envelope to Shared Reporting, which owns the artifact, snapshot, template resolution, HTML/PDF/JSON rendering, hash, storage, history, and scoped retrieval.

The implementation is `foundation-curriculum-career-report-adapter.ts`. It validates organization and tenant scope, validates subjects, applies learner and cohort access checks, emits canonical references, and builds a deterministic presentation model. Shared Reporting does not query Foundation, Curriculum, or Career tables independently.

## Registered families

Foundation families are `program-impact`, `grant-funder`, `cohort-outcome`, and `community-impact`.

Curriculum families are `curriculum-student-progress`, `curriculum-course-completion`, `curriculum-assessment-evidence`, `curriculum-instructor-class`, and `curriculum-cohort-learning`.

Career families are `career-readiness`, `career-skill-profile`, `career-credential-evidence`, `career-pathway-outcome`, and `career-employer-partner-outcome`.

All active definitions support JSON, HTML, and PDF through the U1 shared renderer and use the `PUBLIC_DISCLOSURE_SEPARATE` policy.

## Authority and privacy boundaries

Foundation projections use organization-owned programs, grants, allocations, cohorts, enrollments, impact/truth projections, and verified workforce outcomes where applicable. Curriculum projections use catalog, completion, enrollment, evidence, Truth, and competency-decision authorities. Career projections use career taxonomy, program-career links, credentials, career events, and verified workforce outcomes.

Reports do not issue credentials, change assessment results, mark lessons complete, create placements, alter Truth or Metric records, or publish artifacts. Credential, Evidence, Truth, Metric, Public Disclosure, and domain lifecycle authorities remain separate.

Learner reports are limited to the learner, an authorized admin tier, or an instructor with active cohort scope. Cohort and class reports emit aggregate values only and do not emit learner rows. Disability/accommodation data, raw assessment responses, instructor notes, protected profile data, and restricted investigative content are not queried by the adapter. No new minimum-cell threshold is invented; public or funder release still requires the applicable publication policy and safe aggregation authority.

Career readiness is reported as `Not scored` because no canonical readiness score exists. Skills are reported only from demonstrated competency decisions. Employer/partner reports are aggregate and omit individual learner records. Missing lineage or causal evidence is stated as missing rather than inferred.

## Templates, branding, and files

The fourteen definitions use the U1 `shu-universal-r1` renderer and product-scoped storage. Foundation, Curriculum, and Career use trusted brand metadata and report-family titles; they do not inherit CivicSure or OAS visual claims. The filename prefix is trusted template metadata (`Foundation`, `Curriculum`, or `Career`) and all segments remain sanitized and bounded.

HTML and PDF are derived from the same immutable presentation model. Existing R1/R2/R3, Studio, and OAS artifacts remain compatible. History and rendered-file metadata retain product key, family, classification, template, renderer, format, and hash.

## Public Disclosure

`PUBLIC` classification is not publication approval. U3 generation creates a private governed artifact only. Foundation public impact, learner, career, and employer outputs require the existing Public Disclosure and product publication authorities.

## Validation and migration

U3 uses migration 107 and adds no migration 108. Validation must include U1/U2/CivicSure regressions, U3 registry and adapter tests, typecheck, API/root builds, UI validation, diff check, and migration replay through 107. No AI-generated official facts or narrative are introduced.

## U4 readiness

The next bounded adapters are BOS and AI Governance. They require canonical projections for operating reviews, workflow/control status, release assurance, agent sessions, tool/MCP access, policy enforcement, and security events. Secrets, prompts, restricted content, and security evidence require product-specific redaction before projection. U4 should reuse the same adapter, template, renderer, storage, history, and publication boundaries.
