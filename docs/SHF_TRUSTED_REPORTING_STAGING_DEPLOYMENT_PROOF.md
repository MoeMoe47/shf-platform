# SHF Trusted Reporting Staging Deployment Proof

## Status

`AZURE_STAGING_DEPLOYMENT_BLOCKED_BY_CREDENTIALS` as of 2026-08-26.

The approved target is Azure staging only. `az account show` returned no
authenticated context, no authorized subscription/tenant was available, and
no Azure write action was attempted. This is a proof record, not a claim of
deployed infrastructure.

## Prepared model

The parent Terraform stack is `infra/azure/`; state bootstrap is
`infra/azure/bootstrap/`. The intended state key is
`staging/trusted-reporting.tfstate`, separate from the future
`production/trusted-reporting.tfstate`. State storage is designed as private
Azure Storage with HTTPS, TLS 1.2, private container, versioning, and
least-privilege blob access. Remote backend initialization was not attempted
without an authorized subscription.

Terraform `v1.15.8` resolved AzureRM `v4.81.0`. Parent and bootstrap stacks
both passed `terraform fmt -check -recursive`, backendless `terraform init`,
and `terraform validate`. No plan or apply was run.

## Deployment proof matrix

| Area | Result | Evidence |
|---|---|---|
| Authorized Azure subscription | UNAVAILABLE | No authenticated `az` context |
| Remote state | NOT_CREATED | Requires authorized bootstrap |
| SHS API external HTTPS ingress | CONFIGURED_ONLY | `infra/azure/shs-api.tf` |
| Agent Fabric internal ingress | CONFIGURED_ONLY | `infra/azure/agent-fabric.tf` |
| Worker no ingress | CONFIGURED_ONLY | `infra/azure/worker.tf` |
| PostgreSQL private access | CONFIGURED_ONLY | `infra/azure/postgres.tf` |
| Key Vault/managed identity | CONFIGURED_ONLY | `infra/azure/key-vault.tf` |
| ACR image pull | CONFIGURED_ONLY | `infra/azure/registry.tf` |
| TLS/proxy behavior | UNAVAILABLE | No deployed endpoint |
| CORS | CONFIGURED_ONLY | Explicit staging origin variables |
| Logs/monitoring | CONFIGURED_ONLY | Log Analytics/Application Insights resources |
| Migrations | NOT_RUN | No staging database |
| Auth0 live proof | PENDING | No authorized test tenant configured |
| Failure isolation | NOT_RUN | Requires deployed staging |

## Images and secrets

The repository has no frontend Docker build context, so the frontend app is
optional in Terraform. SHS API and Agent Fabric image references are required
inputs and must be immutable staging tags; placeholder images must not be
deployed. Key Vault secret names are represented, but no secret values were
created, printed, or committed.

## Resource disposition and next gate

No staging resources exist from this run, so no teardown was performed and no
retention decision was needed. Once an authorized subscription, private state
bootstrap, Key Vault bootstrap, runnable image tags, and staging target are
provided, run a reviewed staging-only plan followed by apply of that reviewed
plan. Then prove actual ingress, private service reachability, PostgreSQL
isolation, managed-identity secret/ACR access, health, logs, worker
supervision, and Auth0 test configuration.

## Authorized staging bootstrap attempt (2026-08-26)

Classification: `AZURE_STAGING_CONTEXT_UNAVAILABLE`. The required Azure CLI
check could not run because `az` is not installed on the authorized local
machine. Therefore no signed-in account, tenant, subscription, subscription
state, or staging authorization could be verified. Provider registration,
remote-state bootstrap, backend reconfiguration, Terraform plan, and apply
were not attempted. No Azure resources or state were modified.

The secure bootstrap remains configuration-ready and both Terraform stacks
remain statically validated. The next attempt requires the approved Azure CLI
toolchain, an explicitly authorized non-production subscription, staging-only
resource names, Key Vault bootstrap inputs, and immutable staging image
references. Application deployment remains out of scope until a reviewed plan
and separate apply authorization exist.

## Azure CLI setup attempt (2026-08-26)

Azure CLI was installed through Homebrew, version `2.89.1`. The standard
interactive `az login` flow was started, but no completed browser
authentication was returned during this run. The CLI therefore has no verified
tenant, subscription, or staging authorization. No provider registration,
remote-state bootstrap, backend initialization, plan, or apply was performed.
