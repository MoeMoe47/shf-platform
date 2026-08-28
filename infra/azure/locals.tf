locals {
  name = "${var.name_prefix}-${var.environment}"
  tags = {
    system      = "shf-trusted-reporting"
    environment = var.environment
    managed_by  = "terraform"
  }
  postgres_fqdn = "${azurerm_postgresql_flexible_server.postgres.name}.postgres.database.azure.com"
}
