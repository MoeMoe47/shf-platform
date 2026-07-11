import { routeCommand } from "./shsCommandRouter";
import { validateCommand } from "./shsCommandValidator";

export function dispatchCommandPreview(command = {}) {
  const validation = validateCommand(command);
  return {
    command_id: command.command_id,
    dispatch_status: validation.valid ? "preview_ready" : "blocked",
    execution_performed: false,
    dry_run_only: command.execution_mode === "dry_run",
    preview_only: true,
    route: routeCommand(command),
    validation,
  };
}
