import { SHS_COMMAND_TYPES } from "./shsCommandTypes";

export const SHS_COMMAND_REGISTRY = Object.freeze([
  { command_type: "system", label: "System", target_layer: "System", owner_review_required: false },
  { command_type: "workflow", label: "Workflow", target_layer: "Workflow Engine", owner_review_required: true },
  { command_type: "tracking", label: "Tracking", target_layer: "Tracking Intelligence", owner_review_required: false },
  { command_type: "persistence", label: "Persistence", target_layer: "Durable Persistence", owner_review_required: true },
  { command_type: "registry", label: "Registry", target_layer: "System Registry", owner_review_required: false },
  { command_type: "governance", label: "Governance", target_layer: "Governance", owner_review_required: true },
  { command_type: "reports", label: "Reports", target_layer: "Reports", owner_review_required: true },
  { command_type: "agent", label: "Agent", target_layer: "Agent Workbench", owner_review_required: true },
  { command_type: "client_ops", label: "ClientOps", target_layer: "Client Operations", owner_review_required: true },
  { command_type: "website_studio", label: "Website Studio", target_layer: "Website Studio", owner_review_required: true },
  { command_type: "production", label: "Production", target_layer: "Production Automation", owner_review_required: true },
  { command_type: "sales", label: "Sales", target_layer: "Sales", owner_review_required: true },
  { command_type: "direct_connect", label: "Direct Connect", target_layer: "Direct Connect", owner_review_required: true },
  { command_type: "qa", label: "QA", target_layer: "QA", owner_review_required: false },
  { command_type: "scheduler", label: "Scheduler", target_layer: "Job Scheduler", owner_review_required: false },
  { command_type: "notifications", label: "Notifications", target_layer: "Notification Fabric", owner_review_required: false },
  { command_type: "analytics", label: "Analytics", target_layer: "Analytics", owner_review_required: false },
  { command_type: "identity", label: "Identity", target_layer: "Identity", owner_review_required: true },
  { command_type: "security", label: "Security", target_layer: "Security", owner_review_required: true },
]);

export function getCommandRegistryEntry(commandType = "system") {
  return SHS_COMMAND_REGISTRY.find((entry) => entry.command_type === commandType) || SHS_COMMAND_REGISTRY[0];
}

export function listMissingCommandTypes() {
  const declared = new Set(SHS_COMMAND_REGISTRY.map((entry) => entry.command_type));
  return SHS_COMMAND_TYPES.filter((type) => !declared.has(type));
}
