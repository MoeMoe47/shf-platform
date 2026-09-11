# SYS-7A External Integrations / Storage / Provider Adapter Rebaseline and Gap Audit Report

## 1. Executive Result

SYS-7 currently assigns WF-030, WF-032, and WF-049. WF-030 and WF-032 are
**COMPLETE** for their current repository-local canonical contracts. WF-049 is
**BLOCKED — EXTERNAL DEPENDENCY** because the production Registry provider is
unavailable. No repository-local storage authority gap, duplicate provider
authority, or mandatory Azure workflow was found.

## 2. Repository Baseline

Path: `/Users/mikeslate/Projects/shrv1`  
Branch: `studio-v1-plus-development`  
HEAD: `0441aa4`  
Baseline dirty state at audit: 124 tracked and 184 untracked files, 308 total.
Migration filename head: `130_agent_task_approval_incident_control.sql`.
The disposable PostgreSQL instance remained available on the existing local
port 55445; API and frontend were stopped at audit time. No provider
credentials or cloud subscription were used or exposed.

## 3. SYS-7 Workflow Inventory

| Workflow | Domain | Integration | Registry status | Canonical owner | Final consumer |
|---|---|---|---|---|---|
| WF-030 | Studio | TEST deployment/release adapter; future external deployment | COMPLETE | Studio release authority | Authenticated release/handoff API |
| WF-032 | External Accounts | Google/Microsoft calendar account adapters | COMPLETE | External Accounts | Calendar services and authenticated account API |
| WF-049 | Registry | Local Registry adapter; unavailable production provider | BLOCKED — EXTERNAL DEPENDENCY | Registry Submission | Registry submission status/API |

## 4. Status Classification

Counts: COMPLETE 2; PARTIAL — PRODUCT GAP 0; PARTIAL — ACCEPTANCE GAP 0;
N/A — CANONICAL JUSTIFICATION 0 workflow assignments; BLOCKED — EXTERNAL
DEPENDENCY 1; BLOCKED — SAFETY/POLICY 0. N/A classifications below describe
capabilities outside the assigned workflow contracts, not additional workflows.

## 5. External Integration Inventory

| Integration | Domain | Adapter | Provider-neutral | Live provider available | Workflow |
|---|---|---|---|---|---|
| Local private source storage | Source Ingestion | Yes | Yes | Local only | Supporting |
| Report file storage | Reporting | Yes | Yes | Local only | Supporting |
| Google/Microsoft calendar | External Accounts | Yes | Yes | No credentials in audit | WF-032 |
| Mock calendar | External Accounts | Yes | Yes | Test only | WF-032 |
| Zoom/mock live learning | Live Learning | Yes | Yes | Mock only; Zoom unconfigured | Shared prior workflow |
| TEST Registry | Registry | Yes | Yes | Test only | WF-049 |
| TEST deployment | Studio | Yes | Yes | Test only | WF-030 |
| MCP transport | Agent Fabric | Yes | Yes | Inert/test only | SYS-6 support |
| Email provider | Notifications/Credentials | Interface/test boundary | Yes | No live delivery claim | Supporting |
| Azure/S3/GitHub/GitLab | Various | No mandatory current adapter | N/A | Unavailable/not required | N/A |

## 6. Provider-Neutrality Audit

Canonical services depend on internal contracts and provider registries. Google,
Microsoft, Zoom, Registry, deployment, and MCP implementations are selected at
adapter boundaries. Vendor IDs are metadata, not replacements for internal
connection, submission, release, or artifact IDs. No direct vendor lifecycle
was found in WF-030/032 domain authority.

## 7. Canonical External Identity

Internal IDs remain authoritative: external account connection ID, Registry
submission ID, release ID, Build Artifact ID, and report artifact ID. Provider
references, calendar event IDs, Registry references, and storage keys are
secondary mappings with organization/tenant context.

## 8. Storage Architecture

The repository uses PostgreSQL for canonical metadata and JSON manifests, local
private filesystem storage for source/report bytes, and provider-neutral
references where a later external store may be introduced. No database-wide
blob or cloud-only authority exists.

## 9. Storage Responsibility Matrix

| Content | Metadata authority | Physical bytes | Provider | External required |
|---|---|---|---|---|
| Studio Build Artifact | Studio | Manifest/metadata; no binary provider required | Local DB | No |
| Curriculum/source uploads | Source Ingestion | `local_private` | Local private filesystem | No |
| Evidence attachments | Evidence/report artifact domain | Existing local report storage boundary | Local | No |
| Legal records | Legal authority | `legal_artifacts` metadata/local boundary | Local | No |
| Rendered reports | Reporting | Report file storage | Local private | No |
| Agent resources | Owning resource domain | Domain-specific reference | Provider-neutral | No |
| Public assets/OAS assets | Frontend/content repository | Repository/static assets | Local build | No |
| Backup/export packages | No SYS-7 canonical workflow found | N/A | N/A | N/A |

## 10. Metadata / Byte Boundary

Metadata remains owned by Studio, Reporting, Source Ingestion, Evidence, Legal,
or the relevant domain. Storage implementations only persist bytes by bounded
reference and do not become Truth, Evidence, Build Artifact, or Release
authority.

## 11. Local Storage

`LocalPrivateSourceStorage` and `ReportFileStorage` are repository-local
development/test-capable stores with path traversal protection and bounded
references. They are not represented as cloud production acceptance. Production
report storage fails closed when its required configured root is absent.

## 12. Object Storage Adapter

No S3/Azure Blob object-storage adapter is present or required by the current
SYS-7 workflow contracts. Existing `put/get/remove` local abstractions are
provider-neutral enough for future replacement; adding cloud storage is outside
this rebaseline.

## 13. Storage Integrity

Source/report/build artifacts retain hashes or bounded references where their
domain requires them. Local writes use exclusive creation for immutable source
uploads and safe path validation. No unbounded binary payload was added.

## 14. Storage Isolation

Application metadata is organization/tenant scoped. Storage references use
bounded safe segments or safe relative keys. Cross-organization access is
controlled by owning domain authorization; no global user-controlled path is
accepted.

## 15. Storage Secret Boundary

Provider credentials are not returned in DTOs or frontend configuration. OAuth
tokens use the existing encrypted envelope and server-side decryption path.
Raw MCP secrets are rejected. Secret values were not logged or included in
Evidence/report metadata.

## 16. Storage Failure / Retry

Local writes fail explicitly on unsafe paths, missing files, or duplicate
immutable creation. Provider-backed retry semantics are implemented only in
the owning provider contract; no cloud object retry workflow is assigned to
SYS-7 currently.

## 17. Storage Retention

Domain-specific records are retained or superseded by their existing services.
No global delete/retention policy was invented. Object-store legal hold and
cloud lifecycle are N/A for current local completion.

## 18. Azure

No mandatory Azure-backed SYS-7 workflow or adapter was found. **N/A — NO
MANDATORY AZURE-BACKED SYS-7 WORKFLOW PRESENT.** No subscription was requested
or provisioned.

## 19. WF-049 Registry Provider

The canonical local provider is `local_test_registry`. `RegistrySubmissionService`
owns durable submission state, organization scope, package hash validation,
submission idempotency, failure recording, resubmission lineage, and outbox
events. The production Registry provider remains unavailable.

## 20. Registry Provider Contract

`canonical validated package → RegistrySubmissionService → RegistryProvider →
provider result/reference → durable submission status/outbox`. Local TEST
acceptance covers this contract. Production provider readback cannot be claimed
without provider access.

## 21. Registry Failure / Retry

The local provider supports accepted, submitted, changes-required, rejected,
failed, and failed-once scenarios. Failed submissions persist failure state;
retry creates resubmission lineage and uses advisory locking/idempotency. Live
provider failure/readback remains externally unavailable.

## 22. GitHub / Repository Providers

No canonical GitHub/GitLab provider adapter or live repository workflow is
assigned to SYS-7. Repository/source identity in current Studio remains
internal and is not silently treated as GitHub identity.

## 23. ARAG-1 Provider Adapters

ARAG-1 and Studio use provider-neutral release/work-order contracts. The local
TEST deployment and Registry providers are test adapters. No Codex, Claude
Code, Cursor, GitHub, or other live external execution was accepted here.

## 24. Codex / Claude / Cursor

No independently live-accepted Codex, Claude Code, or Cursor integration is
present. Any references are architectural/provider-environment metadata or
future/test boundaries, not current production providers.

## 25. Provider Switching

Where registries exist, switching is intended to preserve internal task,
submission, account, artifact, approval, and Evidence IDs. No provider switch
was executed because no live external provider was configured.

## 26. Model Providers

Agent model/provider values are governance metadata selected through Agent
Fabric policy. No model provider is a SYS-7 terminal consumer, and SYS-6
production workforce execution remains safety-blocked.

## 27. MCP External Providers

SYS-6G proved governed repository-local MCP using inert/test configuration.
There is no live external MCP provider acceptance in this phase. The WF-040
safety boundary is preserved.

## 28. Webhooks

No mandatory SYS-7 inbound/outbound webhook workflow was found. Existing
outbox/event patterns are canonical for internal handoffs. External webhook
delivery is N/A for the assigned current contracts.

## 29. Inbound Webhook Security

No active external webhook listener requiring provider signature acceptance was
identified. Signature/replay acceptance is therefore N/A, not represented as
complete.

## 30. Outbound Webhook Delivery

Internal outbox events exist for Registry, release, credentials, and other
domains. A customer-facing durable webhook delivery workflow is not assigned
to SYS-7 and was not invented.

## 31. Email / Messaging

Email is a notification/delivery boundary with interfaces and outbox records;
no live external email provider was required for SYS-7 completion. It is not a
missing WF-030/032/049 product seam.

## 32. Identity Federation

Auth0/OIDC session and provider-link primitives exist, but enterprise SAML or
live federation acceptance is not a current SYS-7 workflow requirement. Future
federation is deferred without changing canonical identity authority.

## 33. External Auth Token Lifecycle

OAuth authorization state, encrypted access/refresh token storage, expiry,
refresh, reauth-required, and revocation paths exist for external calendar
connections. Provider calls were not made without credentials.

## 34. Secrets Manager

The external-secret cipher requires approved production key configuration and
fails closed when absent. A dedicated cloud secrets-manager lifecycle is not a
mandatory SYS-7 workflow; it is deployment hardening, not a repository-local
gap for WF-030/032/049.

## 35. Provider Credential Mapping

Credential records are scoped to organization/user/provider and encrypted at
rest. Safe connection DTOs omit ciphertext, key versions, and provider account
secrets. No global shared credential was introduced.

## 36. External API Clients

HTTP clients are isolated in provider/transport modules such as calendar,
MCP, and live-learning adapters. Canonical domain services consume interfaces
and persist internal IDs/results.

## 37. Rate Limits

Application rate limiting is present. Provider-specific 429/backoff is not a
current completion gate for workflows without live providers; no unbounded
provider loop was found.

## 38. Timeouts

MCP HTTP transport and provider HTTP boundaries use bounded timeout behavior.
Local Registry/deployment test adapters are synchronous and deterministic.

## 39. Outage Behavior

Registry provider exceptions persist FAILED state and do not claim acceptance.
Calendar refresh failures isolate the connection and can require reauth. No
provider outage is converted into false domain success.

## 40. Idempotency

Registry submissions use scoped lookup and advisory locking; release and outbox
contracts preserve internal idempotency keys; external account replacement is
scoped by actor/provider. Provider-specific idempotency is not claimed without
the provider.

## 41. Readback / Verification

Local TEST release/Registry contracts return bounded references and statuses.
Build Artifact and release hashes remain internal authoritative identity. Live
external readback is unavailable for WF-049 and not required for the current
WF-030/032 repository-local completion definitions.

## 42. External Result Provenance

Provider/reference, internal submission or connection ID, package/artifact hash,
status, timestamps, failure code, and outbox correlation are retained where
implemented. Secrets are excluded.

## 43. External Correction / Revocation

External calendar connections support REAUTH_REQUIRED/REVOKED and event-link
reconciliation. Registry supports changes-required/rejection/resubmission.
Production provider-specific withdrawal or rollback is not claimed.

## 44. Provider Outage

Outage behavior is fail-closed or persisted as failure for implemented local
contracts. No provider-unavailable state is reported as a successful external
publication.

## 45. Deferred Operation

Durable submission/outbox and reauth-required states provide bounded deferral
where those domains support it. No general external integration queue is
required by current SYS-7 assignments.

## 46. Eventual Consistency

Calendar mirrors and outbox consumers have domain-specific reconciliation
boundaries. No SYS-7 workflow currently requires a new eventual-consistency
consumer.

## 47. External Data Trust

Provider responses remain unverified operational inputs until accepted by the
owning domain. They cannot directly write Truth, verified Evidence, metrics, or
public disclosure.

## 48. Evidence Boundary

Provider calls and references may be provenance inputs to Evidence, but provider
logs are not automatically Evidence. Existing Evidence authority remains
canonical.

## 49. Truth Boundary

No provider adapter writes arbitrary Truth. Truth acceptance remains on the
Truth Spine through its existing evidence/admissibility path.

## 50. Reporting

Reporting is internal and canonical for current report consumers. No external
report delivery provider is required by SYS-7.

## 51. Public Disclosure

WF-030's local TEST release is not production internet publication. Public-safe
projections remain separate from deployment/provider acceptance.

## 52. Studio Release External Boundary

WF-030 is complete for the repository-local approval-gated TEST release
contract. Production deployment/provider publication is not claimed and is not
a newly identified product gap in this rebaseline.

## 53. Agent Fabric External Boundary

SYS-6 remains complete with WF-040 intentionally safety-blocked. No external
Agent Fabric provider or production side effect was enabled.

## 54. CivicSure External Systems

No new external CivicSure provider integration is assigned to SYS-7. Existing
internal GPA authority and provider-lineage contracts remain domain-owned.

## 55. Education External Systems

No LMS/SIS/credential/video provider is required by the current SYS-7
assignments. Existing local/mock live-learning providers remain separate.

## 56. Funding External Systems

No grant/payment provider is assigned to SYS-7. Funding authority remains
internal and human/canonical-policy governed.

## 57. Legal / Document Storage

Legal artifact metadata exists with a local/private storage boundary. No
external legal storage dependency is required for current SYS-7 completion.

## 58. Backup / Recovery

Database migration/schema integrity and domain retry history are covered by
existing workflows. Object-store backup/restore is not a current SYS-7
workflow.

## 59. Data Portability

Provider-neutral contracts preserve internal IDs, hashes, scoped references,
and statuses. A future provider can be introduced behind the adapter without
replacing canonical domain identity.

## 60. Observability

Registry, release, MCP, external-account, and outbox records retain statuses,
references, failures, timestamps, and correlation IDs sufficient for current
operator/API inspection. A unified external-integration dashboard is not
required by SYS-7A.

## 61. Admin Controls

Current services expose bounded connection, submission, release, and policy
operations with permission checks. No new admin UI is required for this audit.

## 62. Security

Path traversal, unsafe MCP endpoints, raw secret payloads, token DTO leakage,
organization scope, and provider credential boundaries are guarded in code.
No arbitrary external URL or provider credential bypass was found in the
assigned workflows.

## 63. Data Classification

MCP classification ceilings and Input Security remain enforced. Restricted data
does not become externally shareable merely because an adapter exists.

## 64. Sensitive Data

No real sensitive data was sent to an external provider during this audit.
Encrypted token and safe DTO boundaries remain in place.

## 65. Contract Versioning

Build artifacts, Registry packages, and provider contracts retain versions or
hashes where needed. Future provider response-version handling is not a
current SYS-7 completion gate.

## 66. Test Adapters

`LocalTestRegistryProvider`, mock calendar, mock live-learning, inert MCP, and
local deployment adapters are explicitly TEST/LOCAL providers. They prove
orchestration, never production publication.

## 67. Acceptance Evidence

WF-030/032 reports provide local PostgreSQL/API/service evidence; WF-049 has
local adapter tests and durable failure/retry evidence but no production
provider readback. This phase did not perform external writes.

## 68. External Dependency Classification

WF-049 meets the external-block criteria: local contract exists and the only
remaining required proof is access to the unavailable production Registry
provider. No product gap is hidden by this classification.

## 69. Product Gap Classification

No SYS-7-assigned workflow has a confirmed product gap. No missing adapter,
durable attempt state, scope boundary, or canonical storage authority was found
for the current contracts.

## 70. Acceptance Gap Classification

No SYS-7-assigned workflow has a current acceptance gap after considering its
contract. Live Google/Microsoft or Registry traffic is not falsely represented
as completed; it is either outside the current local contract or the explicit
WF-049 external block.

## 71. Workflow Matrix

| Workflow | Contract | Provider | Local proof | Live proof | Status | Gap |
|---|---|---|---|---|---|---|
| WF-030 | Approved artifact → TEST release | Local TEST | Service/PostgreSQL/HTTP | N/A by current contract | COMPLETE | None |
| WF-032 | Scoped encrypted external account lifecycle | Google/Microsoft adapters + mock | Service/API/security tests | No provider credentials | COMPLETE | None for current contract |
| WF-049 | Valid package → Registry submission | Local TEST Registry | Service/PostgreSQL/failure/retry | Unavailable | BLOCKED — EXTERNAL DEPENDENCY | Production provider |

## 72. Provider Matrix

| Provider | Purpose | Adapter | Credentials | Live accepted | Status |
|---|---|---|---|---|---|
| local_test_registry | Registry orchestration | Yes | No | Test only | WF-049 external block remains |
| google | Calendar account | Yes | Not present | No | Local contract complete |
| microsoft | Calendar account | Yes | Not present | No | Local contract complete |
| mock calendar/live learning | deterministic tests | Yes | No | Test only | N/A external |
| Azure/S3/GitHub | possible future providers | No mandatory adapter | No | No | N/A |

## 73. Storage Matrix

Storage metadata is domain-owned; current bytes are local/private where needed;
hashes and safe references are retained; organization boundaries are enforced.
No external object provider is mandatory for SYS-7.

## 74. Failure Matrix

| Integration | Failure | Retry | Idempotency | Readback | Terminal |
|---|---|---|---|---|---|
| Registry | Provider exception | Durable retry/resubmission | Scoped/advisory lock | Provider unavailable | FAILED / resubmit |
| External calendar | token expiry/provider error | Reauth/mirror handling | Scoped connection/link | Provider-specific | REAUTH_REQUIRED/REVOKED |
| Local storage | unsafe/duplicate/missing file | Caller/domain retry | Exclusive create | Local hash/reference | Explicit error |
| TEST release | adapter failure | WF-030 attempt retry | Release key | Test reference | FAILED/RELEASED |

## 75. Security Matrix

| Integration | Credential boundary | Org isolation | Input validation | Replay | Risk |
|---|---|---|---|---|---|
| Registry | No raw provider secret in response | Scoped package/submission | Hash/package validation | Submission lock/idempotency | P1 external availability |
| Calendar | Encrypted server-side tokens | Actor/org scoped | OAuth return-path guards | Link reconciliation | Sensitive tokens |
| MCP | Reference-only credentials | Server/resource tenant scope | Classification/input scan | Durable invocation history | WF-040 safety boundary |
| Local storage | Server filesystem | Safe scoped keys | Traversal checks | Exclusive immutable writes | Local-only |

## 76. P0/P1/P2/P3 Gaps

P0 product gaps: none. P1 repository-local gaps: none. P1 external block:
WF-049 production Registry provider. P2: future operational provider
observability and cloud storage hardening. P3: none material to SYS-7A.

## 77. Dependency-Ranked SYS-7 Work

No SYS-7B implementation is required by this audit. The only open item is
external: obtain an authorized production Registry provider and then perform a
separate WF-049 live acceptance. If project direction later requires cloud
object storage or live calendar/provider acceptance, those should be separately
scoped after credentials/subscription availability; they are not inferred here.

## 78. Files Created

- `docs/architecture/SYS-7A_EXTERNAL_INTEGRATIONS_STORAGE_PROVIDER_ADAPTER_REBASELINE_GAP_AUDIT_REPORT.md`

## 79. Files Modified

- `docs/architecture/SYSTEMWIDE_WORKFLOW_REGISTRY.md`
- `docs/architecture/SYSTEMWIDE_WORKFLOW_COMPLETION_ROADMAP.md`
- `docs/architecture/SYSTEMWIDE_WORKFLOW_DEPENDENCY_GRAPH.md`

## 80. Owner Work Preservation

No reset, stash, clean, rebase, checkout, commit, push, deletion, migration
rewrite, provider configuration, credential rotation, cloud provisioning, or
external write occurred. Existing dirty and untracked owner work was preserved.

## 81. SYS-7 Rebaseline Decision

SYS-7 has two COMPLETE repository-local workflow contracts and one legitimate
external block. No repository-local product or acceptance gap remains in the
current SYS-7 assignment set.

## 82. Recommended SYS-7B

Do not start SYS-7B from this audit. The next actionable work is **WF-049 live
Registry provider acceptance only after the provider becomes available**. No
Azure work is justified by current evidence.

## Final Verdict

1. SYS-7 workflows assigned: **3**.
2. COMPLETE: **2** (`WF-030`, `WF-032`).
3. PARTIAL — PRODUCT GAP: **0**.
4. PARTIAL — ACCEPTANCE GAP: **0**.
5. N/A workflow assignments: **0**.
6. BLOCKED — EXTERNAL DEPENDENCY: **1** (`WF-049`).
7. BLOCKED — SAFETY/POLICY: **0**.
8. Canonical provider-neutral pattern: **YES**.
9. Storage metadata and bytes are separate: **YES**.
10. Provider credentials are bounded and server-side: **YES**.
11. Azure required: **NO**.
12. WF-049 remains genuinely externally blocked with no confirmed local product
gap.
13. Registry local retries/idempotency/failure persistence: **YES**; production
readback: **UNAVAILABLE**.
14. Live external provider acceptance is not claimed for calendar, Registry,
MCP, or deployment providers.
15. Evidence, Truth, Reporting, Studio, ARAG-1, Agent Fabric, CivicSure,
Education, and Funding authorities remain separate.
16. Next action: wait for Registry provider availability, then run bounded
WF-049 live acceptance. Do not begin SYS-7B or SYS-8.
