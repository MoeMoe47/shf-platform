# AX-5 Accessibility Assurance Gate & Continuous Testing

## 1. Executive Result

AX-5 establishes one deterministic Accessibility Assurance policy and runner. Automated success is explicitly not equivalent to verified accessibility. Serious barriers can block release, human-review items remain distinct, and ARAG retains final release authority.

## 2. Repository Baseline

Baseline revision: `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`; migration head: `141`. AX-0 through AX-4 remain complete. No migration, commit, or push is performed by AX-5.

## 3. AX-5 Gap IDs

AX5-P1-ASSURANCE-POLICY, AX5-P1-FINDING-CONTRACT, AX5-P1-RELEASE-DECISION, AX5-P1-LOCAL-RUNNER, and AX5-P1-HUMAN-REVIEW are resolved by this phase. AX-6/AX-7 gaps remain future work.

## 4. Existing Testing Inventory

| Tool/Test | Scope | Current Coverage | CI? | Blocking? | Limitations |
|---|---|---|---|---|---|
| AIEL tests | Accessibility runtime/content | 23/23 | Existing test workflow | Existing suite policy | Automation is not human verification |
| AX-0..4 tests | Architecture and boundaries | Passing | Local/repository | No | Contract-focused |
| Playwright | Critical browser flows | AX-2/3/4 suites, including 9/9 AX-4 | Local harness | Phase-specific | Requires seeded runtime |
| Accessibility validators | Runtime/profile/content/accommodation | Passing | Local | Validator failure | Static/contract coverage |
| axe | Not installed | None | No | No | Future dependency decision |
| jsx-a11y | Not installed | None | No | No | Existing lint architecture does not include it |
| Lighthouse | Not present | None | No | No | Future assurance expansion |

## 5. Accessibility Assurance Constitution

Automated Assurance is repeatable machine evidence. Human Assurance covers keyboard-only, assistive-technology, usability, and complex-content judgment. Release Assurance classifies findings and supplies ARAG with a bounded result; it does not publish or approve releases.

## 6. Automated Assurance

The canonical runner executes the accessibility validators and the AX policy evaluator. Browser suites remain explicit acceptance commands rather than being silently represented as passed by the runner.

## 7. Human Assurance

Automation cannot establish real screen-reader quality, complex table interpretation, or usable cognitive presentation. Those checks are `REQUIRED` where listed in the human-review matrix.

## 8. Release Assurance

Release decisions are `PASS`, `PASS_WITH_WARNINGS`, `REVIEW_REQUIRED`, and `BLOCKED`.

## 9. Canonical Assurance Owner

`src/system/accessibility/accessibilityAssurancePolicy.js` is the single policy owner. `accessibilityFindingSchema.js` owns finding vocabulary and validation; `scripts/run-accessibility-assurance.mjs` is the execution boundary.

## 10. Finding Contract

Findings require `findingId`, `ruleId`, `sourceTool`, severity, release impact, status, and may carry route, component, experience, flow, WCAG reference, evidence, owner, waiver state, review requirement, test run, and source revision.

## 11. Severity Model

| Severity | Example | Default Release Impact | Human Review Required |
|---|---|---|---|
| CRITICAL | Keyboard trap, unreachable critical action | BLOCK_RELEASE | Yes when judgment is needed |
| SERIOUS | Required semantic control inaccessible | BLOCK_RELEASE or review | Usually |
| MODERATE | Material flow or adaptive defect | REQUIRES_REVIEW | Yes where listed |
| MINOR | Decorative or low-impact issue | WARNING | No by default |
| INFO | Observation | INFORMATIONAL | No |

## 12. Release Impact Model

`BLOCK_RELEASE`, `REQUIRES_REVIEW`, `WARNING`, and `INFORMATIONAL` are policy values. A waived finding is ignored only when an authorized human waiver is explicit and expires.

## 13. Blocking Policy

Keyboard traps, inaccessible critical actions, impossible critical focus, severe supported text-scale clipping, inaccessible required semantics, critical color-only status, and inaccessible accommodation controls block by default. Cosmetic issues do not.

## 14. Critical Journey Coverage

The policy enumerates Student, Instructor, Parent, Career, onboarding, CivicSure, Studio, Hub/BOS, Agent Fabric, ARAG-1, Accessibility Settings, Accommodation roles, Foundation/Public, Impact Public, OAS, Universe, Learning Arcade shell, and DGAL.

## 15. Component Coverage

Shared buttons, fields, selection controls, dialogs, drawers, tabs, tables, alerts, status, navigation, forms, date controls, uploads, pagination, progress, cards, and breadcrumbs are assurance targets. Existing primitives remain owners of implementation semantics.

## 16. Static / Lint Assurance

Manifest/UI/layer/truth/oracle validators and the AX test suites are included. `jsx-a11y` is not currently installed; this is recorded rather than falsely claimed.

## 17. Axe / Automated Browser Assurance

No axe dependency is currently present. Playwright semantic assertions and existing browser acceptance remain the available automated browser evidence. Adding axe is future work unless a later dependency decision approves it.

## 18. Keyboard Assurance

Representative browser suites assert named actions, role-correct controls, request/review/approval/fulfillment paths, and forbidden controls. No keyboard trap or inaccessible required action is accepted in the covered flows.

## 19. Focus Assurance

Focus behavior remains shared between shell/router, dialog components, OGL tours, and accessibility runtime preferences. AX-5 checks visible and reachable critical controls; it does not centralize component focus ownership.

## 20. Screen Reader / Semantic Assurance

Semantic headings, labels, statuses, accessible names, and minimum-necessary projection structure are asserted where covered. Full screen-reader verification remains human review, not an automated claim.

## 21. Text Scale Assurance

AIEL remains 23/23. AX-2 text-scale browser evidence and Curriculum regression coverage remain part of the assurance handoff.

## 22. Reduced Motion Assurance

AX-2 canonical reduced-motion tests remain green. OGL, Universe, and Arcade shell motion review is included as a human-review requirement where automation cannot assess usability.

## 23. High Contrast / Forced Colors

Forced-colors and system contrast behavior remain design-token/browser responsibilities. Status and focus must not rely on color alone; representative checks are defined, with human follow-up for visual usability.

## 24. Responsive Accessibility

375px, tablet, and desktop acceptance is required for text scale, focus, overflow, dialogs, and primary actions. Browser evidence is retained in AX-2/AX-4 suites; broader route coverage is a future rollout concern.

## 25. Alternative Content Assurance

AX-3 content validation and live acceptance cover provenance, authorization, staleness, accessible HTML/plain text, and failure isolation. Derived content is not verified accessible merely because generation passed.

## 26. Accommodation Assurance

AX-4 validators, 32 AX tests, live API acceptance, and 9/9 browser acceptance cover requestor, reviewer, approver, fulfillment, privacy projection, expiration, supersession, and negative authority.

## 27. Live Learning

Repository-supported Live Learning checks are covered. Conferencing, interpreter, caption, and transcript provider capabilities remain external or representation-dependent where not implemented.

## 28. Arcade

The shell is covered for keyboard, text-scale, reduced motion, and non-color-only state. Individual game equivalence remains AX-7 scope.

## 29. Universe

Universe remains cinematic; assurance targets keyboard destinations, readable text, reduced motion, focus, and alternative navigation without redesigning its visual direction.

## 30. Public Experiences

Foundation, Impact, CivicSure public, OAS, and Universe public surfaces are included in the journey registry and existing public acceptance coverage.

## 31. Accessibility Settings

AX-2 settings and persistence remain covered by AIEL/AX-2 tests. Automated pass does not certify the complete settings experience for all assistive technologies.

## 32. Finding Lifecycle

`OPEN`, `ACKNOWLEDGED`, `IN_REMEDIATION`, `READY_FOR_RETEST`, `VERIFIED_FIXED`, `WAIVED`, `ACCEPTED_RISK`, and `REGRESSION` are canonical states.

## 33. Regression Detection

Findings tied to a prior baseline/rule/route are classified `REGRESSION` when a previously passing assertion fails.

## 34. Baseline / Allowlist Policy

There is no blanket ignore. Any temporary acceptance requires finding ID, reason, owner, expiry/review date, severity, authority, and scope.

## 35. Waiver Authority

Only an authorized human with an expiry may waive a blocking finding. AI may summarize but cannot waive.

## 36. Release Decision

The evaluator derives a decision from active findings. `BLOCKED` exits nonzero from `accessibility:assure`; warnings and review are visible in machine-readable output.

## 37. ARAG Integration

AX-5 supplies an accessibility assurance result to the ARAG integration boundary. Accessibility can block or require review under policy but cannot approve, publish, or bypass ARAG/human release authority.

## 38. CI Integration

`npm run accessibility:assure` is the canonical local/CI entry point. CI can invoke it as a job; no provider-specific workflow was added.

## 39. Local Developer Workflow

Run `npm run accessibility:assure`. It validates the assurance policy and existing accessibility contracts, then prints a deterministic result. Synthetic scenarios are available for gate testing.

## 40. Machine-Readable Result

The runner prints JSON containing run ID, policy version, revision, result, finding arrays, severity counts, tools, critical journeys, and human-review categories. Output is not written to the database and does not create Evidence or Truth.

## 41. Human Review Checklist

| Review Type | Required For | Automation Insufficient Because | Completion State |
|---|---|---|---|
| Keyboard-only completion | Critical workflows | Pointer automation cannot prove real keyboard usability | REQUIRED |
| Screen-reader review | Required semantic journeys | DOM assertions cannot prove AT experience | REQUIRED |
| Zoom/text-scale usability | Dense/content surfaces | Layout evidence needs human judgment | REQUIRED |
| Reduced-motion usability | OGL/Universe/Arcade | Motion quality is contextual | REQUIRED |
| Complex tables/forms | Data and assessment flows | Meaning/error comprehension needs human review | REQUIRED |
| Alternative-content quality | Simplified/transcript/translation | Generation is not semantic verification | REQUIRED |
| Accommodation usability | Request and support workflows | Privacy and cognitive usability need human judgment | REQUIRED |

## 42. WCAG Mapping

Tool-provided mappings are retained when available. Custom rules use descriptive internal IDs; AX-5 makes no certification claim.

## 43. Compliance Language Boundary

The system reports automated and bounded manual assurance under `ax5.v1`; it does not claim WCAG, ADA, or complete accessibility compliance.

## 44. Test Failure Classification

Failures are classified as `PRODUCT_DEFECT`, `TEST_DEFECT`, `FIXTURE_DEFECT`, `ENVIRONMENT_BLOCK`, `EXTERNAL_DEPENDENCY`, or `KNOWN_ACCEPTED_FINDING`.

## 45. Continuous Testing

Local and CI runs use the canonical runner. Pull-request and release-candidate integration is defined at the command boundary; ARAG consumes the result without losing human release approval.

## 46. Negative Gate Acceptance

| Scenario | Finding | Expected Decision | Actual Decision | Result |
|---|---|---|---|---|
| Clean | None | PASS | PASS | PASS |
| Minor warning | Decorative contrast | PASS_WITH_WARNINGS | PASS_WITH_WARNINGS | PASS |
| Human review | Screen-reader quality | REVIEW_REQUIRED | REVIEW_REQUIRED | PASS |
| Blocking violation | Keyboard trap | BLOCKED | BLOCKED | PASS |
| Waived finding | Expiring authorized waiver | PASS | PASS | PASS |
| Regression | Baseline critical action failure | BLOCKED | BLOCKED | PASS |

## 47. Browser Acceptance

AX-4 browser acceptance passes 9/9; AX-2/AX-3 browser suites remain passing from prior phases. Critical journey coverage is represented in the policy and existing suites, with manual review honestly marked where not executed.

## 48. Focused Tests

AX-5 focused tests: **8/8 PASS**. AX-0 through AX-4 structural tests: **32/32 PASS**. AIEL: **23/23 PASS**.

## 49. Validator

`npm run accessibility:assurance:validate` validates the single policy, finding/release vocabularies, human waiver boundary, ARAG boundary, critical journeys, lifecycle, and no blanket suppression.

## 50. Gap Closure Matrix

| Gap ID | Final State | Evidence |
|---|---|---|
| AX5-P1-ASSURANCE-POLICY | RESOLVED | Policy module and validator |
| AX5-P1-FINDING-CONTRACT | RESOLVED | Finding schema and focused tests |
| AX5-P1-RELEASE-DECISION | RESOLVED | Evaluator synthetic matrix |
| AX5-P1-LOCAL-RUNNER | RESOLVED | `accessibility:assure` clean run |
| AX5-P1-HUMAN-REVIEW | RESOLVED | Checklist and REVIEW_REQUIRED scenario |

## 51. Remaining AX-6+ Work

AX-6 operations center, Companion operational escalation, and AX-7 rollout/final acceptance remain untouched.

## 52. EXR Handoff

No EXR work started. EXR may later improve discoverability and journey presentation.

## 53. Frontend Design Handoff

No Frontend Design work started. AX-5 consumes existing surfaces and does not redesign them.

## 54. Files Created

- `src/system/accessibility/accessibilityAssurancePolicy.js`
- `src/system/accessibility/accessibilityFindingSchema.js`
- `scripts/run-accessibility-assurance.mjs`
- `scripts/validate-accessibility-assurance.mjs`
- `tests/ax5AccessibilityAssurance.test.mjs`
- this report

## 55. Files Modified

- `package.json` added `accessibility:assurance:validate` and `accessibility:assure`.

## 56. Owner Work Preservation

Existing dirty work was preserved. No reset, clean, stash, rebase, commit, or push was performed.

## 57. Migration State

Migration head remains `141`. No migration was added.

## 58. AX-5 Decision

**AX-5 COMPLETE.** Canonical assurance policy, finding lifecycle, deterministic severity/release decisions, synthetic gate behavior, local/CI runner, bounded ARAG integration, and human-review requirements are implemented and validated. Automated success is not represented as verified accessibility.

## 59. Exact Next Phase

**AX-6 — ACCESSIBILITY OPERATIONS CENTER + COMPANION + HUMAN ESCALATION**

### Required Assurance Matrix

| Check Type | Tool | Scope | Automated | Human Review | Release Impact |
|---|---|---|---|---|---|
| Static/structural | Existing validators | Repository contracts | Yes | No | Block on validator failure |
| Component/semantic | Node tests and UI contracts | Shared primitives | Yes | Sometimes | Review for material defect |
| Critical journey | Playwright | AX-2/3/4 and public flows | Yes | Yes | Block/review by rule |
| Adaptive | AIEL and browser | Text, motion, contrast, responsive | Yes | Yes | Block material task failure |
| Alternative content | AX-3 tests | HTML/plain text/provenance | Yes | Yes | Review quality |
| Accommodation | AX-4 tests/browser | Roles, privacy, fulfillment | Yes | Yes | Block authority/privacy failure |
| Release | AX-5 evaluator/ARAG boundary | Finding decision | Yes | Authorized human | Deterministic |

### Required Journey Matrix

| Experience | Static | Axe | Keyboard | Focus | Adaptive | Browser | Manual Review |
|---|---|---|---|---|---|---|---|
| Student / Instructor / Public | PASS | N/A | Covered | Covered | Covered | Existing suites | REQUIRED |
| Accessibility Settings | PASS | N/A | Covered | Covered | AIEL | AX-2 suite | REQUIRED |
| Accommodation roles | PASS | N/A | Covered | Covered | Covered | AX-4 9/9 | REQUIRED |
| AX-3 content | PASS | N/A | Covered | Covered | Covered | AX-3 suite | REQUIRED |
| OGL / Universe / Arcade | PASS | N/A | Bounded | Bounded | Reduced motion | Existing coverage | REQUIRED |
| DGAL / ARAG-1 / CivicSure / Studio / Hub | PASS | N/A | Registry/affected suites | Registry/affected suites | Existing runtime | Representative | REQUIRED |

### Required ARAG Matrix

| Accessibility Result | ARAG Check | Human Approval | Release Possible? |
|---|---|---|---|
| PASS | Accessibility check passes | Still required | Yes, subject to ARAG |
| PASS_WITH_WARNINGS | Warning recorded | Still required | Yes, subject to policy |
| REVIEW_REQUIRED | ARAG review required | Required | Only after human decision |
| BLOCKED | ARAG check cannot pass | Required after remediation/authorized waiver | No |

### Validation Evidence

| Check | Result |
|---|---|
| Assurance validator | PASS |
| Assurance runner, clean | PASS |
| Synthetic gate matrix | 6/6 PASS |
| AX-5 focused tests | 8/8 PASS |
| AX-0..4 tests | 32/32 PASS |
| AIEL | 23/23 PASS |
| API typecheck/build | PASS |
| Root and shf-web builds | PASS |
| Existing validators | PASS |
| Migration 001→141 | PASS |
| `git diff --check` | PASS |
