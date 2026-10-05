# Reassessment Rules

Reassessment is a pure projection of one review packet, latest-per-gate decision rows, and the latest source-resolution row at an explicit evaluation time.

- A valid RESOLVED source with no remaining requirements yields `SOURCE_RESOLVED`; a stale latest source yields `SOURCE_STALE`; otherwise source remains unresolved.
- APPROVED and supported NOT_REQUIRED decisions complete their gate. PENDING, UNKNOWN, BLOCKED, STALE, missing, or expired decisions remain unresolved; BLOCKED and STALE are separately listed.
- An expired `expires_at` or elapsed `stale_at` projects the gate as STALE without rewriting its history.
- Production onboarding eligibility requires source resolution, valid packet contract, known selling/delivery entity, and all required gates completed. A separate production authorization remains necessary.
- No readiness or sellability value is included in reassessment output. No SELL_NOW or GREEN value is created.

The function accepts `asOf` so identical inputs and timestamp produce identical output.
