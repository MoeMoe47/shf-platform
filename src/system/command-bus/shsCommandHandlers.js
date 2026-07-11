import { dispatchCommandPreview } from "./shsCommandDispatcher";
import { updateCommandStatus } from "./shsCommandStorage";

export function previewCommand(command = {}) {
  return dispatchCommandPreview({ ...command, execution_mode: "preview" });
}

export function dryRunCommand(command = {}) {
  const preview = dispatchCommandPreview({ ...command, execution_mode: "dry_run" });
  if (command.command_id) {
    updateCommandStatus(command.command_id, {
      execution_mode: "dry_run",
      execution_status: preview.dispatch_status === "preview_ready" ? "dry_run_preview" : "blocked",
      completion_status: "preview_only",
    }, "dry_run_preview");
  }
  return preview;
}

export function auditCommand(command = {}) {
  return {
    command_id: command.command_id,
    audit_status: "recorded",
    execution_performed: false,
    completion_status: "preview_only",
    timestamp: new Date().toISOString(),
  };
}
