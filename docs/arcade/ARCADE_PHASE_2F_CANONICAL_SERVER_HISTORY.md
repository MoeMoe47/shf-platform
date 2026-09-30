# Arcade Phase 2F: Canonical Server History

## Purpose and Authority

The routed `/history` page now reads canonical Arcade Results through the existing authenticated SHS API route, `GET /arcade/results`. Arcade Results remain the source for the outcome, score, pass state, and server-derived mastery shown here. This is a read-only presentation; the frontend does not create results, derive mastery, create evidence, write Truth Spine facts, or authorize rewards.

Canonical Arcade history is derived from server-side Arcade Results. The frontend presents those results but does not create, verify, or reinterpret institutional truth.

The request uses the current authenticated identity and active organization context. Learners see only their own results in that organization. An actor with the existing admin-tier and `arcade.results.view` authorization sees organization-scoped results. The client cannot provide an organization or learner override. The existing service permissions and organization scope remain in force.

## Read Model

The existing results endpoint was suitable and is reused; no second history route or history authority was added. Its read query now joins `arcade_results` to the canonical `arcade_attempts` and `arcade_activities` records in one bounded query. The projection contains:

- `resultId`, `attemptId`, `activityId`, `activitySlug`, `activityTitle`
- `learnerId`, `organizationId`, `attemptStartedAt`, `completedAt`
- `score`, `maxScore`, `passed`, `masteryAchieved`

Evidence and Truth Spine status are deferred. This endpoint has no existing authorized projection for them, and the frontend does not query either authority directly. Reward, XP, EVU, credit, wallet, badge, and Polygon fields are not part of this DTO.

The endpoint accepts `limit` from 1 through 100 and a non-negative `offset`; the default is 50. Results are ordered newest-first, with the canonical Result ID as a stable tie-breaker. The query fetches one extra row to determine `hasMore`, and the response includes `nextOffset` when another page exists.

## Frontend Behavior

`useCanonicalArcadeHistory` and its read client call the existing API with authenticated cookies and `cache: no-store`. A failed request remains an unavailable/error state; it never falls back to `useArcadeHistory` or local storage. An empty successful response says no canonical Arcade Results have been recorded.

`History.jsx` is the only routed history surface. `ArcadeHistory.jsx` remains a compatibility redirect to `/history`. Legacy `useArcadeHistory` remains available for explicitly legacy consumers and is not used by the canonical History page. `ArcadeActivitySummary` remains on the Phase 2E legacy/local counts for this bounded slice; `ArcadeSidebar` remains independent of history-derived rewards.

CSV exports only the canonical result projection fields displayed/available from the API: result, attempt, activity identifiers and labels, completion time, score/max score, pass state, and server-stored mastery state. It excludes evidence/truth status because those are not supplied, and excludes all legacy outcome/reward fields.

## Boundaries and Deferred Work

This phase does not alter Result writes, server mastery derivation, transactional `arcade.resulted`, Verified Evidence, signed Agent Fabric ingestion, Truth Spine persistence, or Treasury. The established verification chain remains:

`Arcade Result → Reviewed Verified Evidence → signed Agent Fabric ingestion → Truth Spine`

`useArcadeHistory` is legacy/local compatibility history and is not merged into canonical results. Treasury/reward integration and any authorized evidence/truth status projection remain deferred to later approved work.
