# SEA-3 — MOCK / VISUAL EXPERIENCE CONTRACTS

## 1. Executive Result
SEA-3 is complete. The repository now has a canonical machine-readable Visual Experience Contract registry keyed to SEA-2 projections. It defines structural visual authority for 19 Priority A role projections without implementing production dashboards or inventing approved mocks.

## 2. Repository Baseline
| Item | Value |
|---|---|
| Repository | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| HEAD | `c775466f5de6f86a7e4d4230434e0d56c17c0a7f` |
| Migration head | 140 |
| SEA-1 authority | `src/system/sea/serviceExperienceContracts.js` |
| SEA-2 authority | `src/system/sea/dashboardArchitecture.js` |
| SEA-3 authority | `src/system/sea/visualExperienceContracts.js` |

## 3. SEA-3 Gap IDs
| Gap ID | Severity | Service/Page | Finding | SEA-3 Remediation | Acceptance |
|---|---|---|---|---|---|
| SEA-GAP-013 | P2 | All | Responsive expectations needed structural encoding | Every Priority A contract has desktop/tablet/mobile composition and priority order | Visual validator passes |
| SEA-GAP-014 | P2 | All | Most dashboards lacked approved visual contracts | 19 Priority A visual contracts define hierarchy, status, density, authority, and acceptance | Focused suite passes |
| SEA-GAP-015 | P2 | Shared shell | Dashboard semantics needed visual handoff rules | Shared visual hierarchy, action treatment, and status contract | Validator/test pass |
| SEA-GAP-010 | P2 | DGAL | Document placement varies | DGAL placement is defined in visual help/work/component intent | SEA-4 implementation handoff |
| SEA-GAP-018 | P3 | Companion | Contextual Companion placement was uneven | Help placement preserves bounded Companion | SEA-4/5 implementation handoff |

SEA-4/5 implementation gaps remain open and were not closed by this phase.

## 4. Visual Contract Authority
`src/system/sea/visualExperienceContracts.js` is the sole SEA-3 registry. It references SEA-1 service contracts and SEA-2 projections by IDs and contract version; it does not duplicate workflow or capability authority.

## 5. Visual Contract Schema
Contracts contain identity, route/projection references, lifecycle/version, visual authority, page shell and region order, hierarchy, action treatments, component intent, status semantics, density, responsive composition, accessibility structure, loading/partial/empty/error behavior, brand relationship, and acceptance rules.

## 6. Visual Authority States
Supported states are `APPROVED_MOCK`, `LOCKED_DIRECTION`, `EXISTING_IMPLEMENTATION`, and `NO_CANONICAL_VISUAL_AUTHORITY`. Existing evidence confirms five authority families: SHF/Foundation, OAS, Universe, Career/Foundation direction, and selected SHS command surfaces. No unverified reference was promoted to an approved mock.

## 7. Priority Tiering
Priority A covers all 19 SEA-2 Tier A projections. Priority B and C remain future SEA-5 visual rollout work; no production mock route was created.

## 8. Page Shell Types
The registry supports `LEARNER_SHELL`, `FULL_APPLICATION_SHELL`, `OPERATOR_CONSOLE_SHELL`, `EMBEDDED_WORKSPACE_SHELL`, `DOCUMENT_CENTERED_SHELL`, and `PUBLIC_PAGE_SHELL`.

## 9. Canonical Visual Hierarchy
Default hierarchy is Context, Attention, Primary Next Action, Active Work, Progress, Intelligence, Help. A projection may mark a region optional or not applicable when SEA-2 says so.

## 10. Primary / Secondary / Reference Actions
One dominant primary action follows the canonical next-action source. Secondary actions support the workflow. Reference actions live in context/help areas. Sensitive approval, verification, release, signature, and destructive actions require explicit authority labels.

## 11. Attention Visual Semantics
Attention states use text, reason, owner, urgency, and safe-action availability. They do not rely on color alone and do not use panic-heavy treatment.

## 12. Work Component Rules
Use cards/lists for low-volume learner/applicant work, queues/tables for high-volume operator comparison, workspace links for builder work, document lists for DGAL, and report/projection tables for analyst work.

## 13. Progress Component Rules
Use staged progress, state timelines, steppers, readiness summaries, or milestone lists from domain state. Never use an invented percentage.

## 14. Intelligence Component Rules
Metric summaries, exception lists, readiness, risk, and source-qualified values belong here only when they support a decision. Decorative KPI strips are prohibited.

## 15. Help Placement
Help is a stable region or control for OGL Guidance Center, orientation/tour, accessible guide, DGAL documentation, bounded Companion, and related workflow help. It does not compete with required work.

## 16. Status Visual Semantics
The reusable status contract covers action required, waiting, blocked, at risk, in progress, complete, verified, unverified, public approved, and unknown. Every status requires readable text; color-only meaning is forbidden.

## 17. Density
Density is `LOW`, `MODERATE`, or `HIGH`. Student, applicant, career, and executive surfaces are low/moderate; instructor/provider/builder are moderate; operator, QA, governed AI, DGAL admin, and reporting are high where their work volume requires it.

## 18. Desktop Composition
Desktop orders are explicit per projection and preserve context, attention, next action, work, progress, intelligence, and help obligations. Executive Command intentionally omits Work because SEA-2 marks it `N/A`.

## 19. Tablet Composition
Tablet preserves the desktop hierarchy while splitting queue/detail, workspace/detail, or report/detail where density requires it. No implementation may hide required state or authority labels.

## 20. Mobile Composition
Mobile orders are explicit. The default is Context, Attention, Next Action, Work, Progress, Help, Intelligence, with learner, applicant, provider, and operational exceptions documented in the registry.

## 21. Loading / Partial / Empty / Error
Loading is section-level where practical. Partial, unavailable, stale, and error states identify source status. Empty is valid only when the source confirms no work. Optional source failure does not disable the service shell.

## 22. Brand Relationships
Contracts refer to existing product direction: calm SHF Curriculum, learner-friendly SHF Career, institutional CivicSure, SHS operational/BOS, governed AI, document-centered DGAL, high-integrity Truth/Reporting, and bounded executive surfaces. SEA-3 does not create a design-system rewrite.

## 23. Existing Mock / Visual Authority Inventory
| Authority | Evidence status | SEA-3 treatment |
|---|---|---|
| SHF/Foundation | LOCKED_DIRECTION / existing implementation | Preserve brand relationship |
| OAS Venus direction | LOCKED_DIRECTION | Public visual authority remains independent |
| Universe cinematic direction | LOCKED_DIRECTION / existing implementation | Preserve direct-on-scene treatment |
| Career design direction | LOCKED_DIRECTION | Referenced for Career contract |
| SHS command surfaces | LOCKED_DIRECTION / existing implementation | Referenced for Hub/Executive |
| Other major dashboards | NO_CANONICAL_VISUAL_AUTHORITY | Contract only; SEA-4/5 implementation must not claim approval |

## 24. Student Visual Contract
Low-density learner shell: context, attention, continue-learning action, current work, progress, career connection, and help. Mobile-first and calm; no admin-style KPI wall.

## 25. Instructor Visual Contract
Moderate-density instructional shell: course/cohort context, attention queue, instructional next action, assignments/lessons, cohort progress, responsibilities, and help. It is not a Student variant.

## 26. Onboarding Applicant Visual Contract
Low-density guided application shell: status, applicant requirements, documents, next action, reviewer waiting state, lifecycle, and help. Reviewer controls are prohibited.

## 27. Onboarding Reviewer Visual Contract
High-density operator console: review queue, active case, missing information, lifecycle, authorized review action, and documentation. Applicant actions are not substituted.

## 28. CivicSure Provider Visual Contract
Moderate evidence-centered provider shell: provider/program context, evidence due, corrections, submission action, verification status, deadlines, and help. No operator controls.

## 29. CivicSure Operator Visual Contract
High-density verification console: queue, providers/cases, evidence review, corrective action, risk, verification state, and human decision action. Consequential authority remains visibly human and domain-owned.

## 30. Studio Builder Visual Contract
Workspace-centered builder shell with project context, build work, Build Packet, blockers, readiness, and next build action. No QA/reviewer/release controls.

## 31. Studio QA Visual Contract
Inspection workspace with QA queue, revision, ruleset, findings, pass/fail state, and rerun action. It remains distinct from review and release.

## 32. Studio Reviewer Visual Contract
Review workspace with immutable submission snapshot, QA evidence, review state, issues, and decision action. Builder mutation controls are prohibited.

## 33. Hub / BOS Visual Contract
Moderate-density operational workspace with organization context, attention, active services/work, owning-service next action, recent state, and help. It is not an everything dashboard.

## 34. Agent Fabric Visual Contract
High-density governed operations console with work order, policy, approvals, restrictions, governed work, risk, and safe action. The visual language must not imply unrestricted autonomous control; WF-040 remains intact.

## 35. ARAG-1 Visual Contract
Release-assurance console explicitly separating AI Work, Policy Check, Human Approval, and Release Gate, with Evidence packet readiness. No autonomous release presentation.

## 36. DGAL Visual Contract
Document-centered experience with applicable requirements, document state, packet, acknowledgment/signature distinctions, history, and next action. Generated, sent, viewed, acknowledged, signed, and completed remain separate.

## 37. Reporting / Truth Visual Contract
High-integrity analyst workspace with scope, reports, metrics, stale/verification issues, readiness, and source-qualified values. Verified, unverified, draft, public-approved, and unknown states are explicit.

## 38. Executive Command Visual Contract
Low-density high-signal bounded executive view with critical attention, verified summary, referral next action, and help. No superuser control plane.

## 39. Career Visual Contract
Low-density learner-friendly pathway shell with profile/skill context, supported career connection, progression, next action, and help. No invented labor-market data.

## 40. Parent Visual Pattern
Parent remains a bounded Priority B pattern: authorized learner context, progress summary, parent action needed, and communication/help. No Student action controls.

## 41. Mock Artifacts Created
No production or visual mock artifacts were created. The machine-readable contracts are the SEA-3 design references until SEA-3-approved mock artifacts are deliberately produced.

## 42. Mock-to-Contract Mapping
Existing references are recorded as visual authority state/source in the registry. Unconfirmed mock data and historical “mock” code remain non-canonical and are not treated as approval.

## 43. Allowed Deviations
Implementations may vary card width, minor spacing, internal arrangement, and chart type when hierarchy, source, verification, role, and decision semantics remain unchanged.

## 44. Prohibited Deviations
Do not turn waiting into action-required, use color alone, promote unavailable/reference actions, collapse role responsibilities, hide verification state, add unauthorized controls, imply unrestricted AI, imply autonomous release, or make Executive Command a superuser surface.

## 45. Visual Acceptance Criteria
Acceptance requires declared regions and order, primary-action prominence, role distinction, text status semantics, source/verification labels, responsive order, help presence, brand relationship, and authority-safe controls. SEA-4 may implement; SEA-3 does not change live dashboards.

## 46. Machine-Readable Registry
`src/system/sea/visualExperienceContracts.js` exports the registry, schema enums, status semantics, page shells, and Priority A projection IDs. It references SEA-1 and SEA-2 rather than duplicating them.

## 47. Validation
`npm run sea:visual:validate` checks references, routes, roles, projection alignment, visual authority, shell, density, required region orders, actions, all status semantics, brand relationship, responsive metadata, mock references, and acceptance criteria. `tests/sea3VisualExperienceContracts.test.mjs` contains 6 passing tests.

## 48. Gap Closure Matrix
| Gap | SEA-3 result | Remaining owner |
|---|---|---|
| SEA-GAP-013 | Responsive visual contract metadata defined | SEA-4/5 implementation |
| SEA-GAP-014 | Priority A visual contracts created | SEA-4/5 implementation |
| SEA-GAP-015 | Shared visual hierarchy/action/status rules defined | SEA-4 |
| SEA-GAP-010 | DGAL placement expressed in contracts | SEA-4/5 |
| SEA-GAP-018 | Bounded Companion placement expressed | SEA-4/5 |

## 49. Files Created
- `src/system/sea/visualExperienceContracts.js`
- `scripts/validate-sea-visual-contracts.mjs`
- `tests/sea3VisualExperienceContracts.test.mjs`
- `docs/architecture/SEA-3_MOCK_VISUAL_EXPERIENCE_CONTRACTS.md`

## 50. Files Modified
- `package.json` adds `sea:visual:validate`.
- `src/system/sea/dashboardArchitecture.js` marks Executive Command Work as `N/A`, aligning SEA-2 with its bounded projection.

## 51. Owner Work Preservation
All pre-existing worktree changes were preserved. No reset, clean, stash, migration, commit, or push was performed.

## 52. SEA-3 Decision
**SEA-3 COMPLETE.** Priority A visual contracts are machine-readable, role-specific, authority-safe, responsive, status-aware, and ready for SEA-4 implementation. No broad live dashboard implementation or future Accessibility/Frontend Design work was started.

## 53. Exact Next Phase
**SEA-4 — PRIORITY SERVICE DASHBOARD IMPLEMENTATION**

## Required Matrices

### VISUAL CONTRACT MATRIX
| Service | Role | Projection | Visual Authority | Density | Desktop Order | Mobile Order | Primary CTA | Mock Status |
|---|---|---|---|---|---|---|---|---|
| Student | learner | student-learning:learner | EXISTING_IMPLEMENTATION | LOW | Context/Attention/Next/Work/Progress/Intelligence/Help | Context/Attention/Next/Work/Progress/Help/Intelligence | Continue assignment | No canonical mock |
| Instructor | instructor | instructor:instructor | EXISTING_IMPLEMENTATION | MODERATE | Context/Attention/Next/Work/Progress/Intelligence/Help | Context/Attention/Next/Work/Progress/Help/Intelligence | Review instructional work | No canonical mock |
| Onboarding | applicant/reviewer | applicant/reviewer | NO_CANONICAL_VISUAL_AUTHORITY | LOW/HIGH | Context/Attention/Next/Work/Progress/Help | Context/Attention/Next/Work/Progress/Help | Complete requirement / review case | No canonical mock |
| CivicSure | provider/operator | provider/operator | EXISTING_IMPLEMENTATION | MODERATE/HIGH | Context/Attention/Next/Work/Progress/Intelligence/Help | Context/Attention/Next/Work/Progress/Help/Intelligence | Submit/correct / review case | No canonical mock |
| Studio | builder/QA/reviewer | builder/qa/reviewer | LOCKED_DIRECTION | MODERATE/HIGH | Context/Attention/Next/Work/Progress/Intelligence/Help | Context/Attention/Next/Work/Progress/Help/Intelligence | Build / inspect / review | Design documentation |
| Hub/BOS | org_admin | bos-hub:org_admin | LOCKED_DIRECTION | MODERATE | Context/Attention/Next/Work/Progress/Help | Context/Attention/Next/Work/Help/Intelligence | Open owning service | Direction reference |
| Agent Fabric | agent_operator | agent-fabric:agent_operator | EXISTING_IMPLEMENTATION | HIGH | Context/Attention/Next/Work/Progress/Intelligence/Help | Context/Attention/Next/Work/Progress/Help/Intelligence | Review governed work order | No canonical mock |
| ARAG-1 | approver | arag-1:approver | NO_CANONICAL_VISUAL_AUTHORITY | HIGH | Context/Attention/Next/Work/Progress/Intelligence/Help | Context/Attention/Next/Work/Progress/Help/Intelligence | Review release gate | No canonical mock |
| DGAL | user/admin | dgal:user/admin | EXISTING_IMPLEMENTATION | MODERATE/HIGH | Context/Attention/Next/Work/Progress/Help | Context/Attention/Next/Work/Progress/Help | Open requirement / lifecycle | No canonical mock |
| Reporting/Truth | analyst/auditor | reporting/truth | EXISTING_IMPLEMENTATION | HIGH | Context/Attention/Next/Work/Progress/Intelligence/Help | Context/Attention/Next/Work/Progress/Help/Intelligence | Review readiness/projection | No canonical mock |
| Executive Command | shs_admin | executive-command:shs_admin | LOCKED_DIRECTION | LOW | Context/Attention/Next/Intelligence/Help | Context/Attention/Next/Intelligence/Help | Open owning service | Direction reference |
| Career | learner | career:learner | LOCKED_DIRECTION | LOW | Context/Attention/Next/Work/Progress/Intelligence/Help | Context/Attention/Next/Work/Progress/Help/Intelligence | Continue pathway | Design documentation |

### MOCK AUTHORITY MATRIX
| Service/Page | Existing Mock | Status | Version/Source | Canonical? | Drift Risk |
|---|---|---|---|---|---|
| OAS | Venus direction | LOCKED_DIRECTION | SEA-0 evidence | Yes, direction | Low |
| Universe | cinematic reference | LOCKED_DIRECTION | SEA-0 evidence | Yes, direction | Low |
| Foundation/Career | design documentation/assets | LOCKED_DIRECTION | SEA-0 evidence | Direction only | Moderate |
| SHS command | selected design references | LOCKED_DIRECTION | SEA-0 evidence | Direction only | Moderate |
| CivicSure explorer | mock/static data | NO_CANONICAL_VISUAL_AUTHORITY | SEA-0 evidence | No | High |
| Priority A dashboards | no confirmed mock | NO_CANONICAL_VISUAL_AUTHORITY or EXISTING_IMPLEMENTATION | Registry source | Contract is canonical | SEA-4 decision |

### STATUS SEMANTICS MATRIX
| Status | Visual Treatment Requirements | Text Required? | Icon Allowed? | Color-Only Allowed? |
|---|---|---|---|---|
| ACTION_REQUIRED | prominent labeled attention with safe action | Yes | Yes | No |
| WAITING | quiet owner/dependency status, no primary CTA | Yes | Yes | No |
| BLOCKED | reason, owner, prerequisite, remediation | Yes | Yes | No |
| AT_RISK | source-backed risk and reason | Yes | Yes | No |
| IN_PROGRESS / COMPLETE | source-backed state/timeline | Yes | Yes | No |
| VERIFIED / UNVERIFIED | explicit source-qualified label | Yes | Yes | No |
| PUBLIC_APPROVED | explicit approval source label | Yes | Yes | No |
| UNKNOWN | unknown/source-status explanation | Yes | Yes | No |

### BRAND MATRIX
| Service/Product | Brand Authority | Palette/Direction | Shell Style | Notes |
|---|---|---|---|---|
| SHF Curriculum | SHF | calm institutional | learner | low/moderate density |
| SHF Career | SHF Career | learner-friendly documented direction | learner | no invented market data |
| CivicSure | CivicSure | institutional/evidence-centered | provider/operator | authority explicit |
| SHS/BOS/Studio | SHS | current SHS system | application/workspace/operator | no arbitrary mixing |
| Agent Fabric/ARAG | SHS/Governance | governed operations | operator console | no autonomous-control styling |
| DGAL/Truth/Reporting | platform authority | document/high-integrity | document/operator | source semantics visible |
| Executive | SHS BOS | calm high-signal | bounded executive | not superuser |

### ACCEPTANCE MATRIX
| Service/Role | Required Sections | Action Hierarchy | Responsive | Authority-Safe | Visual Acceptance Ready |
|---|---|---|---|---|---|
| All Priority A projections | Registry-derived required regions | Primary/Secondary/Reference | Desktop/tablet/mobile order | Prohibited deviations and source semantics | YES |
| Student / Instructor | Context, Attention, Work, Help; progress/intelligence per projection | One dominant learning/instruction action | Mobile-first learner/instructor order | Role-separated | YES |
| CivicSure provider/operator | Context, Attention, Work, Help; status/progress per projection | Submit/correct vs review | Field and operator reflow | Provider/operator separated | YES |
| Studio builder/QA/reviewer | Context, Attention, Work, Help; handoff regions | Build vs inspect vs review | Workspace/queue reflow | No authority collapse | YES |
| Agent/ARAG/Executive | Context, Attention, Help plus projection-defined regions | Safe work/gate/referral action | High-density or bounded executive | No unrestricted/release/superuser authority | YES |
