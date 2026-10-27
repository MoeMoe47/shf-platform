# Effective/publication date rule

PROPOSED — NOT ADOPTED — NOT PUBLISHED

Target: `OAS-1@1.0.0`. Preparation source: `6f145192af25c929c95181fd6cd38f32d7b5ace9`. Normative source: `517cc23426e7485c352a1672c8fe4614291d552a`. Binding checksum: `sha256:cbc26edbca5214fdca1cfa7dc2f7fbf17d917eb44bef4dbc2d337c98a7dbeeb1`.

Existing policy basis: docs/OAS_RELEASE_ADOPTION_POLICY.md requires explicit approved release/effective dates, effective date no earlier than release date, and prohibits substituting artwork/generated time. Its adoption action records exact content plus release metadata; its publication action is separate. docs/OAS_RELEASE_CANDIDATE_CONTRACT.md makes the RC candidate date distinct from a final effective date. No existing rule makes publication time automatically become effective time.

Required human fields:

- release_date: an actual explicit date selected by the human maintainer, YYYY-MM-DD.
- effective_date: an actual explicit date selected by the human maintainer, YYYY-MM-DD, at least release_date.
- actual adoption/publication decision timestamps and immutable references belong to their separate human records; they do not substitute for these dates.

Current inputs: release_date=2026-10-27; effective_date=2026-10-27. Null means missing, not approval, immediate effectiveness or a default date. Invalid dates and reversed ordering fail validation. Publication may be a later recorded transport event; the maintainer must explicitly decide how that relates to the selected release date, never infer it from a tool clock.

The human has supplied both dates as 2026-10-27. They are committed at 6f145192af25c929c95181fd6cd38f32d7b5ace9:standards/oas/governance/final-1.0.0/DATE_SELECTION.md and the entire package has been regenerated from that committed input snapshot. Any future date change invalidates these source/metadata/binding/artifact digests and requires fresh review. A date selection is not final adoption; adoption is not publication authorization.
