# OAS 1.0 proposed baseline requirements

Repository scope and contract closure under the user task directive. FOUNDING GOVERNANCE is not external consensus. This is not an adopted standard or issued RC; real exact-snapshot founding acceptance is still missing.

Generated from the pinned e1b6135 authoring records and standards/oas/closure/scope.json. No requirement ID or normative statement is repurposed. The following clarifications delimit inspection within the information baseline; they add no runtime effectiveness obligation.

## OAS-1-REQ-0001 — Identity and responsible party

Domain: OAS-1-D01. Status: repository scope review approved; not published/adopted.

The provider MUST include a system identifier and the name of the person or organization responsible for the described system in the description record for each system version covered by the declaration.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Bind a declaration to a described subject and responsible party.

Scope clarification: A description names a responsible person or organization, not verified legal title. Multiple named parties are allowed; this obligation requires a named responsible party, not an ownership census. The text asks for a name, not a newly issued organization identifier.

Evidence: Identity/responsibility record. Evidence presence is not conformance.

Verification: Inspect a system identifier and named responsible party; do not infer legal ownership, Registry issuance or identity authentication.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:105 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0002 — Version provenance reference

Domain: OAS-1-D01. Status: repository scope review approved; not published/adopted.

The provider MUST include a provenance reference identifying the source artifact or origin record of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make the origin of the described version traceable.

Scope clarification: A source artifact reference identifies the declared system version directly or through an origin record that identifies that version. A composite/hosted system can reference a version-specific manifest or origin record; a generic homepage that cannot identify the described version does not meet the existing identification obligation.

Evidence: Provenance record; Artifact reference. Evidence presence is not conformance.

Verification: Inspect whether the cited artifact/origin record identifies the declared version; authenticity is separate from reference resolution.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:105 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0003 — Intended purpose

Domain: OAS-1-D02. Status: repository scope review approved; not published/adopted.

The provider MUST document the intended goals and use cases of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make intended purpose inspectable.

Scope clarification: The existing statement is precise within the version-pinned description/declaration baseline; no normative wording change is needed.

Evidence: Purpose documentation. Evidence presence is not conformance.

Verification: Inspect for explicit goals and use cases; a purpose statement does not prove aligned behavior.

Source provenance: src/pages/oas/OASPurposeBoundariesPage.jsx:141 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0004 — Operating boundaries

Domain: OAS-1-D02. Status: repository scope review approved; not published/adopted.

The provider MUST document the permitted operating scope and excluded actions or uses of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make claimed boundaries distinguishable from capability.

Scope clarification: The existing statement is precise within the version-pinned description/declaration baseline; no normative wording change is needed.

Evidence: Scope specification; Boundary policy. Evidence presence is not conformance.

Verification: Inspect for both permitted scope and exclusions; documentation is not enforcement.

Source provenance: src/pages/oas/OASPurposeBoundariesPage.jsx:146 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0005 — Purpose and boundary review

Domain: OAS-1-D02. Status: repository scope review approved; not published/adopted.

The provider MUST record a review of the documented purpose and boundaries when the capabilities, permissions, operating context or intended use of the system version covered by the declaration change.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Apply the existing evolution/reassessment concept at an observable change trigger.

Scope clarification: The grammatical revision preserves all four change triggers. This baseline requires a review record when those scoped attributes change; it introduces no arbitrary review interval or risk classifier.

Evidence: Change review record. Evidence presence is not conformance.

Verification: For a sampled scoped change, inspect the linked purpose/boundary review record.

Source provenance: src/pages/oas/OASPurposeBoundariesPage.jsx:151 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0006 — Capability inventory

Domain: OAS-1-D03. Status: repository scope review approved; not published/adopted.

The provider MUST list the capabilities made available within the operating scope of the system version covered by the declaration in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Distinguish declared capabilities from purpose and permissions.

Scope clarification: Capabilities means the functions made available by the identified system version in the declared operating scope at the declaration snapshot. It is not a list of merely observed successful actions. Dynamic capability access can be identified through a version-pinned permitted-function manifest; unknown completeness must not be declared satisfied.

Evidence: Capability manifest. Evidence presence is not conformance.

Verification: Compare declared functions with scoped version/interface or capability-manifest evidence; declaration validity does not prove runtime completeness.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:119 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0007 — Resources and external dependencies

Domain: OAS-1-D03. Status: repository scope review approved; not published/adopted.

The provider MUST identify the resources, external tools and external systems used by the system version within the declared operating scope in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make resource/tool dependencies inspectable.

Scope clarification: Resources means the declared version's required execution resources and external tool/system dependencies within the stated operating scope, not an unbounded supply-chain census. The obligation concerns used dependencies; merely accessible but unused tools remain covered by capability/permission descriptions. Dynamic dependencies can be identified by a version-specific dependency/selector manifest.

Evidence: Dependency inventory; Interface definition. Evidence presence is not conformance.

Verification: Inspect the scoped dependency/resource inventory and version-specific references; an unresolved dependency set is unknown, not silently complete.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:119 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0008 — Access and action permissions

Domain: OAS-1-D04. Status: repository scope review approved; not published/adopted.

The provider MUST document the data, systems and actions that the described system version is authorized to access or perform within the declared operating scope in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make access permissions explicit and separate from capability.

Scope clarification: Permissions describe the access/actions authorized within the declared snapshot scope. The provider identifies the applicable policy/configuration; the declaration does not grant authorization or imply Registry permission. Changes require a newly pinned declaration or withdrawal; runtime enforcement is outside this information baseline.

Evidence: Permission policy; Configuration evidence. Evidence presence is not conformance.

Verification: Inspect the scoped data/system/action permission list against its policy/configuration references.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:126 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0009 — Authorization mechanism references

Domain: OAS-1-D04. Status: repository scope review approved; not published/adopted.

The provider MUST identify the authorization mechanism associated with each documented data, system or action permission in the description record for the declared system version.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Relate access claims to their claimed authorization mechanism.

Scope clarification: Each documented permission is linked to the mechanism the provider identifies as authorizing it. Presence of a mechanism reference is not an access-control efficacy test.

Evidence: Authorization interface definition; Policy configuration reference. Evidence presence is not conformance.

Verification: Inspect permission-to-mechanism references; evaluate efficacy separately if an evaluator is later authorized.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:126 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0010 — Prohibited actions

Domain: OAS-1-D05. Status: repository scope review approved; not published/adopted.

The provider MUST list the actions prohibited for the system version within the declared operating scope in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make declared prohibitions explicit rather than relying on a vague safety claim.

Scope clarification: The prohibition set is attributed to the provider's applicable policy for this version/scope; OAS does not invent a universal legal or safety blacklist. An explicit empty list describes the provider's policy claim and is not a safety finding. A missing or unknown prohibition set is not a satisfied declaration. This is safety-constraint disclosure, distinct from the general operating exclusions in 0004.

Evidence: Prohibited-action policy. Evidence presence is not conformance.

Verification: Inspect an explicit policy-attributed prohibition list, including explicit empty sets where claimed; do not treat the list as safe deployment approval.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:133 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0012 — Human authority and intervention

Domain: OAS-1-D06. Status: repository scope review approved; not published/adopted.

The provider MUST document the human role authorized to oversee, override or stop the described system version and the interface by which that role can exercise each documented intervention.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Describe human control and its claimed interface.

Scope clarification: The word or is disjunctive: this obligation documents the authorized human role and interfaces for the interventions actually documented. It does not assert that every system supports all three interventions. Unsupported stop/override capability must not be advertised as present. Human oversight can be documented through its actual inspection/control interface; latency/effectiveness is outside this baseline.

Evidence: Human authority policy; Intervention interface definition. Evidence presence is not conformance.

Verification: Inspect the named role and interface for every claimed intervention; do not infer universal stop capability or latency guarantees.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:140 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0014 — Verification and monitoring plan

Domain: OAS-1-D07. Status: repository scope review approved; not published/adopted.

The provider MUST document the verification methods and performance-monitoring measures intended for the described system version within the declared operating scope.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make the existing verification/monitoring concept inspectable.

Scope clarification: This is explicitly a documented plan obligation: intended verification methods and monitoring measures, not executed tests, minimum performance or conformance. Plan documentation can support this requirement's declaration; an unexecuted plan cannot be represented as a completed test result.

Evidence: Verification plan; Monitoring specification. Evidence presence is not conformance.

Verification: Inspect named methods/measures and offered plan references; do not calculate PASS/FAIL or trust.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:147 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0016 — Version and lifecycle description

Domain: OAS-1-D08. Status: repository scope review approved; not published/adopted.

The provider MUST record the system version and its provider-defined lifecycle state in the description record covered by the declaration.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Make the described version and lifecycle claim explicit.

Scope clarification: The lifecycle state is explicitly provider-defined. Its meaning is inspected in the provider's referenced description/vocabulary, not mapped to Registry lifecycle by matching a label. A bare value without an interpretable provider description cannot substantiate the claimed state. Version/state here describe the subject, not OAS release status.

Evidence: Version record; Lifecycle record. Evidence presence is not conformance.

Verification: Inspect the subject version and provider-defined state in its documented context; no Registry state transition is inferred.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:154 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.

## OAS-1-REQ-0017 — Retirement accountability

Domain: OAS-1-D08. Status: repository scope review approved; not published/adopted.

The provider MUST identify the role responsible for retiring the described system version and the retirement process in its description record.

Applicability: Provider-authored description records for the specific system version and operating scope named in a provider declaration; this candidate does not impose a runtime effectiveness result.

Rationale: Carry lifecycle accountability through decommissioning.

Scope clarification: The revised sentence records a role responsible for retiring the version and the retirement process. It neither performs retirement nor mandates Registry lifecycle changes, record deletion, retention periods or a universal shutdown interface.

Evidence: Retirement procedure; Responsibility record. Evidence presence is not conformance.

Verification: Inspect a responsible role and retirement-process description; evaluate execution separately.

Source provenance: src/pages/oas/OASControlDomainsPage.jsx:154 at 35d2bdfd3d8014658789430c2288d20418bc7dcb. Version introduced/release relationship remain unassigned until a real publication.
