export type McpCredentialContext = {
  serverId: string;
  organizationId: string;
  tenantId: string;
};

export type ResolvedMcpCredential = {
  headers: Record<string, string>;
};

export type McpCredentialResolver = {
  resolve: (reference: string | null | undefined, context: McpCredentialContext) => Promise<ResolvedMcpCredential>;
};

function envKey(reference: string) {
  const normalized = reference.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  return `SHS_MCP_CREDENTIAL_${normalized}`;
}

/**
 * Resolves only secret references injected through the process secret boundary.
 * The value is never returned from an API and is never included in event data.
 */
export class EnvironmentMcpCredentialResolver implements McpCredentialResolver {
  async resolve(reference: string | null | undefined, _context: McpCredentialContext) {
    if (!reference) return { headers: {} };
    const value = process.env[envKey(reference)];
    if (!value) throw new Error("MCP_CREDENTIAL_UNAVAILABLE");
    return { headers: { Authorization: `Bearer ${value}` } };
  }
}

export class UnavailableMcpCredentialResolver implements McpCredentialResolver {
  async resolve(reference: string | null | undefined) {
    if (reference) throw new Error("MCP_CREDENTIAL_UNAVAILABLE");
    return { headers: {} };
  }
}
