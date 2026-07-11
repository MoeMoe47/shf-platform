import { getCommandRegistryEntry } from "./shsCommandRegistry";

export function routeCommand(command = {}) {
  const registry = getCommandRegistryEntry(command.command_type);
  return {
    command_id: command.command_id,
    target_layer: command.target_layer || registry.target_layer,
    route_status: "preview_route_only",
    execution_router_enabled: false,
    external_api: false,
    network_execution: false,
    production_write: false,
  };
}

export function listCommandRoutes() {
  return [
    "UI",
    "Agents",
    "Workflow Engine",
    "System Orchestrator",
    "Command Bus",
    "Approval Engine",
    "Execution Router",
    "Target Layer",
  ];
}
