# EXR-4 — Canonical Customer Journey Implementation

## 1. Executive Result
EXR-4 implements a bounded journey projection for the eleven EXR-1 priority journey contracts. It adds context, current work, next action, return target, help, capability exposure, first-service transition, and neutral notification-slot metadata without creating domain authority.

## 2. Repository Baseline
Worktree: `/Users/mikeslate/Projects/shrv1-codex`
Branch: `codex/exr`
Starting commit: `95e6833f053da5f9cc501f256f4b8a0a14995dae`
Migration head: 142. Main and Claude worktrees were not touched.

## 3. EXR-3 Inputs
Consumed the EXR-3 consolidation registry, its 37-surface disposition plan, the EXR-2 IA/navigation registry, and EXR-1 role/capability/journey contracts.

## 4. Implemented Priority Journeys
Implemented eleven declarative journey contracts and a shared `ExrJourneyContext` presentation adapter. Browser acceptance covers twelve lanes, including separate Foundation and Solutions public entries.

## 5. Organization Applicant
The onboarding surface now presents applicant context, application case work, workflow state, next action, and help. It does not expose activated organization capabilities before activation.

## 6. Activated Organization
The organization operator surface presents organization/role context, current operating work, next action, status, and help. Capability visibility remains descriptive and server-authorized.

## 7. First Service Transition
`resolveFirstServiceTransition` maps non-activated organizations back to onboarding, activated organizations with entitlements to the first entitled service, and activated organizations without a service to Hub. No client state writes lifecycle or entitlement data.

## 8. Hub / BOS
Hub remains the SHS/BOS organization operating environment. The journey adapter projects active organization, role, current work, reporting/help context, and entitlement-aware exposure rather than a universal product launcher.

## 9. Student
Student context prioritizes current assignment/lesson work, progress, next action, career connection, and help rather than an ecosystem-wide launcher.

## 10. Instructor
Instructor context prioritizes attention, review/intervention work, cohorts, reporting, next action, and return to the role queue.

## 11. Studio Builder
Builder is workspace-focused and returns to the current Studio project/build packet before QA handoff.

## 12. Studio QA
QA is queue/workflow-focused and exposes project findings and the next remediation or retest action.

## 13. Studio Reviewer
Reviewer is queue/detail/decision-focused and remains separate from Builder and QA roles.

## 14. CivicSure Provider
Provider context exposes assigned evidence/service work only; operator verification controls are not projected into the provider journey.

## 15. CivicSure Operator
Operator context exposes assurance/review queue work and reporting through the existing operator route and source-domain permissions.

## 16. Accessibility Support
The canonical Civic route now registers `/operator/accommodations`; Personal Accessibility remains settings-owned, institutional support remains workflow-owned, and help/Companion remains a shared help concern.

## 17. Reporting Entry
Reporting remains contextual: learner progress in learning context, organization operations in Hub, assurance reporting in authorized operator context, and public impact on public surfaces. No reports mega-page was added.

## 18. Return / Resume
The resolver returns `CURRENT_WORK`, `ROLE_QUEUE`, or public context according to source projections. It does not infer workflow state from card visibility.

## 19. Empty States
The shared context panel provides explicit no-current-work and no-action-required text. Domain surfaces retain their existing source-backed empty states.

## 20. Waiting States
Workflow state is displayed as source-provided state; onboarding, review, approval, QA, and external dependency waiting remain distinguishable from failure.

## 21. Help / Companion Entry
Every journey contract includes `/help`. This is a placement contract only; OGL, DGAL, Companion, and human escalation retain separate authorities.

## 22. Capability Exposure
`resolveCapabilityExposure` uses `HIDDEN`, `LOCKED`, `PENDING`, `VISIBLE`, and `AVAILABLE`. The result is a descriptive UI projection and never a permission grant.

## 23. Organization Context
Organization ID is projected from canonical context when available. Changing it in a UI cannot alter backend membership, entitlement, or permission.

## 24. Role Context
The adapter exposes a human-readable role label or actor context. It does not add client-side role switching.

## 25. NCA Integration Boundary
The adapter exposes only `NOTIFICATION_BELL_SLOT`, `ATTENTION_PROJECTION_SLOT`, and `INBOX_DESTINATION_SLOT`. No notification state, persistence, recipient, unread, delivery, or communication logic was added.

## 26. Route / Alias Preservation
Existing routes and deep links remain intact. The accommodation route was registered as an additive canonical mapping; no route was retired or migrated.

## 27. Authorization Negative Acceptance
The adapter marks authorization `SERVER_AUTHORITATIVE`; tests cover that visibility does not grant authority, org context does not grant entitlement, and capability state is not an API authorization substitute. Existing OGL browser acceptance continues to prove protected operator routes.

## 28. Accessibility Preservation
The new panel uses semantic sections, headings, status text, and ordinary text controls. Existing Accessibility architecture and validators remain unchanged apart from the additive route registration and contextual panel.

## 29. Responsive Acceptance
The panel uses flexible layout and existing shell guardrails. Existing browser harnesses validate representative desktop/mobile-safe structures; final visual polish remains out of scope.

## 30. Browser Acceptance
The EXR-4 browser suite passed 12/12 lanes: Foundation, Solutions, onboarding, activated operator, Student, Instructor, Studio Builder, Studio QA, Studio Reviewer, CivicSure provider, CivicSure operator, and Accessibility support. The harness applied migrations 001→142 to a disposable database and cleaned it afterward.

## 31. Focused Tests
EXR-1 through EXR-4 focused tests pass: 21/21. EXR-4 contributes 5/5 tests.

## 32. Regression Tests
EXR contracts, IA, consolidation, SEA, manifests, UI, and orientation validators pass. Existing OGL-5 browser acceptance passed 7/7 before the EXR-4 rerun.

## 33. Validators
`exr:contracts:validate`, `exr:ia:validate`, `exr:consolidation:validate`, and `exr:journeys:validate` pass.

## 34. Build
`npm run build` passes after installing only the existing API lockfile dependencies inside this worktree. No package metadata changed.

## 35. P0 / P1 Findings
EXR-4 P0: 0. Repository-local EXR-4 P1: 0. The earlier browser selector mismatch was corrected as test evidence; the missing Civic accommodation route was fixed as a bounded implementation gap.

## 36. EXR-5 Handoff
EXR-5 should cover system-wide acceptance, micro-gaps, responsive/visual consistency, and remaining browser inconsistencies. No unresolved journey architecture is passed forward.

## 37. Files Created
- `src/system/exr/exrJourneyExperience.js`
- `src/components/exr/ExrJourneyContext.jsx`
- `scripts/validate-exr-journeys.mjs`
- `tests/exr-4-journey-experience.test.mjs`
- `tests/exr-4-journeys-browser.spec.mjs`
- this report

## 38. Files Modified
- `src/router/CivicRoutes.jsx` — registered the existing accommodation page.
- `apps/shf-web/src/pages/operator/OrganizationOnboarding.jsx` — added journey context.
- `apps/shf-web/src/pages/operator/OperatorDashboard.jsx` — added journey context.
- `apps/shf-web/src/pages/operator/AccessibilityAccommodations.jsx` — added journey context.
- `package.json` — added the journey validator script.

## 39. Migration State
No migration was added. Migration head remains 142.

## 40. Git State
No commit or push was performed. Main and Claude worktrees remain untouched. `git diff --check` passes.

## 41. EXR-4 Decision
COMPLETE, subject to the stated validation evidence. No EXR-5 work was started.

## 42. Exact Next Phase
EXR-5 — SYSTEM-WIDE EXPERIENCE ACCEPTANCE & MICRO-GAPS

### Journey Matrix
| Journey | Entry | Context | Current Work | Next Action | Return Target | Help | Browser PASS |
|---|---|---|---|---|---|---|---|
| Organization Applicant | onboarding | applicant org | application case | resolve case state | current work | `/help` | PASS |
| Activated Organization | Hub | active org | operating work | source next action | current work | `/help` | PASS |
| Student | curriculum | learner org | assignment/lesson | next lesson | current work | `/help` | PASS |
| Instructor | curriculum operations | instructional scope | review queue | review/action | role queue | `/help` | PASS |
| Studio Builder | Studio | project | build packet | handoff QA | current work | `/help` | PASS |
| Studio QA | QA queue | project | QA findings | remediate/retest | role queue | `/help` | PASS |
| Studio Reviewer | review queue | project | submission | decision/handoff | role queue | `/help` | PASS |
| CivicSure Provider | provider | provider org | evidence work | submit/status | current work | `/help` | PASS |
| CivicSure Operator | verification audit | assurance scope | verification queue | review/verify | role queue | `/help` | PASS |
| Accessibility Support | accommodations | support context | support request | request/status | current work | `/help` | PASS |
| BOS Customer Operator | Hub | active org | entitled service work | source next action | current work | `/help` | PASS |

### Capability Matrix
| Journey | Capability | Exposure State | Source Authority | UI Result |
|---|---|---|---|---|
| Applicant | activated service | HIDDEN/LOCKED | entitlement + onboarding | no premature operating UI |
| Activated org | entitled service | AVAILABLE | service catalog | first-service route or Hub |
| Student | current learning | AVAILABLE | Curriculum | current-work context |
| Instructor | review queue | AVAILABLE | Curriculum | attention/work context |
| Studio | stage action | VISIBLE/AVAILABLE | Studio workflow | role-specific entry |
| CivicSure | verification | AVAILABLE to operator | CivicSure | provider/operator separation |
| Accessibility | accommodation workflow | AVAILABLE in context | AX-4 | support context |

### Role-Separation Matrix
| Surface | Allowed Actor | Disallowed Actor | Enforcement Source | Browser/Test Evidence |
|---|---|---|---|---|
| Onboarding review | authorized reviewer | applicant | backend permissions | EXR tests + onboarding browser |
| CivicSure verification | operator | provider | backend permissions | OGL-5 + EXR browser |
| Studio QA/review | matching stage role | wrong stage role | Studio authority | EXR focused contracts |
| Accommodation approval | authorized institutional actor | support user | AX-4 service | AX browser acceptance |

### Empty/Waiting Matrix
| Journey | State | User Message Purpose | Next Action |
|---|---|---|---|
| Applicant | UNDER_REVIEW | explain waiting, not failure | monitor case |
| Student | NO_DATA | explain no current work | view available learning/help |
| Instructor | empty queue | explain no review work | return to role context |
| Studio QA | waiting | explain dependency | await Builder/retest |
| CivicSure provider | no request | explain no assigned evidence | contact contextual help |

### NCA Handoff Matrix
| Surface | EXR Slot | NCA Future Projection | Current EXR Behavior |
|---|---|---|---|
| Hub | `ATTENTION_PROJECTION_SLOT` | attention projection | neutral slot metadata |
| Student | `NOTIFICATION_BELL_SLOT` | recipient-scoped notifications | no notification state |
| Studio | `INBOX_DESTINATION_SLOT` | inbox destination | no inbox behavior |
| CivicSure | `ATTENTION_PROJECTION_SLOT` | action projection | source queue remains canonical |

### EXR-5 Gap Matrix
| Gap | Severity | Journey | Functional/Visual | EXR-5 Owner |
|---|---|---|---|---|
| System-wide responsive sweep | P2 | all priority journeys | visual/structural | EXR-5 |
| Cross-shell return consistency | P2 | organization + learner | functional | EXR-5 |
| Final accessibility journey regression | P2 | accessibility | functional/semantic | EXR-5 |
| NCA slot integration verification | P2 | attention surfaces | integration | EXR-5 with NCA |
