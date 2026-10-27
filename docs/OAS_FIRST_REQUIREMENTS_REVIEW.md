# First OAS normative requirement review

Generated from `standards/oas/authoring/first-release.json`; source digest `sha256:b617e224c934638424cb3c693cb04952c443e28557b23ccc0fe77928affa1c04`. Edit the source, then run oas:first:generate.

REVIEW ONLY — proposed obligations, no adopted release, no certification or conformance determination. Candidate version 0.0.0-public-review.2 is reserved for a future reviewed draft, not a published pin.

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

The provider MUST record a review of the documented purpose and boundaries when the declared system version changes its capabilities, permissions, operating context or intended use.

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

## OAS-1-D07 — Validation & Evidence

<a id="oas-1-req-0014"></a>
### OAS-1-REQ-0014 — Verification and monitoring plan

**CANDIDATE — NOT ADOPTED.**

The provider MUST document the verification methods and performance-monitoring measures intended for the described system version within the declared operating scope.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D07. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Make the existing verification/monitoring concept inspectable.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Verification plan; Monitoring specification. Evidence presence does not establish conformance.

Verification notes: Inspect named methods and measures; neither a plan nor an unexecuted test is a passing result.

Source: `src/pages/oas/OASControlDomainsPage.jsx:147` / DOMAINS / ordinal 07 — “Establishes verification methods, performance monitoring and evidence requirements.”

Review: PENDING — no approval recorded. Questions: Q01, Q08.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

<a id="oas-1-req-0015"></a>
### OAS-1-REQ-0015 — Evidence expectations and references

**CANDIDATE — NOT ADOPTED.**

The provider MUST identify the evidence types expected to support each requirement it declares satisfied and provide references to the evidence offered for that declaration.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Domain: OAS-1-D07. Level: MUST. R0–R4 applicability: not assigned. Introduced: not published; proposed 0.0.0-public-review.2.

Rationale: Distinguish evidence expectations from actual offered evidence.

Implementation notes: Proposed document obligation derived from existing OAS concepts. Review the stated open questions before adoption; do not infer complete or effective implementation from a description.

Evidence expectations: Evidence index; Test result reference; Audit record reference. Evidence presence does not establish conformance.

Verification notes: Inspect requirement-to-evidence-type/reference relationships; presence does not establish conformance or Trust Bureau assessment.

Source: `src/pages/oas/OASControlDomainsPage.jsx:147` / DOMAINS / ordinal 07 — “Establishes verification methods, performance monitoring and evidence requirements.”

Review: PENDING — no approval recorded. Questions: Q01, Q08.

Declaration states: applicable, not_applicable, declared_satisfied, not_declared, unknown; NOT_EVALUATED in every state.

Supersedes: none. Superseded by: none.

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

The provider MUST identify the responsible role and the process for retiring the described system version in its description record.

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
