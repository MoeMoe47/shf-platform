# SHF Trusted Reporting Azure Deployment Model

## Status

Approved canonical cloud model: Azure with Terraform-managed resources. The
repository implementation is `AZURE_PRODUCTION_MODEL_CODE_COMPLETE_DEPLOYMENT_PENDING`.
No Azure resource was created and no `terraform apply` was run.

## Approved topology

- Azure Container Apps hosts the SHS API, Agent Fabric, and continuous trusted-reporting worker in one environment.
- Azure Database for PostgreSQL Flexible Server is private and VNet-integrated.
- Azure Container Registry supplies images through managed-identity `AcrPull`.
- Azure Key Vault supplies runtime secrets through a user-assigned managed identity.
- Azure Monitor foundations are Log Analytics and Application Insights.
- Auth0 remains the external human identity provider; SHS owns authorization.

The implementation is under `infra/azure/` and supports `staging` and
`production` through variables. No committed tfvars contains secret values.

## Network and ingress

The stack creates one custom VNet with delegated Container Apps and PostgreSQL
subnets plus private PostgreSQL DNS. PostgreSQL public network access is
disabled. SHS API ACA ingress is external for authenticated HTTPS edge use;
Agent Fabric ingress is internal-only; the worker has no ingress. An optional
frontend Container App is enabled only when an approved image is supplied.

The ACA settings establish application topology, not complete Azure perimeter
operations. Azure-managed ingress is the initial TLS termination boundary.
NSGs/private routing, custom domains, certificate ownership, and explicit
trusted-proxy configuration remain deployment proof requirements. No arbitrary
forwarded headers are trusted by application code.

## Secrets and identity

Key Vault references cover the complete database URL, SHS session secret,
Auth0 client secret, and Agent Fabric HMAC key material. Secret values are
bootstrapped outside Terraform and are not outputs. Managed identities provide
Key Vault and ACR access; application HMAC remains mandatory for internal
ingestion.

Production variables explicitly select Auth0, durable database access, and
exact CORS origins. Fixture identity, dev-token, JSONL governance fallback,
and legacy demo routes are excluded from production application paths.

## Health, logging, and worker

The ACA environment is connected to Log Analytics and Application Insights.
Existing liveness/readiness endpoints are probe candidates and should remain
private or sanitized. The worker is modeled as a continuously running ACA with
`min_replicas = 1` and no ingress, matching the current one-pass worker
invoked repeatedly by a supervisor. Worker recovery hardening remains a later
operational dependency.

## Validation and remaining dependencies

Terraform includes provider/version constraints, variables, VNet/private DNS,
ACR, managed identities, Key Vault references, PostgreSQL, ACA apps, monitoring,
and outputs. Local validation completed on 2026-08-26 with Terraform `v1.15.8`
and AzureRM `v4.81.0`: `terraform fmt -check -recursive`,
`terraform init -backend=false`, and `terraform validate` all passed. The
configuration-only run used no Azure subscription authentication and created no
resources. The provider lock file is committed with the resolved selection.

The validation pass corrected invalid semicolon-separated HCL blocks and the
AzureRM 4.x Key Vault argument deprecation. No architecture or application
semantics changed.

Terraform state is not configured in this stack. Before an authenticated plan,
configure an Azure Storage remote backend with separate state keys for staging
and production, encryption, restricted access, and supported state locking.
No state storage resources were created in this task.

The separate `infra/azure/bootstrap/` stack now defines that state resource
boundary without creating a backend circular dependency. Its canonical keys are
`staging/trusted-reporting.tfstate` and `production/trusted-reporting.tfstate`.
No state storage resources were created because Azure authentication was not
available. Initialize the parent stack only after the bootstrap is authorized,
using external `-backend-config` values; do not commit backend credentials.

The repository ignores Terraform state, working directories, and local tfvars;
the checked-in staging example contains placeholders only.

Before production, bootstrap secrets, publish approved images, configure the
Auth0 tenant and callbacks, configure Azure DNS/HTTPS and network policy, run
migrations, deploy/recover the worker, configure rate limits/alerts, prove
backup/restore and retention, and run a synthetic staging E2E. Hub remains
data-dependent and inactive.
