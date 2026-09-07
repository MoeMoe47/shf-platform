# Phase 1 Canonical Authority and Semantic Boundary

Status: executable ownership boundary for Government Program Assurance Phase 1.

## A. Canonical Authority Map

| Concept | Canonical Owner | Existing/New | Why | Producers | Consumers | Forbidden Duplicate Owners |
|---|---|---|---|---|---|---|
| Organization / tenant / relationships | Identity and Organization domains | Existing | Existing organization, tenant, membership, RBAC, and relationship scope are authoritative. | Identity, onboarding, organization relationships | All scoped domains | Government Assurance, Reporting, AI, fixtures |
| Program | Programs domain | Existing, semantically extended by references | Existing Program owns lifecycle and stewardship; GPA stores references, not a second Program table. | Program stewardship, funding allocation | Claims, metrics, reporting | GPA, curriculum catalog, report fixtures |
| Provider | Organization relationships and existing provider references | Existing | Provider is an organization/relationship role, not a new GPA identity model. | Organization onboarding, relationships | Funding, claims, monitoring | GPA, UI stores |
| Participant / service / outcome | Operational, curriculum, workforce-outcome domains | Existing producers | These domains retain their source semantics; GPA consumes references and assertions. | Source systems, workforce outcomes, service records | Claims, evidence, verification | A generic GPA participant replacement |
| Funding source / grant / award / agreement / obligation / payment | Funding Grants, Grant Binder, Service Agreements, Exchange Funding Commitments | Existing | Existing funding authorities remain canonical; GPA records only references. | Funding and agreement domains | Claims, reporting, reconciliation | GPA funding tables, report-local funding |
| Claim | Government Assurance Claim Registry | New | No first-class institutional assertion owner existed. A Claim is not evidence or truth. | Providers, programs, source adapters, authorized users | Verification, reconciliation, reporting review | workforce rows, report rows, Truth Spine, AI |
| Evidence | Verified Evidence / Prepare-Prove architecture | Existing, general boundary | Existing persisted evidence/projection has provenance and admissibility patterns; GPA references it rather than duplicating evidence storage. | Source ingestion, verified-evidence producers | Verification, claims, audit | GPA file store, browser evidence |
| Verification | Government Assurance Verification Records | New bounded foundation | Existing verification primitives are aggregation/curriculum-specific; this is the general assurance record owner. | Authorized verifiers, verification methods | Truth, reporting, findings | QA results, AI confidence, report flags |
| Verification Method | Government Assurance Verification Method Registry | New | Versioned method definitions were absent. | Assurance administrators | Verification | Inline report rules, UI labels |
| Metric | Government Assurance Metric Registry | New bounded foundation | Report-local and fixture metrics were not canonical. | Metric owners, source adapters | Reporting, verification, Truth | Report-local formulas, AI-generated KPIs |
| Truth fact | Government Assurance Truth Facts, future general Truth Spine boundary | New bounded foundation; existing curriculum truth remains a producer/projection | A persisted, scoped, provenance-required institutional fact boundary was absent. | Approved determination path after verification | Reporting, public disclosure, decisions | AI, Reporting, Oracle, localStorage, fixtures |
| Reconciliation case | Government Assurance Reconciliation Cases | New bounded foundation; Oracle is analyzer | Conflicts need durable cases without silent truth overwrite. | Oracle analysis, source/claim comparisons | Reviewers, Truth determination | Process-local Oracle truth store |
| Source Authority | Government Assurance Source Authority Registry | New | No canonical source-of-record precedence registry existed. | Authorized source owners | Reconciliation, ingestion, verification | Connector-local precedence, report assumptions |
| Requirement / control | Future policy/control registry | Future boundary | Legal and policy documents are not yet executable controls. | Legal/policy owners | Monitoring, verification, findings | ARAG policy, QA, AI policy |
| Finding | Future Government Assurance Findings | Future bounded owner | Software QA findings and awareness findings have different semantics. | Monitoring, verification, audits | Corrective action, decisions | Studio QA, raw awareness, AI |
| Decision | Future Government Assurance Decision Registry | Future bounded owner | Existing review decisions do not cover institutional determinations. | Authorized reviewers/decision authorities | Reporting, corrective action, Truth | UI approval state, AI recommendation |
| Reporting / public disclosure | Reporting and Public Disclosure | Existing consumer | Reporting renders and distributes authorized data; it does not define truth. | Truth, metrics, operational domains | Government users/public | Report-local truth, dashboard fixtures |
| AI authority/security | AI Governance, Input Security, Agent Fabric | Existing | AI identity, delegation, model, session, security, and tool boundaries already exist. | Identity/governance | Conductor, simulations, assurance workflows | AI-generated Claim, Truth, Evidence, Decision |

## B. Core Concept Definitions

- **Organization**: the identity-domain legal or operational entity with memberships, relationships, lifecycle, and tenant scope. A Provider, State, County, Department, Program Office, or employer is represented through this authority and typed relationships.
- **Program**: an existing Programs-domain unit of accountable work with lifecycle and stewardship. GPA references it; it does not create a second program authority.
- **Provider**: an organization delivering or administering a service under an explicit relationship or agreement.
- **Participant**: a person or organization receiving or being considered for a program service, referenced from the source operational domain.
- **Service**: a delivered or planned unit of program activity, owned by the operational source domain.
- **Funding Source**: the origin of funds. **Award** is an authorized funding allocation. **Agreement** is the binding service/funding instrument. **Obligation** is a committed amount. **Payment** is a disbursement. GPA references these records.
- **Claim**: a versioned, attributable institutional assertion about a subject, program, period, value, or event that requires evidence and verification before it can influence accepted Truth.
- **Evidence**: a provenance-bearing record or reference that can be tested against a Claim or subject. A file, source row, or extraction candidate is not automatically Evidence.
- **Verification**: an attributable evaluation of a Claim or subject using a versioned method and referenced evidence. It records a result; it does not silently rewrite the Claim.
- **Verification Method**: a versioned description of how a class of Claims or subjects may be evaluated, including eligible evidence and effective dates.
- **Metric**: a versioned canonical definition of a named measure, including value type, owner, scope, and effective window. A report-local aggregation is not a Metric authority.
- **Truth Fact**: a scoped, provenance-bearing institutional fact accepted through an authorized determination path. It is not a raw report, Claim, external observation, or AI summary.
- **Reconciliation Case**: a durable record of competing sources or Claims, conflict reason, authority references, review state, and determination. It does not itself become Truth.
- **Source Authority**: a scoped, effective-dated statement of which source system has precedence for a data domain/record type and how conflicts are handled.
- **Requirement**: a machine-addressable or future machine-addressable obligation from statute, regulation, grant, contract, or policy. **Control** is an executable test or procedure mapped to a Requirement.
- **Finding**: a Government Assurance observation that a requirement, control, data, risk, or monitoring condition needs attention. It is distinct from a QA failure, Claim, or fraud determination.
- **Decision**: an attributable institutional determination that records authority, facts, evidence, rules, recommendations, approval, exceptions, and disposition.

## C. Authority Rules

All Phase 1 records are organization and tenant scoped. The service layer validates `tenant:<organization_id>`, permission, and actor scope before writes or reads. History-bearing concepts use version/supersession rather than destructive replacement.

| Concept | Create | Update / supersede | Verify | Consume | History |
|---|---|---|---|---|---|
| Organization / Program / funding / evidence | Existing canonical domain permissions | Existing domain authority | Existing domain or future verification | GPA and reporting | Existing domain rules |
| Claim | Authorized GPA claim manager or source adapter | New version / superseding Claim; no silent mutation | Verification authority only | Verification, reconciliation, review | Required |
| Source Authority | Authorized source owner/administrator | Effective-dated version/status | Reconciliation/verification consumes | Ingestion and conflict evaluation | Required |
| Metric | Metric authority | Versioned definitions only | Verification may require it | Reporting and Truth | Required |
| Verification Method | Verification authority administrator | New effective version; retire old | N/A; it defines method | Verification | Required |
| Verification | Authorized verifier | Superseding record; no silent result overwrite | Verifier/reviewer under method | Truth determination/reporting | Required |
| Truth Fact | Dedicated determination permission only, with verification/provenance | Supersede/retract through Truth authority | Accepted only through approved determination | Reporting, public disclosure, decisions | Required and immutable-safe |
| Reconciliation Case | Authorized reviewer/Oracle adapter | Determination by authority/reviewer | Does not verify by itself | Truth determination and review | Required |
| Requirement / Control / Finding / Decision | Future dedicated authority | Future versioned workflow | Future designated authority | Reporting and operations | Required |

AI, Reporting, browser state, fixtures, and process-local Oracle state may consume or propose but may not create accepted Truth, alter Evidence, define Metrics, or make final institutional Decisions.

## D. Producer / Consumer Rules

Provider system produces source data. Source Authority identifies precedence. Source ingestion preserves provenance. Claim Registry owns the assertion. Evidence supports the assertion. Verification evaluates the assertion using a Verification Method. Metric Registry defines measures. Truth Facts store accepted facts after determination. Oracle/Reconciliation records conflicts under Source Authority policy. Reporting consumes authorized facts and metrics. AI assists with analysis, planning, and recommendations but cannot become authority.

Existing curriculum/workforce and funding records are compatibility producers. Adapters return references or candidates and never promote source data directly to Claim, Verification, or Truth.

## E. Explicit Non-Authority List

The following are explicitly non-authoritative for Government Program Assurance: fixture aggregation registries; process-local Oracle stores; browser/localStorage Truth Spine state; mock APIs; report-local metric definitions; UI-only stores; demo/seed data; Studio QA outside software-release semantics; AI summaries; external observations; and raw uploaded files without admissibility/provenance treatment.

## Phase 1 Executable Boundary

Migration `098_government_program_assurance_authority_boundary.sql` creates the bounded Claim, Source Authority, Metric, Verification Method/Record, Truth Fact, and Reconciliation Case records. The API exposes scoped creation/listing for the bounded foundations and listing for Truth. There is intentionally no public Truth creation endpoint. Truth determination is an internal service boundary requiring `government.assurance.truth.determine`, provenance, verification reference, and a non-AI/non-reporting/non-Oracle actor.

This phase does not implement full verification workflows, V0-V5 evaluation, requirement/control monitoring, findings/CAPA, sampling, audit workspace, recovery, public reporting expansion, connector execution, or program/funding replacement domains.
