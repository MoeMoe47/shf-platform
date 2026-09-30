# Arcade Authority Dependency Matrix

| Authority / component | Owns | Depends on | Does not own | Audit classification |
|---|---|---|---|---|
| Arcade Activity service | Activity definition and stored mastery policy | Authorized activity manager; `arcade_activities` | Curriculum linkage, Evidence, Treasury, Truth Spine | Canonical authority |
| Arcade Attempt service | Learner execution lifecycle | Authenticated org/user, active Activity | Result/mastery until submission | Canonical authority |
| Arcade Result service | Immutable outcome and server-derived mastery | Locked Attempt, Activity policy, raw bounded input | Verified skill, credentials, rewards, Truth Spine | Canonical authority |
| Trusted Reporting outbox | Durable event coordination, delivery state, idempotency | Arcade Result event | Outcome policy or reward policy | Shared coordinator, not authority |
| Verified Evidence projection | Evidence candidate/record and configured truth fact | Canonical source row and active organization evidence rule | Arcade Result derivation, Treasury, identity, browser history | Canonical evidence authority; conditional adapter |
| Curriculum lesson linkage | Lesson↔Activity definition relationship | Curriculum Lesson and Arcade Activity | Attempt, Result, mastery | Canonical Curriculum relationship |
| Curriculum completion policy | Evaluate requirements using source authority records | Target reference and canonical `arcade_results` | Arcade Result creation | Authorized read projection |
| Agent Fabric internal ingestion | Governed event intake and downstream projection | Signed allowlisted producer/event; lineage config | Arcade outcome and mastery | Downstream; Arcade event currently blocked by allowlist |
| Truth Spine | Institutional truth claim/source governance | Configured ingestion/provider/persistence mode | Arcade runtime or local history | Downstream authority; Arcade integration unproven in production |
| Metaverse | Experience/passport/missions projections | Canonical source references and Evidence projections | Verified mastery or credentials | Authorized projection; Arcade claims remain signals |
| Treasury | Economy, wallet/reward decisions | Treasury-owned policies and transactions | Arcade mastery/evidence | Independent authority; no Arcade automatic award found |
| Identity | Authentication, organization/user scope, permissions | Identity/auth system | Arcade outcomes | Independent authority |
| Legacy Arcade descriptor/catalog | Display/runtime metadata and external references | Legacy source metadata; Phase 2A validation | Any institutional outcomes | Presentation/compatibility only |
| Legacy `useArcadeLedger` | Compatibility event interface | Calls from old UI/dev surfaces | XP, tokens, EVU, credit, skills, evidence, credentials, mastery, Polygon proof | Quarantined; no writes after Phase 2D |
| Legacy `useArcadeHistory` | Historical local display | `creditLedger.listRecentEntries({app:"arcade"})` | Canonical Results/Evidence/Truth facts | Legacy read model; still a competing presentation of stale authority-like data pending Phase 2E |

## Dependency Conclusions

- The canonical Arcade Result path has no dependency on the browser ledger or history.
- The SHS Verified Evidence projection reads the canonical Result row; it does not consume local XP, EVU, Polygon metadata, or browser tags.
- Evidence/fact creation requires an active organization-configured `ARCADE_RESULT` rule. This is an explicit policy/configuration dependency, not a browser dependency.
- The downstream Agent Fabric handoff is a separate dependency and currently rejects the Arcade producer/event pair. The mapper and unit/integration test do not close this production handoff gap.
- Phase 2D removed unauthorized browser writes; it did not change API/backend authority implementations. It left the legacy history read/presentation intact for the later Phase 2E slice.
- No Treasury integration was found to be disconnected by Phase 2D; no Arcade Result→Treasury write path was found in the inspected Treasury source.

## Phase 2D.6 Remediation Addendum

The 2D.5 rows above preserve the original checkpoint. The following current dependencies were added without transferring authority:

| Authority / component | Owns | Depends on | Does not own | Current classification |
|---|---|---|---|---|
| Arcade transactional producer | Result and server-derived mastery | Locked Attempt, Activity policy, same-transaction outbox enqueue | Evidence interpretation, Truth Spine, rewards | Canonical Result + durable event coordination |
| SHS Verified Evidence | Evidence status and rule-governed interpretation | Canonical Result, active organization rule, review state | Truth Spine approval or Treasury value | Canonical evidence authority; no handoff until REVIEWED |
| Agent Fabric signed ingress | Authenticated, allowlisted cross-service intake | Valid service signature, exact `curriculum.arcade`/`arcade.resulted` pair, constrained evidence references | Result/mastery or evidence verification | Narrow authorized bridge |
| Truth Spine | Institutional source/claim persistence and approval | Existing Truth Spine service, stable source/claim identity, reviewed Evidence provenance | Arcade outcomes, SHS evidence decisions, browser history | Downstream authority; actual production PostgreSQL path remains unproven in this test environment |

The bridge does not consume `curriculum_truth_facts`; those remain an SHS projection. Legacy browser history/writes are not dependencies. No Treasury, Curriculum, or Metaverse authority was changed.

## Phase 2D.6B Production Acceptance

**Final status: PASS.** A real PostgreSQL database running the existing Truth Spine schema was selected through the production repository configuration. The test exercised signed route ingress, canonical Truth Spine source/claim writes, canonical service read-back, replay idempotency, and fail-closed cases. The signed SHS service is recorded as `created_by`; the learner remains the claim subject. Truth Spine still controls verification and approval, and the persisted record remains draft/unapproved. No second bridge or store was introduced.
