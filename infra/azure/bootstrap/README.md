# Terraform State Bootstrap

This separate stack creates only the restricted Azure Storage state resources:
resource group, private StorageV2 account, private `tfstate` container, and
least-privilege blob-data access for the authenticated deployment principal.
It must be applied before the parent `infra/azure` stack is initialized with an
AzureRM backend. The bootstrap itself needs an authorized Azure subscription
and a network path permitted to the private storage account.

Use separate storage accounts or at minimum separate state keys and access
boundaries for staging and production. The canonical keys are:

- `staging/trusted-reporting.tfstate`
- `production/trusted-reporting.tfstate`

Do not commit bootstrap tfvars or backend config containing credentials. The
parent stack is initialized with `terraform init -reconfigure` and external
`-backend-config` values for resource group, storage account, container, key,
and the approved Azure authentication method. No backend credentials belong in
the repository.
