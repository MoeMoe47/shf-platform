import { SHS_COMMAND_REGISTRY } from "./shsCommandRegistry";
import { checkCommandApproval } from "./shsCommandApprovals";
import { getCommandQueue, queueCommand } from "./shsCommandQueue";
import { createBlockedCommandPreview } from "./shsCommandSafety";
import { calculateCommandMetrics } from "./shsCommandMetrics";
import { calculateCommandReadiness } from "./shsCommandReadiness";
import {
  SHS_SAFE_SAMPLE_COMMANDS,
  createBlockedLocalCommand,
  createLocalCommand,
  getCommandHistory,
  loadSeedCommands,
} from "./shsCommandStorage";
import { dryRunCommand, previewCommand, auditCommand } from "./shsCommandHandlers";

export function getCommandBusState() {
  const commands = loadSeedCommands();
  const safety = createBlockedCommandPreview();
  return {
    commands,
    queue: getCommandQueue(commands),
    history: getCommandHistory(),
    registry: SHS_COMMAND_REGISTRY,
    safe_samples: SHS_SAFE_SAMPLE_COMMANDS,
    safety,
    metrics: calculateCommandMetrics(commands),
    readiness: calculateCommandReadiness({ commands, safety }),
    approval_preview: checkCommandApproval(commands[0] || {}),
  };
}

export {
  auditCommand,
  checkCommandApproval,
  createBlockedLocalCommand,
  createLocalCommand,
  dryRunCommand,
  previewCommand,
  queueCommand,
};
