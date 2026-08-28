resource "azurerm_container_app" "shs_api" {
  name                         = "${local.name}-api"
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
    name                = "postgres-password"
    key_vault_secret_id = data.azurerm_key_vault_secret.postgres_password.id
    identity            = azurerm_user_assigned_identity.runtime.id
  }
  secret {
    name                = "database-url"
    key_vault_secret_id = data.azurerm_key_vault_secret.database_url.id
    identity            = azurerm_user_assigned_identity.runtime.id
  }
  secret {
    name                = "session-secret"
    key_vault_secret_id = data.azurerm_key_vault_secret.session.id
    identity            = azurerm_user_assigned_identity.runtime.id
  }
  secret {
    name                = "internal-service-keys"
    key_vault_secret_id = data.azurerm_key_vault_secret.internal_keys.id
    identity            = azurerm_user_assigned_identity.runtime.id
  }

  ingress {
    external_enabled = true
    target_port      = 8091
    transport        = "auto"
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1
    max_replicas = 3
    container {
      name   = "shs-api"
      image  = var.shs_api_image
      cpu    = 0.5
      memory = "1Gi"
      env {
        name  = "SHS_AUTH_ENV"
        value = "production"
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "AUTH_ALLOWED_ORIGINS"
        value = "${var.frontend_origin},${var.shs_api_origin}"
      }
      env {
        name  = "AUTH0_ISSUER"
        value = var.auth0_issuer
      }
      env {
        name  = "AUTH0_AUDIENCE"
        value = var.auth0_audience
      }
      env {
        name  = "SHS_IDENTITY_PROVIDER"
        value = "auth0"
      }
      env {
        name  = "SHS_IDENTITY_PROVIDER_AUDIENCE"
        value = var.auth0_audience
      }
      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
      env {
        name        = "SHS_SESSION_SECRET_REF"
        secret_name = "session-secret"
      }
      env {
        name  = "SHF_INTERNAL_SERVICE_KEYS_REF"
        value = "keyvault://${azurerm_key_vault.main.name}/${var.internal_service_keys_secret_name}"
      }
      env {
        name        = "SHF_INTERNAL_SERVICE_KEYS_JSON"
        secret_name = "internal-service-keys"
      }
    }
  }
}
