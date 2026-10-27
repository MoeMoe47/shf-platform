# Domain reconciliation

Audit scope: src/pages/oas, entries, SHS reporting adapter/routes/tests, contracts, schemas, scripts, relevant documentation and Vite routes. Canonical names come from existing public OAS1, Control Domains and Landing domain lists. No schema-defined competing OAS taxonomy was found. The existing reporting test verifies NOT_EVALUATED, not semantic equivalence.

| Public ordinal | Canonical domain ID / name | Same-position legacy reporting label | Migration |
| --- | --- | --- | --- |
| 01 | OAS-1-D01 Identity & Ownership | Identity and Purpose | Unmapped |
| 02 | OAS-1-D02 Purpose & Boundaries | Autonomy and Agency | Unmapped |
| 03 | OAS-1-D03 Capabilities & Resources | Safety and Risk | Unmapped |
| 04 | OAS-1-D04 Permissions & Access | Transparency and Explainability | Unmapped |
| 05 | OAS-1-D05 Safety & Prohibited Actions | Human Oversight | Unmapped |
| 06 | OAS-1-D06 Human Authority | Data and Privacy | Unmapped |
| 07 | OAS-1-D07 Validation & Evidence | Interoperability | Unmapped |
| 08 | OAS-1-D08 Lifecycle & Accountability | Accountability and Governance | Unmapped |

Rows show conflicts, not semantic aliases. All legacy rows remain in the source with null canonical IDs. A reviewed semantic mapping may be one-to-many and cannot be derived from ordinals. Preserve legacy reporting references OAS-1:01 etc as legacy references. Existing report behavior is unchanged.

Risk matrix Human Oversight is retained as contextual alias of public Human Authority; Deployment remains cross-domain guidance. Other matrix names coincide with public domains. TOC phrases Agent Identity, Purpose and Operating Boundaries, Safety Controls, Lifecycle Governance are document section headings, not additional domain IDs. No global replacement is applied to prose or historical documentation. Tests assert canonical labels/order, uniqueness, adapter usage and the exact preserved reporting vocabulary.
