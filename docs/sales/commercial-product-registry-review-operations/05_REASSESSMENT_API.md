# Reassessment API

`GET /commercial-product-reviews/:candidateId/reassessment` is a read-only evaluation of the generated 4C packet, latest decision per gate, and latest source resolution. The packet endpoint also returns this projection alongside packet details and history heads.

The projection reports source status, review status, remaining required gates, blocking gates, stale gates, onboarding eligibility, and reasons. It does not return or mutate readiness/sellability. Eligibility is not onboarding execution and is not a sellability state. The queue is bounded to the manifest's candidate set, accepts enumerated filters, caps page size at 100 and page at 1000, and permits only named sort fields.
