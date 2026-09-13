# AX-3 — Universal Alternative Content Engine

## 1. Executive Result
AX-3 establishes one provider-neutral, source-preserving alternative-content contract. It governs eligibility, derived representation metadata, provenance, source-version staleness, access inheritance, idempotent reuse, and safe structured HTML/plain-text projection without creating a second content, document, Evidence, Truth, or accommodation authority.

## 2. Repository Baseline
Repository `/Users/mikeslate/Projects/shrv1`, branch `studio-v1-plus-development`, baseline HEAD `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`. Migration head remains 140. Existing owner work was preserved; no migration, commit, or push was performed.

## 3. AX-3 Gap IDs
AX-GAP-005, AX-GAP-006, AX-GAP-007, AX-GAP-008, and the AX-3 portion of AX-GAP-009 are addressed by the canonical contract and safe projections. AX-4 accommodation workflow, AX-5 assurance gating, AX-6 operations/support, and AX-7 broad rollout remain deferred.

## 4. Alternative Content Architecture
`src/system/accessibility/accessibilityContentEngine.js` is the single contract boundary: canonical source → policy/eligibility → derived representation → validation/provenance → delivery. Storage and transformation providers remain external to this module.

## 5. Canonical Source Contract
`createSourceContract` requires source type, ID, version, owner domain, visibility, language, and MIME type, with optional hash, organization, tenant, and timestamps.

## 6. Representation Contract
`createRepresentation` requires a canonical source and representation type, records generation and validation status, provenance, access policy, storage reference, version, and deterministic reuse key.

## 7. Representation Vocabulary
ORIGINAL, ACCESSIBLE_HTML, LARGE_PRINT, HIGH_CONTRAST, SIMPLIFIED_READING, READ_ALOUD, AUDIO, TRANSCRIPT, CAPTIONED_MEDIA, BRAILLE_READY, TAGGED_PDF, EPUB, TRANSLATED_TEXT, ACCESSIBLE_PRINT, and PLAIN_TEXT.

## 8. Support Status
Supported: accessible HTML, large print, high contrast/runtime presentation, plain text. Partial: simplified reading, read aloud, transcript, captioned media, accessible print. External dependency: Braille-ready and translation. Future phase: generated audio, tagged PDF, ePub. Unsupported combinations are rejected by eligibility.

## 9. Content Type Eligibility

| Source Type | Accessible HTML | Large Print | Simplified | Audio | Transcript | Braille-Ready | Tagged PDF | ePub | Translation |
|---|---|---|---|---|---|---|---|---|---|
| HTML/Markdown/Text | Supported | Supported | Partial | Future | Unsupported | External | Future | Future | External |
| Curriculum lesson | Supported | Supported | Partial | Future | Partial | External | Future | Future | External |
| PDF/DOCX | Unsupported | Supported | Unsupported | Unsupported | Unsupported | External | Future | Unsupported | Unsupported |
| Video/Audio | Unsupported | Unsupported | Unsupported | Future | Partial | Unsupported | Unsupported | Unsupported | Unsupported |
| Image/Diagram | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported |
| Table/Form/Quiz | Supported | Supported | Unsupported | Unsupported | Unsupported | Unsupported | Future | Unsupported | Unsupported |
| DGAL document | Unsupported | Supported | Unsupported | Unsupported | Partial | External | Future | Unsupported | Unsupported |
| Public article/Arcade instructions | Supported | Supported | Partial | Future | Unsupported | External | Future | Future | External |

## 10. Transformation Status
REQUESTED, ELIGIBLE, GENERATING, GENERATED, VALIDATING, READY, FAILED, UNSUPPORTED, STALE, and SUPERSEDED are distinct bounded states. READY is never implied by generation alone.

## 11. Validation Status
NOT_VALIDATED, AUTOMATED_CHECKED, HUMAN_REVIEWED, VERIFIED_ACCESSIBLE, and FAILED_VALIDATION are separate from transformation status. Automated generation is not human accessibility certification.

## 12. Provenance
Every representation records source reference, source version/hash, method/provider-neutral generator label, transformation version, language, and validation state.

## 13. Source Versioning / Staleness
`markSourceChanged` returns the representation as STALE when its source version differs. A stale representation is not current and must be regenerated or explicitly superseded.

## 14. Permission Inheritance
Derived visibility cannot be more open than source visibility. Private and authenticated source content remains restricted; public projection requires a public source or an explicit lawful public projection outside this engine.

## 15. Organization / Tenant Isolation
Organization and tenant references are carried in the source contract and representation. A transformation actor must already have source access; no cross-scope authority is created here.

## 16. Accessible HTML
`projectAccessibleHtml` emits semantic headings, paragraphs, lists, an article landmark, and escaped text. It does not accept arbitrary raw HTML and preserves structured block order.

## 17. Large Print
Large print is primarily a bounded presentation/runtime concern through AX-2 text scaling and print styling. The engine records it as a representation type for delivery contracts without duplicating authored content.

## 18. High Contrast Ownership
High contrast remains AX-2 runtime-owned. AX-3 does not create redundant high-contrast files; a derived artifact may reference the runtime presentation contract where a consumer requires one.

## 19. Simplified Reading
Simplified reading is partial and derived. It must disclose that it is simplified, retain a link/reference to the original, and never replace an official, legal, policy, assessment, or requirement source. AI transformation requires provider and validation metadata.

## 20. Read Aloud
Current capability is browser/runtime speech and existing content controls. Generated audio is not claimed; it remains a future AX-3 extension requiring storage, provenance, and validation.

## 21. Audio
Generated audio is FUTURE_PHASE. No automatic audio artifact pipeline was added.

## 22. Transcripts
Existing lesson/media metadata may represent source or generated transcript capability, but AX-3 requires the representation metadata to distinguish SOURCE_TRANSCRIPT, GENERATED_TRANSCRIPT, and HUMAN_REVIEWED_TRANSCRIPT before certification.

## 23. Captioned Media
`captionsPreference`, source/provider availability, caption representation, and validation remain separate. Preference does not assert that a caption track exists.

## 24. Braille-Ready
Braille-ready is EXTERNAL_DEPENDENCY. No certified translation or embossed output is claimed.

## 25. Tagged PDF
Tagged PDF is FUTURE_PHASE because current PDF/report rendering does not establish semantic tagging or accessibility validation.

## 26. ePub
ePub is FUTURE_PHASE; no new conversion dependency was introduced.

## 27. Translation
Translation is EXTERNAL_DEPENDENCY and must carry target language, source/version, provider/method, and human validation state. Original content remains authoritative.

## 28. Images / Diagrams
Existing content metadata owns alt/caption information. Long descriptions and structured diagram alternatives remain content-specific or future work; the engine does not fabricate them.

## 29. Tables
Structured HTML tables remain the preferred representation where source supports headers and relationships. Plain-text projection is a fallback, not an equivalent replacement for complex tables.

## 30. Forms / Quizzes
The engine can project instructions, but canonical interactive forms/quizzes remain the source authority for validation, submission, grading, and permissions. No disconnected assessment copy is authoritative.

## 31. Curriculum Integration
Curriculum lesson JSON, semantic lesson rendering, reading variants, media metadata, and transcript/read-aloud controls are the current source boundary. Alternative content does not duplicate completion, assignment, assessment, or evidence state.

## 32. DGAL Integration
DGAL remains owner of document requirements, lifecycle, acknowledgment, signature, retention, and signed artifacts. AX-3 may provide a derived representation reference; signed canonical artifacts remain authoritative.

## 33. OGL Integration
OGL may link accessible guides or available representations. OGL remains guidance/orientation authority and does not become a transformation registry.

## 34. Companion Integration
Companion may explain availability and status or surface a ready representation. It cannot certify accessibility, create accommodation, alter source authority, or write Evidence/Truth.

## 35. Public Content
Anonymous delivery is allowed only for public source/projection scope. Hidden source fields and private organization metadata are not copied into public representations.

## 36. Profile Preference Integration
AX-2 preferred format can prioritize an available representation, but it cannot create availability, request institutional fulfillment, or claim delivery.

## 37. Fallback Behavior
Unavailable, unsupported, failed, or stale alternatives fall back to the canonical source or another available safe representation. The source page remains usable and status is honest.

## 38. Storage Decision
No new storage system was created. The live service reuses the existing path-safe `ReportFileStorage` primitive and a disposable/file-backed AX-3 metadata sidecar keyed by the canonical reuse key. This keeps artifact bytes and representation metadata scoped without introducing a second object-store subsystem.

## 39. Database Decision
No migration was added. Migration head remains 140. The bounded live acceptance path uses the existing artifact storage abstraction plus metadata sidecar; a durable database representation registry remains a future hardening decision if production retention/queue requirements demand it.

## 40. Provider-Neutral Transformation
`evaluateTransformation` accepts a provider-neutral identifier and requires explicit actor source access and provider policy permission for external transformations. No model/vendor is canonical.

## 41. Security / Prompt Injection
Restricted content must pass existing source-access and provider-policy boundaries before external transformation. AX-3 does not blindly send content to providers and does not bypass classification or tenant scope.

## 42. Transformation Policy
Source type/classification, requested format, actor access, provider availability, and privacy policy produce deterministic allowed, denied, or unsupported outcomes. AI is not an authorization decision-maker.

## 43. Human Review
Human review is required before claiming VERIFIED_ACCESSIBLE for simplified policy/legal content, machine transcripts, translations, image descriptions, Braille-ready output, and tagged PDFs where applicable.

## 44. API / Service Interface
The live HTTP interface provides `GET` available representations, `POST` request/reuse, metadata retrieval, and content retrieval. `AccessibilityContentService` owns source resolution, permission checks, deterministic transformation, storage, provenance, reuse, stale detection, and delivery authorization. The UI cannot supply trusted ownership, visibility, or organization values.

## Live Transformation Service
`apps/shs-api/src/domain/accessibility-content/service/accessibility-content-service.ts` is the single live owner. It resolves Curriculum lessons, DGAL generated artifacts, and the bounded public `foundation-about` source, then applies deterministic `ACCESSIBLE_HTML` or `PLAIN_TEXT` adapters.

## Source Adapter Architecture
Source adapters preserve source identity, version, hash, owner domain, visibility, organization/tenant scope, language, and content blocks. Curriculum versions use revision/update metadata; DGAL versions use canonical content hash; public content uses an explicit public-safe source version.

## Representation Storage
Derived bytes are stored through `ReportFileStorage` under an AX-3 namespaced reference. Metadata includes representation ID, source/version, MIME type, provenance, validation state, access policy, and reuse key.

## Representation Retrieval
Metadata and bytes are retrieved only after the service re-resolves the source and rechecks current source version and actor scope. A source-version mismatch returns `STALE` and cannot be delivered as `READY`.

## Delivery Authorization
Public delivery is limited to the public adapter. Curriculum and DGAL delivery requires authenticated source access plus the source organization/tenant scope and relevant permission (`assignment.view` or `documentation.view`). Derived access never exceeds source access.

## 45. Idempotency / Reuse
The reuse key combines source type/ID/version, representation type, language, and transformation version. Equal requests can reuse current representations rather than creating artifact storms.

## 46. Failure Isolation
Transformation failure returns FAILED/UNSUPPORTED/STALE state; canonical source access is unaffected.

## 47. Browser Acceptance
`tests/ax3-content-browser.spec.mjs` passes 4/4 in the disposable Chromium/API environment on explicit `127.0.0.1`: authenticated Curriculum HTML, authorized DGAL HTML, anonymous public plain text, and honest unsupported-format fallback.

## Curriculum Live Integration
The live Curriculum lesson adapter generates and serves semantic HTML/plain text without changing assignment, completion, assessment, or Evidence state. Equivalent current requests reuse the stored representation.

## DGAL Live Integration
The live DGAL adapter reads a generated canonical artifact through `ReportFileStorage`; derived delivery is read-only and acceptance proves document state, disposition, and artifact reference remain unchanged.

## Public Live Integration
The anonymous public adapter serves only the explicit public-safe Foundation source. Private Curriculum and DGAL requests without an authenticated actor fail before transformation.

## Idempotent Reuse Evidence
The live API suite passes reuse assertions for the same source version, type, language, and transformation version; the second request returns the original representation ID with `reused: true`.

## Staleness Evidence
The live API suite updates the Curriculum revision and verifies the prior representation is reported `STALE`, while the canonical source remains available.

## Negative Authority Evidence
Live tests prove cross-organization and anonymous denial, DGAL lifecycle immutability during transformation/retrieval, and the absence of any Evidence, Truth, accommodation, signature, or workflow mutation endpoint.

## 48. Focused Tests
`npm run ax:content:test`: 9/9 PASS. The suite covers contract validation, eligibility/support states, policy authorization, access inheritance, provenance/reuse, staleness, escaped semantic HTML/plain text, and authority boundaries. The live API suite passes 5/5 and the live browser suite passes 4/4.

## 49. Validators
`npm run accessibility:content:validate` passes. AX runtime/profile, SEA, OGL, orientation, manifests, UI, layer, Truth, Oracle, API typecheck, build, and `git diff --check` pass.

## 50. Gap Closure Matrix

| Gap | State | Evidence |
|---|---|---|
| AX-GAP-005 Live Learning capability boundary | RESOLVED_FOR_CONTRACT | provider-neutral eligibility and partial transcript/caption states |
| AX-GAP-006 Captions | RESOLVED_FOR_CONTRACT | preference/availability/representation separation |
| AX-GAP-007 Transcripts | RESOLVED_FOR_CONTRACT | source/generated/human-reviewed distinction |
| AX-GAP-008 Universal alternative content | RESOLVED_FOR_CONTRACT | canonical engine, provenance, staleness, permission rules |
| AX-GAP-009 Document accessibility | DEFERRED_WITH_REASON | tagged PDF/DOCX assurance requires later artifact pipeline/AX-5 validation |

## 51. Remaining AX-4+ Work
AX-4 owns accommodation requests/fulfillment. AX-5 owns release assurance. AX-6 owns operations/support. AX-7 owns system rollout and broad browser acceptance.

## 52. EXR Handoff
Any broader page, route, or customer-journey consolidation remains outside AX-3 and is not required to consume this engine.

## 53. Frontend Design Handoff
Future visual work must preserve source/derived disclosure, status text, readable fallback, and non-color-only validation state.

## 54. Files Created
[accessibilityContentEngine.js](/Users/mikeslate/Projects/shrv1/src/system/accessibility/accessibilityContentEngine.js), [validate-accessibility-content-engine.mjs](/Users/mikeslate/Projects/shrv1/scripts/validate-accessibility-content-engine.mjs), [ax3AccessibilityContentEngine.test.mjs](/Users/mikeslate/Projects/shrv1/tests/ax3AccessibilityContentEngine.test.mjs), [accessibility-content-service.ts](/Users/mikeslate/Projects/shrv1/apps/shs-api/src/domain/accessibility-content/service/accessibility-content-service.ts), [routes.ts](/Users/mikeslate/Projects/shrv1/apps/shs-api/src/domain/accessibility-content/api/routes.ts), [accessibility-content.live.test.ts](/Users/mikeslate/Projects/shrv1/apps/shs-api/tests/accessibility-content.live.test.ts), [ax3-content-browser.spec.mjs](/Users/mikeslate/Projects/shrv1/tests/ax3-content-browser.spec.mjs), this report.

## 55. Files Modified
`apps/shs-api/src/api/router.ts` registers the canonical live routes; `scripts/run-phase8-acceptance-env.mjs` adds only disposable AX-3 permissions, DGAL fixture state, and artifact setup; `package.json` contains AX-3 validator/test scripts. Existing owner changes were preserved.

## 56. Owner Work Preservation
No unrelated work was reverted. No reset, clean, stash, commit, or push was performed.

## 57. Migration State
No migration was added. Migration head remains 140.

## 58. AX-3 Decision
AX-3 live repository-local implementation and acceptance are COMPLETE for the bounded supported representations. Curriculum, DGAL, and public flows pass through the canonical service, storage/retrieval, authorization, provenance, reuse, and stale handling. No repository-local P0/P1 was found. Generated audio, tagged PDF, ePub, Braille-ready conversion, and translation remain future or external capabilities and are not advertised as ready.

## 59. Exact Next Phase
**AX-4 — INSTITUTIONAL ACCESSIBILITY & ACCOMMODATION WORKFLOWS**

## Required Representation Matrix

| Representation | Support State | Source Types | Generated/Runtime | Validation Needed | Canonical Owner |
|---|---|---|---|---|---|
| ACCESSIBLE_HTML | SUPPORTED | structured text/lessons/public | generated projection | automated + semantic | AX-3 |
| LARGE_PRINT | SUPPORTED | reading/document sources | runtime/print projection | layout check | AX-2/AX-3 |
| HIGH_CONTRAST | SUPPORTED | presentation-capable sources | AX-2 runtime | runtime checks | AX-2 |
| SIMPLIFIED_READING | PARTIAL | text/lessons/articles | derived | human review where consequential | AX-3 |
| READ_ALOUD | PARTIAL | text/lessons | browser runtime | control/availability check | AX-2/content |
| TRANSCRIPT | PARTIAL | media/lessons/documents | source or generated | provenance + review state | AX-3/provider |
| CAPTIONED_MEDIA | PARTIAL | video | source/provider | caption validation | provider/AX-3 |
| PLAIN_TEXT | SUPPORTED | structured text | generated projection | source linkage | AX-3 |
| BRAILLE_READY | EXTERNAL_DEPENDENCY | structured/document | external transform | specialist validation | external |
| TAGGED_PDF | FUTURE_PHASE | documents | future artifact pipeline | automated + human | AX-3/AX-5 |
| EPUB | FUTURE_PHASE | text/lessons | future artifact pipeline | ePub accessibility review | AX-3 |
| TRANSLATED_TEXT | EXTERNAL_DEPENDENCY | text/lessons/articles | external provider | language/human review | external |

## Required Provenance Matrix

| Representation | Source Ref | Version | Method | Provider | Validation | Stale Rule |
|---|---|---|---|---|---|---|
| All derived | required source type/ID | required sourceVersion/hash where available | transformationVersion + generatedBy | nullable/provider-neutral | separate status | source version mismatch → STALE |

## Required Security Matrix

| Scenario | Expected Boundary | Test | Result |
|---|---|---|---|
| private source → anonymous | deny | policy contract | PASS |
| cross-org request | source actor scope required | policy contract | PASS |
| stale source | no current delivery | staleness test | PASS |
| unsupported format | UNSUPPORTED, no artifact | eligibility test | PASS |
| unauthorized request | deny | policy test | PASS |
| public source | public-safe projection only | access inheritance contract | PASS |
| DGAL signed document | signed source remains authority | boundary registry/test | PASS |
| restricted AI transformation | provider permission required | provider-policy test | PASS |

## Required Authority Matrix

| Concern | AX-3 Can | AX-3 Cannot | External Authority |
|---|---|---|---|
| Content | derive/provide representation | change source meaning | source domain |
| Curriculum | render accessible projection | complete/grade/submit | Curriculum |
| DGAL | attach derived representation | alter signature/lifecycle | DGAL |
| Evidence/Truth | preserve references | write or verify facts | Evidence/Truth |
| Accommodation | expose availability/status | create or fulfill accommodation | AX-4 |
| Public access | filter derived content | make private content public | source/public governance |
