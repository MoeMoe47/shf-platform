# Capabilities & Resources — individual requirement review

Generated from `standards/oas/authoring/first-release.json`; source digest `sha256:8830d45169bc0c494ff0d6ac66cf95d358ac5efb69b510b658997d4aaf4abaad`. Edit the source, then run oas:first:generate.

REVIEW ONLY — proposed obligations, no adopted release, no certification or conformance determination. Approval fields refer to authorized OAS content approval; repository technical dispositions are recorded separately in standards/oas/governance/first-release-review.json and do not populate those fields. Candidate version 0.0.0-public-review.2 is reserved for a future reviewed draft, not a published pin.

Approve/reject each ID against its statement checksum and list any required changes. No decision below is prefilled. Decision records require an authorized reviewer and immutable record reference.

## OAS-1-D03 — Capabilities & Resources

<a id="oas-1-req-0006"></a>
### OAS-1-REQ-0006 — Capability inventory

**CANDIDATE — NOT ADOPTED.**

The provider MUST list the capabilities made available within the operating scope of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D03. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Distinguish declared capabilities from purpose and permissions.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Capability manifest. Evidence presence does not establish conformance.

Verification notes: Compare listed capabilities with an independently supplied scoped interface inventory; completeness is an evaluation question.

Source: `src/pages/oas/OASControlDomainsPage.jsx:119` / DOMAINS / ordinal 03 — “Specifies the agent's capabilities, required resources and any external tools or systems it can access.”

Review: PENDING — no approval recorded. Questions: Q01, Q05.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

<a id="oas-1-req-0007"></a>
### OAS-1-REQ-0007 — Resources and external dependencies

**CANDIDATE — NOT ADOPTED.**

The provider MUST identify the resources, external tools and external systems used by the system version within the declared operating scope in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D03. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Make resource/tool dependencies inspectable.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Dependency inventory; Interface definition. Evidence presence does not establish conformance.

Verification notes: Inspect inventory entries and their relationship to declared capabilities; do not expose credentials in evidence.

Source: `src/pages/oas/OASControlDomainsPage.jsx:119` / DOMAINS / ordinal 03 — “Specifies the agent's capabilities, required resources and any external tools or systems it can access.”

Review: PENDING — no approval recorded. Questions: Q01, Q04, Q05.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.
