# Declaration contract 1.1.0 review

Review target: `1e3b4cad34257f207d8adf3d1afb51cc2b1bd2d8`. Accepted content source: `517cc23426e7485c352a1672c8fe4614291d552a`. Review branch: `review/oas-1.0.0-rc.1-final-validation`.

This is a fresh Codex repository review, not a human adoption decision, implementation certification or external standards consensus. RC1 is immutable; no issued source, schema, membership or artifact is edited.

Contract: docs/OAS_DECLARATION_CONTRACT.md; strict Draft 2020-12 schema schemas/oas/closure/declaration.schema.json; ID urn:oas:schema:closure:declaration:1; schema_version=1.1.0. The RC pins that schema ID and accepted contract checksum. Current-scope and release tests exercise both valid and invalid records against the actual RC, not only synthetic release identifiers.

| Concern | Contract/schema/semantic behavior | Review |
| --- | --- | --- |
| Provider assertion | Per member: declared_satisfied / not_declared / unknown; top-level declared / withdrawn is the statement's state | PASS: does not define system conformance |
| Attribution | Required declarant identity_reference, reference_kind and declaration timestamp; no automatic identity authentication | PASS within an attributed-claim model; caller must retain the real provider/record source |
| Exact version | standard_id=OAS-1 and exact release_id; semantic validator requires the supplied authoritative release's exact standard/release pin | PASS; do not use a floating latest or an arbitrary unvalidated catalog |
| Scope | Explicit declaration_scope plus version/scope-specific provider description and pinned references | PASS; a nonempty scope field is not proof that the provider described it adequately |
| Membership | Exact coverage of all 14 members, no duplicates, no deferred/unknown IDs, resolved offered-evidence references | PASS |
| Applicability | applicable / not_applicable / unknown; not_applicable requires a nonblank reason and cannot claim declared_satisfied | PASS |
| Satisfaction assertion | Requires applicable plus evidence references; evidence content/truth/sufficiency is not evaluated | PASS; reference presence is not behavioral verification |
| Evaluation | evaluation_status is const NOT_EVALUATED; extra scores/certification fields rejected | PASS |
| Profiles | profile_reference is null | PASS: no invented first-release profile |
| Private evidence | References can identify private evidence; schema does not demand publishing its content | PASS; access/retention agreements stay with source authorities |
| Historical compatibility | v1.0.0 legacy schema and public-review.1 stay unchanged; no automatic upgrade to requirement-level claims | PASS |

Authority separation remains explicit: OAS owns standards/interoperability; Autonomous Registry owns identity/provenance/lifecycle/record authority; Autonomous Trust Bureau owns independent trust/assessment opinions; SHS BOS owns operational/business systems. A provider-supplied identity reference is not identity verification, a declared_satisfied flag is not ATB assessment, and a recording event is not Registry endorsement.

The semantic declaration validator takes an already-authoritative release object; it is not an artifact authenticity or acquisition service. Consumers must first verify the actual RC schema, full-file checksum, payload/source checksums and explicit publication pin. Evidence pointers are not fetched and real human/legal identity is not authenticated. These are documented boundaries, not missing certification features.

No live provider declaration, behavioral result, score, certification, endorsement or ATB opinion is created by this review. Existing negative cases reject wrong pins, extra profiles/scores/certification, omitted/duplicate/deferred members, unresolved evidence, unknown applicability with satisfaction and unsupported evaluation statuses. All test assertions remain unchanged.
