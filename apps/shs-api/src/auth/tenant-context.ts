const TENANT_PREFIX = "tenant:";

export function tenantIdForOrganization(organizationId: string) {
  const normalized = String(organizationId || "").trim();
  if (!normalized) throw new Error("organization_id_required_for_tenant");
  return `${TENANT_PREFIX}${normalized}`;
}

export function resolveTenantForOrganization(organizationId: string, tenantId?: string | null) {
  const normalizedTenant = String(tenantId || "").trim();
  const derivedTenant = tenantIdForOrganization(organizationId);
  if (normalizedTenant && normalizedTenant !== derivedTenant) {
    throw new Error("tenant_organization_mismatch");
  }
  return derivedTenant;
}

export function tenantMatchesOrganization(tenantId: string | undefined | null, organizationId: string) {
  const normalizedTenant = String(tenantId || "").trim();
  if (!normalizedTenant) return false;
  return normalizedTenant === tenantIdForOrganization(organizationId);
}
