# Authorization Matrix

All routes require authenticated `req.user`, active organization and tenant context. Read operations require `commercial_product.read`.

| Gate | Capability | Authority types accepted by 4C |
| --- | --- | --- |
| COMMERCIAL_READINESS | `commercial_product.review_readiness` | `COMMERCIAL_GOVERNANCE_AUTHORITY` |
| LEGAL | `commercial_product.review_legal` | `LEGAL_COUNSEL`, `LEGAL_AUTHORITY` |
| TAX | `commercial_product.review_tax` | `TAX_AUTHORITY` |
| REGULATORY | `commercial_product.review_regulatory` | `EXTERNAL_REGULATOR`, `APPROVED_TRAINING_AUTHORITY`, `AUTHORIZED_PARTNER` |
| PROCUREMENT | `commercial_product.review_procurement` | `PROCUREMENT_AUTHORITY`, `BUYER_PROCUREMENT_RECORD` |
| FUNDING | `commercial_product.review_funding` | `FUNDING_PROGRAM_AUTHORITY`, `FUNDING_COMPATIBILITY_AUTHORITY` |
| DELIVERY_CAPACITY | `commercial_product.review_delivery_capacity` | `DELIVERY_OPERATIONS_AUTHORITY`, `AUTHORIZED_PARTNER` |
| EVIDENCE | `commercial_product.review_evidence` | `EVIDENCE_AUTHORITY`, `TRUTH_SPINE_AUTHORITY` |
| SUPPORT | `commercial_product.review_support` | `SUPPORT_SERVICE_OWNER` |
| PRICING | `commercial_product.review_pricing` | `APPROVED_PRICING_AUTHORITY` |
| MARGIN | `commercial_product.review_margin` | `FINANCE_COST_AUTHORITY` |
| ENTITLEMENT | `commercial_product.review_entitlement` | `SERVICE_CATALOG_AUTHORITY`, `ENTITLEMENT_AUTHORITY` |
| PARTNER | `commercial_product.review_partner` | `PARTNER_RELATIONSHIP_AUTHORITY`, `LEGAL_AUTHORITY` |
| COMMISSION | `commercial_product.review_commission` | `COMMISSION_POLICY_AUTHORITY` |

Source resolution requires `commercial_product.review_source_authority`. `commercial_product.edit` and `sales.admin` grant no review decision authority. Actor and organization are always taken from server request context.
