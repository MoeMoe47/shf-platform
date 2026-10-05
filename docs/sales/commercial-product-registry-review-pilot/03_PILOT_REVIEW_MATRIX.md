# Pilot Review Matrix

All 14 gate statuses below are copied from the 4B manifest. Profiles map one-to-one to gate writes as defined in `reviewer-provisioning-plan.json` and `02_AUTHORIZATION_MATRIX.md` in 4D documentation.

| Gate | Assigned profile |
| --- | --- |
| `COMMERCIAL_READINESS` | `COMMERCIAL_READINESS_REVIEWER` |
| `LEGAL` | `LEGAL_REVIEWER` |
| `TAX` | `TAX_REVIEWER` |
| `REGULATORY` | `REGULATORY_REVIEWER` |
| `PROCUREMENT` | `PROCUREMENT_REVIEWER` |
| `FUNDING` | `FUNDING_REVIEWER` |
| `DELIVERY_CAPACITY` | `DELIVERY_CAPACITY_REVIEWER` |
| `EVIDENCE` | `EVIDENCE_REVIEWER` |
| `SUPPORT` | `SUPPORT_REVIEWER` |
| `PRICING` | `PRICING_REVIEWER` |
| `MARGIN` | `MARGIN_REVIEWER` |
| `ENTITLEMENT` | `ENTITLEMENT_REVIEWER` |
| `PARTNER` | `PARTNER_REVIEWER` |
| `COMMISSION` | `COMMISSION_REVIEWER` |

| Candidate / Product | Source | Readiness / Sellability | Gate states (`gate:status`) | Evidence / blockers | Expected pilot outcome |
| --- | --- | --- | --- | --- | --- |
| `cc-001` / `cp_data_center_and_ai_infrastructure_curriculum_pathway` | `SOURCE_RESOLVED` | `YELLOW` / `PILOT` | `COMMERCIAL_READINESS:PENDING`, `LEGAL:UNKNOWN`, `TAX:UNKNOWN`, `REGULATORY:PENDING`, `PROCUREMENT:UNKNOWN`, `FUNDING:PENDING`, `DELIVERY_CAPACITY:UNKNOWN`, `EVIDENCE:PENDING`, `SUPPORT:UNKNOWN`, `PRICING:UNKNOWN`, `MARGIN:UNKNOWN`, `ENTITLEMENT:UNKNOWN`, `PARTNER:UNKNOWN`, `COMMISSION:UNKNOWN` | Joint seller review, training authority and source-linked scope, funding compatibility, evidence, delivery/support evidence still needed. | Authorized reviewers may record pending/blocked process status when supported; unresolved entity and gates stay blocking. |
| `cc-005` / `cp_educator_professional_development_bundle` | `SOURCE_UNRESOLVED` | `UNKNOWN` / `DEVELOP` | `COMMERCIAL_READINESS:UNKNOWN`, `LEGAL:PENDING`, `TAX:UNKNOWN`, `REGULATORY:UNKNOWN`, `PROCUREMENT:UNKNOWN`, `FUNDING:UNKNOWN`, `DELIVERY_CAPACITY:UNKNOWN`, `EVIDENCE:UNKNOWN`, `SUPPORT:UNKNOWN`, `PRICING:UNKNOWN`, `MARGIN:UNKNOWN`, `ENTITLEMENT:UNKNOWN`, `PARTNER:UNKNOWN`, `COMMISSION:UNKNOWN` | Canonical curriculum/program record, owner, approved scope, and non-demo source; seller and delivery entities unknown. | Source remains unresolved absent credible evidence; any test-only resolution is confined to disposable PostgreSQL. |
| `cc-011` / `cp_healthcare_workforce_pathway_concepts` | `SOURCE_UNRESOLVED` | `UNKNOWN` / `NEEDS_REVIEW` | `COMMERCIAL_READINESS:UNKNOWN`, `LEGAL:PENDING`, `TAX:UNKNOWN`, `REGULATORY:PENDING`, `PROCUREMENT:UNKNOWN`, `FUNDING:UNKNOWN`, `DELIVERY_CAPACITY:UNKNOWN`, `EVIDENCE:UNKNOWN`, `SUPPORT:UNKNOWN`, `PRICING:UNKNOWN`, `MARGIN:UNKNOWN`, `ENTITLEMENT:UNKNOWN`, `PARTNER:PENDING`, `COMMISSION:UNKNOWN` | Approved program record, named delivery partner, credential/licensure scope, and external authority references. | Regulatory and partner capabilities stay separate; no external approval or credential claim is inferred. |
| `cc-019` / `cp_metaverse_access_license` | `SOURCE_RESOLVED` | `YELLOW` / `PILOT` | `COMMERCIAL_READINESS:PENDING`, `LEGAL:PENDING`, `TAX:UNKNOWN`, `REGULATORY:UNKNOWN`, `PROCUREMENT:PENDING`, `FUNDING:UNKNOWN`, `DELIVERY_CAPACITY:UNKNOWN`, `EVIDENCE:PENDING`, `SUPPORT:UNKNOWN`, `PRICING:UNKNOWN`, `MARGIN:UNKNOWN`, `ENTITLEMENT:UNKNOWN`, `PARTNER:UNKNOWN`, `COMMISSION:UNKNOWN` | Legal scope, buyer procurement reference, product evidence, pricing, support, and entitlement references remain to be verified. | Separate capability decisions are accepted only in test fixture context; no pilot status upgrade. |
| `cc-025` / `cp_studio_student_project_workspace` | `SOURCE_RESOLVED` | `YELLOW` / `PILOT` | `COMMERCIAL_READINESS:PENDING`, `LEGAL:PENDING`, `TAX:UNKNOWN`, `REGULATORY:UNKNOWN`, `PROCUREMENT:UNKNOWN`, `FUNDING:UNKNOWN`, `DELIVERY_CAPACITY:UNKNOWN`, `EVIDENCE:PENDING`, `SUPPORT:UNKNOWN`, `PRICING:UNKNOWN`, `MARGIN:UNKNOWN`, `ENTITLEMENT:UNKNOWN`, `PARTNER:UNKNOWN`, `COMMISSION:UNKNOWN` | Legal and evidence references; delivery capacity, support model, pricing, margin, entitlement mappings still unknown. | Evidence reviewer cannot act as legal reviewer; all product states remain unchanged. |
| `cc-029` / `cp_civicsure_government_program_assurance` | `SOURCE_RESOLVED` | `YELLOW` / `PILOT` | `COMMERCIAL_READINESS:PENDING`, `LEGAL:PENDING`, `TAX:UNKNOWN`, `REGULATORY:UNKNOWN`, `PROCUREMENT:PENDING`, `FUNDING:UNKNOWN`, `DELIVERY_CAPACITY:UNKNOWN`, `EVIDENCE:PENDING`, `SUPPORT:UNKNOWN`, `PRICING:UNKNOWN`, `MARGIN:UNKNOWN`, `ENTITLEMENT:UNKNOWN`, `PARTNER:UNKNOWN`, `COMMISSION:UNKNOWN` | Evidence/Truth provenance, buyer procurement record, legal scope, support/delivery, and pricing references remain open. | Evidence decisions cite external evidence authority; no assurance result or approval is fabricated. |

The assignment register is intentionally empty for real identities. Test assignments exist only inside disposable acceptance and are not copied into this document as real assignments.
