# Registry readiness by field

Registry integration must not proceed beyond READY fields. No Registry files were read for implementation or modified in this phase. Full checkpoint integrity is checked against Git. Registry remains an independent consumer and cannot redefine OAS language or populate missing standards facts.

| Field | Classification | Allowed boundary / condition |
| --- | --- | --- |
| Standard ID | READY | OAS-1 from unchanged canonical catalog; identifies standard only |
| Pinned version | READY | Only published OAS-1@0.0.0-public-review.1 and exact artifact/revision/checksum; no adopted-standard claim |
| Domain IDs | READY | Existing OAS-1-D01 through D08; do not use ambiguous reporting labels or report ordinals as equivalents |
| Requirement IDs | BLOCKED | 17 reserved candidate IDs are review-only, not members of a published normative catalog; none may be recorded as adopted obligations |
| Profiles | READY WITH CONDITIONS | Empty catalog is truthful; no profile ID resolves, no fictional profile reference or membership allowed; skip integration beyond READY |
| Declarations | READY WITH CONDITIONS | Existing v1 shape supports only current standard-level draft references; per-requirement states are review-schema proposals, requiring publication/contract adoption before operational use |
| Supersession metadata | READY | Existing published empty graphs and historical pins; no replacement event is implied by candidate authorship |

Source/checksum metadata for the historical draft remains READY and reproducible. Candidate source/statement checksums identify reviewed bytes only, not issuer authenticity, adoption or conformance. NOT_EVALUATED is preserved throughout. Future requirement-level integration requires OAS review/adoption, approved release relationship/schema migration, publication and resolved mapping dispositions. Registry recording/authentication/public projection remains a separately authorized task.
