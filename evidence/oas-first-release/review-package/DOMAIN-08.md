# Lifecycle & Accountability — individual requirement review

Generated from `standards/oas/authoring/first-release.json`; source digest `sha256:8830d45169bc0c494ff0d6ac66cf95d358ac5efb69b510b658997d4aaf4abaad`. Edit the source, then run oas:first:generate.

REVIEW ONLY — proposed obligations, no adopted release, no certification or conformance determination. Approval fields refer to authorized OAS content approval; repository technical dispositions are recorded separately in standards/oas/governance/first-release-review.json and do not populate those fields. Candidate version 0.0.0-public-review.2 is reserved for a future reviewed draft, not a published pin.

Approve/reject each ID against its statement checksum and list any required changes. No decision below is prefilled. Decision records require an authorized reviewer and immutable record reference.

## OAS-1-D08 — Lifecycle & Accountability

<a id="oas-1-req-0016"></a>
### OAS-1-REQ-0016 — Version and lifecycle description

**CANDIDATE — NOT ADOPTED.**

The provider MUST record the system version and its provider-defined lifecycle state in the description record covered by the declaration.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D08. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Make the described version and lifecycle claim explicit.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Version record; Lifecycle record. Evidence presence does not establish conformance.

Verification notes: Inspect explicit version/state values; this is a provider lifecycle description, not Registry-issued lifecycle status.

Source: `src/pages/oas/OASControlDomainsPage.jsx:154` / DOMAINS / ordinal 08 — “Covers the full lifecycle from development to decommissioning, including ongoing accountability and impact assessment.”

Review: PENDING — no approval recorded. Questions: Q01, Q09.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

<a id="oas-1-req-0017"></a>
### OAS-1-REQ-0017 — Retirement accountability

**CANDIDATE — NOT ADOPTED.**

The provider MUST identify the role responsible for retiring the described system version and the retirement process in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D08. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Carry lifecycle accountability through decommissioning.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Retirement procedure; Responsibility record. Evidence presence does not establish conformance.

Verification notes: Inspect a role and retirement process; no operational deletion or Registry retirement is performed by this requirement.

Source: `src/pages/oas/OASControlDomainsPage.jsx:154` / DOMAINS / ordinal 08 — “Covers the full lifecycle from development to decommissioning, including ongoing accountability and impact assessment.”

Review: PENDING — no approval recorded. Questions: Q01, Q09.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.
