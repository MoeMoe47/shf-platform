# Safety & Prohibited Actions — individual requirement review

Generated from `standards/oas/authoring/first-release.json`; source digest `sha256:b617e224c934638424cb3c693cb04952c443e28557b23ccc0fe77928affa1c04`. Edit the source, then run oas:first:generate.

REVIEW ONLY — proposed obligations, no adopted release, no certification or conformance determination. Candidate version 0.0.0-public-review.2 is reserved for a future reviewed draft, not a published pin.

Approve/reject each ID against its statement checksum and list any required changes. No decision below is prefilled. Decision records require an authorized reviewer and immutable record reference.

## OAS-1-D05 — Safety & Prohibited Actions

<a id="oas-1-req-0010"></a>
### OAS-1-REQ-0010 — Prohibited actions

**CANDIDATE — NOT ADOPTED.**

The provider MUST list the actions prohibited for the system version within the declared operating scope in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D05. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Make declared prohibitions explicit rather than relying on a vague safety claim.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Prohibited-action policy. Evidence presence does not establish conformance.

Verification notes: Inspect a scoped explicit list; reviewers must decide whether an empty list can ever be justified.

Source: `src/pages/oas/OASControlDomainsPage.jsx:133` / DOMAINS / ordinal 05 — “Defines safety requirements, prohibited actions and guardrails to prevent harmful behavior.”

Review: PENDING — no approval recorded. Questions: Q01, Q06.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

<a id="oas-1-req-0011"></a>
### OAS-1-REQ-0011 — Guardrail control references

**CANDIDATE — NOT ADOPTED.**

The provider MUST identify the control or guardrail intended to prevent each listed prohibited action in the description record for the declared system version.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D05. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Connect each prohibition to a claimed prevention control.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Control configuration; Guardrail design reference. Evidence presence does not establish conformance.

Verification notes: Inspect prohibition-to-control links; prevention effectiveness requires independent evaluation.

Source: `src/pages/oas/OASControlDomainsPage.jsx:133` / DOMAINS / ordinal 05 — “Defines safety requirements, prohibited actions and guardrails to prevent harmful behavior.”

Review: PENDING — no approval recorded. Questions: Q01, Q06.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.
