resource "azurerm_postgresql_flexible_server" "postgres" {
  name                          = "${local.name}-postgres"
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = "16"
  delegated_subnet_id           = azurerm_subnet.postgres.id
  private_dns_zone_id           = azurerm_private_dns_zone.postgres.id
  public_network_access_enabled = false
  administrator_login           = var.postgres_admin_login
  administrator_password        = data.azurerm_key_vault_secret.postgres_password.value
  sku_name                      = var.postgres_sku_name
  storage_mb                    = var.postgres_storage_mb
  backup_retention_days         = 7
  geo_redundant_backup_enabled  = var.environment == "production"
  tags                          = local.tags
}

resource "azurerm_postgresql_flexible_server_database" "shs" {
  name      = "shs"
  server_id = azurerm_postgresql_flexible_server.postgres.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}
