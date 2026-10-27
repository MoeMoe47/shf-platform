# Purpose & Boundaries — individual requirement review

Generated from `standards/oas/authoring/first-release.json`; source digest `sha256:8830d45169bc0c494ff0d6ac66cf95d358ac5efb69b510b658997d4aaf4abaad`. Edit the source, then run oas:first:generate.

REVIEW ONLY — proposed obligations, no adopted release, no certification or conformance determination. Approval fields refer to authorized OAS content approval; repository technical dispositions are recorded separately in standards/oas/governance/first-release-review.json and do not populate those fields. Candidate version 0.0.0-public-review.2 is reserved for a future reviewed draft, not a published pin.

Approve/reject each ID against its statement checksum and list any required changes. No decision below is prefilled. Decision records require an authorized reviewer and immutable record reference.

## OAS-1-D02 — Purpose & Boundaries

<a id="oas-1-req-0003"></a>
### OAS-1-REQ-0003 — Intended purpose

**CANDIDATE — NOT ADOPTED.**

The provider MUST document the intended goals and use cases of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D02. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Make intended purpose inspectable.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Purpose documentation. Evidence presence does not establish conformance.

Verification notes: Inspect for explicit goals and use cases; a purpose statement does not prove aligned behavior.

Source: `src/pages/oas/OASPurposeBoundariesPage.jsx:141` / IN_PRACTICE / Define the agent's purpose — “Document the intended goals and use cases.”

Review: PENDING — no approval recorded. Questions: Q01.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

<a id="oas-1-req-0004"></a>
### OAS-1-REQ-0004 — Operating boundaries

**CANDIDATE — NOT ADOPTED.**

The provider MUST document the permitted operating scope and excluded actions or uses of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D02. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Make claimed boundaries distinguishable from capability.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Scope specification; Boundary policy. Evidence presence does not establish conformance.

Verification notes: Inspect for both permitted scope and exclusions; documentation is not enforcement.

Source: `src/pages/oas/OASPurposeBoundariesPage.jsx:146` / IN_PRACTICE / Establish boundaries — “Specify what the agent can and cannot do.”

Review: PENDING — no approval recorded. Questions: Q01.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

<a id="oas-1-req-0005"></a>
### OAS-1-REQ-0005 — Purpose and boundary review

**CANDIDATE — NOT ADOPTED.**

The provider MUST record a review of the documented purpose and boundaries when the capabilities, permissions, operating context or intended use of the system version covered by the declaration change.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D02. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Apply the existing evolution/reassessment concept at an observable change trigger.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Change review record. Evidence presence does not establish conformance.

Verification notes: For a sampled in-scope change, inspect a linked review record; no review interval or risk tier is inferred.

Source: `src/pages/oas/OASPurposeBoundariesPage.jsx:151` / IN_PRACTICE / Validate and maintain — “Regularly review purpose and boundaries as the agent evolves.”

Review: PENDING — no approval recorded. Questions: Q01, Q02.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.
