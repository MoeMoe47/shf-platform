# Entity Authority Matrix

| Candidate area | Selling entity | Delivery entity | Required review |
|---|---|---|---|
| SHF charitable/community programs | SHF | SHF or partner | LEGAL_REVIEW, TAX_REVIEW, FUNDING_REVIEW |
| Curriculum/content licenses | JOINT_STRUCTURE_REVIEW_REQUIRED | SHF/SHS depending on delivery | LEGAL_REVIEW |
| SHS software/platform services | SHS | SHS | LEGAL_REVIEW, PROCUREMENT_REVIEW |
| CivicSure / assurance / reporting | SHS | SHS | LEGAL_REVIEW, PROCUREMENT_REVIEW |
| Data Center employer validation | SHS or joint | SHS/partner | LEGAL_REVIEW |
| Sponsorships | SHF/SHS/UNKNOWN per class | SHF/SHS/partner | LEGAL_REVIEW, TAX_REVIEW |
| Regulated healthcare/public safety/aviation | PARTNER/UNKNOWN | PARTNER | REGULATORY_REVIEW |
| Apprenticeship/WBL | JOINT_STRUCTURE_REVIEW_REQUIRED | Partner/employer | REGULATORY_REVIEW, FUNDING_REVIEW |
| Agent Fabric/readiness/AI services | SHS | SHS | LEGAL_REVIEW, PROCUREMENT_REVIEW |

Sales authority remains limited to pipeline/orchestration. Sales can reference `selling_entity`, `delivery_entity`, and review states; it cannot determine legal/tax/regulatory status.
