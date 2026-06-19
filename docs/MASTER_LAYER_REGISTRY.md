# Master Layer Registry

This registry is the canonical map of SHS layers. It exists to prevent architecture drift and duplicate layer creation.

## Canonical Rule

Truth Spine verifies what is true. Oracle decides what verified evidence supports. Watchtower observes coverage and risk. LOO ranks outcomes. Alignment controls allowed actions. Reports communicate only Truth Spine-approved information. Apps produce signals only.

## No-New-Layer Rule

No new layer may be created unless it cannot fit any registered layer, is required for safety, scale, reporting, governance, funding, or operations, and is added to this registry with ownership and boundaries.

## Official Layers

| Layer | Ownership | Boundary |
| --- | --- | --- |
| Identity & Access | Security | Authenticates users, roles, organizations, route access, and permission gates. |
| API Gateway | Platform | Routes API traffic and applies shared request policy. |
| Event/Webhook | Platform | Receives and emits event signals from apps, partners, and systems. |
| Batch/Import | Data Operations | Handles file imports, bulk uploads, and scheduled ingest. |
| Source Registry Layer | Data Operations | Registers source identity, source type, provenance expectations, eligibility, and allowed downstream use before data intake. |
| Data Federation Layer | Data Operations | Coordinates source groups, lineage, compatibility, and conflicts between Source Registry and Data Aggregator. |
| Data Aggregator Layer | Data Operations | Gathers approved raw/structured inputs, attaches provenance, and prepares intake for normalization, evidence packaging, and Truth Spine review. |
| Data Normalization Layer | Data Operations | Converts aggregated intake into canonical preview shapes before Evidence Package, Truth Spine, Reports, Watchtower, LOO, or SHF Impact Data Spine consume it. |
| Evidence Package Layer | Data Operations | Bundles normalized records with source metadata, provenance, and evidence references before Truth Spine review. |
| Data Verification Layer | Data Operations | Evaluates Evidence Package readiness, source/provenance quality, blockers, warnings, and next review action before Truth Spine review. |
| Data Approval Layer | Data Operations | Evaluates approval readiness after Truth Spine, Oracle, and Data Verification before Data Approval Gateway review. |
| Warehouse Sync | Data Operations | Moves normalized data into durable reporting and analysis stores. |
| Apps/Programs | Product | Produces operational signals and user workflows. |
| Adapter Layer | Platform | Converts app/program data into canonical SHS contracts. |
| Truth Spine | Verification | Verifies claims, sources, trace coverage, public approval, and report readiness. |
| Oracle Layer | Decision Support | Decides what verified evidence supports and explains evidence-backed recommendations. |
| Game Theory Layer | Strategy | Models incentives, adversarial pressure, and decision scenarios. |
| AI/Swarm Layer | Automation | Summarizes, assists, and coordinates agents without bypassing verification gates. |
| Alignment Layer | Governance | Controls allowed actions, containment, and policy alignment. |
| LOO | Outcomes | Ranks outcomes and exposes trust metadata without deciding truth. |
| Watchtower | Assurance | Observes coverage, risk, anomalies, and drift. |
| Governance Layer | Governance | Defines operating policies, controls, and accountability. |
| Audit & Verification | Assurance | Records verification events, evidence traces, and audit-ready proof. |
| Readiness Gate | Reporting | Determines whether information can enter reports, briefings, or public outputs. |
| Verified Aggregation | Data Operations | Aggregates only verified/readiness-approved records for downstream use. |
| Reports | Reporting | Communicates Truth Spine-approved facts and readiness status. |
| Funding Intelligence | Funding | Analyzes funding opportunities, fit, readiness, and decision support. |
| Public Approval | Governance | Controls external release and public-facing eligibility. |
| Narrative/Story | Communications | Manages approved stories, summaries, and narrative assets. |
| Partner/Institution | Operations | Manages partner organizations, institutions, relationships, and participation. |
| Security/Privacy | Security | Enforces privacy, data handling, access controls, and sensitive-data boundaries. |
| Data Ownership/IP | Governance | Tracks data ownership, usage rights, intellectual property, and release constraints. |
| Decision Journal | Governance | Records decisions, rationale, inputs, and replayable context. |
| Replay Engine | Assurance | Replays decisions or policy events for audit and regression checks. |
| Signed Manifest | Assurance | Locks declared system contracts, manifests, and release controls. |
| Self-Audit | Assurance | Runs internal integrity checks and publishes system self-checks. |
| Layer Control System | Platform | Controls layer registry, lifecycle, dependencies, and boundaries. |
| Context-Adaptive Analyst | AI Operations | Presents analyst guidance based on context, role, and verified inputs. |
| SHS Sales Layer | Revenue Operations | Manages SHS sales workflows, opportunities, proposals, and revenue operations. |
| Production Ops | Operations | Tracks internal production status, delivery work, and operational execution. |
| Development Library | Operations | Stores reusable build patterns, development assets, and implementation references. |
| QA + Delivery | Operations | Runs quality checks, delivery readiness, screenshot QA, and release signoff. |
| ClientOps | Operations | Manages client/project workflows, intake, referrals, reports, and service coordination. |
| Website Studio | Production | Builds and manages website/page production workflows. |
| Production Automation | Automation | Automates internal production workflows without bypassing review gates. |
| SHF Impact Command Center | SHF Impact | Coordinates SHF impact views, regional context, AI analyst context, and impact reporting. |
| Public Impact Map | SHF Impact | Displays public-safe, approved impact geography and map signals. |
| Career Pathways | Programs | Manages career pathway programming and workforce journey surfaces. |
| Program Registry | Programs | Registers programs, adapters, outcomes, and program metadata. |
| Sponsorship Layer | Funding | Manages sponsorship opportunities, packages, and sponsor-ready assets. |
| Grant/Proposal Layer | Funding | Manages grant proposals, binders, funding narratives, and proposal readiness. |
| Governance Binder | Governance | Publishes governance, protection, controls, and stakeholder-facing policy packets. |

## Layer Entries

### Identity & Access

- Layer Type: Security
- Owns: Authentication, roles, organizations, route access, and permission gates.
- Must Not Own: Claim verification, report readiness, public approval, or outcome ranking.
- Upstream: Governance Layer, Security/Privacy
- Downstream: API Gateway, Admin, Apps/Programs
- Cross-App Bridge Note: Cross-App Identity Bridge V1 is not a new layer; SHRV1 remains the Identity & Access authority and SHF-Next consumes route boundary metadata.
- Truth Spine Requirement: Must not mark claims verified, public-approved, or report-ready.
- Enforcement Status: Required

### API Gateway

- Layer Type: Platform
- Owns: API traffic routing, shared request policy, and route exposure boundaries.
- Must Not Own: Business truth, evidence support, risk decisions, or report approval.
- Upstream: Identity & Access, Alignment Layer
- Downstream: Apps/Programs, Reports, Watchtower, LOO
- Truth Spine Requirement: Must route Truth Spine requests without bypassing Truth Spine gates.
- Enforcement Status: Required

### Event/Webhook

- Layer Type: Platform
- Owns: Event receipt, webhook emission, and signal transport.
- Must Not Own: Verification state, public approval, or durable report facts.
- Upstream: Apps/Programs, Partner/Institution
- Downstream: Adapter Layer, Batch/Import, Watchtower
- Truth Spine Requirement: Events that become claims must be routed into Truth Spine or remain unverified.
- Enforcement Status: Required

### Batch/Import

- Layer Type: Data Operations
- Owns: File imports, bulk uploads, scheduled ingest, and import validation.
- Must Not Own: Final truth decisions, public approval, or narrative release.
- Upstream: Event/Webhook, Partner/Institution, Apps/Programs
- Downstream: Adapter Layer, Warehouse Sync, Truth Spine
- Truth Spine Requirement: Imported claims must include sources or enter Truth Spine as missing_source or draft.
- Enforcement Status: Required

### Source Registry Layer

- Layer Type: Data Operations
- Owns: Source identity, source type classification, owner/submitted-by metadata checks, provenance expectations, source warnings, source blockers, intake eligibility, evidence package eligibility, Truth Spine review eligibility, public approval consideration eligibility, and allowed downstream targets.
- Must Not Own: Truth verification, Truth Spine claim creation, public approval, Oracle rulings, Data Aggregator intake collection, Evidence Package bundling, Data Approval Gateway decisions, SHF Impact Data Spine mutation, report publishing, or final claim truth.
- Upstream: Batch/Import, Event/Webhook, Partner/Institution, Apps/Programs
- Downstream: Data Aggregator Layer, Data Normalization Layer, Evidence Package Layer, Data Verification Layer, Truth Spine, Oracle Layer, Data Approval Layer, Reports, Watchtower, LOO, Data Approval Gateway, SHF Impact Data Spine
- Truth Spine Requirement: May evaluate source eligibility and provenance completeness but cannot verify truth, write Truth Spine claims, public-approve records, or override Truth Spine decisions.
- Enforcement Status: Formalized V1

### Data Federation Layer

- Layer Type: Data Operations
- Owns: Source grouping, federation set readiness, cross-source compatibility checks, cross-source provenance completeness, lineage presence checks, source conflict warnings, trust-tier mismatch warnings, and routing eligible source groups toward Data Aggregator.
- Must Not Own: Source Registry source identity authority, Data Aggregator intake collection, Truth Spine claim verification, Truth Spine persistence, public approval, Oracle rulings, Data Approval Gateway decisions, SHF Impact Data Spine mutation, report publishing, or final claim truth.
- Upstream: Source Registry Layer, Batch/Import, Event/Webhook, Partner/Institution, Apps/Programs
- Downstream: Data Aggregator Layer, Data Normalization Layer, Evidence Package Layer, Data Verification Layer, Truth Spine, Oracle Layer, Data Approval Layer, Reports, Watchtower, LOO, Data Approval Gateway, SHF Impact Data Spine
- Truth Spine Requirement: May group and route source sets toward Data Aggregator but cannot verify truth, write Truth Spine claims, public-approve records, or override Truth Spine decisions.
- Enforcement Status: Formalized V1

### Data Aggregator Layer

- Layer Type: Data Operations
- Owns: Intake collection, source/provenance metadata capture, intake classification, aggregation readiness, and routing eligible inputs toward Data Normalization, Evidence Package, Truth Spine, Reports, Watchtower, and SHF Impact Data Spine.
- Must Not Own: Truth verification, Source Registry authority, canonical normalization, public approval, report publication, Oracle rulings, Watchtower risk decisions, LOO ranking, or SHF Impact Data Spine structures.
- Upstream: Batch/Import, Event/Webhook, Apps/Programs, Partner/Institution, SHF Impact Data Spine
- Downstream: Adapter Layer, Warehouse Sync, Truth Spine, Reports, Watchtower, SHF Impact Data Spine
- Truth Spine Requirement: Must send claim-like data to Truth Spine with source/provenance metadata and must mark missing-source/provenance inputs as blocked or draft; cannot verify, public-approve, or mark report-ready.
- Enforcement Status: Formalized V1

### Data Normalization Layer

- Layer Type: Data Operations
- Owns: Field alias normalization, basic data type normalization, canonical entity classification, missing-field detection, ambiguous entity warnings, provenance preservation, normalized previews, and readiness signals for Evidence Package and Truth Spine review.
- Must Not Own: Truth verification, public approval, Source Registry authority, Evidence Package authority, final claim creation, report publication, Oracle rulings, Watchtower risk decisions, LOO ranking, or SHF Impact Data Spine structures.
- Upstream: Data Aggregator Layer, Batch/Import, Apps/Programs, Source Registry
- Downstream: Evidence Package, Truth Spine, Reports, Watchtower, LOO, SHF Impact Data Spine, Data Approval Gateway
- Truth Spine Requirement: Must preserve source/provenance metadata and may only mark normalized previews ready for Truth Spine review; cannot verify, public-approve, or mark report-ready.
- Enforcement Status: Formalized V1

### Evidence Package Layer

- Layer Type: Data Operations
- Owns: Bundling normalized records, source metadata, provenance metadata, evidence references, completeness scoring, blocker detection, missing evidence warnings, missing provenance blockers, missing source blockers, and review readiness for Truth Spine submission.
- Must Not Own: Truth verification, public approval, Source Registry authority, Data Normalization authority, final claim verification, report publication, Oracle rulings, Watchtower risk decisions, LOO ranking, Data Approval Gateway decisions, or SHF Impact Data Spine structures.
- Upstream: Data Normalization Layer, Data Aggregator Layer, Source Registry
- Downstream: Truth Spine, Oracle Layer, Reports, Watchtower, LOO, Data Approval Gateway, SHF Impact Data Spine
- Truth Spine Requirement: May prepare review-ready packages for Truth Spine but cannot verify truth, create verified claims, public-approve records, or mark report-ready.
- Enforcement Status: Formalized V1

### Data Verification Layer

- Layer Type: Data Operations
- Owns: Evidence Package readiness evaluation, evidence completeness inspection, source metadata quality, provenance quality, readiness scoring, blockers, warnings, recommended review action, and preparation for Truth Spine review.
- Must Not Own: Final truth verification, Truth Spine claim creation, Truth Spine persistence, public approval, report readiness, Oracle rulings, Watchtower risk decisions, LOO ranking, Data Approval Gateway decisions, or SHF Impact Data Spine structures.
- Upstream: Evidence Package Layer, Data Normalization Layer, Data Aggregator Layer, Source Registry
- Downstream: Truth Spine, Oracle Layer, Reports, Watchtower, LOO, Data Approval Gateway, SHF Impact Data Spine
- Truth Spine Requirement: May evaluate readiness for Truth Spine but cannot verify truth, write Truth Spine claims, public-approve records, or override Truth Spine decisions.
- Enforcement Status: Formalized V1

### Data Approval Layer

- Layer Type: Data Operations
- Owns: Approval candidate evaluation, Truth Spine status inspection, Oracle supportability inspection, Data Verification status inspection, evidence/provenance presence checks, approval readiness scoring, blockers, warnings, recommended approval action, and preparation for Data Approval Gateway review.
- Must Not Own: Truth verification, Truth Spine claim creation, Truth Spine persistence, Oracle rulings, SHF Impact Data Spine mutation, public report publishing, final public approval, human review replacement, Data Approval Gateway replacement, or Identity bypasses.
- Upstream: Truth Spine, Oracle Layer, Data Verification Layer, Evidence Package Layer
- Downstream: Data Approval Gateway, SHF Impact Data Spine, Reports, Watchtower, LOO, Public Impact Map
- Truth Spine Requirement: May evaluate approval readiness from Truth Spine metadata but cannot verify truth, override Truth Spine, mark records public-approved, or mutate public impact data.
- Enforcement Status: Formalized V1

### Warehouse Sync

- Layer Type: Data Operations
- Owns: Moving normalized records into durable reporting and analysis stores.
- Must Not Own: Verification rules, public release decisions, or layer governance.
- Upstream: Batch/Import, Adapter Layer, Verified Aggregation
- Downstream: Reports, Funding Intelligence, Watchtower
- Truth Spine Requirement: Public/reporting datasets must preserve Truth Spine status metadata.
- Enforcement Status: Required

### Apps/Programs

- Layer Type: Product
- Owns: Operational workflows, app signals, and program-specific user activity.
- Must Not Own: Cross-system truth, public approval, or official reporting readiness.
- Upstream: Identity & Access, Program Registry
- Downstream: Adapter Layer, Event/Webhook, ClientOps
- Truth Spine Requirement: App facts are signals until Truth Spine verifies them.
- Enforcement Status: Required

### Adapter Layer

- Layer Type: Platform
- Owns: Converting app/program data into canonical SHS contracts.
- Must Not Own: Truth evaluation, report communication, or public approval.
- Upstream: Apps/Programs, Batch/Import, Program Registry
- Downstream: Truth Spine, LOO, Watchtower
- Truth Spine Requirement: Claim-like adapter output must carry source references into Truth Spine.
- Enforcement Status: Required

### Truth Spine

- Layer Type: Verification
- Owns: Claims, sources, trace coverage, Truth Packages, replay, public approval status, and report readiness.
- Must Not Own: Evidence-support reasoning, outcome ranking, UI-only narratives, or funding strategy.
- Upstream: Adapter Layer, ClientOps, Batch/Import
- Downstream: Reports, Watchtower, LOO, Oracle Layer, Verified Aggregation
- Truth Spine Requirement: This is the canonical authority.
- Enforcement Status: Frozen V1

### Oracle Layer

- Layer Type: Decision Support
- Owns: Evidence-support reasoning over verified Truth Packages.
- Must Not Own: Claim verification, package signing, public approval, or source creation.
- Upstream: Truth Spine, Reports
- Downstream: Context-Adaptive Analyst, Funding Intelligence, Governance Binder
- Truth Spine Requirement: May reason only over Truth Packages for report/public decisions.
- Enforcement Status: Registered, Not Built

### Game Theory Layer

- Layer Type: Strategy
- Owns: Incentive modeling, adversarial pressure analysis, and decision scenarios.
- Must Not Own: Truth verification, public approval, or report readiness.
- Upstream: Truth Spine, Oracle Layer, Governance Layer
- Downstream: Funding Intelligence, Governance Binder, Alignment Layer
- Truth Spine Requirement: Strategy inputs used in reports must trace to verified Truth Spine packages.
- Enforcement Status: Registered, Not Built

### AI/Swarm Layer

- Layer Type: Automation
- Owns: Summaries, assistance, coordination, and agent task support.
- Agent Fabric/Governance Boundary: Agent Fabric is an AI/Swarm operating capability governed by this layer, Governance Layer policy, and Layer Control System registry enforcement; it is not a separate unregistered layer.
- Must Not Own: Verification, approval, report readiness, or architecture registration.
- Upstream: Truth Spine, Alignment Layer, Context-Adaptive Analyst
- Downstream: Apps/Programs, Reports, ClientOps
- Truth Spine Requirement: Published AI output must attach a Truth Envelope before publication.
- Enforcement Status: Registered

### Alignment Layer

- Layer Type: Governance
- Owns: Allowed actions, containment, policy alignment, and action gates.
- Must Not Own: Claim truth, outcome ranking, or report authorship.
- Upstream: Governance Layer, Security/Privacy
- Downstream: API Gateway, AI/Swarm Layer, Production Automation
- Truth Spine Requirement: Must block actions that bypass Truth Spine for verified/public/report-ready claims.
- Enforcement Status: Required

### LOO

- Layer Type: Outcomes
- Owns: Outcome ranking, scoring, and trust metadata display.
- Must Not Own: Verification, source status, or public approval.
- Upstream: Adapter Layer, Truth Spine, Program Registry
- Downstream: Reports, Funding Intelligence, Watchtower
- Truth Spine Requirement: Must expose trust metadata and defer report/public gates to Truth Spine.
- Enforcement Status: Required

### Watchtower

- Layer Type: Assurance
- Owns: Coverage monitoring, risk observation, anomaly flags, and drift findings.
- Must Not Own: Truth decisions, public approval, or outcome ranking.
- Upstream: Truth Spine, LOO, Warehouse Sync
- Downstream: Governance Layer, Reports, Self-Audit
- Truth Spine Requirement: Must monitor missing Truth coverage and unsafe reporting paths.
- Enforcement Status: Required

### Governance Layer

- Layer Type: Governance
- Owns: Operating policies, controls, accountability, and governance requirements.
- Must Not Own: App workflows, truth verification, or API routing.
- Upstream: Master Layer Registry, Security/Privacy
- Downstream: Alignment Layer, Public Approval, Governance Binder
- Truth Spine Requirement: Must require Truth Spine for verified/public/report-ready claims.
- Enforcement Status: Required

### Audit & Verification

- Layer Type: Assurance
- Owns: Audit event records, audit completeness validation, layer/event classification, provenance/evidence trace checks, before/after decision checks, completeness scoring, missing trace detection, coverage by layer, trace readiness, and replay readiness.
- Must Not Own: Final truth verification, Truth Spine claim creation or persistence, public approval, Oracle rulings, Watchtower monitoring replacement, Reports replacement, Agent event ledger replacement, SHF Impact Data Spine mutation, product workflow, or narrative communication.
- Upstream: Source Registry, Data Federation, Data Aggregator, Data Normalization, Evidence Package, Data Verification, Truth Spine, Oracle Layer, Data Approval Layer, Reports, Watchtower, Agent Fabric
- Downstream: Reports, Watchtower, Self-Audit, Governance Binder, Replay Engine, Signed Manifest
- Truth Spine Requirement: May verify audit completeness and traceability only; cannot verify truth, write Truth Spine claims, public-approve records, or override Truth Spine.
- Enforcement Status: Formalized V1

### Readiness Gate

- Layer Type: Governance
- Owns: Cross-layer transition requests, producer/consumer layer checks, required readiness field checks, transition status, blocker and warning surfacing, blocker owner assignment, next-action recommendations, and forward-movement eligibility.
- Must Not Own: Truth verification, Truth Spine claim creation or persistence, public approval, Oracle rulings, Data Approval Gateway decisions, Audit & Verification replacement, Watchtower replacement, SHF Impact Data Spine mutation, report publishing, or final claim authority.
- Upstream: Source Registry, Data Federation, Data Aggregator, Data Normalization, Evidence Package, Data Verification, Truth Spine, Oracle Layer, Data Approval Layer, Data Approval Gateway, Audit & Verification, Reports, Watchtower
- Downstream: Data Federation, Data Aggregator, Data Normalization, Evidence Package, Data Verification, Truth Spine, Oracle Layer, Data Approval Layer, Data Approval Gateway, SHF Impact Data Spine, Reports, Watchtower, LOO, Verified Aggregation
- Truth Spine Requirement: May decide if an output can move to the next layer, but cannot verify truth, write Truth Spine claims, mark records public-approved, override Truth Spine, override Oracle, or mutate SHF Impact Data Spine.
- Enforcement Status: Formalized V1

### Verified Aggregation

- Layer Type: Data Operations
- Owns: Aggregating verified/readiness-approved records for downstream use.
- Must Not Own: Draft claims, public approval decisions, or source verification.
- Upstream: Truth Spine, Readiness Gate, Warehouse Sync
- Downstream: Reports, Funding Intelligence, SHF Impact Command Center
- Truth Spine Requirement: Must aggregate only verified/readiness-approved Truth Spine records.
- Enforcement Status: Required

### Reports

- Layer Type: Reporting
- Owns: Communicating verified facts, readiness status, exports, and snapshots.
- Must Not Own: Claim verification, source verification, or approval override.
- Upstream: Truth Spine, Readiness Gate, Verified Aggregation
- Downstream: Governance Binder, Funding Intelligence, Public Impact Map
- Truth Spine Requirement: Must display Truth metadata and communicate only approved information.
- Enforcement Status: Required

### Funding Intelligence

- Layer Type: Funding
- Owns: Funding opportunity analysis, fit, readiness, and decision support.
- Must Not Own: Verified claim creation, public approval, or source verification.
- Upstream: Truth Spine, Reports, LOO
- Downstream: Grant/Proposal Layer, Sponsorship Layer, Governance Binder
- Truth Spine Requirement: Funding claims and report outputs must carry Truth metadata.
- Enforcement Status: Required

### Public Approval

- Layer Type: Governance
- Owns: Public release readiness evaluation, Data Approval state inspection, Data Approval Gateway status inspection, Truth Spine status inspection, Oracle supportability inspection, Readiness Gate status inspection, evidence/provenance completeness checks, privacy/security review checks, blockers, warnings, and public-ready candidate recommendation.
- Must Not Own: Truth verification, Truth Spine claim creation or persistence, Oracle rulings, Data Approval Layer replacement, Data Approval Gateway replacement, SHF Impact Data Spine mutation, direct public-approved record writes, report publishing, human review replacement, source verification, or outcome ranking.
- Upstream: Data Approval Layer, Data Approval Gateway, Truth Spine, Oracle Layer, Readiness Gate, Audit & Verification, Security/Privacy, Governance Layer
- Downstream: SHF Impact Data Spine, Reports, Watchtower, LOO, Public Impact Map, Narrative/Story, Governance Binder
- Truth Spine Requirement: May evaluate public release readiness from Truth Spine metadata but cannot verify truth, override Truth Spine, mark records public-approved in V1, or mutate public impact data.
- Enforcement Status: Formalized V1

### Narrative/Story

- Layer Type: Communications
- Owns: Approved stories, summaries, narrative assets, and communication framing.
- Must Not Own: Truth verification, public approval, or source creation.
- Upstream: Truth Spine, Public Approval, Reports
- Downstream: Governance Binder, Sponsorship Layer, Public Impact Map
- Truth Spine Requirement: Public narratives must use verified/public-approved Truth Spine claims.
- Enforcement Status: Required

### Partner/Institution

- Layer Type: Operations
- Owns: Partner organizations, institutions, relationships, and participation records.
- Must Not Own: Claim verification, report readiness, or public release.
- Upstream: Identity & Access, ClientOps
- Downstream: Event/Webhook, Batch/Import, Apps/Programs
- Truth Spine Requirement: Partner facts used publicly must become Truth Spine claims with sources.
- Enforcement Status: Required

### Security/Privacy

- Layer Type: Security
- Owns: Privacy risk evaluation, security risk evaluation, simple PII indicator detection, sensitive category indicator detection, secret/token exposure detection, redaction recommendations, access restriction recommendations, public-safe candidate status, and exposure blockers before public-facing use.
- Must Not Own: Claim truth, Truth Spine claim creation or persistence, Oracle rulings, public approval, public-approved record writes, SHF Impact Data Spine mutation, report publishing, Identity & Access replacement, role/permission replacement, Data Approval Gateway replacement, outcome ranking, or funding strategy.
- Upstream: Governance Layer, Data Ownership/IP, Identity & Access, Data Approval Layer, Readiness Gate, Public Approval, Audit & Verification
- Downstream: Public Approval, Data Approval Gateway, SHF Impact Data Spine, Reports, Watchtower, LOO, Public Impact Map, Identity & Access
- Truth Spine Requirement: Must block or require review for private/sensitive/security-exposed data before it is released through Truth Spine-approved reports or public surfaces.
- Enforcement Status: Formalized V1

### Data Ownership/IP

- Layer Type: Governance
- Owns: Ownership readiness evaluation, source owner inspection, submitter inspection, usage-right checks, license readiness checks, reuse eligibility, reporting eligibility, public-release rights, attribution needs, consent needs, third-party IP indicators, blockers, warnings, and ownership-clear candidate recommendation.
- Must Not Own: Legal advice, Truth verification, Truth Spine claim creation or persistence, Oracle rulings, public approval, public-approved record writes, SHF Impact Data Spine mutation, report publishing, Security / Privacy replacement, Source Registry replacement, role/permission replacement, Data Approval Gateway replacement, route access, or report generation.
- Upstream: Source Registry, Security/Privacy, Data Approval Layer, Readiness Gate, Public Approval, Data Ownership/IP policy, Governance Layer
- Downstream: Public Approval, Data Approval Gateway, SHF Impact Data Spine, Reports, Watchtower, LOO, ClientOps, Governance Binder
- Truth Spine Requirement: Truth Spine publication must respect ownership, usage rights, attribution, consent, and release constraints before public or reporting use.
- Enforcement Status: Formalized V1

### Decision Journal

- Layer Type: Governance
- Owns: Decision records, rationale, inputs, and replayable context.
- Must Not Own: Claim verification, report publication, or source approval.
- Upstream: Oracle Layer, Alignment Layer, Governance Layer
- Downstream: Replay Engine, Governance Binder, Self-Audit
- Truth Spine Requirement: Decisions involving facts must cite Truth Spine claims or packages.
- Enforcement Status: Required

### Replay Engine

- Layer Type: Assurance
- Owns: Replaying decisions, policy events, and audit/regression context.
- Must Not Own: Current truth state, approval override, or report authorship.
- Upstream: Truth Spine, Decision Journal, Audit & Verification
- Downstream: Self-Audit, Governance Binder, Watchtower
- Truth Spine Requirement: Truth replay must not override current Truth Spine claim state.
- Enforcement Status: Required

### Signed Manifest

- Layer Type: Assurance
- Owns: Locked system contracts, manifests, release controls, and signature checks.
- Must Not Own: Claim verification, app workflow, or public narrative.
- Upstream: Layer Control System, Governance Layer
- Downstream: Audit & Verification, Self-Audit, API Gateway
- Truth Spine Requirement: Truth Spine route/package contracts must remain declared and signed where applicable.
- Enforcement Status: Required

### Self-Audit

- Layer Type: Assurance
- Owns: Internal integrity checks and system self-check publication.
- Must Not Own: Remediation ownership, public approval, or verification overrides.
- Upstream: Watchtower, Signed Manifest, Audit & Verification
- Downstream: Governance Binder, Governance Layer
- Truth Spine Requirement: Must include Truth Spine freeze and registry checks.
- Enforcement Status: Required

### Layer Control System

- Layer Type: Platform
- Owns: Layer registry, lifecycle, dependencies, and boundary enforcement.
- Must Not Own: Product features, claim verification, or report content.
- Upstream: Master Layer Registry, Governance Layer
- Downstream: Signed Manifest, API Gateway, Self-Audit
- Truth Spine Requirement: Must prevent unregistered layers from bypassing Truth Spine.
- Enforcement Status: Required

### Context-Adaptive Analyst

- Layer Type: AI Operations
- Owns: Contextual analyst guidance based on role, context, and verified inputs.
- Must Not Own: Claim verification, public approval, or independent AI publication gates.
- Upstream: Truth Spine, Oracle Layer, AI/Swarm Layer
- Downstream: Reports, ClientOps, Funding Intelligence
- Truth Spine Requirement: Analyst guidance used publicly must attach Truth Spine metadata.
- Enforcement Status: Required

### SHS Sales Layer

- Layer Type: Revenue Operations
- Owns: Sales workflows, opportunities, proposals, and revenue operations.
- Must Not Own: Client truth verification, public reports, or delivery QA.
- Upstream: ClientOps, Funding Intelligence
- Downstream: Reports, Sponsorship Layer, Grant/Proposal Layer
- Truth Spine Requirement: Sales claims used in proposals must trace to Truth Spine.
- Enforcement Status: Required

### Production Ops

- Layer Type: Operations
- Owns: Internal production status, delivery work, and operational execution.
- Must Not Own: Public claims, report approval, or truth decisions.
- Upstream: Development Library, ClientOps, QA + Delivery
- Downstream: Website Studio, Production Automation, Reports
- Truth Spine Requirement: Delivery facts used externally must be Truth Spine claims.
- Enforcement Status: Required

### Development Library

- Layer Type: Operations
- Owns: Reusable build patterns, development assets, and implementation references.
- Must Not Own: Runtime verification, public approval, or route authority.
- Upstream: Layer Control System, Production Ops
- Downstream: Website Studio, Production Automation, QA + Delivery
- Truth Spine Requirement: Build patterns must not create alternate truth gates.
- Enforcement Status: Required

### QA + Delivery

- Layer Type: Operations
- Owns: Quality checks, delivery readiness, screenshot QA, and release signoff.
- Must Not Own: Truth verification, public approval, or registry ownership.
- Upstream: Production Ops, Development Library, Signed Manifest
- Downstream: Reports, Website Studio, Self-Audit
- Truth Spine Requirement: QA must verify Truth metadata is present where reporting/public output exists.
- Enforcement Status: Required

### ClientOps

- Layer Type: Operations
- Owns: Client/project workflows, intake, referrals, reports, and service coordination.
- Must Not Own: Final truth decisions, public approval, or source verification.
- Upstream: Identity & Access, Partner/Institution, SHS Sales Layer
- Downstream: Truth Spine, Reports, Production Ops
- Truth Spine Requirement: Client/project facts remain internal until Truth Spine evaluates them.
- Enforcement Status: Required

### Website Studio

- Layer Type: Production
- Owns: Website/page production workflows and managed page delivery.
- Must Not Own: Truth verification, public approval, or ClientOps private data release.
- Upstream: Production Ops, Development Library, QA + Delivery
- Downstream: Reports, Public Impact Map, Narrative/Story
- Truth Spine Requirement: Published factual claims must use Truth Spine-approved metadata.
- Enforcement Status: Required

### Production Automation

- Layer Type: Automation
- Owns: Internal production workflow automation and task execution support.
- Must Not Own: Human approval bypass, truth verification, or public release.
- Upstream: Alignment Layer, Production Ops, Development Library
- Downstream: QA + Delivery, Website Studio, ClientOps
- Truth Spine Requirement: Automation must not publish claims without Truth Spine approval.
- Enforcement Status: Required

### SHF Impact Command Center

- Layer Type: SHF Impact
- Owns: SHF impact views, regional context, analyst context, and impact reporting coordination.
- Must Not Own: Source verification, public approval, or independent report readiness.
- Upstream: Verified Aggregation, Reports, Public Impact Map
- Downstream: Funding Intelligence, Governance Binder, Reports
- Truth Spine Requirement: Impact reporting must use verified/readiness-approved Truth Spine facts.
- Enforcement Status: Required

### Public Impact Map

- Layer Type: SHF Impact
- Owns: Public-safe approved impact geography and map signals.
- Must Not Own: Raw private data, claim verification, or approval override.
- Upstream: Public Approval, Verified Aggregation, Reports
- Downstream: SHF Impact Command Center, Narrative/Story
- Truth Spine Requirement: Public map facts must be public-approved Truth Spine claims.
- Enforcement Status: Required

### Career Pathways

- Layer Type: Programs
- Owns: Career pathway programming and workforce journey surfaces.
- Must Not Own: Cross-program truth, public approval, or reporting gates.
- Upstream: Program Registry, Apps/Programs, ClientOps
- Downstream: Adapter Layer, Reports, LOO
- Truth Spine Requirement: Program facts used externally must enter Truth Spine with sources.
- Enforcement Status: Required

### Program Registry

- Layer Type: Programs
- Owns: Program registration, adapters, outcomes, and program metadata.
- Must Not Own: Claim verification, report publication, or public approval.
- Upstream: Apps/Programs, Governance Layer
- Downstream: Adapter Layer, LOO, Career Pathways
- Truth Spine Requirement: Program metadata used as report facts must be Truth Spine-verifiable.
- Enforcement Status: Required

### Sponsorship Layer

- Layer Type: Funding
- Owns: Sponsorship opportunities, packages, and sponsor-ready assets.
- Must Not Own: Verified impact claims, public approval, or source status.
- Upstream: Funding Intelligence, Reports, Narrative/Story
- Downstream: SHS Sales Layer, Governance Binder
- Truth Spine Requirement: Sponsor-facing factual claims must be public-approved Truth Spine claims.
- Enforcement Status: Required

### Grant/Proposal Layer

- Layer Type: Funding
- Owns: Grant proposals, binders, funding narratives, and proposal readiness.
- Must Not Own: Claim verification, source verification, or public approval override.
- Upstream: Funding Intelligence, Reports, Governance Binder
- Downstream: SHS Sales Layer, Sponsorship Layer
- Truth Spine Requirement: Proposal claims must include Truth metadata and readiness status.
- Enforcement Status: Required

### Governance Binder

- Layer Type: Governance
- Owns: Governance packets, protection controls, stakeholder policy packets, and accountability evidence.
- Must Not Own: App workflows, claim verification, or outcome ranking.
- Upstream: Governance Layer, Reports, Audit & Verification
- Downstream: Funding Intelligence, Public Approval, Self-Audit
- Truth Spine Requirement: Governance evidence must cite Truth Spine claims, packages, or replay records.
- Enforcement Status: Required

## Boundary Tests

- If the work verifies truth, it belongs in Truth Spine.
- If the work decides what evidence supports, it belongs in Oracle Layer.
- If the work watches coverage or risk, it belongs in Watchtower.
- If the work ranks outcomes, it belongs in LOO.
- If the work controls what actions are allowed, it belongs in Alignment Layer.
- If the work communicates externally, it must pass Reports and Public Approval gates.
- If the work only produces operational signals, it belongs in Apps/Programs or an app-specific layer.
