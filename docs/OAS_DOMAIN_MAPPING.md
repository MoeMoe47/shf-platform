# OAS domain mapping

Generated from `standards/oas/authoring/domain-mapping.json`. Resolve labels only within the named namespace. Exact canonical labels and the existing D06 alias resolve deterministically; ambiguous/unmapped labels never return a canonical ID. Related concepts are not equivalence mappings. Legacy report ordinals and report payloads remain unchanged.

| Namespace | Label | Classification | Canonical domain | Related concepts only | Disposition |
| --- | --- | --- | --- | --- | --- |
| oas-public | Identity & Ownership | canonical | OAS-1-D01 | none | Exact canonical public domain label. |
| oas-public | Purpose & Boundaries | canonical | OAS-1-D02 | none | Exact canonical public domain label. |
| oas-public | Capabilities & Resources | canonical | OAS-1-D03 | none | Exact canonical public domain label. |
| oas-public | Permissions & Access | canonical | OAS-1-D04 | none | Exact canonical public domain label. |
| oas-public | Safety & Prohibited Actions | canonical | OAS-1-D05 | none | Exact canonical public domain label. |
| oas-public | Human Authority | canonical | OAS-1-D06 | none | Exact canonical public domain label. |
| oas-public | Validation & Evidence | canonical | OAS-1-D07 | none | Exact canonical public domain label. |
| oas-public | Lifecycle & Accountability | canonical | OAS-1-D08 | none | Exact canonical public domain label. |
| shs-oas-reporting-v1 | Identity and Purpose | ambiguous | none | OAS-1-D01, OAS-1-D02 | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. |
| shs-oas-reporting-v1 | Autonomy and Agency | unmapped | none | none | No single canonical domain with equivalent documented meaning exists. |
| shs-oas-reporting-v1 | Safety and Risk | ambiguous | none | OAS-1-D05 | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. |
| shs-oas-reporting-v1 | Transparency and Explainability | ambiguous | none | OAS-1-D01, OAS-1-D07 | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. |
| shs-oas-reporting-v1 | Human Oversight | alias | OAS-1-D06 | OAS-1-D06 | The canonical catalog already records Human Oversight as an alias of D06. This resolves the label only, never report ordinal 05 as canonical D05. |
| shs-oas-reporting-v1 | Data and Privacy | ambiguous | none | OAS-1-D04, OAS-1-D05 | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. |
| shs-oas-reporting-v1 | Interoperability | unmapped | none | none | No single canonical domain with equivalent documented meaning exists. |
| shs-oas-reporting-v1 | Accountability and Governance | ambiguous | none | OAS-1-D06, OAS-1-D08 | Concept may span domains or add unspecified obligations; suggested related concepts are not approved equivalence. |

Reporting taxonomy migration remains BLOCKED: seven labels need governance disposition. Human Oversight maps lexically to D06 as an already recorded alias, not to public ordinal 05. This does not establish the meaning or equivalence of a historical report assessment. No existing reporting record is rewritten.
