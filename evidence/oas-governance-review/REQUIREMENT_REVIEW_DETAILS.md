# Individual review findings

This is the repository technical review requested by the user. APPROVE is a content disposition, not manufactured institutional authorization, adoption or RC issuance. Authorized OAS approval fields remain null. No RC exists.

## OAS-1-REQ-0001 — Identity and responsible party

Domain: OAS-1-D01. Disposition: APPROVE WITH REVISION.

The provider MUST include a system identifier and the name of the person or organization responsible for the described system in the description record for each system version covered by the declaration.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Bind a declaration to a described subject and responsible party.

Evidence: Identity/responsibility record

Verification: Inspect the record for a nonempty system identifier and named responsible party; this does not verify legal ownership or Registry issuance.

Questions: Q01, Q03; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:105` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 01: “Establishes clear identity, provenance and ownership for agents, ensuring accountability throughout their lifecycle.”

Reviewed record checksum: sha256:f5941c69982ceb8a96349771fac188ecfcda527d51413bb8b65e2205cfc590e0.

- precision: needs_revision. The obligation already identifies a responsible party rather than legal title. Align the title and evidence label with the obligation and retain the non-verification boundary.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: acceptable. Documentation elements are inspectable; the original ownership label overstates the actual obligation.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: acceptable. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: needs_revision. Content disposition is APPROVE WITH REVISION; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0002 — Version provenance reference

Domain: OAS-1-D01. Disposition: HOLD.

The provider MUST include a provenance reference identifying the source artifact or origin record of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make the origin of the described version traceable.

Evidence: Provenance record; Artifact reference

Verification: Inspect whether the reference identifies the described version; provenance truth and authenticity require separate evaluation.

Questions: Q01, Q04; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:105` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 01: “Establishes clear identity, provenance and ownership for agents, ensuring accountability throughout their lifecycle.”

Reviewed record checksum: sha256:8b45b79816dfd80f385db0a742d0d2bf113a27487046e9ee7d0ffab420cb8033.

- precision: unresolved. A source artifact or origin record has no defined minimum granularity for composite, hosted or continuously updated systems. A generic reference could satisfy the syntax without identifying the described version.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: unresolved. Reference presence is observable, but version identification is underdefined.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: unresolved. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: unresolved. Content disposition is HOLD; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0003 — Intended purpose

Domain: OAS-1-D02. Disposition: APPROVE.

The provider MUST document the intended goals and use cases of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make intended purpose inspectable.

Evidence: Purpose documentation

Verification: Inspect for explicit goals and use cases; a purpose statement does not prove aligned behavior.

Questions: Q01; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASPurposeBoundariesPage.jsx:141` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, IN_PRACTICE / Define the agent's purpose: “Document the intended goals and use cases.”

Reviewed record checksum: sha256:c7a8bcb9376a619fdf06dfee7b0248bcae7f24e9300489343dff079fafed7d49.

- precision: acceptable. A named provider documents goals and use cases for an identified version. The obligation is bounded and inspectable without claiming aligned runtime behavior.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: acceptable. A reviewer can inspect explicit goals/use cases in the scoped description record.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: acceptable. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: acceptable. Content disposition is APPROVE; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0004 — Operating boundaries

Domain: OAS-1-D02. Disposition: APPROVE.

The provider MUST document the permitted operating scope and excluded actions or uses of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make claimed boundaries distinguishable from capability.

Evidence: Scope specification; Boundary policy

Verification: Inspect for both permitted scope and exclusions; documentation is not enforcement.

Questions: Q01; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASPurposeBoundariesPage.jsx:146` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, IN_PRACTICE / Establish boundaries: “Specify what the agent can and cannot do.”

Reviewed record checksum: sha256:1f88fba4b3e21951a84d47b699d5ad3c8d9e92c5c4ccb5e1a183b3c96fff98d1.

- precision: acceptable. Permitted scope and exclusions are distinct from permissions and control efficacy. The existing statement is a coherent description obligation without claiming enforcement.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: acceptable. Inspect permitted scope and excluded actions/uses; do not infer enforcement.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: acceptable. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: acceptable. Content disposition is APPROVE; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0005 — Purpose and boundary review

Domain: OAS-1-D02. Disposition: APPROVE WITH REVISION.

The provider MUST record a review of the documented purpose and boundaries when the capabilities, permissions, operating context or intended use of the system version covered by the declaration change.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Apply the existing evolution/reassessment concept at an observable change trigger.

Evidence: Change review record

Verification: For a sampled in-scope change, inspect a linked review record; no review interval or risk tier is inferred.

Questions: Q01, Q02; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASPurposeBoundariesPage.jsx:151` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, IN_PRACTICE / Validate and maintain: “Regularly review purpose and boundaries as the agent evolves.”

Reviewed record checksum: sha256:f17fc5ef20f5a2fe8b8f5022bfd12dab87b985e04d4a45f81536ce5e4bc9c9e7.

- precision: needs_revision. The version is described as changing itself. Clarify that the trigger is a change in the declared version's capabilities, permissions, context or use; do not add a new timing or risk rule.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: acceptable. A change review record is inspectable; no arbitrary cadence is required.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: acceptable. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: needs_revision. Content disposition is APPROVE WITH REVISION; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0006 — Capability inventory

Domain: OAS-1-D03. Disposition: APPROVE.

The provider MUST list the capabilities made available within the operating scope of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Distinguish declared capabilities from purpose and permissions.

Evidence: Capability manifest

Verification: Compare listed capabilities with an independently supplied scoped interface inventory; completeness is an evaluation question.

Questions: Q01, Q05; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:119` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 03: “Specifies the agent's capabilities, required resources and any external tools or systems it can access.”

Reviewed record checksum: sha256:5c195af599d0dfca55d2c7a4f00beebaabe84b185d07b365520460589fcf1f60.

- precision: acceptable. Capability enumeration is distinct from intended purpose and permission. The obligation is a useful documentation baseline; completeness methodology remains a release-level issue.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: acceptable. Inspect a scoped capability manifest; runtime completeness must not be inferred from schema validity.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: acceptable. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: acceptable. Content disposition is APPROVE; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0007 — Resources and external dependencies

Domain: OAS-1-D03. Disposition: HOLD.

The provider MUST identify the resources, external tools and external systems used by the system version within the declared operating scope in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make resource/tool dependencies inspectable.

Evidence: Dependency inventory; Interface definition

Verification: Inspect inventory entries and their relationship to declared capabilities; do not expose credentials in evidence.

Questions: Q01, Q04, Q05; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:119` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 03: “Specifies the agent's capabilities, required resources and any external tools or systems it can access.”

Reviewed record checksum: sha256:3feca25b10c6bab15f79c86e143dbb1891c9bb52157f3fe9e9f9c3899b0d0ac3.

- precision: unresolved. Resources lacks a bounded inventory granularity and used dependencies do not cover the source concept of accessible tools. Dynamic/composite dependency scope is unresolved.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: unresolved. The inventory can be present while omitting unspecified classes of dependencies.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: unresolved. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: unresolved. Content disposition is HOLD; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0008 — Access and action permissions

Domain: OAS-1-D04. Disposition: APPROVE.

The provider MUST document the data, systems and actions that the described system version is authorized to access or perform within the declared operating scope in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make access permissions explicit and separate from capability.

Evidence: Permission policy; Configuration evidence

Verification: Inspect permitted resources/actions and scope; a documented permission does not establish Registry authorization.

Questions: Q01, Q05; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:126` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 04: “Controls what the agent can access, including data, systems and actions, with appropriate authorization mechanisms.”

Reviewed record checksum: sha256:e3562e2b6d66f1d334aea1ee7de454937e4512bf261251670fc714e3391a0224.

- precision: acceptable. Documents existing access/action permissions within scope. It neither grants permission nor duplicates capability enumeration. The existing notes correctly exclude Registry authorization.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: acceptable. Inspect permission policy/configuration against identified data, systems and actions; authority and efficacy are not granted by the declaration.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: acceptable. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: acceptable. Content disposition is APPROVE; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0009 — Authorization mechanism references

Domain: OAS-1-D04. Disposition: APPROVE.

The provider MUST identify the authorization mechanism associated with each documented data, system or action permission in the description record for the declared system version.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Relate access claims to their claimed authorization mechanism.

Evidence: Authorization interface definition; Policy configuration reference

Verification: Inspect permission-to-mechanism references; mechanism efficacy is not inferred from reference presence.

Questions: Q01, Q05; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:126` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 04: “Controls what the agent can access, including data, systems and actions, with appropriate authorization mechanisms.”

Reviewed record checksum: sha256:4e160e2913162688f8373911a3ee245080cd259f82466cb19ffb4c89d53bc3f4.

- precision: acceptable. Relates each documented permission to its authorization mechanism. This is inspectable linkage, distinct from merely listing permissions or proving access enforcement.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: acceptable. Inspect permission-to-mechanism references; no mechanism-efficacy result follows.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: acceptable. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: acceptable. Content disposition is APPROVE; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0010 — Prohibited actions

Domain: OAS-1-D05. Disposition: HOLD.

The provider MUST list the actions prohibited for the system version within the declared operating scope in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make declared prohibitions explicit rather than relying on a vague safety claim.

Evidence: Prohibited-action policy

Verification: Inspect a scoped explicit list; reviewers must decide whether an empty list can ever be justified.

Questions: Q01, Q06; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:133` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 05: “Defines safety requirements, prohibited actions and guardrails to prevent harmful behavior.”

Reviewed record checksum: sha256:f0654dddbaad018753bc42b32a1585b6b749ca9d563c1aed26d839e5aa6d288a.

- precision: unresolved. The source does not identify the authority defining prohibited actions or the treatment of an empty list. It can overlap the exclusions in 0004 unless a safety-policy scope is defined.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: unresolved. List presence alone does not resolve the content authority or distinguish it from general exclusions.
- duplication: unresolved. Potential overlap is identified in the disposition and needs scope clarification, not automatic rejection.
- breadth: unresolved. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: unresolved. Content disposition is HOLD; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0011 — Guardrail control references

Domain: OAS-1-D05. Disposition: HOLD.

The provider MUST identify the control or guardrail intended to prevent each listed prohibited action in the description record for the declared system version.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Connect each prohibition to a claimed prevention control.

Evidence: Control configuration; Guardrail design reference

Verification: Inspect prohibition-to-control links; prevention effectiveness requires independent evaluation.

Questions: Q01, Q06; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:133` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 05: “Defines safety requirements, prohibited actions and guardrails to prevent harmful behavior.”

Reviewed record checksum: sha256:5e1c538576d5f43be70d8dde970ff791c89c4117cccc487442bb69f6e33ec791.

- precision: unresolved. The control-reference obligation depends on the unresolved prohibited-action set in 0010 and does not specify treatment of unavailable/partial controls.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: unresolved. Prohibition-to-control links are inspectable only once the prohibition set and control treatment are defined.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: unresolved. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: unresolved. Content disposition is HOLD; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0012 — Human authority and intervention

Domain: OAS-1-D06. Disposition: HOLD.

The provider MUST document the human role authorized to oversee, override or stop the described system version and the interface by which that role can exercise each documented intervention.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Describe human control and its claimed interface.

Evidence: Human authority policy; Intervention interface definition

Verification: Inspect named roles and intervention interfaces; no universal intervention latency or runtime availability claim is introduced.

Questions: Q01, Q07; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:140` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 06: “Clarifies human oversight, authority structures and escalation paths for critical decisions.”

Reviewed record checksum: sha256:8b99e53a50b7ef07b35686bf42d9ba52d22a33b1c38481459d9dd9a9e9475113.

- precision: unresolved. The disjunction oversee/override/stop leaves which interventions must exist unclear. Documentation scope does not settle applicability for systems lacking an intervention interface.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: unresolved. A role/interface can be listed without establishing which intervention obligations apply.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: unresolved. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: unresolved. Content disposition is HOLD; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0013 — Escalation path

Domain: OAS-1-D06. Disposition: HOLD.

The provider MUST document the conditions that trigger human escalation and the receiving human role or contact route for the described system version within the declared operating scope.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make escalation conditions and destination inspectable.

Evidence: Escalation policy; Routing configuration

Verification: Inspect trigger-to-destination descriptions; response adequacy is separate from declaration validity.

Questions: Q01, Q07; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:140` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 06: “Clarifies human oversight, authority structures and escalation paths for critical decisions.”

Reviewed record checksum: sha256:c96eb954daeec7bfdecb7dc0fd109be0eb4c9ed91dc9d4e3f8ee1dabdbedfb7d.

- precision: unresolved. Escalation triggers and destinations are valid concepts, but the no-escalation case and applicability of a receiving human role are unresolved with 0012.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: unresolved. A trigger/destination record is inspectable, but its required applicability is not settled.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: unresolved. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: unresolved. Content disposition is HOLD; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0014 — Verification and monitoring plan

Domain: OAS-1-D07. Disposition: APPROVE.

The provider MUST document the verification methods and performance-monitoring measures intended for the described system version within the declared operating scope.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make the existing verification/monitoring concept inspectable.

Evidence: Verification plan; Monitoring specification

Verification: Inspect named methods and measures; neither a plan nor an unexecuted test is a passing result.

Questions: Q01, Q08; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:147` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 07: “Establishes verification methods, performance monitoring and evidence requirements.”

Reviewed record checksum: sha256:eef8a364d2266257b0d5873d8b4d23e4405658d460e8fd8ebdfcadcf7287a370.

- precision: acceptable. Explicitly documents intended verification and monitoring methods. It creates a plan requirement, not a passing test or minimum performance score; adequacy of the baseline remains Q08/Q12.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: acceptable. Inspect named methods/measures in a plan; plans and unexecuted tests are not evaluation results.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: acceptable. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: acceptable. Content disposition is APPROVE; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0015 — Evidence expectations and references

Domain: OAS-1-D07. Disposition: HOLD.

The provider MUST identify the evidence types expected to support each requirement it declares satisfied and provide references to the evidence offered for that declaration.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Distinguish evidence expectations from actual offered evidence.

Evidence: Evidence index; Test result reference; Audit record reference

Verification: Inspect requirement-to-evidence-type/reference relationships; presence does not establish conformance or Trust Bureau assessment.

Questions: Q01, Q08; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:147` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 07: “Establishes verification methods, performance monitoring and evidence requirements.”

Reviewed record checksum: sha256:8b484f7d8e5315d0783babb1b65ce2bdf3f85290c14d1296bd7b149e26dd47cf.

- precision: unresolved. Evidence typing is provider-defined and overlaps the proposed declaration schema's evidence-reference obligation. Acceptable evidence semantics, accessibility and self-reference need a defined schema migration.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: unresolved. Evidence references are observable but their required typing/linkage semantics are immature.
- duplication: unresolved. Potential overlap is identified in the disposition and needs scope clarification, not automatic rejection.
- breadth: unresolved. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: unresolved. Content disposition is HOLD; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0016 — Version and lifecycle description

Domain: OAS-1-D08. Disposition: HOLD.

The provider MUST record the system version and its provider-defined lifecycle state in the description record covered by the declaration.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make the described version and lifecycle claim explicit.

Evidence: Version record; Lifecycle record

Verification: Inspect explicit version/state values; this is a provider lifecycle description, not Registry-issued lifecycle status.

Questions: Q01, Q09; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:154` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 08: “Covers the full lifecycle from development to decommissioning, including ongoing accountability and impact assessment.”

Reviewed record checksum: sha256:a7efd09ad1d373dd5b8e5a835c5170b8c0a20a612407ac734cdd0d7e02770e4d.

- precision: unresolved. A provider-defined lifecycle state without a referenced vocabulary has no reproducible interpretation. The version field also overlaps identity/provenance, though lifecycle description is a legitimate distinct concept.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: unresolved. State presence is inspectable, but an unqualified state value cannot be interpreted consistently.
- duplication: unresolved. Potential overlap is identified in the disposition and needs scope clarification, not automatic rejection.
- breadth: unresolved. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: unresolved. Content disposition is HOLD; institutional authorization, global blockers and any revision re-review remain separate release gates.

## OAS-1-REQ-0017 — Retirement accountability

Domain: OAS-1-D08. Disposition: APPROVE WITH REVISION.

The provider MUST identify the role responsible for retiring the described system version and the retirement process in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Carry lifecycle accountability through decommissioning.

Evidence: Retirement procedure; Responsibility record

Verification: Inspect a role and retirement process; no operational deletion or Registry retirement is performed by this requirement.

Questions: Q01, Q09; global Q01/Q10/Q12.

Provenance: `src/pages/oas/OASControlDomainsPage.jsx:154` at 35d2bdfd3d8014658789430c2288d20418bc7dcb, DOMAINS / ordinal 08: “Covers the full lifecycle from development to decommissioning, including ongoing accountability and impact assessment.”

Reviewed record checksum: sha256:6f3339dcad396b7f226b882e752a10bf18162716fbf2fe75e61127b06d4d4521.

- precision: needs_revision. Role responsibility and retirement-process documentation are valid and bounded. Make the role/process relationship explicit without adding execution or Registry retirement authority.
- responsible_actor: acceptable. The normative actor is the provider making the scoped declaration.
- applicability: unresolved. Description-record applicability is explicit, but Q01/Q12 require an authorized first-release scope decision; local issues are listed separately.
- inspectability: acceptable. Inspect a responsible role and process; do not infer operational deletion or Registry lifecycle changes.
- duplication: acceptable. No identical normative statement or identical primary obligation was found; related obligations inspect different records or relationships.
- breadth: acceptable. The content review is limited to provider description records; no universal runtime, safety or legal assurance is implied.
- narrowness: unresolved. A documentation-only baseline may be too narrow for the first OAS standard; Q12 remains a global scope gate.
- oas_authority: acceptable. Describing standards information stays within OAS; it does not issue Registry records, change system permissions or determine Trust Bureau opinion.
- certification_boundary: acceptable. No assessment result, certification scheme or conformance score is introduced; evidence presence remains NOT_EVALUATED.
- baseline_suitability: needs_revision. Content disposition is APPROVE WITH REVISION; institutional authorization, global blockers and any revision re-review remain separate release gates.
