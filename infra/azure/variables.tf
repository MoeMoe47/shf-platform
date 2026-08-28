variable "subscription_id" {
  type      = string
  sensitive = true
}
variable "location" {
  type    = string
  default = "eastus"
}
variable "environment" {
  type = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production"
  }
}
variable "name_prefix" {
  type    = string
  default = "shf-trusted-reporting"
}
variable "resource_group_name" { type = string }
variable "vnet_address_space" {
  type    = list(string)
  default = ["10.40.0.0/16"]
}
variable "container_apps_subnet_cidr" {
  type    = string
  default = "10.40.0.0/23"
}
variable "postgres_subnet_cidr" {
  type    = string
  default = "10.40.2.0/24"
}
variable "private_dns_zone_name" {
  type    = string
  default = "postgres.database.azure.com"
}
variable "log_analytics_retention_days" {
  type    = number
  default = 30
}
variable "shs_api_image" { type = string }
variable "agent_fabric_image" { type = string }
variable "frontend_image" {
  type    = string
  default = ""
}
variable "acr_sku" {
  type    = string
  default = "Standard"
}
variable "shs_api_origin" { type = string }
variable "frontend_origin" { type = string }
variable "auth0_issuer" { type = string }
variable "auth0_audience" { type = string }
variable "postgres_admin_login" {
  type    = string
  default = "shs_admin"
}
variable "postgres_admin_password_secret_name" {
  type    = string
  default = "postgres-admin-password"
}
variable "database_url_secret_name" {
  type    = string
  default = "shs-database-url"
}
variable "session_secret_name" {
  type    = string
  default = "shs-session-secret"
}
variable "internal_service_keys_secret_name" {
  type    = string
  default = "shs-internal-service-keys"
}
variable "auth0_client_secret_name" {
  type    = string
  default = "auth0-client-secret"
}
variable "postgres_sku_name" {
  type    = string
  default = "B_Standard_B1ms"
}
variable "postgres_storage_mb" {
  type    = number
  default = 32768
}
