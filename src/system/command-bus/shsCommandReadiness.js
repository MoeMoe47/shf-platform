import { SHS_COMMAND_TYPES } from "./shsCommandTypes";
import { listMissingCommandTypes } from "./shsCommandRegistry";

export function calculateCommandReadiness({ commands = [], safety = {} } = {}) {
  const blockers = [];
  const warnings = [];
  if (SHS_COMMAND_TYPES.length !== 19) blockers.push("Command Bus must declare exactly 19 supported command types.");
  if (listMissingCommandTypes().length) blockers.push("Command registry is missing supported command types.");
  if (!safety.safe) warnings.push("Blocked command examples are present and correctly blocked.");
  if (!commands.length) warnings.push("No local command requests are currently stored.");
  return {
    ready: blockers.length === 0,
    score: blockers.length ? 70 : warnings.length ? 92 : 100,
    blockers,
    warnings,
    v2_ready_path: "V2+ execution must remain behind approval engine, command policies, audit logging, and owner review.",
  };
}
