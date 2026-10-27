# Requirement revisions

This is the repository technical review requested by the user. APPROVE is a content disposition, not manufactured institutional authorization, adoption or RC issuance. Authorized OAS approval fields remain null. No RC exists.

Three reserved IDs retained. Only editorial clarification is applied; no substantive applicability, source authority or supersession change. Every APPROVE WITH REVISION remains excluded until an explicit re-review of the final text; revision application does not auto-upgrade its disposition.

## OAS-1-REQ-0001

Align title/evidence/verification metadata; do not change the normative obligation.

Field: title

Before: Identity and responsible owner

After: Identity and responsible party

Field: evidence_expectations

Before: ["Identity/ownership record"]

After: ["Identity/responsibility record"]

Field: verification_notes

Before: Inspect the record for a nonempty system identifier and named responsible party; this does not verify legal ownership.

After: Inspect the record for a nonempty system identifier and named responsible party; this does not verify legal ownership or Registry issuance.

## OAS-1-REQ-0005

Clarify the grammatical subject of the change trigger; preserve all four triggers.

Field: normative_text

Before: The provider MUST record a review of the documented purpose and boundaries when the declared system version changes its capabilities, permissions, operating context or intended use.

After: The provider MUST record a review of the documented purpose and boundaries when the capabilities, permissions, operating context or intended use of the system version covered by the declaration change.

## OAS-1-REQ-0017

Clarify the role responsible for retiring the described version and name the retirement process.

Field: normative_text

Before: The provider MUST identify the responsible role and the process for retiring the described system version in its description record.

After: The provider MUST identify the role responsible for retiring the described system version and the retirement process in its description record.

The Q03 label mismatch is clarified editorially, but Q03 as a whole remains open and DEFERRED because multiple-party and organization-identifier semantics are not resolved. No canonical question is marked resolved.
