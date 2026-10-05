# Future Reviewer UI Requirements

Future review UI work must use the authenticated SHS API and respect server authorization. It should provide:

- Reviewer inbox/queue limited to assigned gates and candidates once candidate scope is enforced server-side.
- Packet view with canonical candidate/product identity, lifecycle, readiness, sellability, source status, regulated constraints, and production-onboarding implication.
- Evidence references and authority types without copying external payloads or presenting unverified claims as facts.
- Gate-specific decision form for `PENDING`, `APPROVED`, `BLOCKED`, `STALE`, `UNKNOWN`, and `NOT_REQUIRED`, with authority/evidence requirements and explicit supersession/version controls.
- Separate source-resolution form; resolved source must not look like approved review or sellability.
- Immutable history with reviewer actor/org, timestamps, authority/evidence refs, stale state, and superseded record.
- Reassessment summary for unresolved, blocking, stale, and eligible states without mutating lifecycle/readiness/sellability.
- Assignment scope, effective window, revocation status, and expiry cues sourced from canonical Identity assignment data.
- Permission states that explain forbidden/read-only operations without suggesting a client-side permission check is security authority.

Do not begin UI implementation until server-enforced candidate assignment and an Identity-supported expiry/provisioning workflow are resolved. No frontend is included in 4E.
