# AX-2 — Persistent Accessibility Profile & Adaptive Experience

## 1. Executive Result
AX-2 operationalizes the existing personal accessibility profile. Authenticated profile state is loaded and saved through the canonical `/accessibility/profile/me` API; anonymous users receive system/product defaults plus an explicitly session-only convenience state. The runtime applies supported presentation state without owning accommodation, workflow, Evidence or Truth authority.

## 2. Repository Baseline
Repository: `/Users/mikeslate/Projects/shrv1`. Migration head remains 140. Existing owner work was preserved. No commit or push was performed.

## 3. AX-2 Gap IDs
AX-GAP-003, AX-GAP-014 and the AX-2 portion of AX-GAP-002 are addressed. Full alternative content, accommodation, assurance and system rollout gaps remain assigned to AX-3 through AX-7.

## 4. Persistent Profile Architecture
`user_accessibility_profiles` is the only authenticated preference store. The browser runtime owns effective presentation; the backend owns persistence, validation and revision concurrency.

## 5. user_accessibility_profiles
Migration 056 provides one user-scoped JSON profile with profile version, revision and timestamps. No new table or migration was added.

## 6. Backend Ownership
`apps/shs-api/src/domain/accessibility-profile/` owns the model, repository, service and routes. `/me` derives identity from the authenticated request and does not accept caller-selected user identity.

## 7. Frontend Runtime Ownership
`AccessibilityProfileProvider` owns loading, saving, reset and session fallback. `EffectiveAccessibilityContextProvider` derives OS-aware state and applies document presentation attributes. Both remain mounted from `src/entries/RootProviders.jsx`.

## 8. Profile Field Reconciliation
Persisted today: text scale, contrast mode, focus emphasis, target size, caption preference, transcript preference, motion preference, celebration intensity, reading support and read-aloud prominence. Line height, letter spacing, reading width, reduced density, alternative-format preference, keyboard-first and audio description remain future/partial capabilities rather than fabricated fields.

## 9. Effective Preference Precedence
Explicit persisted user preference > bounded session preference > supported system signal > reserved organization default > product default. Accommodation state is excluded from this chain.

## 10. Authenticated Loading
Authenticated loading is asynchronous and identity-keyed. A role/user identity change first resets in-memory state to defaults, then loads the new `/me` profile. Loading failures produce `UNAVAILABLE` and retain safe presentation defaults.

## 11. Anonymous Fallback
Anonymous entries do not call the profile API. They use system/product defaults and may store non-sensitive convenience state in `sessionStorage`; a flat legacy localStorage mirror is retained only for existing anonymous Curriculum compatibility and is never authenticated canonical truth.

## 12. Shared Device Isolation
The provider resets state on sign-out/sign-in identity transitions. Authenticated preferences never enter anonymous session storage. The API remains actor-scoped.

## 13. Profile Save
Supported settings call the canonical profile patch path. Authenticated saves expose `SAVING` then `SAVED`; failures expose `ERROR` and rethrow to the adapter without collapsing the application.

## 14. Save State / Error State
The existing settings surface now announces `LOADING`, `SAVING`, `SAVED`, `ANONYMOUS`, `UNAVAILABLE` and `ERROR` through a semantic status region. It does not claim server save success before the request returns.

## 15. Profile Reset
Reset uses the existing revision-checked reset API for authenticated users and clears only the anonymous session convenience state for anonymous users. Accommodation records are never touched.

## 16. Canonical Settings Experience
`CurriculumAccessibility` and `AccessibilityPreferencesPanel` remain the strongest existing user-facing settings surface. It is a preference surface and explicitly disclaims diagnosis/medical meaning; AX-4 support workflows are not faked.

## 17. Text Scale
The known Curriculum failure was fixed: the final fixed 12px notification/status rule now uses the shared `--ld-text-scale` lever. The shared adaptive layer also exposes bounded body scaling for `LARGE` and `EXTRA_LARGE`.

## 18. Known AIEL Text-Scaling Gap
Resolved. `tests/aielPhase4CurriculumAccessibility.test.mjs` now passes 23/23. This closes the AX-2-owned gap without weakening the assertion.

## 19. Line Height
No independent persisted line-height field exists. It remains honestly classified as FUTURE_PHASE; current content-specific line-height values are not misrepresented as a user preference.

## 20. Letter Spacing
No independent persisted field exists. It remains FUTURE_PHASE and is not exposed as a no-op control.

## 21. Reading Width
No independent persisted field exists. It remains FUTURE_PHASE and is not applied to tables, workspaces or game canvases.

## 22. Reduced Motion
The effective context remains canonical. It combines explicit `REDUCED`/`FULL` profile choice with `prefers-reduced-motion` only when the choice is `AUTO`. The shared adaptive stylesheet minimizes non-essential animation and transitions.

## 23. Simplified UI
Reading support remains a real canonical content preference. A universal simplified presentation toggle is not advertised; page-local IEP controls remain bounded and are not treated as global authority.

## 24. Reduced Density
Reduced density remains distinct from simplified content and is not falsely exposed as a persisted supported field. SEA page projections remain responsible for safe density composition.

## 25. High Contrast / Forced Colors
Curriculum profile-backed high contrast remains active. Forced-colors behavior is respected and not overridden with unsafe author colors.

## 26. Focus Enhancement
Profile-backed focus emphasis and target size remain active where supported. Native focus is enhanced, not removed.

## 27. Keyboard First
The current supported behavior is bounded focus emphasis/target sizing through the existing adapter. A broader keyboard-first mode remains PARTIAL and is not presented as a shortcut system.

## 28. Screen Reader Optimization
No fake screen-reader mode was added. Semantic correctness remains a component/design-system and assurance responsibility.

## 29. Read Aloud
Read-aloud prominence is persisted and supported where the existing content control exists. Speech generation and universal audio alternatives remain AX-3.

## 30. Captions Preference
Caption preference is persisted separately from media capability. `PREFER` never asserts that captions exist.

## 31. Transcripts Preference
Transcript preference is persisted separately from transcript availability and fulfillment.

## 32. Alternative Format Preference
No universal alternative-format preference or conversion engine was invented. DGAL/content systems retain fulfillment authority.

## 33. Audio Description
Audio description remains future capability; preference vocabulary does not imply availability.

## 34. Adaptive CSS / Presentation Layer
`src/styles/accessibility-adaptive.css` supplies shared bounded text-scale and reduced-motion hooks. Curriculum continues to consume its scoped `--ld-text-scale`, contrast, focus and target-size tokens. This is a presentation layer, not a second design system.

## 35. Root Provider Integration
No competing provider was introduced. `RootProviders` imports the adaptive stylesheet and mounts the canonical profile/effective contexts. Standalone anonymous entries use the optional-auth fallback safely.

## 36. Legacy Preference Migration
Existing localStorage keys remain one-time migration inputs for authenticated profile creation. The flat preferences and ReadingLevel APIs remain compatibility adapters; no active preference is silently discarded.

## 37. LocalStorage Boundary
Authenticated canonical truth is the profile API. Anonymous convenience state uses sessionStorage plus a flat legacy localStorage compatibility mirror; legacy localStorage is never authenticated canonical truth.

## 38. OGL Integration
OGL may consume reduced motion and related contextual signals. Tour/orientation/guidance state and authority remain OGL-owned.

## 39. DGAL Integration
DGAL may consume presentation preferences for reading/document presentation. Lifecycle, requirements, acknowledgment, signature and retention remain DGAL-owned.

## 40. Companion Integration
Companion remains bounded and may consume effective motion/context signals. It cannot infer disability/accommodation or approve any service action.

## 41. SEA Integration
Adaptive state changes presentation only. It cannot change role, entitlement, workflow, attention truth, canonical next-action eligibility, Evidence or Truth.

## 42. Privacy / Security
Profile data is user-scoped, least-privilege, non-public and not used for marketing or disability inference. Accommodation fields are rejected by the API patch validator and remain institutionally scoped.

## 43. Profile API Authorization
The backend uses authenticated actor identity and `enrollment.view` permission. User-selected IDs in query/body are not accepted as profile identity. Revision checks prevent stale overwrites. The live disposable API security suite passes 18/18 after its test-only users receive the existing least-privilege student memberships required by the permission middleware.

## 44. No-Op Controls
AX-2-owned settings are connected to the canonical adapter/runtime and have honest save state. Unsupported line-height, reading-width, density and audio-description controls are not exposed.

## 45. Multi-App Compatibility
Representative shared RootProviders entries receive the same runtime and adaptive stylesheet. Apps without authenticated identity use the optional-auth anonymous fallback; no second provider is created.

## 46. Responsive Acceptance
The adaptive CSS uses bounded scale values and preserves ordinary flow. Existing Curriculum responsive/AIEL checks pass; full combinatorial adaptive visual acceptance remains future AX-7 work.

## 47. Browser Acceptance
The dedicated authenticated browser acceptance ran against an ephemeral API and Vite app bound to `127.0.0.1`. It passed 2/2: authenticated save survives reload and a User A to User B switch, and anonymous mode uses the bounded session fallback while an unauthenticated profile request returns 401. The earlier non-completing run was a TEST-HARNESS DEFECT: its init script reinstalled User A on every reload, making User B impossible to represent. The harness now carries the selected test identity through session storage before reload.

## 48. Focused Tests
AX-2 profile tests: 8/8. AX-1 tests: 7/7. AX-0 tests: 4/4. AIEL tests: 23/23.

## 49. Validators
`accessibility:runtime:validate`, `accessibility:profile:validate`, all SEA validators, OGL/orientation/manifests/UI/layer/truth/oracle validators, API typecheck, build and `git diff --check` pass.

## 50. Gap Closure Matrix

| Gap ID | Severity | AX-2 Requirement | Final State | Evidence |
|---|---|---|---|---|
| AX-GAP-002 | P1 | normalize duplicate preference consumers | RESOLVED | canonical adapter/runtime; 8 AX-2 tests |
| AX-GAP-003 | P2 | persistent profile used safely | RESOLVED | `/me` API, identity reset, profile validator |
| AX-GAP-014 | P2 | canonical text scale | RESOLVED | AIEL 23/23; shared CSS lever |

## 51. Remaining AX-3+ Work
AX-3 owns alternative content, captions/transcript generation and audio-description pipelines. AX-4 owns accommodation workflows. AX-5 owns assurance/release gates. AX-6 owns operations/support. AX-7 owns broad rollout and final acceptance.

## 52. EXR Handoff Items
None created by AX-2. Any broader settings discoverability/navigation restructuring remains outside this phase.

## 53. Frontend Design Handoff Items
Deeper visual polish and cross-product adaptive styling remain future Frontend Design work; AX-2 only adds shared functional hooks.

## 54. Files Created
[accessibility-adaptive.css](/Users/mikeslate/Projects/shrv1/src/styles/accessibility-adaptive.css), [validate-accessibility-profile.mjs](/Users/mikeslate/Projects/shrv1/scripts/validate-accessibility-profile.mjs), [ax2AccessibilityProfile.test.mjs](/Users/mikeslate/Projects/shrv1/tests/ax2AccessibilityProfile.test.mjs), [ax2-profile-browser.spec.mjs](/Users/mikeslate/Projects/shrv1/tests/ax2-profile-browser.spec.mjs), this report.

## 55. Files Modified
`src/auth/auth-context.jsx`, `src/context/AccessibilityProfileContext.jsx`, `src/context/AccessibilityPreferences.jsx`, `src/components/lessons/AccessibilityPreferencesPanel.jsx`, `src/context/EffectiveAccessibilityContext.jsx`, `src/entries/RootProviders.jsx`, `src/styles/curriculum-dashboard.css`, `src/lib/accessibilityProfile/api.js`, `src/system/identity/authClient.js`, `scripts/run-phase8-acceptance-env.mjs`, `apps/shs-api/tests/accessibility-profile.security.test.ts`, `package.json`.

## 56. Owner Work Preservation
Unrelated existing work was preserved. No reset, clean, stash, commit or push was performed.

## 57. Migration State
No migration was added. Migration head remains 140.

## 58. AX-2 Decision
AX-2 implementation and the remaining authenticated acceptance evidence are complete. The live API security suite passes 18/18 and the dedicated browser suite passes 2/2 on disposable infrastructure at `127.0.0.1`. No AX-2 P0 or repository-local P1 remains. No product authorization was weakened: the only fixture correction adds the canonical existing student membership to test users, while the browser identity header is development-only and host-gated.

## 59. Exact Next Phase
**AX-3 — UNIVERSAL ALTERNATIVE CONTENT ENGINE**

## 60. Acceptance Lane Classification

| Acceptance Lane | Current Failure | Classification | Product Change Required? | Harness/Fixture Change Required? |
|---|---|---|---|---|
| Authenticated profile persistence | Initial live users lacked the permission-bearing membership required by `enrollment.view` | FIXTURE-AUTH HARNESS DEFECT | No authorization change | Yes; add least-privilege test memberships |
| Reload persistence | No dedicated authenticated browser proof existed | TEST-HARNESS DEFECT | No | Yes; dedicated `127.0.0.1` browser spec |
| User A to User B isolation | Previous browser init script restored User A on every reload | TEST-HARNESS DEFECT | No | Yes; session-backed test identity handoff |
| Own-profile API authorization | Live acceptance was initially blocked by fixture membership | FIXTURE-AUTH HARNESS DEFECT | No | Yes; canonical memberships in test setup |
| Cross-user API denial | Same fixture authorization block | FIXTURE-AUTH HARNESS DEFECT | No | Yes; live security suite against disposable API |
| Anonymous denial/fallback | Default harness supplied a development identity | FIXTURE-AUTH HARNESS DEFECT | No production change | Yes; explicit demo-auth disable and anonymous browser context |

## 61. Live Profile API Acceptance

`tests/accessibility-profile.security.test.ts` passes 18/18 against a disposable PostgreSQL/API environment migrated through 140. The run proves both users can read and update only their own profile, cross-user reads and writes are denied by actor-derived `/me` identity, anonymous access is denied, reset and revision behavior are enforced, and profile data cannot carry accommodation or operational/Truth authority.

## 62. Authenticated Browser Persistence Acceptance

`tests/ax2-profile-browser.spec.mjs` passes 2/2 against a disposable Vite/API environment using explicit `127.0.0.1`. The authenticated flow loads User A, saves HIGH contrast through the live API, verifies the saved server value, reloads and observes it again, then switches to User B and observes User B's independent default profile. The anonymous flow confirms session fallback and a 401 profile request without an authenticated identity.

## 63. Final Acceptance

| Focused Lane | Result | Evidence |
|---|---|---|
| Authenticated persistence | PASS | browser 2/2; API 18/18 |
| Reload persistence | PASS | browser 2/2 |
| User A to User B isolation | PASS | browser 2/2; AX-2 identity tests 8/8 |
| Own-profile API authorization | PASS | API 18/18 |
| Cross-user API denial | PASS | API 18/18 |
| Anonymous denial/fallback | PASS | browser 2/2; API 18/18 |

The earlier browser stall and the initial API fixture failure were harness classifications, not product defects. AX-2 P0 = 0 and repository-local P1 = 0.

## Required Profile Matrix

| Preference | Persisted | Session | System Derived | Effective Runtime | Support State | Future Phase |
|---|---:|---:|---:|---:|---|---|
| textScale | yes | yes | no | yes | PERSISTED_SUPPORTED | AX-2 |
| reducedMotion | yes | yes | yes | yes | PERSISTED_SUPPORTED | AX-2 |
| highContrast | yes | yes | no | partial | PARTIAL | AX-2/7 |
| focusEnhancement | yes | yes | no | partial | PARTIAL | AX-2/5 |
| targetSize | yes | yes | no | partial | PARTIAL | AX-2 |
| captions | yes | yes | no | preference only | PARTIAL | AX-3 |
| transcripts | yes | yes | no | preference only | PARTIAL | AX-3 |
| readAloud | yes | yes | no | partial | PARTIAL | AX-3 |
| reading support | yes | yes | no | yes where offered | PERSISTED_SUPPORTED | AX-3 |
| lineHeight | no | no | no | no | FUTURE_PHASE | AX-2 |
| letterSpacing | no | no | no | no | FUTURE_PHASE | AX-2 |
| readingWidth | no | no | no | no | FUTURE_PHASE | AX-2 |
| reducedDensity | no | no | no | no | FUTURE_PHASE | AX-2/7 |
| alternative format | no | no | no | no | FUTURE_AX3 | AX-3 |
| audioDescription | no | no | no | no | FUTURE_AX3 | AX-3 |

## Required Adaptive Behavior Matrix

| Preference | Runtime Effect | Scope | Persistence | Browser Evidence | Result |
|---|---|---|---|---|---|
| textScale | data attributes, Curriculum token, bounded body scale | shared/Curriculum | profile or anonymous session | AIEL text-scale suite | PASS |
| reducedMotion | effective OS/profile state, reduced nonessential transitions | shared runtime | profile or system | effective-context tests | PASS |
| highContrast | Curriculum token strengthening and forced-colors safety | Curriculum | profile | AIEL contrast tests | PASS |
| focusEnhancement | stronger focus ring/target size where supported | Curriculum/shared adapter | profile | AIEL focus/target tests | PASS |
| captions/transcripts | preference controls default presentation only | media/content | profile | AIEL media tests | PASS |
| readAloud | prominence of existing speak control | content | profile | AIEL read-aloud tests | PASS |

## Required App Coverage Matrix

| App/Experience | Profile Runtime | Text Scale | Motion | Contrast | Simplified UI | Browser Proof |
|---|---|---|---|---|---|---|
| Foundation/Public | anonymous fallback where RootProviders is present | shared hook | system fallback | product tokens | not advertised | build/validator |
| Student/Curriculum | RootProviders | canonical | canonical | supported | reading support | AIEL/browser suite |
| Career | RootProviders | shared hook | canonical | product tokens | bounded | SEA acceptance evidence |
| Admin/BOS | RootProviders | shared hook | canonical | product tokens | not advertised | SEA acceptance evidence |
| CivicSure | RootProviders | shared hook | canonical | product tokens | not advertised | SEA acceptance evidence |
| DGAL | consuming surfaces | presentation-compatible | canonical | product tokens | bounded | deterministic contract |
| OAS | entry-compatible | product tokens | system-safe | product direction | not advertised | OGL/SEA validators |
| Universe | standalone-safe | product direction | system-safe | product direction | not advertised | existing Universe suite |

## Required Security Matrix

| Scenario | Expected Boundary | Test | Result |
|---|---|---|---|
| User A reads User B | `/me` derives authenticated actor | disposable live API security suite, 18/18 | PASS |
| User A writes User B | no caller-selected identity | disposable live API security suite, 18/18 | PASS |
| anonymous profile read | no authenticated API call | AX-2 profile test/provider branch | PASS |
| sign-out clearing | identity effect resets defaults | AX-2 identity test | PASS |
| User A → User B switch | new identity loads isolated state | identity-keyed provider | PASS |
| org/tenant boundary | profile is user-owned; no scope injection | schema/API inspection | PASS |
