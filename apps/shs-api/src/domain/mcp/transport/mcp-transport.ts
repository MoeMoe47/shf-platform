export class McpTransportError extends Error {
  constructor(public code: string, message = code, public statusCode = 502) { super(message); }
}

export type McpReadResponse = {
  content: unknown;
  contentType: string;
  responseStatus: number;
  sourceIdentity: string;
};

export type McpTransport = {
  discoverTools: (server: any) => Promise<any[]>;
  discoverResources: (server: any) => Promise<any[]>;
  invokeReadOnly?: (server: any, tool: any, input: any, credential: { headers: Record<string, string> }) => Promise<McpReadResponse>;
};

export class UnavailableMcpTransport implements McpTransport {
  async discoverTools() { return []; }
  async discoverResources() { return []; }
  async invokeReadOnly(_server: any, _tool: any, _input: any, _credential: { headers: Record<string, string> }): Promise<McpReadResponse> { throw new McpTransportError("MCP_LIVE_TRANSPORT_UNAVAILABLE", "MCP live transport is unavailable."); }
}
