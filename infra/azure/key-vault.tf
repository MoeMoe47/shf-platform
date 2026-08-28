resource "azurerm_key_vault" "main" {
  name                       = replace("${var.name_prefix}-${var.environment}", "-", "")
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = true
  soft_delete_retention_days = 90
  rbac_authorization_enabled = true
  tags                       = local.tags
}

data "azurerm_client_config" "current" {}

resource "azurerm_user_assigned_identity" "runtime" {
  name                = "${local.name}-runtime"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

resource "azurerm_role_assignment" "runtime_key_vault_reader" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.runtime.principal_id
}

# Secret values are provisioned outside this stack by the approved secret
# bootstrap process. They are referenced by URI and are never committed here.
data "azurerm_key_vault_secret" "postgres_password" {
  name         = var.postgres_admin_password_secret_name
  key_vault_id = azurerm_key_vault.main.id
}

data "azurerm_key_vault_secret" "database_url" {
  name         = var.database_url_secret_name
  key_vault_id = azurerm_key_vault.main.id
}

data "azurerm_key_vault_secret" "session" {
  name         = var.session_secret_name
  key_vault_id = azurerm_key_vault.main.id
}

data "azurerm_key_vault_secret" "internal_keys" {
  name         = var.internal_service_keys_secret_name
  key_vault_id = azurerm_key_vault.main.id
}

data "azurerm_key_vault_secret" "auth0_client" {
  name         = var.auth0_client_secret_name
  key_vault_id = azurerm_key_vault.main.id
}
