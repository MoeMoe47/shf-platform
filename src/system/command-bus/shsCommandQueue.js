import { getCommands, updateCommandStatus } from "./shsCommandStorage";

export function getCommandQueue(commands = getCommands()) {
  return commands.filter((command) => ["queued_preview", "dry_run_preview", "blocked"].includes(command.execution_status));
}

export function queueCommand(commandId) {
  return updateCommandStatus(commandId, {
    execution_status: "queued_preview",
    audit_status: "queued",
  }, "queued");
}
