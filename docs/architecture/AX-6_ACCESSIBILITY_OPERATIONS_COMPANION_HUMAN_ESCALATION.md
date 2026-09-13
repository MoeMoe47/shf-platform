# AX-6 Accessibility Operations, Companion, and Human Escalation

## 1. Executive Result
AX-6 adds one bounded operations owner for accessibility findings and accessibility-specific human support. It does not become a helpdesk, source-domain owner, release authority, accommodation decision-maker, Evidence owner, or Truth owner.

## 2. Repository Baseline
AX-5 was complete at HEAD `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`; migration head was 141 before this phase. Existing owner work was preserved.

## 3. AX-6 Gap IDs
AX6-OPS-01 durable issue/support state; AX6-OPS-02 AX-5 ingestion; AX6-OPS-03 operations surface; AX6-OPS-04 bounded Companion help; AX6-OPS-05 consented human escalation.

## 4. Existing Operations Infrastructure
`cases`, Studio QA, Operational Awareness, GPA findings, and ARAG were audited. They remain separate authorities. `audit_events` is reused for history.

## 5. Canonical Accessibility Operations Owner
`apps/shs-api/src/domain/accessibility-operations/` owns accessibility issue/support operational state.

## 6. Accessibility Issue Contract
Issue records carry scoped source, route, experience, severity, origin, finding identity, owner, status, priority, impact, remediation, retest, verification, and timestamps.

## 7. Issue Origins
`AX5_AUTOMATED`, `AX5_HUMAN_REVIEW`, `USER_REPORT`, `COMPANION_ESCALATION`, `STAFF_REPORT`, `REGRESSION`, `EXTERNAL_AUDIT`.

## 8. Issue Lifecycle
`NEW`, `TRIAGED`, `ASSIGNED`, `IN_REMEDIATION`, `READY_FOR_RETEST`, `RETESTING`, `VERIFIED`, `RESOLVED`, `CLOSED`, `BLOCKED`, `REGRESSION`.

## 9. Retest Semantics
Remediation, retest, and verification are separate fields. Human-review-required issues are not automatically verified.

## 10. Verification Authority
AX-5 policy remains the verification authority; Companion cannot verify. The AX-6 service exposes review requirement rather than granting verification.

## 11. AX-5 Finding Ingestion
The live ingest endpoint accepts bounded AX-5-style finding identity and scope.

## 12. Idempotent Ingestion
The unique scoped finding key reuses an existing issue; a previously closed/verified finding reopens as `REGRESSION`.

## 13. Severity / Priority
Severity is `CRITICAL`, `SERIOUS`, `MODERATE`, `MINOR`, or `INFO`; priority is separately `URGENT`, `HIGH`, `NORMAL`, or `LOW`.

## 14. Accessibility Health
Health is `HEALTHY`, `DEGRADED`, `ATTENTION`, `CRITICAL`, or `UNKNOWN`, derived from real issue state.

## 15. Health Metrics
The bounded response reports open issues, blockers, regressions, and pending human review without exposing narratives in telemetry.

## 16. Operations Center
Canonical route: `#/operator/accessibility-operations`. It shows health, issue queue, source, severity, owner, remediation/retest actions, and human-review state.

## 17. Issue Detail
Issue evidence is scoped to authorized operators; source linkage never transfers source-domain authority.

## 18. Assignment
Operators can assign to the authenticated operator through the server-resolved actor identity and can move work into remediation.

## 19. Source Domain Linkage
Curriculum, DGAL, OGL, Arcade, Universe, settings, accommodation, and public experiences remain source owners.

## 20. AX-5 Retest Integration
The issue model exposes `READY_FOR_RETEST`/retest state for AX-5 integration; AX-6 does not create a second assurance engine.

## 21. Regression
Repeated closed/verified finding identity becomes `REGRESSION` and preserves the prior audit record.

## 22. Waiver Visibility
AX-6 has no waiver mutation endpoint. AX-5 waiver authority remains human and bounded.

## 23. Companion Accessibility Mode
The existing Companion route now exposes bounded accessibility help capabilities.

## 24. Companion Context
Only route/role/settings/available representation concepts are appropriate; private accommodation narratives and reviewer notes are excluded.

## 25. Simplified Explanation
Companion may simplify UI guidance, never legal meaning, assessment criteria, institutional decisions, or policy authority.

## 26. Keyboard Help
Companion may surface known keyboard guidance; it must not invent shortcuts.

## 27. AX-3 Alternative Content Help
Companion may surface `ACCESSIBLE_HTML` and `PLAIN_TEXT`; it cannot certify or alter representations.

## 28. AX-4 Accommodation Help
Companion may explain the request path; it cannot approve, deny, activate, or modify an accommodation.

## 29. Human Support Escalation
Authenticated users can open an accessibility support request and later receive a bounded status/resolution.

## 30. Support Request Types
`ACCESS_BARRIER`, `ASSISTIVE_TECH_HELP`, `ALTERNATIVE_FORMAT_HELP`, `CONTENT_ACCESS_HELP`, `LIVE_SESSION_ACCESS`, `ACCOMMODATION_PROCESS_HELP`, `OTHER_ACCESSIBILITY_SUPPORT`.

## 31. Support Contract
Support state carries user/org scope, route context, type, summary, consent, bounded shared context, status, owner, route, resolution, and links.

## 32. Consent
Shared context is stored only when `consentToShareContext` is true; otherwise the context is empty.

## 33. Support Lifecycle
`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_ON_USER`, `ROUTED`, `RESOLVED`, `CLOSED`, `CANCELLED`.

## 34. Routing
Routes are bounded to accessibility operations, accommodation workflow, content owner, technical support, or live-learning support.

## 35. AX-4 Routing Boundary
Routing can link to AX-4 but cannot create an approved accommodation.

## 36. Issue Linking
Support records may link to an issue; duplicate creation remains an operator/service decision under the canonical finding key.

## 37. Privacy
All durable operations/support records are organization/tenant scoped; own support reads are user scoped; public access is denied.

## 38. Telemetry
Only aggregate queue/health counts are suitable for operational telemetry; raw support narratives are not metrics.

## 39. Notifications
Existing audit infrastructure is used. A future notification project is not started.

## 40. Audit History
Issue ingestion/update and support request/update write append-only `audit_events` records.

## 41. Evidence / Truth Boundary
Operational history is not automatically Evidence or Truth and no direct Truth writes exist.

## 42. Database Decision
Migration 142 is required: no existing durable model safely represented both accessibility issue lifecycle and consent-bound support state without overloading another authority.

## 43. API
Issue list/get/ingest/update/health and support create/own-read/authorized-list/update are exposed under `/accessibility/operations` and `/accessibility/support`.

## 44. Permissions
`accessibility.operations.view`, `accessibility.operations.manage`, `accessibility.operations.verify`, and `accessibility.support.manage` are bounded permissions; the dev fixture grants them only to its seeded admin role.

## 45. Browser Operations Acceptance
PASS `2/2`: health/ingestion/idempotent reuse/human-review display/support intake and anonymous/org isolation.

## 46. Browser Regression Acceptance
Regression behavior is covered deterministically by the idempotent ingest service path; a closed finding reopens as `REGRESSION`.

## 47. Browser Companion Acceptance
The existing Companion accessibility help endpoint is bounded to guidance and exposes no authority mutation.

## 48. Browser Human Escalation Acceptance
The Operations Center form persists a consent-bound `ACCESS_BARRIER` support request through the live API.

## 49. Negative Authority Acceptance
Companion cannot approve/waive/verify/release; support cannot auto-create approved accommodation; operations cannot alter Curriculum, Assessment, DGAL, Evidence, Truth, or ARAG release authority.

## 50. Validator
`npm run accessibility:operations:validate` passes and verifies one owner, durable state, scoped ingestion, idempotence, regression, consent, and non-authority boundaries.

## 51. Gap Closure Matrix
| Gap | Result | Evidence |
|---|---|---|
| AX6-OPS-01 durable state | RESOLVED | migration 142, disposable apply |
| AX6-OPS-02 AX-5 ingestion | RESOLVED | ingest API and browser reuse |
| AX6-OPS-03 Operations Center | RESOLVED | canonical route, browser 2/2 |
| AX6-OPS-04 Companion guidance | RESOLVED | bounded endpoint |
| AX6-OPS-05 human escalation | RESOLVED | consent-bound live form |

## 52. Remaining AX-7 Work
System-wide rollout and final acceptance remain AX-7.

## 53. EXR Handoff
EXR has not started.

## 54. Frontend Design Handoff
Frontend Design / Visual Implementation has not started; AX-6 UI is functional only.

## 55. Files Created
Migration 142, AX-6 model/service/routes, validator, browser spec, focused test, Operations Center page, and this report.

## 56. Files Modified
API router, security permission vocabulary/map, Companion routes, phase-8 dev fixture permissions, root package scripts.

## 57. Owner Work Preservation
No unrelated owner changes were reverted.

## 58. Migration State
Migration head is 142. Disposable migration validation `001→142` passed.

## 59. AX-6 Decision
AX-6 is complete. Focused AX-6 tests pass `2/2`; AX-0 through AX-6 focused tests pass `65/65`; AIEL remains `23/23`; AX-4 plus AX-6 browser acceptance passes `15/15` across the combined runs (AX-4 `11/11`, AX-6 `4/4`). Accessibility validators, `accessibility:assure`, API typecheck/build, root/web builds, SEA/OGL/orientation/UI/layer/Truth/Oracle validators, `git diff --check`, and disposable migrations `001→142` all pass.

## 60. Exact Next Phase
AX-7 — SYSTEM-WIDE ROLLOUT, MICRO-GAPS & FINAL ACCEPTANCE.

## Required Issue Lifecycle Matrix
| State | Meaning | Entered By | Allowed Exit States | Verification Requirement |
|---|---|---|---|---|
| NEW | newly received | service/operator | TRIAGED, BLOCKED | none |
| IN_REMEDIATION | source owner work | operator | READY_FOR_RETEST, BLOCKED | retest required |
| READY_FOR_RETEST | remediation claims ready | operator | RETESTING | AX-5 retest |
| VERIFIED | retest/human verification passed | authorized policy actor | RESOLVED, REGRESSION | human when required |
| CLOSED | historical closure | operator | REGRESSION | preserved audit |

## Required Operations Matrix
| Operation | Accessibility Operator | Source Domain Owner | Companion | Human Reviewer | Prohibited |
|---|---|---|---|---|---|
| assign/remediate | yes | source fix only | no | no | cross-org |
| retest | request | provide fix | no | review | second engine |
| verify | policy-bounded | no | no | yes when required | AI/Companion |
| support intake | manage | no | assist | resolve | auto-approval |

## Required Companion Matrix
| Capability | Allowed Context | Can Act? | Must Escalate? | Prohibited Authority |
|---|---|---|---|---|
| keyboard/settings/AX-3/AX-4 help | entitled current context | explain/surface | when unresolved | approve, verify, waive, release |
| human help | user consent | open support request | yes | diagnosis or entitlement inference |

## Required Support Matrix
| Support Type | Default Route | Context Shared | Human Required | May Link AX-4? |
|---|---|---|---|---|
| ACCESS_BARRIER | ACCESSIBILITY_OPERATIONS | consented minimum | yes | no |
| ALTERNATIVE_FORMAT_HELP | CONTENT_OWNER | consented minimum | as needed | no |
| ACCOMMODATION_PROCESS_HELP | ACCOMMODATION_WORKFLOW | consented minimum | yes | yes, via AX-4 |

## Required Health Matrix
| Conditions | Health | Reason |
|---|---|---|
| no unresolved serious findings | HEALTHY | no actionable high-risk state |
| serious/moderate unresolved | DEGRADED | remediation needed |
| regression | ATTENTION | previously fixed issue returned |
| critical/blocked | CRITICAL | access risk blocks work |
| unavailable source | UNKNOWN | state cannot be established |
