# Backend storage is created by infra/azure/bootstrap before this stack is
# initialized with -backend-config. Values stay outside the repository.
terraform {
  backend "azurerm" {}
}
