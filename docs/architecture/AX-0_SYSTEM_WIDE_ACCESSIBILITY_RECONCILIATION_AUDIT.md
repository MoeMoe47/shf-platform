# AX-0 SYSTEM-WIDE ACCESSIBILITY RECONCILIATION & AUDIT

## 1. Executive Result
AX-0 is complete as a read-only audit. The repository has an active personal accessibility profile/runtime and substantial accessibility islands, but not yet a single assured system-wide Accessibility Layer. The audit identifies 10 active mechanisms, 11 duplication categories, 2 connected scope-dependent controls, 21 stable AX gaps, and bounded maturity for each major area.

## 2. Repository Baseline
Repository: `/Users/mikeslate/Projects/shrv1`
Branch: `studio-v1-plus-development`
HEAD: `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`
Migration head: `140`
No production behavior, migration, commit, or push was performed.

## 3. Audit Method
Read-only source, migration, route, provider, component, design-system, test, and architecture-document inspection. Findings were recorded in `src/system/accessibility/ax0Audit.js` and validated deterministically.

## 4. Accessibility Architecture Context
The repository contains prior AIEL personal-profile work. AX-0 treats it as current evidence, not as permission to start AX-1. Personal preference, content capability, application capability, and institutional accommodation remain separate authority classes.

## 5. Runtime Inventory
The inventory contains 10 active mechanisms. The strongest candidate is `AccessibilityProfileProvider` plus `EffectiveAccessibilityContextProvider` mounted from `src/entries/RootProviders.jsx`.

## 6. Root Provider Audit
`src/entries/RootProviders.jsx` mounts profile, effective context, Companion, Celebration, LiveAnnouncer, and Brainiact. `src/providers/RootProviders.jsx` is a separate pass-through provider and is not the strongest shared extension point. App entry nesting still creates boundary differences, especially for ReadingLevel fallback behavior.

## 7. Reduced Motion
Reduced motion is supported by OS `prefers-reduced-motion`, canonical profile preference, effective context, Companion behavior, curriculum CSS, celebration behavior, and legacy migration. This is functional but duplicated at the consumer edge. Recommendation: AX-1 owns the effective runtime; consumers consume it rather than observe OS state independently.

## 8. Simplified UI
Reading support has a canonical three-value profile field when inside the shared provider tree. IEP `simpleMode` and `focusMode` are separate local concepts. No single global simplified UI exists; labels must not imply an accommodation.

## 9. Skip Links
Active variants exist in `AppLayout`, `SkipLinks`, `A11yTools`, and `CurriculumLayout`. Curriculum intentionally avoids a duplicate A11yTools link, but cross-app target/mount conventions are not centrally assured. AX-1 should define one shell contract.

## 10. Keyboard
Native controls, semantic buttons, tables, dialogs, tours, and focused Arcade/Curriculum tests provide partial-to-strong islands. System-wide coverage is not measured. Custom cards, drag/drop, dense operator surfaces, and cinematic Universe navigation require AX-5 validation.

## 11. Focus Management
Route focus, dialog return focus, tour focus, Guidance Center Escape behavior, and local focus helpers exist. They are implemented in multiple systems without one cross-app policy for route transitions, async updates, or all drawers/modals.

## 12. Screen Reader / Semantics
Headings, labels, `role=status`, `aria-live`, dialog labels, table captions, and semantic OGL alternatives exist. Coverage is uneven and no centralized semantic regression gate was found.

## 13. Color / Contrast
Curriculum has profile-backed high-contrast CSS, forced-colors handling, focus emphasis, and target sizing. The IEP surface has page-local contrast classes. There is no proven all-app contrast contract or automated contrast gate.

## 14. Text / Reading Personalization
Profile-backed `DEFAULT/LARGE/EXTRA_LARGE` and `CORE/SIMPLE/ADVANCED` support exists, alongside IEP inline percentage scaling and local reading-level fallback. Scope and value models differ across apps.

## 15. Preference Persistence
Personal preferences persist in `user_accessibility_profiles` as user-scoped JSON with revision checks through `/accessibility/profile/me`. Legacy localStorage values are migrated when no canonical row exists. OS motion is not persisted. Local fallback remains in apps outside the canonical provider tree.

## 16. User Profile Readiness
The user profile has a bounded personal-preference API and storage model. AX-2 should address cross-app/provider coverage and device portability; no user schema change is proposed in AX-0.

## 17. Institutional Accommodation
Migration 057 defines a structurally separate `authorized_accommodations` table with organization/user scope, lifecycle, typed values, and grant/revoke authority intent. No complete corresponding operational service/API/read/enforce workflow was found. This is readiness evidence, not a complete accommodation product.

## 18. Live Learning Accessibility
Live Learning has session, provider, and recording-policy foundations. Captions, transcripts, interpreters, accessible chat, and equivalent session content are not exposed as a canonical SHF accessibility capability contract. Provider capability and external dependency must remain distinct.

## 19. Captions / Transcripts
Curriculum media can consume real caption tracks and transcript metadata; missing capability is reported honestly. LessonTemplate, MediaRow, and SpeakBtn provide localized transcript/read-aloud behavior. No universal caption/transcript ownership or storage pipeline exists.

## 20. Alternative Content
Existing capabilities include semantic HTML, lesson content variants, transcript download, and read-aloud controls. No universal large-print, tagged-PDF, EPUB, Braille-ready, audio-description, or transformation engine was found.

## 21. Curriculum Content
Lesson JSON contains alt/caption metadata, content variants, assessments, tables, images, video, and accessibility warnings. This is a feasible source boundary for AX-3, but coverage is content-by-content rather than guaranteed globally.

## 22. Document Accessibility
DGAL has semantic HTML/document tests, captions in table documentation, packets, signatures, and retention concepts. Consistent tagging and alternative-format assurance for every uploaded/generated PDF/DOCX remains unverified.

## 23. OGL Accessibility
OGL remains complete and strong: keyboard tour controls, Escape, focusable coachmarks, accessible alternatives, delayed-target handling, semantic labels, and Guidance Center behavior are present. AX must consume and preserve OGL rather than duplicate it.

## 24. Companion Accessibility
Companion can explain, summarize, contextualize, navigate/help, announce updates, and respect reduced motion. Describing arbitrary charts, producing transcripts, and surfacing institutional accommodations require explicit future contracts. Approval, verification, signature, release, Evidence, and Truth authority remain prohibited.

## 25. Public Experience Accessibility
Public shells have semantic headings, navigation, alt text, focus/dialog patterns, and responsive tests in selected surfaces. Foundation, Impact, CivicSure public, OAS, Store/Catalog, and public registry coverage is partial and needs representative AX-7 acceptance.

## 26. Universe Accessibility
Universe has cinematic direction and route/destination relationships, but keyboard alternative navigation, screen-reader destination semantics, and motion-intensity acceptance are not systemically assured. Preserve the visual direction; AX-7 should add acceptance.

## 27. Learning Arcade Accessibility
Arcade has accessibility dialogs, keyboard/touch tests, touch-target checks, instructions, and reduced-motion concerns. Game-by-game keyboard equivalence, non-timing alternatives, captions/audio, and evidence-equivalence policy remain incomplete.

## 28. Automated Testing
Focused tests include `tests/aielPhase4CurriculumAccessibility.test.mjs`, semantic Playwright suites, OGL tests, document tests, and custom validators. No axe dependency or central accessibility validator was found.

## 29. CI / Release Gate
Accessibility-related tests can run locally, but no CI-wide accessibility job or release-blocking accessibility gate was identified. AX-5 owns the future gate.

## 30. Human Validation
Repository docs and focused browser tests imply targeted manual review, but a repeatable screen-reader, keyboard-only, disabled-user, or expert sign-off process is not centrally defined.

## 31. Accessibility Operations
No accessibility operations center, issue ownership queue, retest state, or regression dashboard was found. AX-6 owns this gap.

## 32. Support / Escalation
General help, OGL, DGAL, and Companion paths exist. No dedicated accessibility issue, accommodation request, AT-context, or human escalation workflow was found.

## 33. Accessibility Data / Privacy
Personal preferences are user-scoped and do not contain diagnosis fields. Accommodation records are organization/user scoped and sensitive. Future phases must enforce least privilege, organization isolation, retention, redacted logs, and no public/reporting leakage.

## 34. Authority Boundaries
The profile/runtime does not own curriculum completion, attendance, assessment, Arcade mastery, portfolio evidence, career outcomes, identity, permissions, membership, Evidence, or Truth. Migration 057 and profile validation explicitly support this separation.

## 35. SEA Integration
AX should be consumed by SEA contracts, projections, visual contracts, responsive priorities, and EXR handoffs as a presentation/support layer. It must not rewrite service workflow or next-action authority.

## 36. EXR Dependencies
EXR must preserve accessibility semantics when it later merges, splits, moves, streamlines, replaces, or retires pages. SEA-6 route and journey handoffs remain active dependencies.

## 37. Frontend Design Dependencies
Future visual work must preserve semantic order, focus visibility, text scaling, contrast, non-color status, responsive reflow, reduced motion, accessible media, and OGL anchors. AX acceptance precedes aesthetic polish.

## 38. Duplication Matrix
| Accessibility Capability | Implementation A | Implementation B | Additional Implementations | Conflict/Overlap | Recommended AX Owner |
|---|---|---|---|---|---|
| Reduced motion | Effective context | Companion | CSS, migration | Multiple readers | AX-1 |
| Simplify/reading | ReadingLevelProvider | Profile adapter | IEP, focusMode | Different semantics | AX-1/3 |
| Skip links | AppLayout | SkipLinks | A11yTools, Curriculum | Target/mount variants | AX-1 |
| Focus | CSS | useFocusVisibleClass | route/dialog/tour | No central policy | AX-1/5 |
| Contrast | Curriculum CSS | IEP CSS | profile | Scope/value split | AX-1 |
| Text scaling | Profile data attrs | IEP inline style | reading levels | Different scales | AX-1/2 |
| Settings | Profile API | IEP toolbar | local fallback | Canonical/local overlap | AX-1/2 |
| Help | OGL | Companion | inline checklists | Distributed ownership | AX-1/6 |
| Captions/transcripts | MediaRow | LessonTemplate | metadata/provider | No universal capability | AX-3 |
| Alternative formats | lesson variants | transcript download | semantic docs | No transformation engine | AX-3 |
| Testing | AIEL tests | Playwright | custom validators | No axe/CI gate | AX-5 |

## 39. No-Op Controls
No silent no-op control was confirmed in the active inspected paths. Two controls are connected but scope-dependent: the IEP toolbar is page-local and ReadingLevel local fallback persists only outside the canonical provider tree. They are gaps, not falsely classified as globally canonical controls.

## 40. Accessibility Gap Register
| Gap ID | Severity | Category | Scope | Finding | Evidence | Phase Owner |
|---|---:|---|---|---|---|---|
| AX-GAP-001 | P1 | AX-RUNTIME | Runtime ownership | Distributed provider/adapter ownership | RootProviders/context inventory | AX-1 |
| AX-GAP-002 | P1 | AX-DUPLICATION | Settings | Canonical and legacy controls coexist | profile, adapter, IEP | AX-1 |
| AX-GAP-003 | P2 | AX-PERSISTENCE | App boundaries | Persistence coverage varies by provider nesting | migration 056 | AX-2 |
| AX-GAP-004 | P1 | AX-ACCOMMODATION | Institutional support | Schema exists; operational workflow absent | migration 057 | AX-4 |
| AX-GAP-005 | P1 | AX-LIVE_LEARNING | Sessions | No canonical accessibility capability contract | provider/model audit | AX-3/EXTERNAL |
| AX-GAP-006 | P1 | AX-CAPTIONS | Content | No universal caption capability registry | MediaRow/lesson metadata | AX-3 |
| AX-GAP-007 | P1 | AX-TRANSCRIPTS | Content | Component-specific transcript support | MediaRow/LessonTemplate/SpeakBtn | AX-3 |
| AX-GAP-008 | P1 | AX-ALTERNATIVE_CONTENT | Content | No universal transformation engine | variants/download | AX-3 |
| AX-GAP-009 | P2 | AX-DOCUMENT | DGAL | Document accessibility not uniformly assured | DGAL tests/inventory | AX-3/AX-5 |
| AX-GAP-010 | P2 | AX-KEYBOARD | System | Coverage is not system-wide measured | focused browser tests | AX-5 |
| AX-GAP-011 | P1 | AX-FOCUS | System | Multiple local focus systems | tours/dialogs/routes | AX-1/AX-5 |
| AX-GAP-012 | P2 | AX-SCREEN_READER | System | Semantic coverage not centrally assured | live regions/landmarks | AX-5 |
| AX-GAP-013 | P2 | AX-CONTRAST | System | Contrast support is not all-app | Curriculum/IEP CSS | AX-1/AX-7 |
| AX-GAP-014 | P2 | AX-TEXT | System | Multiple text/value scopes | profile/reading/IEP | AX-1/AX-2 |
| AX-GAP-015 | P1 | AX-TESTING | Assurance | No axe/CI-wide coverage | test/package inventory | AX-5 |
| AX-GAP-016 | P1 | AX-RELEASE_GATE | Assurance | Accessibility does not block release | CI/package inventory | AX-5 |
| AX-GAP-017 | P1 | AX-OPERATIONS | Operations | No accessibility operations center | admin inventory | AX-6 |
| AX-GAP-018 | P2 | AX-SUPPORT | Support | No dedicated accessibility escalation | support inventory | AX-6 |
| AX-GAP-019 | P1 | AX-PRIVACY | Data | Privacy is documented, not operationally assured | constitution/migrations | AX-4/AX-5 |
| AX-GAP-020 | P2 | AX-PUBLIC | Public | Public/Universe/Arcade acceptance incomplete | public tests | AX-7 |
| AX-GAP-021 | P3 | AX-EXR | Future IA | Accessibility must survive route restructuring | SEA-6 handoff | EXR |

## 41. P0 Findings
No P0 finding was confirmed. AX-0 is permitted to complete with documented P1/P2 findings assigned to later phases.

## 42. P1 Findings
12 P1 gaps: runtime ownership, duplication, accommodation workflow, Live Learning capability, captions, transcripts, alternative content, focus, testing, release gate, operations, and privacy assurance.

## 43. P2 Findings
8 P2 gaps: persistence coverage, documents, keyboard measurement, screen-reader assurance, contrast, text scope, support escalation, and public acceptance.

## 44. P3 Findings
1 P3 gap: preserving accessibility through future EXR information architecture changes.

## 45. Maturity Assessment
| Area | Current Level | Evidence | Target Direction |
|---|---|---|---|
| Runtime | 2 | Profile/effective providers active | AX-1 |
| Preferences | 2 | Nested profile and adapter | AX-2 |
| Persistence | 2 | User JSON profile/CAS API | AX-2 |
| Alternative Content | 1 | Variants/transcript download | AX-3 |
| Accommodation | 1 | Schema, no full workflow | AX-4 |
| Live Learning | 1 | Provider/session foundation | AX-3 |
| Automated Testing | 2 | Focused tests, no central axe gate | AX-5 |
| Release Gate | 0 | No blocking gate found | AX-5 |
| Operations | 0 | No center found | AX-6 |
| Companion | 2 | Bounded contextual support | AX-6 |
| Human Support | 1 | General help only | AX-6 |

## 46. Future Phase Ownership
All 21 gaps have owners: AX-1, AX-2, AX-3, AX-4, AX-5, AX-6, AX-7, EXR, or EXTERNAL. No gap is left open without an owner.

## 47. AX-1 Readiness
AX-1 can begin with a concrete inventory: choose `src/entries/RootProviders.jsx` as the canonical runtime extension point, define ownership for the profile/effective context, and retire or bound local adapters. AX-1 was not started here.

## 48. Files Created
- `src/system/accessibility/ax0Audit.js`
- `scripts/validate-ax0-audit.mjs`
- `tests/ax0Audit.test.mjs`
- `docs/architecture/AX-0_SYSTEM_WIDE_ACCESSIBILITY_RECONCILIATION_AUDIT.md`

## 49. Files Modified
- `package.json`: added `ax:audit:validate`.

## 50. Owner Work Preservation
All pre-existing owner changes, AIEL/OGL/SEA artifacts, migrations 056/057/139/140, and tests were preserved. No production runtime, schema, route, or authorization behavior was changed.

## 51. Validation
`npm run ax:audit:validate` passes. `tests/ax0Audit.test.mjs` passes 4/4. SEA contracts/dashboard/visual/rollout/final validators, orientation/OGL/manifests/UI/layer/truth/oracle validators, API typecheck, frontend build, and `git diff --check` pass. Migration head remains 140; no new migration was added.

## 52. AX-0 Decision
**AX-0 COMPLETE.** The system-wide accessibility mechanisms, ownership candidates, duplication, no-op/scope-dependent controls, persistence, accommodation boundary, content/media/document capability, public/runtime/testing/release/operations/support state, privacy boundaries, maturity, and future ownership are documented.

## 53. Exact Next Phase
`AX-1 — ACCESSIBILITY CONSTITUTION, OWNERSHIP & CANONICAL RUNTIME`

### Required Runtime Matrix
See `src/system/accessibility/ax0Audit.js` export `AX0_RUNTIME_INVENTORY` for the validated 10-row machine-readable matrix.

### Required Experience Matrix
| Experience | Keyboard | Focus | Screen Reader | Motion | Responsive | Alternative Content | Current Maturity |
|---|---|---|---|---|---|---|---|
| Student | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | LEVEL 2 |
| Instructor | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | LEVEL 2 |
| Parent | UNKNOWN | UNKNOWN | UNKNOWN | PASS | PASS | UNKNOWN | LEVEL 0 |
| Career | PARTIAL | PARTIAL | PARTIAL | PASS | PASS | PARTIAL | LEVEL 1 |
| Calendar | PARTIAL | PARTIAL | PARTIAL | PASS | PASS | UNKNOWN | LEVEL 1 |
| Live Learning | PARTIAL | PARTIAL | PARTIAL | EXTERNAL_PROVIDER_DEPENDENCY | PASS | UNKNOWN | LEVEL 1 |
| Arcade | PARTIAL | PARTIAL | WEAK | PARTIAL | PASS | PARTIAL | LEVEL 1 |
| CivicSure | PARTIAL | PARTIAL | PARTIAL | PASS | PASS | PARTIAL | LEVEL 2 |
| Studio | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | LEVEL 2 |
| Hub/BOS | PARTIAL | PARTIAL | PARTIAL | PASS | PASS | UNKNOWN | LEVEL 2 |
| Agent Fabric | PARTIAL | PARTIAL | PARTIAL | PASS | PASS | UNKNOWN | LEVEL 2 |
| ARAG | PARTIAL | PARTIAL | PARTIAL | PASS | PASS | UNKNOWN | LEVEL 2 |
| DGAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | LEVEL 2 |
| Public/Foundation | PARTIAL | PARTIAL | PARTIAL | PASS | PASS | PARTIAL | LEVEL 1 |
| OAS | PARTIAL | PARTIAL | PARTIAL | PASS | PASS | UNKNOWN | LEVEL 1 |
| Universe | WEAK | WEAK | WEAK | PARTIAL | PASS | UNKNOWN | LEVEL 1 |

### Required Testing Matrix
| Test/Tool | Scope | Automated | CI | Release Blocking | Human Follow-Up | Gap |
|---|---|---|---|---|---|---|
| AIEL focused tests | Curriculum/profile/media | Yes | Local/current suite | No | Needed | AX-GAP-015 |
| Playwright semantic tests | Selected routes | Yes | Local/current suite | No | Expand | AX-GAP-010/015 |
| OGL tests | Tours/guidance | Yes | Local/current suite | No | Preserve | AX-GAP-015 |
| DGAL document tests | Semantic document path | Yes | API suite | No | Broaden files | AX-GAP-009 |
| axe/Lighthouse | System-wide | No evidence | No evidence | No | Add later | AX-GAP-015/016 |

### Program Status
SEA-0 through SEA-6: COMPLETE.
AX-0: COMPLETE.
AX-1, AX-2, AX-3, AX-4, AX-5, AX-6, and AX-7: NOT STARTED.
EXR and Frontend Design: NOT STARTED.
