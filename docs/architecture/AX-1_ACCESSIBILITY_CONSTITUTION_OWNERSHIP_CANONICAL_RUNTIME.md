# AX-1 — Accessibility Constitution, Ownership & Canonical Runtime

## 1. Executive Result
AX-1 establishes one canonical accessibility runtime authority, separates personal preferences from institutional accommodations and assurance, and classifies all AX-0 runtime duplication. No migration or broad adaptive-experience rollout was performed.

## 2. Repository Baseline
Repository: `/Users/mikeslate/Projects/shrv1`. Migration head remains 140. Existing owner changes were preserved. No commit or push was performed.

## 3. AX-1 Gap IDs
AX-GAP-001, AX-GAP-002, AX-GAP-011, AX-GAP-013, AX-GAP-014 and AX-GAP-019 are resolved for AX-1 by the registry below. AX-2+ work remains assigned to its original owner.

## 4. Accessibility Constitution
Personal Accessibility is user-selected, non-authoritative presentation and interaction preference. Institutional Accessibility is an authorized organizational support obligation. Accessibility Assurance is testing, human validation, release evidence, monitoring and remediation. These are separate authorities.

## 5. Personal Accessibility
Preferences include motion, presentation, interaction, media and learning-support choices. They may change presentation and assistance, but never workflow state, eligibility, authority or domain outcomes.

## 6. Institutional Accessibility
Approved accommodations, captions/transcript obligations, interpreting, alternate formats and institutional support belong to an institutional accessibility domain. The existing `authorized_accommodations` schema is not merged into the personal preference runtime.

## 7. Accessibility Assurance
AX-5 owns automated testing, human validation, release gates, regression monitoring and remediation verification. AX-1 creates no blocking gate.

## 8. Preference vs Accommodation
`REDUCED_MOTION`, larger text, contrast and simplified presentation are preferences. Extended time, interpreters, approved alternate formats and service adjustments are accommodations. A preference never creates an accommodation, and an accommodation is never inferred from preference telemetry.

## 9. Authority Boundaries
Accessibility can normalize preferences, derive effective presentation state, report capability/source status and consume authorized projections. It cannot own identity, permissions, entitlements, curriculum completion, attendance, assessment, mastery, Evidence, Truth, verification, signatures, OGL workflow, release, CivicSure decisions, Studio review, Agent Fabric policy or any other service workflow authority.

## 10. Privacy Constitution
Preferences are user-specific and least-privilege. Accommodation data is sensitive and institutionally scoped. Public mode uses system/product defaults. There is no cross-user or cross-organization leakage, no marketing use, no accommodation inference, and no raw assistive-technology storage unless necessary, consented and bounded.

## 11. Telemetry Boundary
Allowed: aggregate feature use, accessibility error counts, test failures and remediation status. Prohibited by default: disability inference, accommodation details, raw screen-reader content and unnecessary identifying assistive-technology data.

## 12. Canonical Runtime Decision
The canonical runtime is the pair `AccessibilityProfileProvider` (raw user profile) plus `EffectiveAccessibilityContextProvider` (derived/system-aware state), represented by `src/system/accessibility/accessibilityConstitution.js`.

## 13. Root Provider Decision
The canonical mount is `src/entries/RootProviders.jsx`. `src/providers/RootProviders.jsx` is only a pass-through and is not a competing owner.

## 14. Runtime Contract
The contract exposes `preferences`, `systemPreferences`, `effectivePreferences`, `capabilities`, `source`, `loading`, `error`, `version`, `setPreference`, `resetPreference` and `supports`. It documents the current provider shape and does not claim that future capability consumers already exist.

## 15. Effective Preference Precedence
Explicit `USER_PROFILE` > bounded `SESSION` override > supported `SYSTEM` signal > bounded `ORGANIZATION_DEFAULT` (reserved, not currently active) > `PRODUCT_DEFAULT`. `NOT_AVAILABLE` is explicit when a source cannot provide a capability.

## 16. System Preference Integration
The current runtime consumes `prefers-reduced-motion`. Forced colors and browser/system contrast behavior remain respected by CSS; unsupported media features are not forced into the application.

## 17. Capability Vocabulary
`reducedMotion`, `textScale`, `lineHeight`, `letterSpacing`, `readingWidth`, `highContrast`, `simplifiedUI`, `reducedDensity`, `readAloud`, `focusEnhancement`, `captions`, `transcripts`, `preferredAlternativeFormat`, `keyboardFirst`, `screenReaderOptimization` and `audioDescription`.

## 18. Capability Support Status
Current statuses are machine-readable: SUPPORTED (1), PARTIAL (8), FUTURE_PHASE (7). No capability is presented as fully supported merely because its vocabulary exists.

## 19. Preference Source Model
The source vocabulary is `USER_PROFILE`, `SESSION`, `SYSTEM`, `ORGANIZATION_DEFAULT`, `PRODUCT_DEFAULT`, `NOT_AVAILABLE`. Accommodation is intentionally absent.

## 20. Persistence Boundary
AX-1 does not add persistence. The existing profile API remains the boundary, while the runtime has safe defaults when profile loading is unavailable.

## 21. user_accessibility_profiles Ownership
The accessibility-profile domain owns `user_accessibility_profiles`, keyed by authenticated user identity and revision-checked through the existing API. The table has no organization-scoped preference authority and is not an accommodation store.

## 22. Reduced Motion Consolidation
The effective accessibility context is canonical. CSS and motion-sensitive components consume the effective value. Companion's direct media-query observer is deprecated and should migrate to the effective context in a later bounded change.

## 23. Simplified UI Consolidation
`simplifiedUI` is the canonical preference vocabulary. Reading-level variants remain content-owned consumers; the IEP toolbar remains page-local until a safe migration. Simplified UI is not silently mapped to reduced density.

## 24. Reduced Density
Reduced density belongs to SEA page/projection composition and may be influenced by accessibility preferences later. It is distinct from simplified content or reading level.

## 25. Text Scale Ownership
The runtime/profile owns the normalized preference and document data attributes; application CSS owns layout consumption. The known Curriculum `12px` scaling failure remains AX-GAP-014's AX-2 implementation follow-up.

## 26. Focus Ownership
The router/shell owns route-change focus; dialog/drawer components own local focus trap and return; OGL owns tour focus; components own error/status focus. The runtime only exposes preference signals such as focus emphasis.

## 27. Skip-Link Ownership
Each shell provides one semantic skip-to-main strategy with a valid target. `#main` is the default application/public target and `#curriculum-main` is the Curriculum shell target. Existing shell variants are adapters to this contract, not competing preference runtimes.

## 28. Screen Reader Semantics
There is no fake screen-reader mode. Semantic HTML, accessible names, landmarks, statuses and live regions remain responsibilities of the design system, page components, content and AX-5 assurance.

## 29. Contrast / Forced Colors
High contrast is a bounded runtime preference where supported. Browser forced-colors behavior is not overridden unsafely; token/CSS consumers must preserve readable focus and status indicators.

## 30. Public App Compatibility
Anonymous/public apps do not require an authenticated profile. They fall back to system signals and product defaults.

## 31. Multi-App Compatibility
The runtime is mounted per multi-page entry through the shared `src/entries/RootProviders.jsx` composition. Consumers use context/adapters rather than copying providers.

## 32. SEA Integration
Accessibility may influence motion, density, text, responsive adaptation and alternative presentation. It cannot change service capability, workflow state, role authority or canonical next-action eligibility.

## 33. OGL Integration
OGL may consume normalized motion, simplified, focus and screen-reader preference signals. OGL remains owner of tour, orientation and guidance state.

## 34. DGAL Integration
Accessibility may influence document rendering and format preference. DGAL remains owner of document lifecycle, requirements, acknowledgment, signature and retention.

## 35. Companion Integration
Companion may use bounded contextual preference signals for explanation, motion and assistance. It remains non-authoritative and must not infer accommodation.

## 36. Accommodation Domain Boundary
The institutional accommodation domain owns authorization, scope, privacy and enforcement. AX-4 owns completion of request/grant/support workflows. Runtime projection, if later authorized, is read-only and bounded.

## 37. Compatibility Adapters
The flat `AccessibilityPreferencesProvider` and ReadingLevelProvider are adapters/consumers over canonical profile state. Shell skip links adapt to one shell contract. No adapter may write Evidence, Truth or workflow state.

## 38. Legacy / Deprecated Mechanisms
The Companion direct OS observer is deprecated. IEP toolbar and focus mode remain local-by-design pending proof. Legacy localStorage keys are migration inputs only; canonical profile state is server-owned when available.

## 39. No-Op Controls
AX-0 confirmed no silent no-op control. The IEP toolbar is connected but page-local; the ReadingLevel local fallback is connected but scope-dependent. Both are explicitly classified rather than advertised as global settings.

## 40. Settings Surface Ownership
The existing accessibility profile/settings surfaces are canonical consumers. The flat lesson settings API remains a compatibility surface. AX-2 owns full persistent-profile editing and cross-device adaptive UX.

## 41. Validation
`npm run accessibility:runtime:validate` passes. The validator checks one owner/mount, vocabulary, source/status validity, accommodation exclusion, authority boundaries, public fallback, adapter classification and privacy rules.

## 42. Focused Tests
`tests/ax1AccessibilityRuntime.test.mjs`: 7/7 pass. AX-0 tests remain 4/4. Existing AIEL accessibility tests remain 22/23, with the documented AX-2-owned Curriculum text-scale failure.

## 43. Gap Closure Matrix

| Gap | AX-1 result | Remaining owner |
|---|---|---|
| AX-GAP-001 runtime ownership | RESOLVED_FOR_AX1 | none for AX-1 |
| AX-GAP-002 duplication | RESOLVED_FOR_AX1 | later consumer migration |
| AX-GAP-011 focus | RESOLVED_FOR_AX1 | AX-5 coverage |
| AX-GAP-013 contrast | RESOLVED_FOR_AX1 | AX-2/AX-7 rollout |
| AX-GAP-014 text | RESOLVED_FOR_AX1 | AX-2 implementation |
| AX-GAP-019 privacy | RESOLVED_FOR_AX1 | AX-4/AX-5 assurance |

## 44. Remaining AX-2+ Work
AX-2 owns full persistent profile UX and adaptive text/layout rollout. AX-3 owns alternative content, captions and transcripts. AX-4 owns accommodation workflows. AX-5 owns assurance/release gates. AX-6 owns operations/support. AX-7 owns system rollout and final acceptance.

## 45. Files Created
`src/system/accessibility/accessibilityConstitution.js`, `scripts/validate-accessibility-runtime.mjs`, `tests/ax1AccessibilityRuntime.test.mjs`, this report.

## 46. Files Modified
`package.json` only for `accessibility:runtime:validate` and `ax:runtime:test`. Existing owner changes remain untouched.

## 47. Owner Work Preservation
No unrelated dirty work was reverted, staged, committed or pushed.

## 48. Migration State
No migration was added. Migration head remains 140.

## 49. AX-1 Decision
AX-1 is COMPLETE: one canonical runtime and constitution are established, AX-1-owned gaps are resolved, and downstream work is explicitly handed off.

## 50. Exact Next Phase
**AX-2 — PERSISTENT ACCESSIBILITY PROFILE & ADAPTIVE EXPERIENCE**

## Required Ownership Matrix

| Capability | Canonical Owner | Runtime Owner | Domain Authority | Legacy Owner(s) | AX Phase |
|---|---|---|---|---|---|
| Reduced Motion | Accessibility Runtime | Effective Context | motion components | Companion/CSS | AX-1 |
| Text Scale | Runtime + app CSS | Profile/effective attrs | layout/content | IEP inline scale | AX-2 |
| Line Height | Runtime vocabulary | future context | content/layout | none | AX-2 |
| Letter Spacing | Runtime vocabulary | future context | content/layout | none | AX-2 |
| Reading Width | Runtime vocabulary | future context | content/layout | none | AX-2 |
| High Contrast | Runtime + tokens | effective context | shell/components | IEP toolbar | AX-2 |
| Simplified UI | Runtime vocabulary | adapters | content presentation | ReadingLevel/IEP | AX-2 |
| Reduced Density | SEA contracts | page projection | service experience | none | AX-2 |
| Read Aloud | Content components | profile preference | TTS/content | none | AX-3 |
| Focus Enhancement | Shell/components | profile preference | interaction patterns | focus helper | AX-5 |
| Captions | Content/provider | preference | media domain | none | AX-3 |
| Transcripts | Content/provider | preference | media domain | none | AX-3 |
| Alternative Format Preference | Accessibility Runtime | future context | DGAL/Curriculum fulfillment | none | AX-3 |
| Keyboard First | Shell/components | preference | interaction patterns | none | AX-5 |
| Screen Reader Optimization | Design system/content | semantic implementation | page/content | none | AX-5 |
| Audio Description | Content provider | future capability | media domain | none | AX-3 |
| Accommodation | Institutional Accessibility | authorized projection | institution | schema only | AX-4 |
| Accessibility Testing | Assurance | test infrastructure | release evidence | AIEL tests | AX-5 |
| Release Gate | Assurance | future gate | release process | none | AX-5 |
| Operations | Accessibility Operations | future center | defect lifecycle | none | AX-6 |
| Human Support | Accessibility Support | future escalation | support workflow | general help | AX-6 |

## Required Runtime Matrix

| Runtime Mechanism | Current State | Canonical / Adapter / Deprecated | Consumer Scope | Migration Phase |
|---|---|---|---|---|
| AccessibilityProfileProvider | active persisted profile | CANONICAL | shared authenticated apps | AX-1 |
| EffectiveAccessibilityContextProvider | active derived OS-aware state | CANONICAL | shared provider tree | AX-1 |
| AccessibilityPreferencesProvider | active flat API | ADAPTER | lesson/settings | AX-2 |
| ReadingLevelProvider | active content variant | ADAPTER | Curriculum/content | AX-2/AX-3 |
| IEP AccessibilityToolbar | active connected local state | LOCAL_BY_DESIGN | IEP surface | AX-2 review |
| focusMode | active local document flag | LOCAL_BY_DESIGN | focus presentation | AX-2 review |
| LiveAnnouncer | active announcement infrastructure | LOCAL_BY_DESIGN | shared shell | AX-5 |
| SkipLinks variants | active shell mechanisms | ADAPTER | shells | AX-5 |
| Companion media observer | active fallback | DEPRECATED | Companion | AX-2 |

## Required Preference Precedence Matrix

| Setting | User Profile | Session | System | Product Default | Final Effective Rule |
|---|---|---|---|---|---|
| reducedMotion | explicit choice | bounded override | prefers-reduced-motion | default | profile, then session, then system, then default |
| textScale | explicit choice | bounded override | not used | DEFAULT | profile, then session, then default |
| highContrast | explicit choice | bounded override | forced-colors respected | DEFAULT | profile/session, with browser forced-colors safety |
| simplifiedUI | explicit choice | bounded view mode | not used | DEFAULT | profile, then session, then default |
| captions/transcripts | preference | bounded session | not used | AUTO | preference, then session, then availability/default |

## Required Duplication Resolution Matrix

| Capability | Duplicate Implementations | AX-1 Decision | Immediate Action | Future Action |
|---|---|---|---|---|
| Reduced motion | effective context, Companion, CSS, legacy keys | canonical + adapter/deprecated | document source | migrate Companion |
| Simplify | ReadingLevel, flat adapter, IEP, focusMode | distinct bounded consumers | do not conflate | AX-2/AX-3 |
| Skip links | AppLayout, SkipLinks, A11yTools, Curriculum | shell adapter contract | preserve valid targets | AX-5 coverage |
| Focus | CSS, helper, route, dialog, tour | shared responsibility | document ownership | AX-5 coverage |
| Contrast | profile CSS, IEP | canonical preference + local adapter | preserve forced colors | AX-2 |
| Text scale | profile attrs, Curriculum CSS, IEP | runtime owner, app consumers | document known gap | AX-2 |
| Settings | profile, flat adapter, IEP, local fallback | profile canonical | retain compatibility | AX-2 |
| Help | OGL, Companion, guides, checklists | distributed bounded ownership | no duplicate runtime | AX-6 |
| Media | metadata, MediaRow, lesson templates | content-owned capability | no universal claim | AX-3 |
| Testing | AIEL, Playwright, validators | assurance future owner | preserve tests | AX-5 |
| Alternative formats | lesson variants, transcript, HTML | no engine yet | document limits | AX-3 |

## Required Authority Matrix

| Accessibility Concern | Accessibility Can | Accessibility Cannot | Canonical External Authority |
|---|---|---|---|
| Preference | normalize and present | grant services | user profile domain |
| Accommodation | consume authorized projection | infer or approve | institutional accommodation domain |
| Completion | adapt presentation | mark complete | curriculum/workflow domain |
| Evidence/Truth | label support state | create/verify facts | Evidence/Truth systems |
| Guidance | expose contextual help | own tour state | OGL/Companion |
| Documents | request accessible presentation | acknowledge/sign/retain | DGAL |
| Release | expose accessible controls | approve/release | ARAG/human authority |

## Required Privacy Matrix

| Data Type | Sensitivity | Persistence | Access Boundary | Telemetry Allowed? |
|---|---|---|---|---|
| preferences | personal | user profile | authenticated user | aggregate use |
| accommodations | sensitive | institutional domain | least privilege | no details |
| assistive technology context | potentially sensitive | avoid by default | explicit operational need | no identifying data |
| support requests | potentially sensitive | support system | user/support staff | aggregate status only |
| caption/transcript preferences | personal | profile/content context | user + authorized app | aggregate use |
| alternative-format preferences | personal | future profile | user + fulfillment domain | aggregate use |

## Required Legacy Matrix

| Legacy Mechanism | Active Consumers | AX-1 Treatment | Safe to Remove? | Future Phase |
|---|---|---|---|---|
| flat preferences API | lesson/settings | adapter | no | AX-2 |
| `sh:readingLevel` | ReadingLevel fallback | bounded adapter | no | AX-2/3 |
| Companion matchMedia | Companion | deprecated adapter target | no | AX-2 |
| IEP toolbar | IEP demo | keep local by design | no | AX-2 review |
| focusMode dataset | focus consumers | keep local by design | no | AX-2 review |
| shell skip variants | app shells | adapter to shell contract | no | AX-5 |
