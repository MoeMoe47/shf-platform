output "resource_group_name" { value = azurerm_resource_group.main.name }
output "container_registry_login_server" { value = azurerm_container_registry.main.login_server }
output "container_apps_environment_id" { value = azurerm_container_app_environment.main.id }
output "shs_api_fqdn" { value = azurerm_container_app.shs_api.ingress[0].fqdn }
output "agent_fabric_ingress_class" { value = "internal-only" }
output "worker_ingress_class" { value = "disabled" }
output "postgres_fqdn" { value = local.postgres_fqdn }
output "key_vault_id" { value = azurerm_key_vault.main.id }
