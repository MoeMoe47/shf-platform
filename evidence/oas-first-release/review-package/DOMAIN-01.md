# Identity & Ownership — individual requirement review

Generated from `standards/oas/authoring/first-release.json`; source digest `sha256:b617e224c934638424cb3c693cb04952c443e28557b23ccc0fe77928affa1c04`. Edit the source, then run oas:first:generate.

REVIEW ONLY — proposed obligations, no adopted release, no certification or conformance determination. Candidate version 0.0.0-public-review.2 is reserved for a future reviewed draft, not a published pin.

Approve/reject each ID against its statement checksum and list any required changes. No decision below is prefilled. Decision records require an authorized reviewer and immutable record reference.

## OAS-1-D01 — Identity & Ownership

<a id="oas-1-req-0001"></a>
### OAS-1-REQ-0001 — Identity and responsible owner

**CANDIDATE — NOT ADOPTED.**

The provider MUST include a system identifier and the name of the person or organization responsible for the described system in the description record for each system version covered by the declaration.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D01. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Bind a declaration to a described subject and responsible party.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Identity/ownership record. Evidence presence does not establish conformance.

Verification notes: Inspect the record for a nonempty system identifier and named responsible party; this does not verify legal ownership.

Source: `src/pages/oas/OASControlDomainsPage.jsx:105` / DOMAINS / ordinal 01 — “Establishes clear identity, provenance and ownership for agents, ensuring accountability throughout their lifecycle.”

Review: PENDING — no approval recorded. Questions: Q01, Q03.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

<a id="oas-1-req-0002"></a>
### OAS-1-REQ-0002 — Version provenance reference

**CANDIDATE — NOT ADOPTED.**

The provider MUST include a provenance reference identifying the source artifact or origin record of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D01. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Make the origin of the described version traceable.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Provenance record; Artifact reference. Evidence presence does not establish conformance.

Verification notes: Inspect whether the reference identifies the described version; provenance truth and authenticity require separate evaluation.

Source: `src/pages/oas/OASControlDomainsPage.jsx:105` / DOMAINS / ordinal 01 — “Establishes clear identity, provenance and ownership for agents, ensuring accountability throughout their lifecycle.”

Review: PENDING — no approval recorded. Questions: Q01, Q04.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.
