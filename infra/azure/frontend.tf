# The repository has no frontend container build context. Keep the API and
# frontend origins explicit; bind a separately supplied image only when the
# approved static/frontend image exists.
resource "azurerm_container_app" "frontend" {
  count                        = var.frontend_image == "" ? 0 : 1
  name                         = "${local.name}-frontend"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.tags
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_pull.id]
  }
  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.container_pull.id
  }
  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "http"
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
  template {
    min_replicas = 1
    max_replicas = 2
    container {
      name   = "frontend"
      image  = var.frontend_image
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }
}
