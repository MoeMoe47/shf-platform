import { createCommand } from "./shsCommandTypes";
import { getCommandRegistryEntry } from "./shsCommandRegistry";
import { validateCommand } from "./shsCommandValidator";
import { checkCommandApproval } from "./shsCommandApprovals";

const COMMAND_STORAGE_KEY = "shs_bos_command_bus_v1_commands";
const COMMAND_HISTORY_KEY = "shs_bos_command_bus_v1_history";

export const SHS_SAFE_SAMPLE_COMMANDS = Object.freeze([
  { command_type: "reports", command_name: "Generate Report Preview", target_layer: "Reports", risk_level: "medium", payload: { preview_only: true } },
  { command_type: "governance", command_name: "Run Governance Validation", target_layer: "Governance", risk_level: "low", payload: { validation_only: true } },
  { command_type: "registry", command_name: "Refresh Registry Scan", target_layer: "System Registry", risk_level: "low", payload: { scan_only: true } },
  { command_type: "workflow", command_name: "Preview Workflow", target_layer: "Workflow Engine", risk_level: "medium", payload: { preview_only: true } },
  { command_type: "system", command_name: "Recalculate Readiness", target_layer: "Readiness", risk_level: "low", payload: { local_calculation: true } },
  { command_type: "tracking", command_name: "Refresh Tracking Metrics", target_layer: "Tracking Intelligence", risk_level: "low", payload: { metrics_only: true } },
  { command_type: "persistence", command_name: "Dry-run Persistence Snapshot", target_layer: "Durable Persistence", risk_level: "medium", payload: { dry_run_snapshot: true } },
  { command_type: "notifications", command_name: "Queue Notification Preview", target_layer: "Notification Fabric", risk_level: "low", payload: { local_queue_preview: true } },
  { command_type: "security", command_name: "Validate Route Access", target_layer: "Route Guard", risk_level: "low", payload: { validation_only: true } },
]);

function readJson(key) {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeJson(key, items) {
  if (typeof localStorage === "undefined") return items;
  localStorage.setItem(key, JSON.stringify(items));
  return items;
}

export function getCommands() {
  return readJson(COMMAND_STORAGE_KEY);
}

export function getCommandHistory() {
  return readJson(COMMAND_HISTORY_KEY);
}

export function recordCommandHistory(command, action = "audit") {
  const entry = {
    history_id: `command_history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    command_id: command.command_id,
    command_name: command.command_name,
    action,
    execution_status: command.execution_status,
    audit_status: "recorded",
    timestamp: new Date().toISOString(),
    local_only: true,
  };
  return writeJson(COMMAND_HISTORY_KEY, [entry, ...getCommandHistory()].slice(0, 120));
}

export function createLocalCommand(input = {}) {
  const registry = getCommandRegistryEntry(input.command_type || "system");
  const draft = createCommand({
    command_type: registry.command_type,
    command_name: input.command_name || `${registry.label} Command Preview`,
    target_layer: input.target_layer || registry.target_layer,
    risk_level: input.risk_level || (registry.owner_review_required ? "medium" : "low"),
    approval_required: input.approval_required ?? registry.owner_review_required,
    execution_mode: input.execution_mode || "preview",
    payload: input.payload || { local_preview: true, execution_requested: false },
    notes: input.notes || "Local Command Bus request created.",
  });
  const validation = validateCommand(draft);
  const approval = checkCommandApproval(draft);
  const command = {
    ...draft,
    validation_status: validation.validation_status,
    approval_status: validation.valid ? approval.approval_status : "blocked",
    execution_status: validation.valid ? "queued_preview" : "blocked",
    completion_status: "preview_only",
  };
  const commands = writeJson(COMMAND_STORAGE_KEY, [command, ...getCommands()].slice(0, 100));
  recordCommandHistory(command, validation.valid ? "received" : "blocked");
  return { command, commands, validation, approval };
}

export function loadSeedCommands() {
  const existing = getCommands();
  if (existing.length) return existing;
  return createLocalCommand(SHS_SAFE_SAMPLE_COMMANDS[0]).commands;
}

export function updateCommandStatus(commandId, updates = {}, action = "updated") {
  let changed;
  const commands = getCommands().map((item) => {
    if (item.command_id !== commandId) return item;
    changed = { ...item, ...updates };
    return changed;
  });
  writeJson(COMMAND_STORAGE_KEY, commands);
  if (changed) recordCommandHistory(changed, action);
  return commands;
}

export function createBlockedLocalCommand() {
  return createLocalCommand({
    command_type: "production",
    command_name: "Delete Database",
    target_layer: "Production",
    risk_level: "critical",
    execution_mode: "blocked",
    payload: { shell_request: "execute shell", python_request: "run python", payment_processing: true },
  });
}
