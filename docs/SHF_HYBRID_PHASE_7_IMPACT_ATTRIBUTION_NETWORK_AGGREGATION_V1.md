# SHF Hybrid Phase 7: Impact Attribution & Network Aggregation V1

## Canonical Ownership

Phase 7 does not create a second impact, evidence, truth, or metric pipeline. Impact attribution is a read-only reporting projection over canonical `curriculum_truth_facts`, with lineage back to `evidence_id`, `source_type`, and `source_record_id` where present.

Operational Event domains continue to own activity creation. Evidence owns verifiable source provenance. Truth owns accepted institutional facts. Metric query semantics determine which canonical facts are counted. Reporting/Impact Attribution owns authorized aggregation presentation.

## Producing Organization

`producer_organization_id` means the organization whose controlled program or activity produced the underlying fact. It is server-derived by the attribution service.

Derivation order:

1. For program-backed facts, use `programs.operator_organization_id`, falling back to the program's `organization_id`.
2. For non-program facts, use the canonical Truth fact's `organization_id`.

The browser cannot send producer identity, support qualification, direct classification, or verified state as authority.

## Stewardship Distinctions

Program owner, operator, and accountable organization remain distinct. A SHF-owned or SHF-accountable program operated by a network organization remains direct impact of the operator for direct-delivery attribution. SHF may aggregate the fact only through supported-network semantics when support qualification exists.

## Direct vs Supported Impact

Direct SHF impact requires `producer_organization_id = org_shf_001`.

SHF-Supported Network impact may include independently produced facts when one or more qualifying support reasons is active for the fact's timestamp. Supported aggregation never rewrites the producer.

Whole Network is Direct SHF plus supported independent network facts. The same fact contributes once even when it qualifies through multiple support reasons.

## Support Qualification

Phase 7 support reasons are:

- `NETWORK_MEMBERSHIP`: active `NETWORK_MEMBER_OF` relationship from producer to SHF covering the fact timestamp.
- `INCUBATION`: active `INCUBATES` relationship from SHF to producer covering the fact timestamp.
- `SERVICE_AGREEMENT`: active SHF provider service agreement for the producer covering the fact timestamp.
- `FUNDING`: active/awarded/closed funding relationship or grant program allocation covering the fact timestamp.

Inactive relationships, suspended service agreements, terminated service agreements, and facts outside effective windows do not qualify through that reason.

## Historical Qualification

Relationship, agreement, and grant support are evaluated against the fact timestamp and each domain's effective interval. Current platform membership alone is not enough to qualify historical activity.

## Metric Reuse

V1 exposes query semantics over canonical Truth facts:

- `truth.fact_count`
- `lesson_completion.count`
- `project_accepted.count`

These are filters over canonical source facts, not new metric definitions such as `shf_participants_served` or `supported_participants_served`.

## Deduplication and Lineage

The deduplication key is `curriculum_truth_facts.truth_fact_id`. Support reasons are attached to that fact and may be multiple, but metric contribution remains one. Internal responses preserve source lineage through fact ID, source type, source record ID, evidence ID when available, producer, program, stewardship fields, support classification, and support reasons.

## Truth / Evidence Boundary

Attribution derives from canonical Truth facts. Draft, reviewable, or unprojected Evidence rows are not counted as verified impact. Reading attribution data creates no Evidence, Truth, completion, credential, funding, agreement, relationship, or onboarding records.

## Privacy and Authorization

`impact.aggregate.view` is required for the attribution endpoint. Organization actors with that permission may view their own organization scope. Whole-network, Direct SHF, and SHF-Supported Network scopes require SHF active organization or platform authority.

Network organization actors cannot inspect another organization's raw attribution detail through the endpoint. SHF aggregate users receive lineage fields needed for governance, not participant-level private payloads.

## Boundaries

Funding can qualify support but never determines producer. A grant recipient is not automatically the producing organization.

Service agreements can qualify support but never determine producer. A service provider is not automatically the producing organization.

Network membership can qualify supported aggregation but never makes member activity SHF direct delivery.

Public reporting remains separate. Phase 7 does not redesign public impact numbers or public reporting approval.

Billing, invoicing, subscriptions, payments, SHF/SHS settlement, procurement, final funder dashboards, storytelling, benchmarking, forecasting, AI narratives, facilities, and national scaling are deferred.

## Phase 8 Entry Contract

Phase 8 may consume canonical Organizations, Programs, Funding relationships, Service agreements, Impact attribution, Truth/Evidence, Metric Registry semantics, and Reporting Service to produce organization, program, funder, SHF direct, SHF-supported network, and public-approved impact reports without redefining metrics or corrupting producer attribution.
