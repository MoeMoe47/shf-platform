# Reviewer Gate Matrix

Least privilege is required. No universal reviewer profile is permitted.

| Profile | Allowed gates | Required capability | Prohibited gates | Source resolution | Provisioning/admin |
| --- | --- | --- | --- | --- | --- |
| `LEGAL_REVIEWER` | `LEGAL`, selected `PARTNER` | `commercial_product.review_legal` | `FUNDING`, `PRICING`, `MARGIN`, `COMMISSION`, `SOURCE_AUTHORITY` | No | Prohibited |
| `FUNDING_REVIEWER` | `FUNDING` | `commercial_product.review_funding` | `LEGAL`, `PRICING`, `MARGIN`, `COMMISSION`, `SOURCE_AUTHORITY` | No | Prohibited |
| `PRICING_REVIEWER` | `PRICING`, selected `MARGIN` | `commercial_product.review_pricing` and gate-specific finance capability where used | `LEGAL`, `FUNDING`, `REGULATORY`, `SOURCE_AUTHORITY` | No | Prohibited |
| `EVIDENCE_REVIEWER` | `EVIDENCE` | `commercial_product.review_evidence` | `LEGAL`, `FUNDING`, `PRICING`, `MARGIN`, `COMMISSION`, `SOURCE_AUTHORITY` | No | Prohibited |
| `SOURCE_AUTHORITY_REVIEWER` | `SOURCE_AUTHORITY` | `commercial_product.review_source_authority` | Review approval gates unless separately assigned | Yes | Prohibited |

Candidate gate examples:

| Candidate | Initial gates |
| --- | --- |
| `cc-001` | `LEGAL`, `FUNDING`, `EVIDENCE`, `DELIVERY_CAPACITY` |
| `cc-019` | `LEGAL`, `ENTITLEMENT`, `SUPPORT`, `SOURCE_AUTHORITY` |
| `cc-025` | `LEGAL`, `REGULATORY`, `SUPPORT`, `DELIVERY_CAPACITY` |
| `cc-029` | `REGULATORY`, `PROCUREMENT`, `FUNDING`, `EVIDENCE`, `SOURCE_AUTHORITY` |
