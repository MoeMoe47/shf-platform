# OAS normative requirement writing standard

Editorial proposal for OAS review. Authoring language is not an adoption decision. The canonical proposed requirements are `standards/oas/authoring/first-release.json`; generated human views are `docs/OAS_FIRST_REQUIREMENTS_REVIEW.md` and the review-package domain files. The published catalog remains `standards/oas/catalog.json`. These are authoring and publication stages of one standard, not competing adopted catalogs.

## Required record

Each requirement records a unique immutable reserved ID, short title, normative_text, canonical domain_id, explicit applicability, requirement_level, rationale, implementation_notes, evidence_expectations, verification_notes, version_introduced, status, source references, supersedes/superseded_by and review decision. Drafts have version_introduced/release_id null and an explicitly proposed version. A proposal is never bound to the old published draft as if it already belonged there. On a separately authorized publication, a valid release relationship and adopted-status mapping must be established using the canonical catalog contract. The current candidate schema cannot represent a released requirement.

Use the established `OAS-1-REQ-####` serial format. Domain membership is a separate field; do not switch to OAS-1-D01-R001. Reserve serials 0001–0017 in this authoring source. Do not recycle rejected IDs; retain their disposition. R0–R4 is not an ID, maturity tier, certification level or automatically applicable requirement level.

## Writing an obligation

Name the obligated actor, triggering condition/scope, action and inspectable object. Use one primary obligation per statement. Every term affecting the obligation must be explained in applicability, a definition or the statement. A provider is the person or organization making the declaration; the described system version and operating scope are those named by that provider. A description record is the provider's identified documentation for that version/scope, not a Registry-issued record. A reference identifies a document, artifact or record without implying successful verification or mandatory public access.

MUST is a mandatory obligation within stated applicability; MUST NOT prohibits the stated action. SHOULD/SHOULD NOT permits a justified exception that must be reviewed under the adopted exception policy; do not use these words without an exception rationale and decision rule. MAY permits an optional action and does not imply assessment. This authoring set uses MUST only; no externally adopted keyword standard is claimed. Quoted lowercase source “must” is authoring evidence, not evidence of adoption.

Prefer “The provider MUST document the intended goals and use cases ...” over “Agents should be safe.” Avoid undefined adjectives such as appropriate, sufficient, regular, robust or secure in the obligation. Define triggers instead of inventing arbitrary time intervals. Do not transform an informal risk matrix into a quantified duty. Separate a documented mechanism from demonstrated runtime effectiveness. Avoid two independently failing obligations under one ID unless they form one inspectable record.

Normative text is the obligation. Rationale explains purpose; implementation notes suggest implementation; evidence expectations describe inspectable support; verification notes describe a possible evaluation method. Those non-normative fields must not quietly add new obligations. Source references must quote real baseline text and state whether the source was descriptive or adopted. Each proposal must explain the authored interpretation. No copied marketing promise becomes a binding rule by changing a keyword.

## Applicability and declarations

A candidate currently applies to provider-authored description records for a declared system version/scope. This limited baseline does not guarantee safe or interoperable runtime behavior. Whether a documentation baseline alone is an adequate first OAS standard is Q12; do not infer completeness from eight-domain coverage. Unclear actor/applicability is an adoption blocker, not a placeholder exemption.

For every requirement a proposed review declaration can state applicable (scope assertion only), not_applicable (reason required), declared_satisfied (provider assertion with offered evidence refs), not_declared (no satisfaction assertion) or unknown (undetermined). All remain NOT_EVALUATED. An absent entry is not_declared as a consumer interpretation, never satisfied; validators do not silently add entries. No state produces PASS/FAIL, a score, certification or Trust Bureau opinion. Applicability disputes require review. `declared_by` is attribution text, not authenticated identity proof.

The unchanged published declaration v1 cannot express these per-requirement states and rejects candidate requirement IDs because they are not published members. A separate closed review-only declaration proposal under `schemas/oas/review/declaration.schema.json`, version 1.1.0-review.1, pins the authoring checksum and individual statement checksum. It is not a new production declaration interface. Adoption requires an explicit versioned migration of the published declaration contract; old declarations remain valid under their old schema. Profiles stay null/empty.

## Evidence and independent evaluation

Expected evidence may include configuration, policy, interface, audit, test, capability manifest and provenance references. Protect secrets/private evidence; a reference does not require publishing content. Evidence presence is not truth, sufficiency or conformance. An evaluation compares implemented behavior against adopted criteria and evidence; no evaluator or automatic decision is introduced. Trust Bureau independently owns trust/assessment opinions. Certification would require a separate explicitly adopted scheme and authorized issuer; none exists here. Registry registration is not an OAS determination.

## Review and change control

Each ID is approved, rejected or deferred by an actual authorized reviewer with timestamp, reason, record reference and exact statement checksum. No decisions are prefilled. Editing approved wording invalidates its decision. Resolved questions need an external documented disposition before adoption; setting a machine field alone is not proof of governance.

After publication, normative text under an ID must not silently change. Editorial clarification that can affect interpretation requires an explicit version/change entry and review. Material changes allocate a new serial with supersession links and a new standard release; preserve the old text, artifact, declaration pins and migration guidance. Existing schemas do not support implicit cross-release applicability. Future extensions require explicit versioned contracts, never silent carry-over. Historical pins remain reproducible.
