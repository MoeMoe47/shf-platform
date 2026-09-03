import { createHash } from "node:crypto";

export const AGENT_PACKAGE_STANDARD_VERSION = "agent-standard-v1";
export const AGENT_PACKAGE_SCHEMA_VERSION = "studio-agent-package-v1";
export const AGENT_PACKAGE_STATUSES = ["VALID", "INVALID"] as const;
export type AgentPackageStatus = typeof AGENT_PACKAGE_STATUSES[number];
export type AgentPackageReadiness = "NOT_READY" | "READY_FOR_REGISTRY";

export interface AgentPackageTool { id: string; description: string; }
export interface AgentPackageDefinition {
  identity: { name: string };
  purpose: { instructions: string };
  capabilities: readonly string[];
  tools: readonly AgentPackageTool[];
  permissions: readonly string[];
  safety: {
    execution: "NOT_AUTHORIZED";
    prohibitedActions: readonly string[];
    humanApprovalRequired: true;
  };
  provider: { kind: "PROVIDER_NEUTRAL" };
}

export interface AgentPackageProvenance {
  projectId: string;
  deliveryRecordId: string;
  workspaceRevision: number;
  projectType: "AI_AGENT";
  learnerId: string;
  organizationId: string;
  tenantId: string;
  finalizedAt: string;
}

export interface AgentPackageValidation {
  status: AgentPackageStatus;
  standardVersion: string;
  errors: readonly string[];
  warnings: readonly string[];
}

export const AGENT_PACKAGE_PROHIBITED_ACTIONS = Object.freeze([
  "execute_tools",
  "access_secrets",
  "mutate_authority",
  "submit_registry",
  "issue_credentials",
  "dispatch_clientops",
]);

const SECRET_PATTERN = /(api[_ -]?key|access[_ -]?token|secret|password|private[_ -]?key|bearer\s+[a-z0-9._-]+)/i;
const HTML_PATTERN = /<\/?(script|iframe|object|embed)\b/i;
const MAX_NAME = 200;
const MAX_INSTRUCTIONS = 50_000;
const MAX_TOOL_ID = 100;

function text(value: unknown, field: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`AGENT_PACKAGE_${field.toUpperCase()}_INVALID`);
  if (SECRET_PATTERN.test(value)) throw new Error("AGENT_PACKAGE_SECRET_CONTENT_FORBIDDEN");
  if (HTML_PATTERN.test(value)) throw new Error("AGENT_PACKAGE_UNSAFE_MARKUP_FORBIDDEN");
  return value.trim();
}

export function normalizeAgentWork(work: unknown): AgentPackageDefinition {
  if (!work || typeof work !== "object" || Array.isArray(work)) throw new Error("AGENT_PACKAGE_WORK_INVALID");
  const value = work as Record<string, unknown>;
  const name = text(value.name, "name", MAX_NAME);
  const instructions = text(value.instructions, "instructions", MAX_INSTRUCTIONS);
  if (!Array.isArray(value.tools) || value.tools.length > 20) throw new Error("AGENT_PACKAGE_TOOLS_INVALID");
  const tools = value.tools.map((tool) => {
    const id = text(tool, "tool", MAX_TOOL_ID);
    if (id.includes("/") || id.includes("\\") || id.includes("..") || id.startsWith("exec:") || id.startsWith("shell:")) throw new Error("AGENT_PACKAGE_TOOL_NOT_ALLOWED");
    return { id, description: "Declared Studio tool; runtime authorization is separate." };
  });
  return {
    identity: { name },
    purpose: { instructions },
    capabilities: [],
    tools,
    permissions: [],
    safety: { execution: "NOT_AUTHORIZED", prohibitedActions: AGENT_PACKAGE_PROHIBITED_ACTIONS, humanApprovalRequired: true },
    provider: { kind: "PROVIDER_NEUTRAL" },
  };
}

export function validateAgentPackageDefinition(definition: AgentPackageDefinition): AgentPackageValidation {
  const errors: string[] = [];
  if (definition.safety.execution !== "NOT_AUTHORIZED") errors.push("runtime_execution_not_authorized");
  if (definition.safety.humanApprovalRequired !== true) errors.push("human_approval_required");
  if (!definition.safety.prohibitedActions.includes("access_secrets")) errors.push("secret_access_must_be_prohibited");
  if (definition.provider.kind !== "PROVIDER_NEUTRAL") errors.push("provider_must_be_neutral");
  return { status: errors.length ? "INVALID" : "VALID", standardVersion: AGENT_PACKAGE_STANDARD_VERSION, errors, warnings: [] };
}

export function canonicalPackageContent(provenance: AgentPackageProvenance, definition: AgentPackageDefinition) {
  return { schemaVersion: AGENT_PACKAGE_SCHEMA_VERSION, standardVersion: AGENT_PACKAGE_STANDARD_VERSION, provenance, definition };
}

export function packageHash(content: unknown) {
  return createHash("sha256").update(JSON.stringify(content), "utf8").digest("hex");
}

export function registryReadiness(status: AgentPackageStatus): AgentPackageReadiness {
  return status === "VALID" ? "READY_FOR_REGISTRY" : "NOT_READY";
}
