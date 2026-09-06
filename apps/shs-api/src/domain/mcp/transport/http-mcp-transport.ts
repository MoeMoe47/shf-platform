import { randomUUID } from "node:crypto";
import { McpTransportError, type McpReadResponse, type McpTransport } from "./mcp-transport.js";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_RESPONSE_BYTES = 1_048_576;

function assertSafeEndpoint(endpointReference: string) {
  let url: URL;
  try { url = new URL(endpointReference); } catch { throw new McpTransportError("MCP_ENDPOINT_INVALID", "MCP endpoint must be a valid URL."); }
  if (url.protocol !== "https:") throw new McpTransportError("MCP_ENDPOINT_UNSAFE", "MCP live reads require HTTPS.");
  if (url.username || url.password || /^(localhost|127\.|0\.0\.0\.0|::1$)/i.test(url.hostname) || /^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(url.hostname) || url.hostname.endsWith(".local")) {
    throw new McpTransportError("MCP_ENDPOINT_UNSAFE", "MCP endpoint is not an approved public HTTPS endpoint.");
  }
  return url;
}

async function readBounded(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new McpTransportError("MCP_RESPONSE_TOO_LARGE", "MCP response exceeds the configured size limit.");
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    total += next.value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new McpTransportError("MCP_RESPONSE_TOO_LARGE", "MCP response exceeds the configured size limit.");
    }
    chunks.push(next.value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
}

export class HttpMcpTransport implements McpTransport {
  constructor(private timeoutMs = DEFAULT_TIMEOUT_MS, private maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES, private fetchImpl: typeof fetch = fetch) {}

  async discoverTools() { return []; }
  async discoverResources() { return []; }

  async invokeReadOnly(server: any, tool: any, input: any, credential: { headers: Record<string, string> }): Promise<McpReadResponse> {
    const url = assertSafeEndpoint(String(server.endpoint_reference || ""));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: { "content-type": "application/json", accept: "application/json", ...credential.headers },
        body: JSON.stringify({ jsonrpc: "2.0", id: randomUUID(), method: "tools/call", params: { name: tool.tool_key, arguments: input || {} } }),
      });
      const text = await readBounded(response, this.maxResponseBytes);
      if (!response.ok) throw new McpTransportError("MCP_REMOTE_ERROR", `MCP server returned HTTP ${response.status}.`, response.status);
      let content: unknown = text;
      try { content = JSON.parse(text); } catch { /* Preserve non-JSON content for Input Security. */ }
      return { content, contentType: response.headers.get("content-type") || "text/plain", responseStatus: response.status, sourceIdentity: url.origin };
    } catch (error: any) {
      if (error instanceof McpTransportError) throw error;
      if (error?.name === "AbortError") throw new McpTransportError("MCP_TIMEOUT", "MCP read timed out.");
      throw new McpTransportError("MCP_TRANSPORT_FAILED", "MCP read failed safely.");
    } finally { clearTimeout(timeout); }
  }

  async readResource() { throw new McpTransportError("MCP_RESOURCE_READ_UNSUPPORTED", "Resource reads require a governed read-only descriptor."); }
}
