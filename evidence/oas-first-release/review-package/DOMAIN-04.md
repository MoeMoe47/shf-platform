# Permissions & Access — individual requirement review

Generated from `standards/oas/authoring/first-release.json`; source digest `sha256:b617e224c934638424cb3c693cb04952c443e28557b23ccc0fe77928affa1c04`. Edit the source, then run oas:first:generate.

REVIEW ONLY — proposed obligations, no adopted release, no certification or conformance determination. Candidate version 0.0.0-public-review.2 is reserved for a future reviewed draft, not a published pin.

Approve/reject each ID against its statement checksum and list any required changes. No decision below is prefilled. Decision records require an authorized reviewer and immutable record reference.

## OAS-1-D04 — Permissions & Access

<a id="oas-1-req-0008"></a>
### OAS-1-REQ-0008 — Access and action permissions

**CANDIDATE — NOT ADOPTED.**

The provider MUST document the data, systems and actions that the described system version is authorized to access or perform within the declared operating scope in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D04. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Make access permissions explicit and separate from capability.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Permission policy; Configuration evidence. Evidence presence does not establish conformance.

Verification notes: Inspect permitted resources/actions and scope; a documented permission does not establish Registry authorization.

Source: `src/pages/oas/OASControlDomainsPage.jsx:126` / DOMAINS / ordinal 04 — “Controls what the agent can access, including data, systems and actions, with appropriate authorization mechanisms.”

Review: PENDING — no approval recorded. Questions: Q01, Q05.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

<a id="oas-1-req-0009"></a>
### OAS-1-REQ-0009 — Authorization mechanism references

**CANDIDATE — NOT ADOPTED.**

The provider MUST identify the authorization mechanism associated with each documented data, system or action permission in the description record for the declared system version.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D04. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Relate access claims to their claimed authorization mechanism.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Authorization interface definition; Policy configuration reference. Evidence presence does not establish conformance.

Verification notes: Inspect permission-to-mechanism references; mechanism efficacy is not inferred from reference presence.

Source: `src/pages/oas/OASControlDomainsPage.jsx:126` / DOMAINS / ordinal 04 — “Controls what the agent can access, including data, systems and actions, with appropriate authorization mechanisms.”

Review: PENDING — no approval recorded. Questions: Q01, Q05.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.
