# OAS domain mapping — terminal closure

Generated from standards/oas/closure/domain-mapping.json. Historical review projection is preserved byte-for-byte at docs/history/OAS_DOMAIN_MAPPING.e1b6135.md. Legacy report payloads/ordinals are unchanged. Namespaces are mandatory; no fuzzy matching, ordinal conversion or fallback is permitted.

| Namespace | Label | Terminal state | Canonical IDs | Rationale |
| --- | --- | --- | --- | --- |
| oas-public | Identity & Ownership | CANONICAL | OAS-1-D01 | Exact canonical public domain label. |
| oas-public | Purpose & Boundaries | CANONICAL | OAS-1-D02 | Exact canonical public domain label. |
| oas-public | Capabilities & Resources | CANONICAL | OAS-1-D03 | Exact canonical public domain label. |
| oas-public | Permissions & Access | CANONICAL | OAS-1-D04 | Exact canonical public domain label. |
| oas-public | Safety & Prohibited Actions | CANONICAL | OAS-1-D05 | Exact canonical public domain label. |
| oas-public | Human Authority | CANONICAL | OAS-1-D06 | Exact canonical public domain label. |
| oas-public | Validation & Evidence | CANONICAL | OAS-1-D07 | Exact canonical public domain label. |
| oas-public | Lifecycle & Accountability | CANONICAL | OAS-1-D08 | Exact canonical public domain label. |
| shs-oas-reporting-v1 | Identity and Purpose | QUARANTINED LEGACY | none | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. This label is excluded from canonical projections; review is not an equivalence mapping. |
| shs-oas-reporting-v1 | Autonomy and Agency | QUARANTINED LEGACY | none | No single canonical domain with equivalent documented meaning exists. This label is excluded from canonical projections; review is not an equivalence mapping. |
| shs-oas-reporting-v1 | Safety and Risk | QUARANTINED LEGACY | none | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. This label is excluded from canonical projections; review is not an equivalence mapping. |
| shs-oas-reporting-v1 | Transparency and Explainability | QUARANTINED LEGACY | none | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. This label is excluded from canonical projections; review is not an equivalence mapping. |
| shs-oas-reporting-v1 | Human Oversight | ALIAS | OAS-1-D06 | The canonical catalog already records Human Oversight as an alias of D06. This resolves the label only, never report ordinal 05 as canonical D05. |
| shs-oas-reporting-v1 | Data and Privacy | QUARANTINED LEGACY | none | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. This label is excluded from canonical projections; review is not an equivalence mapping. |
| shs-oas-reporting-v1 | Interoperability | QUARANTINED LEGACY | none | No single canonical domain with equivalent documented meaning exists. This label is excluded from canonical projections; review is not an equivalence mapping. |
| shs-oas-reporting-v1 | Accountability and Governance | QUARANTINED LEGACY | none | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. This label is excluded from canonical projections; review is not an equivalence mapping. |

QUARANTINED LEGACY is a closed migration disposition, not a semantic mapping. Such labels may remain visible in historical reports but cannot enter canonical output or requirement membership. DEPRECATED is reserved for an expressly retired label; quarantine does not pretend deprecation or equivalence. The known lexical Human Oversight alias maps to D06, never public ordinal 05. Releasing quarantine requires a new reviewed mapping contract and explicit migration, not an in-place reinterpretation of history.
