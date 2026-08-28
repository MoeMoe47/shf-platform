resource "azurerm_container_app" "agent_fabric" {
  name                         = "${local.name}-agent-fabric"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.runtime.id, azurerm_user_assigned_identity.container_pull.id]
  }
  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.container_pull.id
  }
  secret {
    name                = "internal-service-keys"
    key_vault_secret_id = data.azurerm_key_vault_secret.internal_keys.id
    identity            = azurerm_user_assigned_identity.runtime.id
  }
  secret {
    name                = "database-url"
    key_vault_secret_id = data.azurerm_key_vault_secret.database_url.id
    identity            = azurerm_user_assigned_identity.runtime.id
  }

  ingress {
    external_enabled = false
    target_port      = 8090
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
      name   = "agent-fabric"
      image  = var.agent_fabric_image
      cpu    = 1
      memory = "2Gi"
      env {
        name  = "SHS_AUTH_ENV"
        value = "production"
      }
      env {
        name  = "HOST"
        value = "0.0.0.0"
      }
      env {
        name  = "PORT"
        value = "8090"
      }
      env {
        name  = "SHF_INTERNAL_SERVICE_KEYS_REF"
        value = "keyvault://${azurerm_key_vault.main.name}/${var.internal_service_keys_secret_name}"
      }
      env {
        name        = "SHF_INTERNAL_SERVICE_KEYS_JSON"
        secret_name = "internal-service-keys"
      }
      env {
        name  = "AUTH_ALLOWED_ORIGINS"
        value = var.shs_api_origin
      }
      env {
        name        = "SHF_DATABASE_URL"
        secret_name = "database-url"
      }
    }
  }
}
