resource "azurerm_container_app_environment" "main" {
  name                           = "${local.name}-aca"
  location                       = azurerm_resource_group.main.location
  resource_group_name            = azurerm_resource_group.main.name
  infrastructure_subnet_id       = azurerm_subnet.container_apps.id
  internal_load_balancer_enabled = false
  log_analytics_workspace_id     = azurerm_log_analytics_workspace.main.id
  tags                           = local.tags
}
