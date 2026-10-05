# API Routes

Base path: `/commercial-product-reviews`. Routes are mounted by the canonical SHS API router.

| Method | Path | Permission | Behavior |
| --- | --- | --- | --- |
| GET | `/` | `commercial_product.read` | Bounded review queue with validated filters and whitelisted sorting |
| GET | `/:candidateId/packet` | `commercial_product.read` | Packet, latest decisions/source resolution, and reassessment |
| GET | `/:candidateId/decisions` | `commercial_product.read` | Paginated immutable decision history; optional `gate_type` |
| POST | `/:candidateId/decisions` | Gate-specific capability | Append a decision using 4C service |
| GET | `/:candidateId/source-resolutions` | `commercial_product.read` | Paginated source-resolution history |
| POST | `/:candidateId/source-resolutions` | `commercial_product.review_source_authority` | Append a source-resolution record |
| GET | `/:candidateId/reassessment` | `commercial_product.read` | Pure reassessment projection |

Candidate-to-product identity is resolved from the reviewed manifest. Client-supplied identity, actor, organization, timestamps, audit fields, product state, and eligibility fields are rejected. No onboarding execution endpoint exists.
