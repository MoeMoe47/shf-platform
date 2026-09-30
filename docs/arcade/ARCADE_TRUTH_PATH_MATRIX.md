# Arcade Truth Path Matrix

| Component | Authority | Reads From | Writes To | Event / API | Canonical? | Frontend Dependency? | Phase 2D Affected? | Risk / Notes |
|---|---|---|---|---|---|---|---|---|
| Arcade Activity | Arcade | Activity management request and stored policy | `arcade_activities` | Activity API; `createActivity()` | Yes, definition authority | No | No | `lesson_id` is legacy metadata, not canonical new Curriculum linkage. |
| Arcade Attempt | Arcade | active Activity; authenticated actor/org | `arcade_attempts` | start/abandon Attempt API | Yes, execution record | No | No | Result path locks Attempt and scopes learner/org. |
| Arcade Result/mastery | Arcade | locked Attempt, stored Activity policy, validated raw `passed` or score | `arcade_results`; Attempt completion | `submitResult()` | Yes, immutable outcome and derived mastery | No | No | Unique Result per Attempt. Mastery is server-derived. |
| Arcade outbox producer | Arcade | stored Result fields | `integration_outbox` | `arcade.resulted`, producer `curriculum.arcade`, destination `shs-verified-evidence` | Yes, integration event | No | No | Enqueued after Result transaction; gap if enqueue fails after commit. |
| SHS outbox dispatcher | Trusted Reporting | pending outbox row and source reference | SHS Evidence/fact projection; external event request | `dispatchPendingIntegrationEvents()` | Authorized coordinator | No | No | Runs local verified-evidence projection before Fabric POST. |
| SHS Verified Evidence adapter | Verified Evidence | canonical `arcade_results` row + active org evidence rule | `prepare_prove_evidence`, optionally `curriculum_truth_facts` | `arcade.resulted` → `ARCADE_RESULT` | Yes, conditional on configured rule | No | No | Checks stored `mastery_achieved`; no legacy XP/EVU/Polygon input. No rule means no projection. |
| SHF internal event ingestion | Agent Fabric boundary | signed event body and allowlist | operational event storage/projection | `POST /shf/internal/ingestion/events` | Authorized downstream boundary | No | No | Current allowlist excludes `curriculum.arcade` + `arcade.resulted`; delivery fails permanently. |
| SHF evidence/Truth projection | Agent Fabric / Truth Spine | accepted operational event + producer lineage | SHF evidence and Truth Spine source/claim repositories | internal ingestion calls `project_operational_event_to_truth()` | Yes, downstream authority | No | No | Arcade event cannot currently reach this route; no Arcade lineage entry found. |
| SHS curriculum truth facts | SHS curriculum/evidence projection | canonical source Result + evidence rule | `curriculum_truth_facts` | `projectAuthoritativeOutboxEvent()` | Durable SHS projection, not the independent SHF Truth Spine ledger | No | No | `toTruthSpineFact()` maps a row but does not itself persist it in SHF production storage. |
| SHF Truth Spine SHS provider | Truth Spine | SHS `curriculum_truth_facts` when provider selected | read-only claims projection | `ShsCurriculumTruthProvider.list_facts()` | Read adapter only | No | No | Selected only outside SHF durable PostgreSQL mode; not the production-mode route. |
| Curriculum Lesson↔Activity | Curriculum | Lesson and Activity definitions | `curriculum_lesson_arcade_activities` | migration 064 linkage | Yes, definition relationship | No | No | Does not own learner execution or mastery. |
| Curriculum completion policy | Curriculum completion policy | `arcade_results` filtered by org/user/Activity/mastery | evaluation result | `evaluateArcade()` | Authorized read projection | No | No | Reads canonical Result, not local history or legacy lesson_id. |
| Metaverse missions | Metaverse | assignment/content references and Arcade expectation | projection only | mission evidence adapter | No, reference/projection | No | No | Marks evidence false; requires Evidence domain rule for actual projection. |
| Metaverse passport | Metaverse | org/user-scoped `arcade_results` plus other authorities | passport projection | `loadPassportSources()` | No, activity signal | No | No | Calls Arcade data a mastery signal, explicitly not capability verification. |
| Treasury/rewards | Treasury | Treasury-owned policies/records | Treasury-owned economy records | No Arcade Result consumer found | Yes, separate authority | No | No | No automatic economic award from Arcade Result found. |
| Legacy browser writer | Legacy Arcade frontend | old event vocabulary/game metadata | formerly browser credit ledger, wallet, Polygon; now no writes | `recordArcadeEvent()` quarantine shim | No | Browser-only compatibility | Yes | Quarantined in Phase 2D; returns rejected/zero result. |
| Legacy browser history | Legacy Arcade frontend | local credit ledger rows | display summaries/history | `useArcadeHistory()` | No | Yes, for current legacy display | No | Still reads/aggregates historic values at checkpoint; Phase 2E not yet applied. |

## Phase 2D.6 Current-State Addendum

The rows above capture the original 2D.5 audit state. Current repaired path:

| Component | Authority | Reads From | Writes To | Event / API | Canonical? | Frontend Dependency? | Phase 2D.6 Affected? | Risk / Notes |
|---|---|---|---|---|---|---|---|---|
| Arcade Result + outbox | Arcade + shared coordinator | Locked Attempt, stored Activity policy | Result, completed Attempt, outbox in one transaction | `curriculum.arcade` / `arcade.resulted`; `arcade.resulted:${result.id}` | Result is canonical; outbox coordinates | No | Yes | Transaction rollback prevents a committed Result without its event. |
| SHS Verified Evidence projection | Verified Evidence | Canonical Result and active org rule | SHS evidence records; SHS fact projection only after REVIEWED | `ARCADE_RESULT` | Evidence authority | No | Yes | Missing rule or pending/unreviewed evidence yields no Truth Spine claim and a retryable observable failure. |
| Signed Agent Fabric ingress | Agent Fabric security boundary | Signed minimized handoff and exact allowlist | Existing Truth Spine source/claim service | `POST /shf/internal/ingestion/events`; exact pair `curriculum.arcade` + `arcade.resulted` | Authorized ingestion boundary | No | Yes | Exact Arcade validation; unsupported events and invalid signatures fail closed. |
| Truth Spine bridge | Truth Spine | Reviewed SHS Evidence references + canonical Result provenance | Existing Truth Spine source and draft claim | `project_verified_arcade_event_to_truth()` | Truth Spine owns persistence/approval | No | Yes | Stable IDs support replay. Claims remain draft/unapproved and source unverified. Production PostgreSQL persistence was not exercised; overall status PARTIAL. |
| `curriculum_truth_facts` | SHS read/projection model | Canonical source + evidence rule | SHS-side projection | Not polled by the bridge | Not Truth Spine authority | No | No | Not used as an ingestion shortcut or source of truth. |

## Phase 2D.6B Acceptance Addendum

**Final status: PASS.** The production-mode PostgreSQL repository was exercised against a disposable database using the existing `truth_spine_records` schema. The signed Agent Fabric ingestion route and canonical Truth Spine service persisted the Arcade claim/source, read them back through `get_claim`, `get_source`, and viewer-scoped `list_claims_for_viewer`, and reused stable identities on replay. Invalid signature/event, unreviewed or malformed evidence, and organization mismatch left Truth Spine reads unchanged. SHS integration tests separately prove absent and retired rules stop evidence/fact projection before handoff.

| Component | Authority | Reads From | Writes To | Event / API | Canonical? | Frontend Dependency? | Phase 2D.6B Result | Risk / Notes |
|---|---|---|---|---|---|---|---|---|
| Truth Spine PostgreSQL repository | Truth Spine | Canonical source/claim payloads | `truth_spine_records` | `append_record`, `read_records`, `find_record_identity` | Yes | No | Real PostgreSQL write/read/replay passed | Existing append-only repository and migration 114; no new persistence API. |
| Arcade signed handoff | Shared coordination into Truth Spine | Reviewed `ARCADE_RESULT` refs and canonical Result provenance | Truth Spine source/claim service | Signed `curriculum.arcade` / `arcade.resulted` | Yes, downstream projection | No | Route exercised with PostgreSQL mode | Status remains unverified/draft/unapproved pending Truth Spine workflow. |
