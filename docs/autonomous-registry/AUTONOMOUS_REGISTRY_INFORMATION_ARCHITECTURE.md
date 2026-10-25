# Autonomous Registry — Information Architecture and Consolidation Plan

Date: 2026-10-24. Status: Phase 1 implemented and locally verified; publication pending independent Registry repository configuration. Phases 2–7 remain unimplemented. Sections 1–11 retain the approved plan and pre-implementation evidence; section 12 records the Phase 1 result.

## Decision and scope

Adopt **nine canonical route families: seven public, one authenticated provider workspace, and one secondary status utility**. Record tabs, registration steps, verification results and provider views are internal states of those experiences. Do not create pages to reproduce earlier mocks.

The current implementation has **three Registry content routes**, not a sprawling application awaiting deletion. The other desired surfaces are not implemented. Consolidation therefore establishes a compact target architecture and prevents overbuild; it does not reduce the current three routes to a smaller number. No functioning Registry capability is scheduled for removal.

This plan lives in `/Users/mikeslate/Projects/shrv1` as requested. The canonical Registry frontend remains `/Users/mikeslate/Desktop/autonomous-registry`. The ecosystem gateway routes requests to that independent application; it does not own Registry records. Moving code or Registry authority into SHRV1 is neither required nor authorized by this plan.

## Evidence and current ownership

| Surface | Current source / fresh observation | Planning implication |
| --- | --- | --- |
| Public gateway | `vite.config.js:44`: exact `/autonomous-registry` subtree proxy to `SHS_VITE_REGISTRY_PROXY_TARGET`, default `http://127.0.0.1:5176`; prefix retained | Keep gateway integration small; no second Registry React router in SHRV1 |
| Runtime confirmation | GET `http://localhost:5173/__ecosystem/status` reports Registry target `http://127.0.0.1:5176` | :5173 is the public local entry; :5176 is the independent internal frontend |
| Independent entry/router | Registry `index.html` → `src/main.tsx` → BrowserRouter → `src/App.tsx:10–14` | Three literal content routes plus root redirect and wildcard; no dynamic ID lookup |
| Standalone defaults | Registry `package.json` defaults :5174; gateway `scripts/dev/ecosystem.mjs:187` overrides port and base to :5176 and `/autonomous-registry/` | Preserve standalone operation; test both launch configurations |
| Navigation | Registry `src/components/Shell.tsx` | Explore/Register/Standards/Developers/Governance and Sign In are disabled spans; Verify points directly to fixed sample success |
| Record | Registry `src/pages/AgentRecordPage.tsx` | Identity, capabilities, standards, provenance, versions, lifecycle, evidence and export text already share one record experience |
| Verification | Registry `src/pages/VerificationPage.tsx` | Fixed result page, no general verification intake or computed states |
| Data | Registry `src/data/registryData.ts` | Static fixtures; route consolidation cannot confer production authenticity |
| Current route contract | Registry `contracts/routes/autonomous-registry-route-contract.v1.json` | Captures no-slash home and Registry-owned subtree; future contract amendment must reconcile the requested slash-canonical home |
| Universe destination | `src/pages/universe-v1/universeDestinationRegistry.js:227`; `UniverseApp.jsx:685` / `:871` | `/universe/autonomous-registry` is a Universe destination/entry wrapper, not a second Registry record UI |
| Development destination override | `scripts/dev/ecosystem-vite.mjs:16` | Resolves Registry entry to current gateway origin plus Registry prefix; existing fallback metadata still references :5174 |
| Readiness coupling | `scripts/dev/ecosystem.mjs:57–63` | `isRegistry` inspects served App source for the old fixed verification route; a correct consolidation can fail this check unless its contract is updated |
| Browser regression coupling | `tests/ui/local-ecosystem.spec.mjs:99`; `tests/ui/universe-canonical.spec.mjs:205` | Existing record link/reload and Universe loop coverage must survive migration |

Fresh transport checks: trailing-slash Home and the two fixed sample routes return 200 HTML; no-slash `/autonomous-registry` returns 404 text/plain. Proposed singular record, Standards, Governance and Provider paths also return SPA HTML, but are absent from App routes and fall through to NotFound. HTTP 200 must not be mistaken for implemented functionality.

The prior detailed audit remains in the independent repository at `docs/autonomous-registry/AUTONOMOUS_REGISTRY_TOP_1_PERCENT_AUDIT.md`; fresh source inspection in this task confirms the same three-page router. That earlier audit is background evidence, not an instruction to build all its investigated candidate URLs.

## 1. Current routes and disposition

Counts distinguish content routes from redirect/fallback plumbing, Universe routes and unimplemented labels.

| Existing path or router node | Exists as | Disposition | Target / treatment |
| --- | --- | --- | --- |
| `/autonomous-registry` (slash accepted by client router) | Home content route | KEEP | Make `/autonomous-registry/` canonical. Keep the existing home composition; redirect the no-slash spelling at the server/gateway boundary |
| `/autonomous-registry/agents/AR-2026-0001847` | Fixed record content route | REDIRECT | `/autonomous-registry/agent/AR-2026-0001847`; reuse AgentRecordPage content in the canonical parameterized renderer |
| `/autonomous-registry/verify/AR-2026-0001847` | Fixed verification-result content route | REDIRECT | `/autonomous-registry/verify?registryId=AR-2026-0001847`; retain entry context, recompute truthful results rather than copying fixed success |
| Independent Registry origin `/` | Navigate redirect to no-slash Home | REDIRECT | Redirect to `/autonomous-registry/` on the independent origin only; never redirect SHRV1 gateway `/`, which belongs to the Universe |
| Registry `*` wildcard | NotFoundPage | KEEP | Keep institutional not-found behavior; distinguish unknown record/verifier outcomes from nonexistent page paths |
| `/universe/autonomous-registry` | Universe destination wrapper, separate owner | KEEP | Preserve entry wrapper and destination identity; do not count it as a Registry content route or redesign the Universe |

Current Registry content-route disposition totals: **KEEP 1, MERGE 0, REDIRECT 2, REMOVE 0**. Content components behind redirected routes are retained/reused. Router plumbing contributes one additional redirect and one kept wildcard; neither increases the product count. The Universe wrapper is excluded from Registry counts.

### Labels, sections and investigated paths that are not current routes

| Current or anticipated surface | Disposition | Target policy |
| --- | --- | --- |
| Home search / hypothetical `/search` results page | MERGE | Home query submits to Explore; one directory/search result experience. No separate search product route |
| Explore label | KEEP | Implement `/autonomous-registry/explore` when directory behavior exists |
| Verify label and sample result composition | MERGE | One `/verify` instrument containing intake, progress, errors, reasoned result and receipt |
| Register label | KEEP | One `/register` wizard; do not create a registration-review product section |
| Standards + Governance disabled labels | MERGE | One `/standards` public policy/documentation surface, labeled “Standards & Governance” |
| Hypothetical `/autonomous-registry/governance` | REDIRECT | `/autonomous-registry/standards#governance`; reserve compatibility, but do not call this a migrated functioning page |
| Developers label | KEEP | One `/developers` technical documentation surface |
| Record capabilities / standards / provenance / versions / evidence / JSON | INTERNAL TAB/STATE | Same `/agent/:registryId` record, URL-addressable state; no standalone public page for each |
| Record lifecycle/history | INTERNAL TAB/STATE | Versions tab contains chronological version/lifecycle events, with evidence/reason links |
| Provider views and per-agent management | INTERNAL TAB/STATE | One authenticated `/provider` workspace; public inspection links to the single canonical record |
| Registration review and success | INTERNAL TAB/STATE | Review step and completion state inside `/register`; persistent outcome links to issued public record |
| Status utility | KEEP | `/status`, secondary only. There is no current Status top-nav item to remove |
| Duplicate hypothetical provider/public agent detail UI | REMOVE | Do not introduce a second public identity renderer. No such current component exists to delete |

“MERGE” in this second table consolidates concerns/labels into the target architecture; it is not evidence of existing standalone pages. Do not add redirects for every hypothetical mock URL. Add actual legacy path aliases only when link/source/log evidence establishes a compatibility need.

## 2. Final canonical route table

These are route families, not one route per issued Registry ID or state value.

| Access | Canonical route | Composition and responsibility | Internal state; no extra product page |
| --- | --- | --- | --- |
| PUBLIC | `/autonomous-registry/` | Approved search-centered landing; recent records; verify/register entry; basic explanation; operational indicator | Search submits to Explore; indicator reports actual service state, not decorative metrics |
| PUBLIC | `/autonomous-registry/explore` | Directory/search layout with filters, pagination, sorting and record links | Query/filter/page state in URL; query implementation shared with Home, not duplicate result renderer |
| PUBLIC | `/autonomous-registry/agent/:registryId` | One authoritative public record composition | Overview, Capabilities, Standards, Provenance, Versions, Evidence, JSON tabs/sections |
| PUBLIC | `/autonomous-registry/verify` | Verification instrument with input modes and reasoned results | Registry ID, public URL, QR, signed manifest, fingerprint/hash; result/progress/errors remain inside this route |
| PUBLIC | `/autonomous-registry/register` | One multi-step registration composition; entry may explain requirements before authentication | Identity; Responsible Parties; Definition; Capabilities; Standards/OAS; Evidence; Review & Submit; completion state |
| PUBLIC | `/autonomous-registry/standards` | Standards & Governance documentation/policy composition | OAS relationship/releases/declarations; registration/issuance/correction/update/lifecycle/disputes/appeals/retention/transparency/authority policies; governance change log |
| PUBLIC | `/autonomous-registry/developers` | Technical docs/API console composition | API/OpenAPI/schemas/SDKs/auth/webhooks/limits/sandbox/examples/records/discovery; authentication required for privileged console actions |
| AUTHENTICATED | `/autonomous-registry/provider` | Operational management workspace | My Agents; Drafts; Pending Review; Action Required; Register New Agent; Organization Profile; Responsible Parties; API Keys; Webhooks; Activity & Audit; Settings |
| SECONDARY PUBLIC | `/autonomous-registry/status` | Operational utility, actual service health and incidents | Reachable through footer, Developers and system links; excluded from primary navigation |

**Total: 9** (7 public primary experiences + 1 authenticated workspace + 1 secondary utility). Sign In invokes the approved identity integration and returns to an allowlisted Registry destination; it does not require a tenth bespoke Registry sign-in page. Authentication required to save/submit a registration is compatible with a publicly accessible registration entry.

### Necessary state addressing and technical endpoints

No additional human-facing subordinate route is currently technically necessary. Start with query parameters or anchors, with validated values and accessible focus/history behavior:

- Record: `?tab=provenance` and `?tab=versions&version=<version-id>` identify sections/snapshots of the same Registry identity. Invalid tabs fall back predictably; an unknown version does not silently show a different valid one. Version state must bind exports and verification to the selected immutable snapshot.
- Explore: query, approved filter values, sort and pagination are deep-linked. Prefer a service-supported opaque cursor where suitable; do not invent backend filter names before the query contract exists.
- Verify: `?registryId=<public-id>` can prefill an ID. A URL parameter must never assert VALID. Every displayed result derives from actual checks. Uploaded manifests, raw evidence and sensitive values never belong in a shareable URL. QR is an input transport, not a new authority; arbitrary URL resolution requires SSRF-safe rules.
- Register: step state is resumable against an authenticated, authorized server-side draft. Draft identifiers can be opaque URL references if needed, never access credentials. Completed issuance can be recovered after reload and links to the record; do not repeat issuance on refresh. Introduce `/register/complete/:submissionId` only if a demonstrated callback/history requirement cannot be handled safely by flow state.
- Provider: `?view=drafts` or `?view=my-agents&agent=<id>` selects workspace state, with server-side organization and role checks. “Register New Agent” enters the same `/register` flow. Editing/mutation controls may use an authorized workspace panel; public identity detail remains `/agent/:registryId`.

Machine-readable records, immutable version retrieval, schemas, OpenAPI, verifier responses and `/.well-known/autonomous-registry` are **technical resources, not additional product pages**. Prefer an explicit service representation/content negotiation for a record rather than a standalone JSON screen. Retain a usable JSON tab for people. Decide stable API/resource URLs in the Registry-owned API contract after existing service discovery, including version-specific retrieval, correct JSON content type and errors before SPA fallback. This planning task does not invent a new API namespace or turn SHS submission APIs into Registry authority.

Root well-known discovery lies outside the current proxy prefix: its deployment mapping needs the gateway/hosting owner. Never accept Universe HTML with HTTP 200 as valid discovery. Optional infrastructure identity callbacks/webhook endpoints must have narrow technical contracts; they do not become new navigation sections. Do not encode signatures or canonicalization around arbitrary UI tab/query URLs.

## 3. Record consolidation and reusable components

The existing record already keeps all major concerns together. Refactor it into sections/panels only when useful for accessibility, loading or maintainability; do not create a page per panel.

| Target tab | Reuse from current AgentRecordPage | Preserve / resolve |
| --- | --- | --- |
| Overview | Record hero, ID/name/status, provider/operator/responsible organization summary, identity table | Stable public ID, lifecycle status, parties, timestamps; one record resolver for all tabs |
| Capabilities | Declared Capabilities, Intended Uses, Restricted Uses, Models and Dependencies, Permissions and Boundaries | Declarations remain attributable; not runtime authorization |
| Standards | Standards Declarations | Subject-specific OAS release/profile/evidence associations; global policy stays in `/standards` |
| Provenance | Provenance and Other Identifiers | Source/submitter/relationships/identity fingerprints; genuine evidence-backed integrity, not static claims |
| Versions | Version Timeline and Lifecycle Events | Historical snapshots, supersession and actor/reason/evidence events; retain history when consolidating |
| Evidence | Evidence References | References with access/disclosure controls; do not relocate independent assessment/evidence review into Registry authority |
| JSON | Export rows | Actual public machine representation and download; current “Download” text is not functional |

Reusable existing primitives: `Shell` for institution/navigation and Universe return; `InfoTable` for appropriate definition/table content; `RegistryMark` visual treatment with evidence-driven status semantics; `universeReturn` origin resolver; shared `styles.css` tokens and typography. Reuse the search input/control pattern, but current Home has no working query service. Reuse verification result layout where appropriate, never its unconditional fixed success logic. Keep NotFoundPage.

Reuse primitives and contracts, not identical page composition: Explore is a directory, Verify an instrument, Register a wizard, Record an authoritative document, Standards/Governance policy documentation, Developers technical docs/console, Provider operational management. Home keeps the approved hero and overview composition. Do not wrap all content in an identical dashboard/card template.

### Duplicate files and experiences

Fresh byte comparisons found six exact duplicate file pairs in the independent Registry:

| Canonical imported/executed file | Duplicate artifact | Treatment |
| --- | --- | --- |
| `src/App.tsx` | `src/App 2.tsx` | Not a separate product router; keep imported file authoritative; archive/remove duplicate only after owner/provenance and import checks |
| `src/main.tsx` | `src/main 2.tsx` | Only `main.tsx` is referenced by index.html |
| `src/utils/universeReturn.ts` | `src/utils/universeReturn 2.ts` | One implementation; preserve return-origin safety checks |
| `tests/phase-1.test.tsx` | `tests/phase-1 2.test.tsx` | Both match Vitest discovery; reported 38 cases include duplicated coverage |
| `tests/phase-0.test.mjs` | `tests/phase-0 2.test.mjs` | Package test command names the canonical phase-0 file explicitly |
| `tests/setup.ts` | `tests/setup 2.ts` | Vite setup points to canonical setup file |

No duplicate provider agent-detail, registration-review/success, Standards/Governance page components, or separate record-tab page components exist in the current `src/pages` inventory (LandingPage, AgentRecordPage, VerificationPage, NotFoundPage). `README 2.md` is another documentation-copy artifact, not another application. Duplicate schemas/contracts are a model-governance concern, not extra routes to merge blindly. No duplicate artifact is deleted in this task.

## 4. Overbuild assessment

| Candidate expansion | Current finding | Consolidation decision |
| --- | --- | --- |
| Standalone Versions page | Not implemented; table on record | INTERNAL TAB/STATE under record; preserve snapshot retrieval as technical capability |
| Standalone Provenance page | Not implemented; record sidebar and verifier summary | INTERNAL TAB/STATE. Verification may show a scoped summary from the same authoritative data; avoid independently maintained duplicate chains |
| Standalone Evidence page | Not implemented; ID/type table | INTERNAL TAB/STATE. Controlled evidence resources can exist without another product page |
| Standalone JSON page | Not implemented; static export labels | INTERNAL TAB/STATE plus real machine resource; avoid HTML masquerading as JSON |
| Provider agent-detail mirror | Not implemented | Do not build. Link to public record and keep privileged controls in workspace state |
| Registration Review section | Not implemented | Review is the final wizard step, not a nav item/product route |
| Registration Success section | Not implemented | Completion state, recoverable and idempotent; optional subordinate technical route only with demonstrated need |
| Status primary navigation | Absent today | Keep absent; secondary footer/Developers/system link only |
| Separate Standards/Governance experiences | Two disabled labels, no pages | Merge policy surface and label; reserve Governance redirect |
| Separate search result application | Not implemented | Home initiates one Explore directory/search; share query semantics |
| More public mock catalog records | Four recent fixture rows have no record pages | Do not manufacture pages to make fixture rows look authoritative; publish only records with valid backing data |

Do not remove versions, provenance, evidence, review, security or audit functions to simplify the URL tree. Consolidation concerns presentation and addressing; each capability still requires its own correct service/control boundaries where needed.

## 5. Primary navigation and visual lock

| Label | Destination/action |
| --- | --- |
| Explore | `/autonomous-registry/explore` |
| Verify | `/autonomous-registry/verify` |
| Register | `/autonomous-registry/register` |
| Standards & Governance | `/autonomous-registry/standards` |
| Developers | `/autonomous-registry/developers` |
| RETURN TO UNIVERSE | Existing configured/validated Universe-return action |
| Sign In | Approved authentication entry with safe return to `/autonomous-registry/provider`; authenticated state can expose Provider Workspace |

The wordmark links to `/autonomous-registry/`. Status is secondary. Keep utility actions visually distinct within the existing header; combining Standards/Governance reduces the six current domain labels to five. Do not enable dead placeholder links merely to match the target navigation; navigation changes and working destinations ship together or remain explicitly unavailable.

Preserve near-black backgrounds, ivory/off-white text, monospace-forward typography, thin restrained borders, sparse institutional spacing and current Home composition. Apply restrained Registry blue to interactions, green only to truthful valid/verified/operational states, amber to review/warnings, and red to revoked/error/action-required states; always include text/icon semantics, not color alone. Current root CSS explicitly defines ivory/black but no named blue/green/amber/red semantic tokens, so exact accent values must come from the approved Registry reference/tokens during implementation rather than being invented here. The existing token bridge prohibits cinematic treatments and Universe stylesheet/runtime imports. No white SaaS surfaces, decorative metrics, excessive cards, repetitive layouts or globe imagery.

Preserve `REGISTRATION ACTIVE · PROVENANCE VERIFIABLE` as approved institutional language while binding any operational presentation to truthful service state; never imply that fixture verification is live. Preserve `RETURN TO UNIVERSE` and its existing configuration safeguards.

## 6. Authority and service boundaries

| Authority | Owns | Does not acquire through consolidation |
| --- | --- | --- |
| OAS | Standards definitions, releases and interoperability requirements | Registry issuance, Registry lifecycle decisions or Trust Bureau findings |
| Autonomous Registry | Registration, persistent IDs, identity, declarations, provenance, versions/lifecycle, evidence references, public records and identity/integrity verification | Runtime execution, marketplace/ranking, standards authorship or independent trust assessment |
| Autonomous Trust Bureau | Independent assessment, trust findings, evidence review and trust reporting | Canonical registration mutations or standards definition |
| Universe / SHRV1 gateway | Destination metadata, development proxy and navigation integration | Registry record ownership, authentication policy, evidence/lifecycle decisions or operating authority |
| Providers and external runtimes | Authorized submissions/declarations and evidence references through governed interfaces | Direct canonical record writes or self-issued Registry verification |

Maintain Registry-owned write controls, responsible-party authorization, organization scope, public/private projections, immutable history and provenance integrity. Existing SHS Studio `registry-submission` is a `local_test_registry` adapter and submission workflow, not a live public Registry backend. Do not relabel its acceptance as production issuance or move ownership by reusing its database tables. Identity, evidence and gateway integrations require their canonical owners' interfaces; consolidation creates no competing identity or evidence system.

The route plan is authorized by this request. Future changes to route contracts, identity integration, shared gateway routing and evidence architecture require the repository's documented Core/Integration coordination; this task records their exact impact rather than implementing those changes implicitly.

## 7. Redirect and backward-compatibility contract

| Source | Destination | Compatibility rule |
| --- | --- | --- |
| `/autonomous-registry` | `/autonomous-registry/` | Server-level canonical normalization; preserve approved query/fragment state; avoid loops at both direct origin and proxy |
| Existing `/autonomous-registry/agents/AR-2026-0001847` | `/autonomous-registry/agent/AR-2026-0001847` | Preserve persistent ID and record content; introduce broad legacy `/agents/:registryId` compatibility only after validating IDs and inventorying consumers |
| Existing `/autonomous-registry/verify/AR-2026-0001847` | `/autonomous-registry/verify?registryId=AR-2026-0001847` | Preserve input intent; compute current truthful state. Do not translate old result URL into unconditional VALID |
| `/autonomous-registry/governance` | `/autonomous-registry/standards#governance` | Requested reserved alias, not proof of a working predecessor; retain meaningful policy anchors |
| Independent Registry origin `/` | `/autonomous-registry/` | Origin-specific only; leave Universe gateway root intact |

No redirects are required for unimplemented mock Versions/Provenance/Evidence/JSON/provider-detail/review/success URLs without actual compatibility evidence. If later discovered, map them to the matching state on the single canonical experience rather than building pages to honor obsolete composition.

Redirect deployment must cover hard loads, reloads and JS-disabled machine clients as appropriate; React Navigate alone is insufficient. Use temporary behavior during validation, then permanent GET/HEAD canonical redirects after destination semantics and query handling are proven. Reject or safely handle unsupported methods rather than redirecting mutation requests blindly. Do not strip version/evidence identity, replay submissions, propagate sensitive query values or allow external return targets. Handle JSON Accept requests at the service boundary before HTML fallback. Unknown record IDs and unknown verification inputs need domain-specific truthful responses, not a redirect to the sample record.

Phase 1 prepares compatibility and can ship only same-semantics aliases; Phase 6 completes verified permanent redirects. Never delete an old handler before its replacement and compatibility checks pass.

## 8. Migration impact and risk

| Impact/risk | Exact affected files/systems | Required mitigation / release gate |
| --- | --- | --- |
| Canonical routes live outside requested repository | Independent `src/App.tsx`, route contract, Shell and page links | Implement in canonical Registry checkout through the approved ownership workflow; do not create competing SHRV1 pages |
| No-slash home hard-load fails | Gateway prefix/base handling and independent root/router links | Normalize slash canonically and test direct/proxied GET/reload; do not alter gateway Universe `/` |
| Literal path detection breaks readiness | SHRV1 `scripts/dev/ecosystem.mjs:63`, related localEcosystem tests | Replace sample-source-string coupling with reviewed Registry-specific identity/readiness evidence; do not weaken checks to generic HTTP 200 |
| Hardcoded links/test expectations | Independent LandingPage, AgentRecordPage, VerificationPage, Shell, `tests/phase-1*.test.tsx`; SHRV1 `tests/ui/local-ecosystem.spec.mjs` | Update canonical expectations when implementing and keep independent legacy compatibility assertions; no assertion changes in this task |
| Duplicate copies obscure canonical source/test count | Six duplicate pairs listed above | Confirm imports/config/source ownership before separately removing redundant artifacts; preserve unique coverage |
| Fake success could survive route refactor | VerificationPage / RegistryMark / static fixture data | Keep demo vs computed results explicit; never declare verification production-ready from route tests |
| Tab split loses content/history | AgentRecordPage, record contract/public API | Content-parity checklist for all seven tabs; immutable version selection and evidence identities survive navigation/export |
| Wizard/workspace state leaks or duplicates mutations | Future Registry draft/issuance/identity services | Server authorization on every draft/mutation; secure resume, idempotency, concurrency and safe authentication return |
| Combined policies hide authority distinctions | Governance/authority/OAS documents and `/standards` | Keep separate issuers/scopes, policy anchors, versioned change log and dispute/appeal procedures |
| JSON/discovery caught by SPA fallback | Future Registry machine resources and gateway root well-known mapping | Validate status/content type/schema, version binding, public-only fields and cache behavior |
| Long combined label affects header | Shell and Registry CSS responsive header | Desktop/tablet/mobile and keyboard checks; preserve approved visual system |
| Green static operational signal misleads | Landing status indicator and verification seal | Real operational/verification state dependency; unavailable/unknown states cannot display success |

No database migration or API change is necessary merely to write this plan. Backend/schema/identity controls remain production prerequisites; the seven UI consolidation phases below are an addressing/composition migration order, not permission to launch before those controls exist.

## 9. Ordered implementation plan

### Phase 1 — Navigation and route consolidation

First safe implementation slice: normalize canonical Home slash behavior, centralize Registry route builders within the independent Registry, define the nine-route contract and prepare legacy compatibility. Keep current content reachable and retain unavailable labels where a destination is not implemented. Change the combined Standards/Governance label without inventing a policy page or enabling a dead route. New singular record and general Verify destinations must be functional/truthful before navigation or redirects send users to them.

Affected boundary: independent App/Shell/page links and route contract; narrowly necessary gateway/readiness integration in SHRV1. Acceptance: Home hard-load/reload works, Universe entry/return survives, sample record remains reachable, no route loop or false verification promotion. Preparation of aliases and consumers is part of this phase; permanent migration is gated in Phase 6.

### Phase 2 — Agent Record tab consolidation

Reuse AgentRecordPage as one parameterized public record with seven accessible tabs/sections, a shared record resolver and version-aware state. Move current content without dropping lifecycle/evidence/restriction details. Replace decorative JSON actions only when a real public serializer/resource exists. Verify keyboard operation, deep-link/reload state, historical snapshot identity, public/private fields and content parity. Do not create separate versions/provenance/evidence/JSON product routes.

### Phase 3 — Registration flow consolidation

Build one reusable `/register` wizard with the seven specified steps and recoverable completion. Reuse it from Provider; keep review/preview/submission/results within flow state. Gate save/submit by approved authentication, responsible-party roles and Registry-issued commands. Validate drafts, permissions, evidence references, retries, unique persistent IDs, correction/new-version behavior and reload after issuance. Do not call local test acceptance a Registry ID issuance.

### Phase 4 — Standards + Governance consolidation

Publish one policy/documentation surface with anchors for standards/OAS, issuance, corrections/updates, suspension/revocation, disputes/appeals, retention/transparency, authorities and governance changes. Clearly distinguish provider declarations, Registry identity checks and Trust Bureau assessment. Include pinned standards/policy versions and maintain incoming anchors. Prepare Governance alias only after the destination content is available.

### Phase 5 — Provider Workspace consolidation

Deliver one authenticated workspace with the eleven requested views. Share the registration flow, record display components where appropriate, permissions, organization context and service contracts. Keep public identity inspection at the canonical public record. Privileged management panels remain authorized workspace state; no second provider agent-detail product. Test cross-organization reads/mutations, party delegation, API-key lifecycle, webhook management, draft ownership, audit visibility and safe sign-out/session expiry.

### Phase 6 — Redirects and backward compatibility

Finish route-consumer migration and tested server redirects. Update Home/record/Verify links and canonical metadata, Registry contract, gateway readiness logic and targeted tests together. Preserve legacy ID/version/query intent; retain the Universe wrapper. Check direct origin and gateway, slash variants, reload/back/forward, encoded/invalid IDs, unknown IDs, query allowlisting, machine clients and absence of redirect loops. Keep old handlers/aliases until evidence shows replacement semantics are safe; no arbitrary removal deadline.

### Phase 7 — Browser regression and production readiness

Run focused unit/contract and gateway navigation checks, followed by complete keyboard and desktop/tablet/mobile journeys: search/filter/pagination, record tabs/history/JSON, each verification mode/state/reason, registration validation/resume/issuance, provider permission boundaries, policy anchors and utilities. Compare to the approved visual baseline; verify focus/contrast/reduced motion/overflow and distinct compositions. Measure actual rendering/service performance and test deployment fallback/content types.

Production gate additionally requires durable Registry storage and unique issuance, immutable provenance/lifecycle evidence, authentic signatures and explainable VALID/UNKNOWN/SUSPENDED/REVOKED/EXPIRED/SUPERSEDED states, abuse/rate controls, privacy boundaries, operational monitoring and recovery. Passing browser navigation is not proof of these capabilities. Keep public Status and Developers linked secondarily where appropriate and never add Status to primary navigation.

## 10. Complexity outcome

- Existing count is **3** content routes; target is **9** route families. This is **six additional required families**, not a claimed numerical reduction in today's implementation.
- Public navigation reduces six current domain labels (including separate Standards and Governance) to **five**, with Return to Universe and Sign In retained as utilities.
- Seven record tabs share one identity renderer/resolver; seven registration steps share one draft/submission flow; eleven provider views share one authorized workspace and do not duplicate record or registration experiences.
- Separate versions, provenance, evidence, JSON, review, success and provider-detail product pages are avoided rather than later maintained and redirected. No fabricated percentage saving is claimed against a nonexistent implementation.
- Six byte-identical source/test pairs are identified for reviewed cleanup; no duplicate component deletion is assumed safe merely from naming.
- APIs, policy modules, evidence controls and immutable history remain distinct where correctness requires it. A lean URL tree does not justify collapsing authority or security boundaries.

## 11. Verification and handoff

Fresh checks for this planning task:

| Check | Result / limit |
| --- | --- |
| Registry source/router/page/link/contract inspection | Three content routes, two infrastructure router nodes; no split record/wizard/provider pages |
| SHRV1 gateway/Universe/readiness/test-consumer inspection | Independent :5176 target, Universe wrapper, old-path readiness/test dependencies documented |
| Eight HTTP probes | Slash Home and old sample links: 200 HTML; no-slash Home: 404 text/plain; proposed routes: HTML fallback, not implemented pages |
| Byte comparison | Six exact duplicate file pairs identified above |
| Independent `npm run test:ui` | Exit 0: 2 Vitest files, 38 tests, 6.88s. Duplicate phase-1 copies account for repeated cases; tests cover the current prototype, not the proposed architecture |
| Documentation/scoped source integrity | Route-table/count/disposition/phase checks and before/after hashes for Registry source plus SHRV1 gateway/dev integration; product files unchanged |

No fresh browser run or full production-readiness pass was required or claimed for this documentation-only change. Phase 7 specifies the future implementation regression gate. Existing broader ecosystem changes were present before the task and were left untouched. No dependencies were installed, no database was mutated, and no product source/test/configuration was changed.

CODEX HANDOFF REPORT

- Agent: Codex / architecture and verification.
- Task/status: Autonomous Registry consolidation planning — COMPLETE; product implementation not started.
- File created: `docs/autonomous-registry/AUTONOMOUS_REGISTRY_INFORMATION_ARCHITECTURE.md` in SHRV1.
- Existing files modified: none by this task. Database/API/route/shared-component changes: none.
- Test results: focused existing UI suite passes; source, transport and duplicate evidence recorded above.
- Known issues: prototype data/verification, missing six target route families, slash hard-load defect, old-route readiness coupling; none repaired in a planning-only task.
- Cross-domain dependencies: independent Registry owner; gateway/Universe routing owner; approved identity and evidence interfaces; OAS and Trust Bureau contracts.
- Architectural decision: nine route families; one public record, one registration flow, one combined Standards/Governance surface, one provider workspace; preserve independent authority and approved design.
- Follow-up: execute the bounded Phase 1 slice, then the sequenced migration with real production service prerequisites.
- Safe to merge: this planning document is ready for review; it does not approve production deployment or unrelated workspace changes.

## 12. Phase 1 implementation status

Phase 1 code is implemented locally and verified. No Phase 2–7 feature is implemented or marked complete. No schema/authority/governance/evidence/submission/verification semantics changed. The approved Registry CSS is byte-identical, and the production CSS bundle remains `index-CxJzzaYk.css` (12.85 kB / 3.21 kB gzip).

### Central route module and mounted routes

Canonical definitions now live in the independent Registry at `src/routes/registryRoutes.ts`. Each family defines key, path, public/authenticated access, primary-nav visibility, implementation state, label and compatibility aliases. App, Shell, page links and recent-record links consume the module; no active Registry component embeds a Registry URL literal. Route metadata does not mount planned pages.

| Key | Canonical path | Access / primary navigation | Phase 1 state |
| --- | --- | --- | --- |
| home | `/autonomous-registry/` | public / no | Mounted; no-slash form normalizes |
| explore | `/autonomous-registry/explore` | public / yes | Defined only; disabled |
| agent | `/autonomous-registry/agent/:registryId` | public / no | Defined only; legacy fixed record still mounted |
| verify | `/autonomous-registry/verify` | public / yes | Defined only; disabled; legacy sample result still mounted |
| register | `/autonomous-registry/register` | public / yes | Defined only; disabled |
| standards | `/autonomous-registry/standards` | public / yes | Defined only; combined label disabled |
| developers | `/autonomous-registry/developers` | public / yes | Defined only; disabled |
| provider | `/autonomous-registry/provider` | authenticated / no | Defined only; no new auth/workspace implementation |
| status | `/autonomous-registry/status` | public / no | Defined secondary family only; no fake status page/link |

The only content pages remain Home and the two original sample pages. Existing sample result/record semantics are preserved, not endorsed as production verification.

### Aliases, redirects and navigation

| Source | Behavior now | Future dependency |
| --- | --- | --- |
| `/autonomous-registry` | HTTP 308 to `/autonomous-registry/` for GET/HEAD, preserving raw query encoding. POST/other methods return 405 with Allow header. Client router also normalizes with query/fragment preserved | Static production hosting must implement the same HTTP normalization when deployed; current middleware covers the inspected Vite development gateway and independent dev server |
| `/autonomous-registry/agents/AR-2026-0001847` | Original fixed sample record preserved at the same URL | Canonical singular record is not mounted until Phase 2; no redirect to an unavailable replacement |
| `/autonomous-registry/verify/AR-2026-0001847` | Original fixed sample result preserved at the same URL | General verifier remains unimplemented; no redirect to it and no change to verification semantics |
| `/autonomous-registry/governance` | Reserved alias metadata only; still NotFound | Combined policy destination must exist before redirect activation |
| Independent Registry origin `/` | Client redirect to canonical Home | Public gateway `/` remains Universe; untouched |
| Unknown/unimplemented Registry paths | Existing institutional NotFound | No sample fallback or fake canonical records |

Primary navigation is Explore, Verify, Register, Standards & Governance, Developers; all five canonical destinations remain explicitly aria-disabled because none yet has a general implementation. Return to Universe remains functional/configuration-safe; Sign In remains disabled. Existing Home/record/result links to the sample views remain usable outside primary navigation. Status is not in primary navigation and no secondary link to a nonexistent implementation was added. The phase intentionally does not create a general Verify page by relabeling the sample result.

### Gateway and readiness integration

SHRV1 `scripts/dev/registry-routing.mjs` implements exact Home normalization and the focused `isRegistry` transport-readiness probe. The existing development gateway plugin installs normalization before proxy/base handling. The independent Registry Vite plugin installs the same normalization using Registry-owned route definitions.

A development-only Registry identity response at `/autonomous-registry/__registry/status` exposes service identity, schema version, canonical Home, the three actually mounted pages, and `verification: static-prototype`. It is not `/.well-known/autonomous-registry`, a production status API, or evidence of operational verification readiness. SHRV1 readiness still checks the Registry bootstrap and actual served App route wiring; it additionally requires the typed Registry identity/manifest. The obsolete literal fixed URL in served App source is no longer required. Generic HTTP 200, foreign identity, missing page declarations, HTML in place of JSON, or missing centralized route wiring fail the probe. Readiness tests include those negative cases. Live checks returned true through both :5173 gateway and :5176 independent origin.

The existing gateway target/prefix, Universe destination/return behavior, API/Fabric proxies and other applications were not changed by this phase. Current source-level readiness remains an intentionally development-specific check, as it was before Phase 1; production service readiness needs a separate future contract.

### Exact verification results

| Command / evidence | Result |
| --- | --- |
| Registry `npm test` | Exit 0: 81 phase-0 checks plus architecture assertions; 3 Vitest files / 49 UI/route tests passed. Includes 11 new route behaviors and the 38 existing duplicated prototype cases |
| Registry `npm run build` | Exit 0: TypeScript `tsc --noEmit` plus Vite build; 1812 modules, JS 253.76 kB / 80.30 kB gzip; CSS unchanged; final recorded build 777 ms |
| SHRV1 `node --input-type=module --eval "await import('./tests/autonomousRegistryRouting.test.mjs'); await import('./tests/localEcosystem.test.mjs'); await import('./tests/localEcosystemLifecycle.test.mjs');"` | Exit 0: 11 tests passed, 0 failed; exact HTTP normalization, negative readiness, existing startup/lifecycle behavior |
| SHRV1 `./node_modules/.bin/playwright test tests/ui/local-ecosystem.spec.mjs --grep 'Registry' --workers=1 --reporter=line` | Exit 0: 3 Chromium tests passed, 12.4 s; Universe entry, canonical redirect/query/fragment/reload, old record/result hard reloads, unknown and unimplemented paths, disabled nav, 768px/390px navigation and no page overflow |
| Live HTTP | Public no-slash Home responds 308 Location `/autonomous-registry/`; both direct/proxied dev identity probes respond valid JSON |
| Source integrity and whitespace | Registry CSS unchanged; scoped diffs checked against pre-task file snapshots; `git diff --check` run in both repositories; staged changes reviewed separately |

The first attempted gateway Node test invocation failed because this execution environment denied loopback listener creation (`EPERM`), not from an assertion failure. Running the same test modules through the available approved Node command form passed all 11 without modifying assertions. The first new Registry route test correctly failed because its required module did not yet exist; it passed after implementation.

### Phase 2 dependencies and remaining limits

Phase 2 Agent Record consolidation is technically safe to begin after this verified route foundation. It must keep the legacy exact URL alive, build the parameterized singular record against an explicit record resolver, preserve all current information and the design, then add accessible internal tabs/version state. Do not map arbitrary IDs to the sample. Immutable data, evidence projection and real verification remain separate production prerequisites. General Verify, registration, combined policies, workspace, permanent legacy migration and production readiness are not implemented.

Version-control publication is a distinct remaining limitation: the independent Registry is an unborn Git repository with all original files untracked and no configured remote. The task requested exact Phase 1 files only; blindly bootstrapping or publishing the entire pre-existing independent application would exceed that staging boundary. The user confirmed that the Registry must have its own repository. `git ls-remote git@github.com:MoeMoe47/autonomous-registry.git HEAD` returned Repository not found, and `gh repo create MoeMoe47/autonomous-registry --private` could not reach api.github.com. No independent remote was configured and no incomplete root commit was created. No product source is moved into SHRV1 to work around independent ownership.

### Files changed for Phase 1

Independent Registry:

- `src/routes/registryRoutes.ts` (new)
- `src/App.tsx`
- `src/components/Shell.tsx`
- `src/pages/LandingPage.tsx`
- `src/pages/AgentRecordPage.tsx`
- `src/pages/VerificationPage.tsx`
- `src/pages/NotFoundPage.tsx`
- `src/data/registryData.ts` (route reference only; record fixtures unchanged)
- `vite.config.ts`
- `contracts/routes/autonomous-registry-route-contract.v1.json` (URL contract version 1.1.0; canonical slash and route-module pointer)
- `scripts/validate-phase-0.mjs`
- `tests/registry-routes.test.tsx` (new)
- `tests/phase-1.test.tsx` and its existing `tests/phase-1 2.test.tsx` copy
- `tests/phase-0.test.mjs` and its existing `tests/phase-0 2.test.mjs` copy

SHRV1:

- `scripts/dev/registry-routing.mjs` (new)
- `scripts/dev/ecosystem.mjs`
- `scripts/dev/ecosystem-vite.mjs`
- `tests/autonomousRegistryRouting.test.mjs` (new)
- `tests/localEcosystemLifecycle.test.mjs`
- `tests/ui/local-ecosystem.spec.mjs`
- This information-architecture document

Normal test output regenerated independent `evidence/phase-0/VALIDATION_RESULTS.json`; build/test caches are not product changes and are excluded from staging. Existing unrelated workspace changes are preserved.

Publication status and commit evidence are reported in the final handoff. No later phase or production readiness is marked complete.
