# SYS-8B0 Remaining Partial Workflow Closure Ledger / Dependency Order

Date: 2026-09-10  
Repository: `/Users/mikeslate/Projects/shrv1`  
Mode: audit / ledger only

## 1. Executive Result
The current registry reconciles to 50 material workflows. There are exactly 15 repository-local partial workflows: one product gap, WF-012, and 14 acceptance gaps. WF-040 and WF-049 remain the only legitimate non-COMPLETE terminal constraints. No code, migration, schema, provider, or frontend implementation was changed in SYS-8B0.

## 2. Repository Baseline
Branch: `studio-v1-plus-development`; HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`. The worktree contains substantial pre-existing owner changes and untracked architecture/application files; they were preserved. The current migration filename head is `130_agent_task_approval_incident_control.sql`. No database, API, browser, cloud, or production mutation was performed.

## 3. Full 50-Workflow Inventory
| Workflow ID | Name | Domain | Current Status |
|---|---|---|---|
| WF-001 | Identity/session/authentication | Identity | PARTIAL |
| WF-002 | Organization onboarding/activation/suspension | Organizations | COMPLETE |
| WF-003 | Organization relationships | Organizations | COMPLETE |
| WF-004 | Service definition/entitlement activation | Service Catalog | COMPLETE |
| WF-005 | Shared service agreement lifecycle | Service Agreements | COMPLETE |
| WF-006 | Funding/grant/restricted-funds lifecycle | Funding | PARTIAL |
| WF-007 | Government assurance claim lifecycle | GPA | COMPLETE |
| WF-008 | Evidence and verification assurance | GPA | COMPLETE |
| WF-009 | Reconciliation quality/block/resume | GPA | COMPLETE |
| WF-010 | Early warning/risk/Money-at-Risk | GPA | COMPLETE |
| WF-011 | Finding/CAP/retest/remediation | GPA | COMPLETE |
| WF-012 | Public assurance disclosure | GPA | PARTIAL |
| WF-013 | Truth Spine ingestion/verification/history | Truth | PARTIAL |
| WF-014 | Metric Registry/calculation/readiness | Metrics | PARTIAL |
| WF-015 | Verified evidence/admissibility | Evidence | PARTIAL |
| WF-016 | Private report creation/publication | Reporting | PARTIAL |
| WF-017 | Trusted reporting outbox/dispatch | Reporting | PARTIAL |
| WF-018 | Curriculum catalog/import/document processing | Curriculum | COMPLETE |
| WF-019 | Lessons/activities/assessment completion | Curriculum | COMPLETE |
| WF-020 | Enrollment/cohort membership | Enrollment | COMPLETE |
| WF-021 | Assignment targeting/submission/review | Assignments | COMPLETE |
| WF-022 | Completion policy/evaluation/certificate eligibility | Completion | COMPLETE |
| WF-023 | Credential definition/issuance/delivery | Credentials | COMPLETE |
| WF-024 | Portfolio evidence/section publishing | Portfolio | COMPLETE |
| WF-025 | Career pathway/opportunity planning | Career | COMPLETE |
| WF-026 | Career event/opportunity visibility | Career | COMPLETE |
| WF-027 | Project/team/workspace lifecycle | Studio | COMPLETE |
| WF-028 | Build packet/builder execution boundary | Studio | COMPLETE |
| WF-029 | QA/review/delivery/finalize | Studio | COMPLETE |
| WF-030 | Website deployment/public publish | Studio | COMPLETE |
| WF-031 | Provider/partner onboarding network lifecycle | Onboarding | COMPLETE |
| WF-032 | External calendar/account connection | External Accounts | COMPLETE |
| WF-033 | Calendar projection/scheduling | Calendar | COMPLETE |
| WF-034 | Live learning/cohort/session workflow | Live Learning | COMPLETE |
| WF-035 | Notification/alert evaluation | Notifications | COMPLETE |
| WF-036 | Model/session/policy approval | AI Governance | COMPLETE |
| WF-037 | Agent identity/session/delegation/policy | Agent Fabric | COMPLETE |
| WF-038 | Tool/MCP authorization and execution | Agent Fabric | COMPLETE |
| WF-039 | Agent-to-Evidence/Truth/Reporting | Agent Fabric | COMPLETE |
| WF-040 | Agent workflow/coordination/workbench | Agent Fabric | BLOCKED — SAFETY/POLICY |
| WF-041 | MCP server/resource/tool governance | MCP | COMPLETE |
| WF-042 | Input/document scanning and classification | Input Security | PARTIAL |
| WF-043 | Operational awareness/conductor workflows | Operations | COMPLETE |
| WF-044 | Legal authority/runtime lifecycle | Legal | PARTIAL |
| WF-045 | Audit event capture/retrieval | Audit | PARTIAL |
| WF-046 | Approval/snapshot/public population | Public Disclosure | PARTIAL |
| WF-047 | Impact attribution/aggregation | Funding/Impact | PARTIAL |
| WF-048 | Source registry/intake/validation | Source Ingestion | PARTIAL |
| WF-049 | Registry submission/provider adapter | Registry | BLOCKED — EXTERNAL DEPENDENCY |
| WF-050 | Cross-product composition/identity bridge | Cross Product | PARTIAL |

Total: 50. COMPLETE: 33. PARTIAL: 15. N/A: 0. External blocks: 1. Safety/policy blocks: 1.

## 4. Fifteen Partial Workflows
The exact partial set is WF-001, WF-006, WF-012, WF-013, WF-014, WF-015, WF-016, WF-017, WF-042, WF-044, WF-045, WF-046, WF-047, WF-048, and WF-050.

## 5. Product Gap Count
One: WF-012. Its registry identifies a real missing canonical public explorer/detail consumer seam, not merely missing test evidence.

## 6. Acceptance Gap Count
Fourteen: WF-001, WF-006, WF-013, WF-014, WF-015, WF-016, WF-017, WF-042, WF-044, WF-045, WF-046, WF-047, WF-048, and WF-050.

## 7. Exact Workflow Contracts
| Workflow | Trigger / Input | Owner / State Transition | Handoff / Final Consumer | Success / Failure / Isolation |
|---|---|---|---|---|
| WF-001 | Authenticated user/session request | Identity middleware validates scoped membership/session | Cross-app authenticated consumers | Active scoped session / deny or revoke; tenant isolation and direct-ID protection |
| WF-006 | Funding obligation, grant, or restricted-funds action | Funding authority persists lifecycle and authorized use | Program/service, Evidence, Reporting | Valid obligation/use / reject, expire, or deny; org/funds isolation |
| WF-012 | Approved public assurance disclosure | Reporting/Public Disclosure creates sanitized public projection | Public assurance explorer/detail consumer | Published safe projection / unpublished, revoked, or not-published; no private leakage |
| WF-013 | Provenance-bearing fact submitted for Truth consideration | Truth Spine accepts only canonical admissible facts | Truth consumers and registered metrics | Accepted current Truth / rejected or superseded; lineage and scope preserved |
| WF-014 | Registered metric calculation request/input | Metric Registry evaluates accepted Truth inputs | MetricTruth and Reporting consumers | Durable metric result/readiness / reject unverified or invalid input; org/program scope |
| WF-015 | Evidence submitted from a canonical producer | Evidence authority admits/rejects and preserves provenance | Truth, completion, reporting | Admissible Evidence / rejected or quarantined; source and organization isolation |
| WF-016 | Report creation/publication request | Reporting owns draft → review/approval → publication | Institutional/private report and disclosure projection | Approved report/publication / denied, revoked, or unpublished; private/public separation |
| WF-017 | Trusted report dispatch/outbox event | Trusted Reporting worker processes durable dispatch | Reporting delivery/acknowledgment consumer | Delivered/acknowledged / retry, terminal failure, or dead-letter; scoped delivery |
| WF-042 | Uploaded/retrieved input enters scanning/classification | Input Security scans and classifies | Evidence/MCP/resource consumers | Allowed classified input / blocked, quarantined, or failed with recovery |
| WF-044 | Consequential legal authority request | Legal authority evaluates approve/revoke lifecycle | Authorized legal/decision consumer and audit | Authorized decision / denied, revoked, or expired; principal/org scope |
| WF-045 | Domain operation emits auditable event | Audit authority stores/retrieves immutable trace | Admin/audit consumer | Complete correlated audit trace / retained failure or tamper signal; tenant isolation |
| WF-046 | Approved snapshot/public population request | Disclosure authority filters and publishes approved snapshot | Public-safe consumer | Sanitized current publication / excluded or revoked; no restricted data leak |
| WF-047 | Funding/service result becomes impact input | Impact attribution aggregates canonical funding/evidence/metric inputs | Impact/reporting consumer | Reproducible scoped attribution / rejected or corrected; funding/org scope |
| WF-048 | Source registration/intake/validation request | Source ingestion validates and persists job lifecycle | Evidence/Truth/reporting downstream consumer | Validated/processed source / retry, dead-letter, or terminal failure; source scope |
| WF-050 | Cross-product identity/session/data handoff | Composition bridge resolves canonical domain authorities | Authenticated application consumers | Correct scoped handoff / deny or safe-not-found; cross-app and tenant isolation |

## 8. Exact Gap Analysis
| Workflow | Exact Piece Preventing COMPLETE Today | Gap Type | Surface |
|---|---|---|---|
| WF-001 | Uniform live cross-app session/scope proof | ACCEPTANCE | HTTP, isolation, restart |
| WF-006 | One live obligation → service → Evidence → Reporting trace | ACCEPTANCE | HTTP, integration, reporting |
| WF-012 | Canonical live public explorer/detail projection replacing/displacing mock consumer path | PRODUCT | API/public consumer/UI |
| WF-013 | One live durable Truth producer/consumer path across current adapters | ACCEPTANCE | PostgreSQL, HTTP, lineage |
| WF-014 | Representative cross-domain registered producer/result/final-consumer proof | ACCEPTANCE | HTTP, metric/reporting |
| WF-015 | Unified SHF/SHS admissibility boundary and live provenance matrix | ACCEPTANCE | PostgreSQL, HTTP, isolation |
| WF-016 | Approved publication/revocation/private-public consumer proof | ACCEPTANCE | HTTP, browser/API |
| WF-017 | Worker retry, terminal failure, replay, and downstream acknowledgement proof | ACCEPTANCE | PostgreSQL, worker, restart |
| WF-042 | Downstream enforcement and failed-scan recovery proof | ACCEPTANCE | HTTP, security, retry |
| WF-044 | Approve/revoke/audit legal authority matrix | ACCEPTANCE | HTTP, authorization, audit |
| WF-045 | Complete cross-domain trace plus tamper/replay proof | ACCEPTANCE | audit API, replay, isolation |
| WF-046 | Cross-domain public DTO exclusion and revocation proof | ACCEPTANCE | public API, direct-ID, privacy |
| WF-047 | Funding → Evidence → registered metric → impact consumer proof | ACCEPTANCE | integration, metric/reporting |
| WF-048 | Source job retry/dead-letter/consumer terminal proof | ACCEPTANCE | worker, PostgreSQL, downstream |
| WF-050 | Cross-app route/session/data boundary live isolation matrix | ACCEPTANCE | HTTP/browser, wrong-org/direct-ID |

## 9. WF-012 Product Gap
Canonical owner is Reporting/Public Disclosure. The smallest seam is a live public-safe projection/detail path sourced from canonical approved disclosure data, with exclusion/revocation/date/status filtering and no mock-data fallback in the active consumer. Reuse existing public DTO, disclosure, reporting, and GPA projection primitives. A migration is not indicated by current evidence; an API/public projection change and active consumer wiring are likely required. Do not implement in SYS-8B0.

## 10. Acceptance-Only Gaps
The 14 acceptance workflows have existing domain primitives according to the registry. Their closure requires focused fresh fixtures, authenticated HTTP where routes exist, fresh PostgreSQL for durable paths, and browser proof only where the registry names a mounted final consumer. No acceptance gap is promoted to a product gap without a fresh failed contract showing missing behavior.

## 11. Stale-Evidence / Status-Reconciliation Candidates
WF-006 and WF-019 had stale roadmap status text. WF-019 is reconciled to COMPLETE because SYS-4B3/SYS-4C5 evidence covers its current assigned contract. WF-006 is reconciled to PARTIAL because the current registry still requires the integrated funding-to-service/Evidence/Reporting handoff. Earlier reports that call WF-006 complete are historical scoped reports, not full current-contract closure. No other partial can be closed by documentation alone from the reviewed evidence.

## 12. Shared Gap Clusters
| Cluster | Workflows | Shared Seam |
|---|---|---|
| A: Public disclosure product | WF-012, WF-046 | Public-safe approved projection, exclusion, revocation, consumer |
| B: Identity and authority boundary | WF-001, WF-044, WF-050 | Scoped HTTP identity, role, membership, direct-ID and revocation |
| C: Evidence / Truth / input integrity | WF-013, WF-015, WF-042 | Admissibility, classification, provenance, rejection/recovery |
| D: Metrics / reporting / delivery | WF-014, WF-016, WF-017 | Registered facts, approval/publication, outbox retry/ack |
| E: Funding / source / impact integration | WF-006, WF-047, WF-048 | Funding/source input through Evidence/metrics to consumer |
| F: Cross-domain audit | WF-045 | Correlated trace over clusters B–E and representative completed flows |

## 13. Dependency Graph
| Workflow | Depends On | Blocks | Shared Gap Cluster |
|---|---|---|---|
| WF-012 | WF-013, WF-014, WF-016 | Public disclosure certification | A |
| WF-001 | Identity authority | All tenant-scoped partials | B |
| WF-015 | WF-001, WF-013 | WF-013, WF-014, WF-016, WF-047, WF-048 | C |
| WF-013 | WF-015 | WF-014, WF-016, WF-046 | C |
| WF-042 | WF-015, WF-041 | WF-015 downstream acceptance | C |
| WF-044 | WF-001, WF-036 | Legal authority acceptance | B |
| WF-050 | WF-001, all domain authorities | Whole-system closure | B/F |
| WF-014 | WF-013 | WF-016, WF-046, WF-047 | D |
| WF-016 | WF-013, WF-014 | WF-017, WF-046, WF-012 | D |
| WF-017 | WF-016 | Reporting delivery closure | D |
| WF-006 | WF-004, WF-005 | WF-047 and funding trace | E |
| WF-047 | WF-006, WF-014, WF-015 | Impact consumer closure | E |
| WF-048 | WF-015, WF-017 | Source downstream closure | E |
| WF-046 | WF-013, WF-014, WF-016 | Public disclosure closure | A |
| WF-045 | All material workflows | Final audit certification | F |

## 14. Closure Clusters
The smallest finite closure sequence is five checkpoints: one product batch, three grouped acceptance batches, and one final certification rerun.

## 15. Priority Classification
P0: WF-001, WF-012, WF-013, WF-014, WF-015, WF-016, WF-042, WF-044, WF-045, WF-046, WF-050. P1: WF-006, WF-017, WF-047, WF-048. WF-012 is product; all others are acceptance. P0/P1 items block zero-partial certification.

## 16. Repository-Local / External Classification
All 15 partials are repository-local. None is an external-only blocker. WF-049 alone is external and remains outside this ledger.

## 17. Safety Classification
None of the 15 partials should be converted to a safety block. WF-040 remains separate and intentionally safety-blocked.

## 18. N/A Candidates
None. No partial workflow has a documented canonical replacement that makes the registry entry inapplicable.

## 19. Frontend / Backend Classification
WF-012 is a product/API/public-consumer gap. WF-001 and WF-050 are identity/API/browser acceptance. WF-013–WF-017, WF-042, WF-044–WF-048 are backend/integration and acceptance. WF-046 additionally requires public projection safety proof. No remaining item is documentation-only after the WF-006/WF-019 roadmap correction.

## 20. FE-0 Candidates
No partial is being deferred to FE-0. Separate app destination/navigation work remains a post-completion FE-0 candidate only when it does not block a current canonical workflow.

## 21. Acceptance Harness Plan
Use reusable fresh PostgreSQL fixtures with Org A/Org B, active and revoked members, roles, entitlements, funding obligation, source/job records, Evidence/Truth/Metric/Report records, public snapshot, and audit correlation IDs. Use deterministic test providers/workers only. Each batch must generate state through canonical APIs/services, not seed terminal claims.

## 22. Browser Acceptance Requirements
Required for WF-012 once its consumer seam exists, WF-016/WF-046 public/private projection where a mounted consumer is canonical, and WF-050 where route/session composition is the final consumer. The remaining workflows may use authenticated API/projection consumers if their registry contract does not require browser UI.

## 23. HTTP Acceptance Requirements
Required for all 14 acceptance gaps where active authenticated routes exist: WF-001, WF-006, WF-013–WF-017, WF-042, WF-044–WF-048, and WF-050. Public WF-012/WF-046 uses the public-safe API plus authenticated administrative setup/approval paths.

## 24. Restart Requirements
Required for WF-001, WF-006, WF-013–WF-017, WF-042, WF-045, WF-047, WF-048, and WF-050 where durable state, worker state, or reporting state is part of the contract. WF-044 and WF-046 require restart reconstruction of decisions/snapshots if their current services persist those records.

## 25. Replay / Retry Requirements
Replay/retry is explicit for WF-006, WF-013, WF-014, WF-015, WF-017, WF-042, WF-045, WF-047, WF-048, and WF-050. WF-012/WF-016/WF-046 require idempotent snapshot/publication and revocation behavior. WF-001/WF-044 require decision/session replay and stale/revoked authority checks.

## 26. Security Acceptance Requirements
Wrong-org, direct-ID, revoked membership, and role denial are required for WF-001, WF-006, WF-013, WF-015, WF-044, WF-045, WF-046, WF-050. Public/private filtering is mandatory for WF-012, WF-016, and WF-046. Entitlement checks remain additive to membership checks.

## 27. WF-012 Public-Safe Projection Trace
Current canonical facts → authorized disclosure approval → sanitized public DTO/snapshot → active public explorer/detail consumer. Current evidence identifies the missing live canonical consumer seam and mock-data risk at this boundary. The product batch must prove unpublished, revoked, private, wrong-org, and stale facts never appear publicly.

## 28. Scope Sizes
WF-012: L, because it is a real product fix plus acceptance. Clusters B, C, D, E: M each, because they combine reusable fixtures, authenticated HTTP, and multiple durable consumers. Cluster F/final certification: S–M, acceptance-only over already completed authorities.

## 29. Finite Closure Ledger
| Order | Workflow ID | Domain | Gap Type | Exact Gap | Priority | Size | Closure Cluster | Required Proof | Target Final Status |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | WF-012 | GPA | PRODUCT | Live canonical public explorer/detail projection | P0 | L | A | API/browser public safety, revocation, isolation | COMPLETE |
| 2 | WF-001 | Identity | ACCEPTANCE | Cross-app scoped session proof | P0 | M | B | HTTP, wrong-org, revoked, restart | COMPLETE |
| 3 | WF-044 | Legal | ACCEPTANCE | Approve/revoke/audit matrix | P0 | M | B | HTTP, role/org/revocation/audit | COMPLETE |
| 4 | WF-050 | Cross Product | ACCEPTANCE | Route/session/data isolation | P0 | M | B | HTTP/browser, direct-ID, restart | COMPLETE |
| 5 | WF-015 | Evidence | ACCEPTANCE | Unified admissibility/provenance proof | P0 | M | C | HTTP/PostgreSQL, failed/replay | COMPLETE |
| 6 | WF-013 | Truth | ACCEPTANCE | Unified durable Truth producer/consumer proof | P0 | M | C | HTTP/PostgreSQL, rejection/lineage | COMPLETE |
| 7 | WF-042 | Input Security | ACCEPTANCE | Enforcement and failed-scan recovery | P0 | M | C | HTTP, security, retry | COMPLETE |
| 8 | WF-014 | Metrics | ACCEPTANCE | Cross-domain registered producer/result proof | P0 | M | D | HTTP, Truth lineage, consumer | COMPLETE |
| 9 | WF-016 | Reporting | ACCEPTANCE | Approval/publication/revocation proof | P0 | M | D | HTTP/browser, privacy | COMPLETE |
| 10 | WF-017 | Reporting | ACCEPTANCE | Outbox retry/terminal/ack proof | P1 | M | D | worker/PostgreSQL/restart | COMPLETE |
| 11 | WF-006 | Funding | ACCEPTANCE | Funding → service → Evidence → Reporting trace | P1 | M | E | HTTP, scoped funds, replay | COMPLETE |
| 12 | WF-047 | Funding/Impact | ACCEPTANCE | Funding → Evidence → metric → impact | P1 | M | E | PostgreSQL/API, correction | COMPLETE |
| 13 | WF-048 | Source Ingestion | ACCEPTANCE | Retry/dead-letter/consumer proof | P1 | M | E | worker/PostgreSQL/restart | COMPLETE |
| 14 | WF-046 | Public Disclosure | ACCEPTANCE | Exclusion/revocation public proof | P0 | M | A/F | public API, direct-ID, privacy | COMPLETE |
| 15 | WF-045 | Audit | ACCEPTANCE | Cross-domain trace/tamper/replay proof | P0 | M | F | audit consumer, replay, isolation | COMPLETE |

## 30. Partial Count Burn-Down
Starting partial count: 15.

| Checkpoint | Expected Partial Count |
|---|---:|
| After roadmap/status reconciliation | 15 |
| After Cluster A / WF-012 + public acceptance | 14 |
| After Cluster B / WF-001, WF-044, WF-050 | 11 |
| After Cluster C / WF-015, WF-013, WF-042 | 8 |
| After Cluster D / WF-014, WF-016, WF-017 | 5 |
| After Cluster E / WF-006, WF-047, WF-048 | 2 |
| After Cluster F / WF-046, WF-045 | 0 |
| Final SYS-8 certification rerun | 0 |

## 31. Fixed Remaining Phase Plan
| Phase | Purpose | Workflows Targeted | Expected Partial Count After |
|---|---|---|---:|
| SYS-8B1 | Implement and accept canonical public assurance projection | WF-012 | 14 |
| SYS-8B2 | Identity, legal authority, and cross-product isolation acceptance | WF-001, WF-044, WF-050 | 11 |

## SYS-8B2 Closure Evidence - 2026-09-11

WF-001, WF-044, and WF-050 are COMPLETE. Fresh PostgreSQL migration 001-130
and schema-integrity checks passed. Authenticated HTTP acceptance proved
database-backed identity resolution, active organization and membership scope,
role and entitlement enforcement, legal artifact/decision persistence,
relationship and composition isolation, wrong-org/direct-ID denial, revoked
membership, entitlement revocation, durable audit state, and API restart
reconstruction. The current partial count is 11 and the locked burn-down is
11 → 8 → 2 → 0. SYS-8B3, targeting WF-015, WF-013, and WF-042, is the exact
next phase and was not started.
| SYS-8B3 | Evidence, Truth, and input-security acceptance | WF-015, WF-013, WF-042 | 8 |
| SYS-8B4 | Metrics, reporting, trusted dispatch, funding/source/impact acceptance | WF-014, WF-016, WF-017, WF-006, WF-047, WF-048 | 2 |
| SYS-8B5 | Public disclosure, cross-domain audit, final integrated certification | WF-046, WF-045, SYS-8 | 0 |

No phase may be added solely for a stale fixture, harness repair, documentation correction, or an initially failing test. A new phase requires a newly discovered P0/P1 repository-local product defect.

## 32. Change-Control Rule
The fixed plan ends at zero partial workflows. Future work must remain within the listed clusters unless fresh evidence demonstrates a genuine P0/P1 product defect that cannot be corrected in the active batch.

## 33. Files Created
- `docs/architecture/SYS-8B0_REMAINING_PARTIAL_WORKFLOW_CLOSURE_LEDGER_DEPENDENCY_ORDER_REPORT.md`

## 34. Files Modified
- `docs/architecture/SYSTEMWIDE_WORKFLOW_COMPLETION_ROADMAP.md` — reconciled stale WF-006 and WF-019 rows.
- `docs/architecture/SYSTEMWIDE_WORKFLOW_DEPENDENCY_GRAPH.md` — added SYS-8B0 dependency order.

## 35. Owner Work Preservation
No production code, migrations, schemas, frontend implementation, provider configuration, or cloud resource was changed. Existing owner work and unrelated worktree changes were preserved.

## 36. Exact Next Phase
**SYS-8B1 — Canonical Public Assurance Projection / WF-012 Product Closure and Acceptance.** It is the first phase because WF-012 is the only confirmed product gap and is an upstream dependency of public-disclosure closure.

## 37. Completion Forecast by Workflow Count
The forecast is deterministic if each batch passes its stated contract: 15 → 14 after WF-012, → 11 after identity/authority isolation, → 8 after Evidence/Truth/input security, → 2 after metrics/reporting/funding/source integration, → 0 after public disclosure and audit acceptance. WF-040 and WF-049 remain outside the partial count as the only legitimate constrained terminal statuses.

## SYS-8B1 Evidence Update - 2026-09-11

WF-012 is now COMPLETE. Reporting owns the bounded public assurance list/detail
API over the existing canonical publication projection, and the mounted
CivicSure explorer/detail route consumes it without mock/demo fallback.
Publication authorization, currentness, source type, and published status are
enforced centrally; the public DTO exposes only the approved allowlist plus a
public projection reference. Fresh PostgreSQL, HTTP, browser, failure-state,
direct-ID, build, manifest, UI, focused disclosure tests, and diff hygiene
passed. WF-046 remains open separately. The locked burn-down is now 14 -> 11
-> 8 -> 2 -> 0 with SYS-8B2 next.

## Final Ledger Decision
The remaining work is finite and dependency-ranked. FE-0 remains deferred until the partial count reaches zero. No implementation phase was started.

## SYS-8B2 Evidence Update - 2026-09-11

WF-001, WF-044, and WF-050 closed after fresh HTTP acceptance. A cross-org legal
decision attachment probe exposed a small repository-local scope defect; the
canonical legal service now validates artifact organization/tenant ownership,
and the rerun failed closed. The locked partial count remains 11.
## SYS-8B3 Closure Update - 2026-09-11

Fresh SYS-8B3 evidence closed WF-015, WF-013, and WF-042. The partial count is
now 8: WF-006, WF-014, WF-016, WF-017, WF-045, WF-046, WF-047, and WF-048.
The locked burn-down remains **11 → 8 → 2 → 0**. SYS-8B4 is the exact next
phase and was not started.

## SYS-8B4 Closure Update - 2026-09-11

SYS-8B4 closed WF-014, WF-016, WF-017, WF-006, WF-047, and WF-048 after fresh PostgreSQL, live service, authenticated HTTP, and focused regression evidence. The partial count is now 2: WF-045 and WF-046. The locked burn-down remains **8 → 2 → 0**. SYS-8B5 — WF-045 / WF-046 final closure and SYS-8 certification is the exact next phase and was not started.

## SYS-8B5 Final Closure Update - 2026-09-11

SYS-8B5 closed WF-045 and WF-046. Fresh PostgreSQL/schema, authenticated audit
scope and revocation HTTP, public list/detail HTTP, focused audit/disclosure
regression, authority checkers, builds, manifest/UI validation, and diff checks
passed. The audit list required one smallest repository-local organization-scope
fix, which passed rerun. The partial count is now **0**. WF-040 remains
BLOCKED — SAFETY/POLICY and WF-049 remains BLOCKED — EXTERNAL DEPENDENCY. SYS-8
is COMPLETE and FE-0 is the deferred next program.
