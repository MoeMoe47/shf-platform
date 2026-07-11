import { SHS_COMMAND_TYPES } from "./shsCommandTypes";

export function calculateCommandMetrics(commands = []) {
  return {
    total_commands: commands.length,
    queued_commands: commands.filter((command) => command.execution_status === "queued_preview").length,
    blocked_commands: commands.filter((command) => command.execution_status === "blocked").length,
    dry_run_commands: commands.filter((command) => command.execution_mode === "dry_run").length,
    approval_required: commands.filter((command) => command.approval_required).length,
    command_type_count: SHS_COMMAND_TYPES.length,
    by_type: SHS_COMMAND_TYPES.map((type) => ({
      command_type: type,
      count: commands.filter((command) => command.command_type === type).length,
    })),
  };
}
