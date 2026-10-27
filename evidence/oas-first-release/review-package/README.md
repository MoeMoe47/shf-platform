# First OAS normative requirement review package

This package contains proposals, not adopted requirements or an issued RC. The current published pin remains OAS-1@0.0.0-public-review.1. Proposed public-review.2 is not published.

Start with [candidate metadata](CANDIDATE_METADATA.json), [open questions](OPEN_QUESTIONS.md), [disputed requirements](DISPUTED_REQUIREMENTS.md), [domain mapping issues](DOMAIN_MAPPING_ISSUES.md), [release blockers](RELEASE_BLOCKERS.md) and [candidate changelog](CANDIDATE_CHANGELOG.md). The writing standard and proposed adoption policy are in docs/.

Review individual requirements by domain:

- [D01 Identity & Ownership](DOMAIN-01.md)
- [D02 Purpose & Boundaries](DOMAIN-02.md)
- [D03 Capabilities & Resources](DOMAIN-03.md)
- [D04 Permissions & Access](DOMAIN-04.md)
- [D05 Safety & Prohibited Actions](DOMAIN-05.md)
- [D06 Human Authority](DOMAIN-06.md)
- [D07 Validation & Evidence](DOMAIN-07.md)
- [D08 Lifecycle & Accountability](DOMAIN-08.md)

For each reserved ID, record approve/reject/defer, actual reviewer attribution/time, reason, immutable decision-record reference and the exact statement checksum from candidate metadata. Do not prefill an approval, edit generated text or assume that individual approval adopts a release. Proposed decisions belong in the canonical authoring source under a separately authorized review action; this implementation records none.

The complete human view and all generated sheets come from standards/oas/authoring/first-release.json. Mapping views come from domain-mapping.json. Run oas:first:generate and oas:first:check; never maintain separate manual normative wording. Source citations identify descriptive/near-normative authoring inputs, not proof of historical adoption.
