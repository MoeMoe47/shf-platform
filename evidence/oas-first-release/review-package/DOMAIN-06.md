# Human Authority — individual requirement review

Generated from `standards/oas/authoring/first-release.json`; source digest `sha256:8830d45169bc0c494ff0d6ac66cf95d358ac5efb69b510b658997d4aaf4abaad`. Edit the source, then run oas:first:generate.

REVIEW ONLY — proposed obligations, no adopted release, no certification or conformance determination. Approval fields refer to authorized OAS content approval; repository technical dispositions are recorded separately in standards/oas/governance/first-release-review.json and do not populate those fields. Candidate version 0.0.0-public-review.2 is reserved for a future reviewed draft, not a published pin.

Approve/reject each ID against its statement checksum and list any required changes. No decision below is prefilled. Decision records require an authorized reviewer and immutable record reference.

## OAS-1-D06 — Human Authority

<a id="oas-1-req-0012"></a>
### OAS-1-REQ-0012 — Human authority and intervention

**CANDIDATE — NOT ADOPTED.**

The provider MUST document the human role authorized to oversee, override or stop the described system version and the interface by which that role can exercise each documented intervention.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D06. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Describe human control and its claimed interface.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Human authority policy; Intervention interface definition. Evidence presence does not establish conformance.

Verification notes: Inspect named roles and intervention interfaces; no universal intervention latency or runtime availability claim is introduced.

Source: `src/pages/oas/OASControlDomainsPage.jsx:140` / DOMAINS / ordinal 06 — “Clarifies human oversight, authority structures and escalation paths for critical decisions.”

Review: PENDING — no approval recorded. Questions: Q01, Q07.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

<a id="oas-1-req-0013"></a>
### OAS-1-REQ-0013 — Escalation path

**CANDIDATE — NOT ADOPTED.**

The provider MUST document the conditions that trigger human escalation and the receiving human role or contact route for the described system version within the declared operating scope.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D06. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Make escalation conditions and destination inspectable.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Escalation policy; Routing configuration. Evidence presence does not establish conformance.

Verification notes: Inspect trigger-to-destination descriptions; response adequacy is separate from declaration validity.

Source: `src/pages/oas/OASControlDomainsPage.jsx:140` / DOMAINS / ordinal 06 — “Clarifies human oversight, authority structures and escalation paths for critical decisions.”

Review: PENDING — no approval recorded. Questions: Q01, Q07.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.
