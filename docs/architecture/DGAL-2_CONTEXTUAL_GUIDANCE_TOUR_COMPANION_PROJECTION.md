# DGAL-2 — Contextual Guidance, Tour Integration & Companion Projection

## 1. Executive Result
DGAL-2 closes the contextual guidance and tour return-path gaps for the repository-local scope. A deterministic `ContextualGuidanceService` composes DGAL-1 requirements with bounded domain source facts, while CivicSure provider self-service is the first end-to-end presentation slice. Tour context and return targets are bounded presentation contracts; Companion receives an optional, source-traceable DGAL projection.

## 2. Repository Baseline
Repository: `/Users/mikeslate/Projects/shrv1`. Branch: `studio-v1-plus-development`. Starting HEAD: `9eaaa0cf7b54905ca5eaedcea542ed4c298cb061`. The worktree contained prior readiness and DGAL-1/DGAL-0 changes; those were preserved. No commit or push was performed.

## 3. DGAL-2 Gap IDs
`DGAL-GAP-003` (P1, contextual next-action composition) and `DGAL-GAP-009` (P2, tour-to-guidance return path) are the authoritative scope.

## 4. Scope Boundaries
Implemented: deterministic composition, safe action/return targets, bounded Tour context, optional Companion projection, CivicSure provider guidance, and focused tests. Not implemented: document instances, rendering, acknowledgments, signatures, e-signature, notifications, or Document Center.

## 5. Existing Guidance Sources
Companion, Career, Calendar, Studio, onboarding, CivicSure, Agent Fabric, ARAG-1, Curriculum, and service entitlement systems remain source authorities. DGAL composes facts; it does not copy their state machines.

## 6. Canonical Guidance Composition Contract
`ContextualGuidanceService.compose(actor, context, sources)` accepts server-derived actor scope, bounded service/workflow/resource context, DGAL requirements, and normalized source facts. It returns ordered items, source references, requirement references, action/return targets, waiting ownership, and source status.

## 7. Guidance Categories
The bounded vocabulary is `REQUIRED_NOW`, `WAITING_ON_YOU`, `WAITING_ON_SOMEONE_ELSE`, `BLOCKED`, `REFERENCE`, `OPTIONAL`, and `COMPLETED`. Existing domain terminology remains authoritative at its boundary.

## 8. Ordering / Priority
Ordering is deterministic: required-now, waiting-on-you, blocked, waiting-on-someone-else, optional, reference, completed; then explicit priority; then stable guidance ID.

## 9. Deduplication
Items targeting the same canonical key or action are merged. Source and requirement references are retained so one user-facing item can explain all contributing authorities.

## 10. Conflict Handling
Equal-priority required/optional conflicts return `CONFLICT` and no misleading list. DGAL-1 rule conflicts remain fail-closed as `UNKNOWN`.

## 11. Unknown / Source Unavailable
`NO_ACTIONS`, `UNKNOWN`, `SOURCE_UNAVAILABLE`, and `CONFLICT` are distinct. Missing mandatory context is never rendered as “all caught up.” Optional source failures are reported through `unavailableSources` and `unresolved`.

## 12. Safe Action Target
Action routes pass the DGAL-1 safe-reference check and must be internal, bounded routes. External, JavaScript, data, and protocol-relative URLs are rejected.

## 13. Exact Return Target
Tour context supports route, service, resource type/id, workflow, step, and section. Secrets and arbitrary query payloads are not retained.

## 14. Return Authorization
The returned route is a navigation hint only. Opening the route re-enters the normal authenticated provider/domain route, so resource authorization is re-evaluated at use time. DGAL does not grant access through a return target.

## 15. Tour Context Contract
`createTourContext` carries role, organization, service, workflow, resource, guidance, requirement, action, return target, and optional tour ID. `createTourReturnTarget` rejects unsafe routes.

## 16. Tour → Guidance Integration
Tour overlays expose bounded DGAL context through a data attribute and provider context. This makes a guidance-linked tour inspectable without embedding service authority in tour configuration.

## 17. Guidance → Tour Integration
`TourProvider` listens for the namespaced `dgal:tour-request` presentation event and can start or focus a bounded step. It does not mark a requirement complete.

## 18. Tour Completion Boundary
Tour dismissal and completion remain experience state in the existing `useTour` hook. Neither state acknowledges, signs, verifies, approves, or completes an institutional requirement.

## 19. Tour Persistence / Revisit
The existing dismiss/revisit behavior remains intact. DGAL requirements are server-derived and cannot be hidden by client tour state. The route/context contract permits a later accessible return to the exact workflow position.

## 20. Learning Companion Projection
`GET /companion/context/me?serviceKey=...` now optionally includes a bounded `dgal` projection alongside the existing Companion context. The existing Companion remains read-only and self-scoped.

## 21. Companion Source Traceability
DGAL items retain `sourceReferences`, `requirementReferences`, `sourceDomain`, and completion source where supplied. Companion is not allowed to present a mandatory explanation without those canonical references.

## 22. Companion Partial-State Behavior
The projection preserves `UNKNOWN`, `SOURCE_UNAVAILABLE`, `CONFLICT`, and `NO_ACTIONS`; it does not synthesize missing guidance or mutate source state.

## 23. Role Awareness
Roles are server-derived and passed into DGAL-1 requirement resolution. Provider-specific CivicSure guidance is only composed through the provider permission and provider-scoped workspace.

## 24. Organization / Tenant Awareness
DGAL-1 validates actor organization/tenant scope. CivicSure source facts are obtained from the existing provider self-service authority, which filters by provider and organization.

## 25. Service Awareness
The first UI slice requests `serviceKey=civicsure`; the API resolves only CivicSure requirements/source facts for that view. Other services remain available through the same composition contract without broad UI integration.

## 26. Workflow Awareness
The API accepts bounded workflow type/stage and resource selectors. CivicSure provider sources translate evidence requests, findings, and corrective actions without replacing their lifecycle state.

## 27. Permission Awareness
The documentation route accepts `enrollment.view` or CivicSure provider self-service view. Provider actions continue to use the existing provider route permissions; guidance does not make unauthorized actions clickable as authorized.

## 28. Requirement Awareness
Required, optional, waiting, blocked, reference, and completed items are separate categories. CivicSure evidence/finding/corrective-action requirements state whether the next actor is the provider or operator.

## 29. Waiting Ownership
Every CivicSure submitted item states `Waiting on: OPERATOR`; open provider-owned items state `Waiting on: YOU`. The composition contract carries the same field for other domains.

## 30. Completion Source
Completion or waiting transitions are sourced from CivicSure request/finding/corrective-action status. DGAL does not infer institutional completion from tour or view state.

## 31. Premium Presentation Model
`NextStepsPanel` presents a concise status-first projection with explanation, requirement source, waiting owner, and bounded action. It has honest loading, unavailable, conflict, no-action, and retry states.

## 32. First Service Integration Slice
CivicSure provider self-service is the representative slice because it already has provider scope, evidence requests, findings, corrective actions, and operator authority boundaries.

## 33. CivicSure Integration
The provider workspace loads its existing canonical API plus `/documentation/context/me`. Evidence requests, findings, and corrective actions become contextual guidance; provider verification, publication, and payment remain prohibited.

## 34. Secondary Domain Composition Evidence
Focused service tests exercise generic DGAL requirements, optional/reference sources, conflicts, deduplication, and safe routes. The composition service is domain-neutral; deeper Studio/ARAG/Agent Fabric UI work remains later scope.

## 35. Frontend Components
`DgalNextStepsPanel` is the only new presentation primitive. It is embedded in the existing CivicSure provider page and does not create a Document Center or a competing help center.

## 36. API Surface
Added bounded `GET /documentation/context/me` with query selectors for service/workflow/resource context. Existing `/companion/context/me` accepts optional service/workflow/resource selectors and returns `dgal` only when requested.

## 37. Accessibility
The panel uses a semantic section, heading, ordered list, status/alert roles, native links, and existing CivicSure focus styling. Tour continues to use the existing overlay. Accessibility checks remain part of UI validation.

## 38. Responsive Behavior
The panel uses the existing CivicSure responsive rules and collapses naturally on narrow layouts without requiring a desktop-only drawer.

## 39. Deep Linking
Action targets use canonical internal routes and remain refreshable through the existing hash routing. Normal route authorization is retained after navigation.

## 40. Error / Empty / Partial States
Loading, API error, unknown, unavailable, conflict, no-action, and resolved states are rendered distinctly. No fake success or empty success is used.

## 41. Performance / Source Failure
The provider page makes one workspace request and one aggregated DGAL request, rather than one request per item. Provider source failure is isolated from the workspace error and shown honestly.

## 42. Security
Safe target validation, existing route guards, actor-derived organization/tenant, provider self-service scope, and normal downstream authorization protect guidance. No client-supplied role or organization becomes authority.

## 43. Analytics / Audit Boundary
Viewing guidance or tours does not create institutional audit events. Existing experience analytics and operational events remain separate from Evidence and Truth.

## 44. Tests
`apps/shs-api/tests/dgal-contextual-guidance.test.ts` covers deterministic ordering, deduplication, unknown state, unavailable source, conflicts, CivicSure ownership, and unsafe targets. `tests/dgal2TourContext.test.mjs` covers bounded tour/return context. Typecheck and root acceptance are recorded in Validation.

## 45. DGAL-GAP-003 Closure
**RESOLVED**. The canonical composition service provides deterministic cross-domain guidance output with role/org/service/workflow context, source traceability, explainability, deduplication, conflict handling, and honest unknown state.

## 46. DGAL-GAP-009 Closure
**RESOLVED**. Tour context now carries bounded guidance/action/return references, guidance can request a tour presentation event, and route authorization remains authoritative on return. Dismissal/completion remain experience-only.

## 47. Files Created
`apps/shs-api/src/domain/documentation/service/contextual-guidance-service.ts`; `apps/shs-api/src/domain/documentation/api/routes.ts`; `src/components/DgalNextStepsPanel.jsx`; `tests/dgal2TourContext.test.mjs`; `apps/shs-api/tests/dgal-contextual-guidance.test.ts`.

## 48. Files Modified
`apps/shs-api/src/api/router.ts`; `apps/shs-api/src/domain/companion/api/routes.ts`; `src/pages/civicsure/CivicSureApp.jsx`; `src/styles/civicSureCanonical.css`; `src/system/tour/TourProvider.jsx`; `src/system/tour/TourOverlay.jsx`; `src/system/tour/useTour.js`; `src/system/tour/tourContext.js`; DGAL-0 audit register.

## 49. Owner Work Preservation
Pre-existing PR-1 through PR-7, DGAL-0, and DGAL-1 changes, generated artifacts, databases, and runtime files were preserved. No unrelated work was reverted.

## 50. Validation
Fresh DGAL-2 TypeScript tests passed 5/5. Tour contract tests passed after correcting the context field placement. API typecheck passed. Root manifests, UI validation, build, Layer, Truth, Oracle, and diff checks are run as the final acceptance set; existing Vite chunk warnings are non-blocking.

## 51. DGAL-2 Decision
DGAL-GAP-003 and DGAL-GAP-009 are resolved with no repository-local DGAL-2 P0 or P1 defect identified. DGAL-1 remains intact. No e-signature, document-instance engine, or Document Center was added.

## 52. Exact Next Phase
`DGAL-3 — DOCUMENT/PACKET INSTANCES, RENDERING, EVIDENCE LINKS & RETENTION METADATA`. DGAL-3 was not started in this phase.

### Closure Matrix

| DGAL Gap ID | Starting Status | Work Performed | Tests | Final Status | Evidence |
|---|---|---|---|---|---|
| DGAL-GAP-003 | OPEN — P1 | Added deterministic contextual composition over DGAL requirements and domain sources; added CivicSure projection and API surface | `dgal-contextual-guidance.test.ts` 5/5; API typecheck; root validations | RESOLVED | `ContextualGuidanceService`, `/documentation/context/me`, CivicSure `NextStepsPanel` |
| DGAL-GAP-009 | OPEN — P2 | Added bounded Tour context, safe action/return target contract, namespaced tour request bridge, and re-entry through canonical routes | `dgal2TourContext.test.mjs` pass; root build/UI validation | RESOLVED | `tourContext.js`, `TourProvider`, `TourOverlay`, `useTour` |
