output "resource_group_name" {
  value = azurerm_resource_group.state.name
}

output "storage_account_name" {
  value = azurerm_storage_account.state.name
}

output "container_name" {
  value = azurerm_storage_container.state.name
}

output "staging_state_key" {
  value = "staging/trusted-reporting.tfstate"
}

output "production_state_key" {
  value = "production/trusted-reporting.tfstate"
}
