resource "azurerm_container_app" "worker" {
  name                         = "${local.name}-worker"
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

  # No ingress block: the trusted-reporting worker is worker-only.
  template {
    min_replicas = 1
    max_replicas = 1
    container {
      name    = "trusted-reporting-worker"
      image   = var.shs_api_image
      command = ["npm", "run", "worker:trusted-reporting"]
      cpu     = 0.25
      memory  = "0.5Gi"
      env {
        name  = "SHS_AUTH_ENV"
        value = "production"
      }
      env {
        name  = "SHF_AGENT_FABRIC_INTERNAL_URL"
        value = "http://${azurerm_container_app.agent_fabric.name}.internal:8090"
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
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
    }
  }
}
