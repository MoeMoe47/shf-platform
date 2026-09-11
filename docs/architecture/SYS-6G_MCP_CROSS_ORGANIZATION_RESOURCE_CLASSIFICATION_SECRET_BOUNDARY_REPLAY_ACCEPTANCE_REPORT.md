# SYS-6G MCP Cross-Organization / Resource Classification / Secret Boundary / Replay Acceptance Report

## 1. Executive Result

**WF-041 COMPLETE for the bounded repository-local governed MCP contract.**
Fresh PostgreSQL and authenticated HTTP acceptance proved scoped discovery and
evaluation, canonical resource classification ceilings, safe denial paths,
secret rejection, input-security access, durable simulation records, and
revoked-membership fail-closed behavior. No live external MCP provider or
production side effect was used. WF-040 remains `BLOCKED — SAFETY/POLICY`.

## 2. Repository Baseline

Path: `/Users/mikeslate/Projects/shrv1`  
Branch: `studio-v1-plus-development`  
HEAD: `0441aa4`  
Dirty baseline: 305 files (122 tracked, 183 untracked) before this phase;
current count is 307 after the two phase artifacts and report changes. Owner
work was preserved. Migration filename head: `130_agent_task_approval_incident_control.sql`.
PostgreSQL was available on disposable port 55445; API acceptance ran on port
8111; no frontend or Agent Fabric production service was enabled.

## 3. WF-041 Contract

| Trigger | Producer | Canonical consumer | Final consumer | Success | Failure |
|---|---|---|---|---|---|
| Authenticated agent-scoped MCP request | Agent Fabric/MCP gateway | MCP policy/resource gateway | Authenticated governance API and durable invocation record | Governed evaluation or safe simulation | Denied, approval-required, not-found, or policy failure |

The entering gap was fresh cross-organization, classification, secret-boundary,
input-security, replay, and revoked-identity acceptance.

## 4. Authority Map

| Responsibility | Canonical owner |
|---|---|
| Agent identity, delegation, session, task | AI Governance / Agent Fabric |
| MCP server, tool, resource, policy, invocation | MCP gateway |
| Resource classification | MCP persisted classification plus AI Governance classification authority |
| Input scanning/admission | Agent Input Security gateway |
| Operational event/outbox | Integration outbox / operational event authority |
| Evidence and Truth | Existing Evidence / GPA and Truth Spine authorities |
| External provider execution | Provider adapter; no live provider in this phase |

## 5. Agent / Server / Tool / Resource Inventory

The acceptance fixture used Org A and Org B, one active TEST MCP server, a
READ_ONLY tool, a PROPOSED_WRITE tool, an INTERNAL resource, and a RESTRICTED
resource. Server and resource records are durable and organization/tenant
scoped. The test server used an inert HTTPS reference and no credential value.

## 6. Classification Model

The canonical classification set is `PUBLIC`, `INTERNAL`, `SENSITIVE`, and
`RESTRICTED`, ordered by `CLASSIFICATION_RANK`. The MCP service now reads the
persisted resource classification and compares it to the policy ceiling before
Agent authority evaluation. Unknown classifications fail closed.

## 7. Classification Rules

| Rule | Source | Enforcement | Result |
|---|---|---|---|
| INTERNAL is allowed only under an INTERNAL ceiling and valid scope | MCP resource/policy | MCP + Agent authority | Org A scoped read allowed |
| RESTRICTED exceeds INTERNAL ceiling | MCP resource/policy | MCP gateway | `MCP_CLASSIFICATION_DENIED` |
| Unknown resource/tool/server | Durable gateway lookup | MCP gateway | Safe denial/not-found |

## 8. Cross-Organization Isolation

Org B discovery returned no Org A server. Direct evaluation of the Org A server
as Org B returned HTTP 404 `MCP_SERVER_NOT_FOUND`; protected details were not
disclosed. Server, tool, resource, policy, invocation, and identity lookups
retain organization and tenant predicates.

## 9. Session / Task / Delegation Scope

The fixture used the existing durable active Agent Identity, delegation, and
session. Evaluation checked principal, organization, tenant, purpose, action,
delegation, session, and explicit resource scope. The initial fixture resource
type was corrected to the persisted canonical `test_resource` type; this was a
fixture issue, not a product bypass.

## 10. Tool Allowlists

The READ_ONLY tool was allowlisted for the acceptance purpose. Unknown tool
evaluation returned `MCP_TOOL_NOT_FOUND`. The PROPOSED_WRITE tool did not gain
permission through the read policy and returned `MCP_TOOL_NOT_ALLOWLISTED`.

## 11. Side-Effect and Approval Boundary

READ_ONLY evaluation required no approval and simulation produced `SIMULATED`.
Non-read tools remain policy/approval governed. No live write or external
side-effect path was invoked.

## 12. Secret Boundary

Server registration with a raw `secret` field returned HTTP 400
`MCP_SECRET_NOT_ALLOWED`. The stored server contained only an endpoint reference
and no credential or token. Provider credentials remain server-side references.

## 13. Input Security

The authenticated `/input-security/scans` route accepted the deterministic test
scan for an injection-pattern fixture and persisted the gateway result. Input
security remains separate from MCP policy and no model reasoning was stored.

## 14. Direct-ID Protection

Unknown server and tool IDs fail closed. Org B direct evaluation of Org A's
server is safe-not-found. No alternate unrestricted resource-detail route was
introduced.

## 15. Revoked Membership

After Org A membership was changed to inactive, the same authenticated token
received HTTP 401 `AUTH_REQUIRED` on protected MCP discovery. This confirms
current membership is rechecked rather than trusted from an earlier session.

## 16. Replay / Idempotency

Simulation invocations are durable append-only operational records. Repeating a
safe simulation cannot create an external side effect; mutating tools remain
approval-gated and live execution is disabled. Existing MCP invocation history
preserves each request rather than rewriting prior records.

## 17. Security Events and Correlation

Denied evaluations persist bounded denial codes in durable MCP invocation and
operational event data where simulation is used. Input-security findings remain
in the input-security authority. Correlation identifiers are returned by HTTP;
no duplicate incident authority was created.

## 18. Evidence / Truth Boundary

MCP evaluations and scans are operational facts. They do not self-create
verified Evidence, accepted Truth, institutional metrics, or public claims.
Existing Agent-to-Evidence and Truth acceptance paths remain the only route for
those consequences.

## 19. Domain Boundaries

MCP does not replace Studio/ARAG release authority, CivicSure decisions,
Education outcomes or credentials, Funding decisions, Evidence admissibility,
Truth acceptance, or Oracle interpretation. Agent Fabric remains a governed
requesting/coordinating layer.

## 20. Public Disclosure

N/A for the bounded WF-041 contract. No public MCP surface or public disclosure
was created. Private resource names, endpoint details, and secrets remain
outside public projections.

## 21. Final Consumer

The canonical current consumer is the authenticated MCP governance API and its
durable server/resource/policy/invocation projections. No active Agent Fabric
admin browser surface was required; UI acceptance is `API/DOMAIN CONSUMER — UI
DEFERRED`.

## 22. Operational Event Chain

| Producer | Event | Consumer | Side effect | Terminal |
|---|---|---|---|---|
| MCP gateway | `mcp.invocation.simulated` | Integration outbox/operational audit | Durable simulation record | SIMULATED |
| MCP gateway | `mcp.access.denied` | Integration outbox/operational audit | Durable denial record | DENIED |
| Input Security | scan event/result | Input-security consumer | Finding/admission decision | Admitted or blocked |

## 23. Fresh PostgreSQL

Database: `shs_sys6g_20260910`. Migrations 001–130 applied from the current
repository. Status was `pending=[]`, `drift=[]`, `unknownApplied=[]`; schema
integrity returned `{ok:true, failures:[]}`.

## 24. Authenticated HTTP Acceptance

| Operation | Org A authorized | Org B | Revoked Org A | Result |
|---|---:|---:|---:|---|
| GET `/mcp/servers` | 200 | 200 empty projection | 401 | Pass |
| POST `/mcp/evaluate` INTERNAL | 200 allowed | 404 server not found | 401 | Pass |
| POST `/mcp/simulations` READ_ONLY | 201 SIMULATED | N/A | N/A | Pass |
| Evaluate RESTRICTED over INTERNAL ceiling | 200 denied | N/A | N/A | Pass |
| Unknown tool | 200 `MCP_TOOL_NOT_FOUND` | N/A | N/A | Pass |
| Unknown server | 404 `MCP_SERVER_NOT_FOUND` | N/A | N/A | Pass |
| Raw secret registration | 400 `MCP_SECRET_NOT_ALLOWED` | N/A | N/A | Pass |
| Input-security scan | 201 | N/A | N/A | Pass |

## 25. Negative and Recovery Paths

Unknown identifiers, classification overflow, wrong organization, revoked
membership, unallowlisted tool, and raw secret input all failed closed. The
service is stateless for these projections; restarting it reconstructs records
from PostgreSQL. Live external provider outage/retry is N/A because no live
provider is configured or required for this bounded contract.

## 26. Performance

Queries use server/resource, organization/tenant, policy, and status indexes
already present in the MCP migrations. No per-resource unbounded loop or raw
payload expansion was introduced. The manifest/resource reads are bounded.

## 27. Security and Privacy

No credentials, secrets, raw model reasoning, or unrelated tenant data entered
the fixture or report. Organization and tenant checks occur before protected
evaluation. Restricted resources cannot be downgraded by a request body.

## 28. Regression

Passed: focused MCP gateway tests (11/11), API typecheck, API build, root build,
manifest validation, UI validation, migration status, schema integrity, and
`git diff --check`. The root package has no `typecheck` script; that command
returned npm `Missing script: typecheck` and is a `STALE CONTRACT`, not a code
failure. Broader SYS-6B/C/E regression commands were not rerun in this narrow
acceptance continuation; existing phase reports remain the regression evidence
for those unchanged surfaces.

## 29. Failure Classification

The initial uppercase fixture statuses and delegation resource-type mismatch
were `FIXTURE` failures and were corrected in the disposable database. The
earlier tsx IPC/listener failures were `HARNESS/ENVIRONMENT`; the existing API
was run directly with `node --import tsx/esm` under the permitted local test
context. No product failure remains for the accepted contract.

## 30. Production and Azure Boundary

No production MCP provider, cloud resource, Azure subscription, or external
side effect was used. WF-041 repository-local acceptance is not Azure-backed:
**N/A — NO MANDATORY AZURE-BACKED SYS-6 WORKFLOW PRESENT**. WF-040 remains
**BLOCKED — SAFETY/POLICY**.

## 31. Files Created

- `docs/architecture/SYS-6G_MCP_CROSS_ORGANIZATION_RESOURCE_CLASSIFICATION_SECRET_BOUNDARY_REPLAY_ACCEPTANCE_REPORT.md`
- `/tmp/sys6g-fixture.mjs` and `/tmp/sys6g-http.mjs` acceptance harnesses

## 32. Files Modified

- `apps/shs-api/src/domain/mcp/service/mcp-service.ts`
- `apps/shs-api/tests/mcp-gateway.test.ts`
- `docs/architecture/SYSTEMWIDE_WORKFLOW_REGISTRY.md`
- `docs/architecture/SYSTEMWIDE_WORKFLOW_DEPENDENCY_GRAPH.md`
- `docs/architecture/SYSTEMWIDE_WORKFLOW_COMPLETION_ROADMAP.md`

## 33. Owner Work Preservation

No reset, stash, clean, rebase, checkout, commit, push, deletion, migration
rewrite, production database mutation, cloud provisioning, or production Agent
Fabric enablement occurred. Existing dirty and untracked owner work was
preserved.

## 34. Workflow Completion Matrix

| Workflow | Status | Evidence |
|---|---|---|
| WF-036 | COMPLETE | SYS-6E generic approval foundation |
| WF-037 | COMPLETE | SYS-6B durable identity/delegation/session/task |
| WF-038 | COMPLETE | SYS-6C bounded execution/recovery |
| WF-039 | COMPLETE | SYS-6F Agent Attempt → Evidence → Truth |
| WF-040 | BLOCKED — SAFETY/POLICY | Intentional production workforce block |
| WF-041 | COMPLETE | This fresh SYS-6G governed MCP acceptance |
| WF-043 | COMPLETE | Bounded operational awareness |

## 35. Remaining SYS-6 Work

No repository-local SYS-6 acceptance workflow remains open. WF-040 remains a
deliberate safety/policy block and must not be promoted by this phase. External
live MCP/provider deployment is not claimed.

## 36. WF-041 Decision

**WF-041 COMPLETE** for the current bounded repository-local MCP server,
resource, tool, classification, secret, scope, input-security, and replay
contract. No HIGH WF-041 blocker remains.

## 37. SYS-6 Closure Readiness

SYS-6 is ready for final closure with WF-040 intentionally recorded as a
safety/policy block. The control and bounded execution waves remain separate
from unrestricted production workforce execution.

## 38. Next Phase

The next systemwide wave is **SYS-7**, according to the current roadmap. It was
not started.

## 39. Final Verdict

1. Agent Fabric cannot create verified Evidence by itself: **YES**.
2. Agent Fabric cannot write arbitrary Truth: **YES**.
3. Agent facts and MCP resources are classified and policy-checked: **YES**.
4. Canonical MCP intake and authenticated HTTP acceptance pass: **YES**.
5. Provenance, scope, secret, replay, and revoked-membership protections pass: **YES**.
6. PostgreSQL/API agreement and schema integrity pass: **YES**.
7. Live external MCP delivery was not required or claimed: **YES**.
8. WF-040 remains **BLOCKED — SAFETY/POLICY**.
9. WF-041 is **COMPLETE** for its bounded contract.
10. SYS-6 is **COMPLETE WITH INTENTIONAL SAFETY BLOCK RECORDED**; SYS-7 is the
next phase and was not started.

**SYS-6 AGENT FABRIC GOVERNANCE / DURABLE EXECUTION WAVE COMPLETE WITH INTENTIONAL SAFETY BLOCK RECORDED**
