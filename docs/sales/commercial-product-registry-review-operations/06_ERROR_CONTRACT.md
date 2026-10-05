# Error Contract

Errors use the shared `{ ok: false, error: { code, message } }` envelope.

| Code | HTTP | Meaning |
| --- | --- | --- |
| `UNAUTHENTICATED` | 401 | No authenticated request actor |
| `FORBIDDEN` | 403 | Missing read/gate/source capability or active organization context |
| `NOT_FOUND` | 404 | Candidate packet identity is not in the reviewed manifest |
| `INVALID_INPUT` | 400 | Unsupported field, malformed filter, or invalid decision detail |
| `INVALID_GATE` | 400 | Gate type is not in the contract |
| `AUTHORITY_REQUIRED` | 400 | Required authority/reference is absent |
| `EVIDENCE_REQUIRED` | 400 | Required evidence reference is absent/invalid |
| `INVALID_AUTHORITY_TYPE` | 400 | Authority type is not allowed for the gate |
| `INVALID_STATUS` | 400 | Decision/source status is not supported |
| `SOURCE_NOT_RESOLVABLE` | 400 | Source resolution lacks defensible authority/provenance |
| `SUPERSESSION_CONFLICT` | 409 | Missing/stale supersession or decision stream conflict |
| `INTERNAL_ERROR` | 500 | Unexpected server failure |

No client-supplied field can override actor, organization, timestamps, audit context, lifecycle, readiness, sellability, or onboarding eligibility.
