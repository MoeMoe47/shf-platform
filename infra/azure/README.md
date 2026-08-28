# SHF Trusted Reporting Azure Deployment Model

This Terraform stack models the approved Azure topology:

- Azure Container Apps for the SHS API, internal Agent Fabric, and worker.
- Azure Database for PostgreSQL Flexible Server with delegated private subnet,
  private DNS, and public network access disabled.
- Azure Container Registry with managed-identity `AcrPull`.
- Azure Key Vault references consumed by user-assigned runtime identities.
- One VNet and one Container Apps environment with explicit ingress classes.
- Log Analytics and Application Insights wiring for stdout/stderr collection.

The stack supports `staging` and `production` through variables. Secret values,
including the complete `shs-database-url`, must be bootstrapped into Key Vault
by an approved process before dependent resources are planned/applied. No
secret values belong in committed tfvars or
Terraform outputs.

`frontend_image` is optional because this repository has no canonical frontend
container build context. The public frontend origin remains explicit in
`frontend_origin`; a future approved frontend image can enable the optional
public Container App without changing the backend boundaries.

The worker is modeled as a continuously running Container App with `min_replicas
= 1` and no ingress because the current worker is a one-pass process intended
for managed repeated invocation. A later worker recovery/supervision slice
must decide whether ACA Jobs or a supervisor is required for production
delivery guarantees.

For the parent stack, initialize staging only after the separate bootstrap
stack has created the restricted state account:

```text
terraform init -reconfigure \
  -backend-config="resource_group_name=<state-resource-group>" \
  -backend-config="storage_account_name=<state-storage-account>" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=staging/trusted-reporting.tfstate"
```

Keep these backend values in an approved CI/environment configuration, not in
Git. The checked-in `staging.tfvars.example` contains placeholders only.

Run `terraform fmt`, `terraform init -backend=false`, and `terraform validate`
after Terraform and the AzureRM provider are installed. Never run `terraform
apply` from this directory without explicit environment authorization.
