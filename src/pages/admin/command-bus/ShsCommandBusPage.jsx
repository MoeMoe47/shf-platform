import React from "react";
import { SHS_COMMAND_PIPELINE_STEPS } from "@/system/command-bus/shsCommandTypes";
import { SHS_SAFE_SAMPLE_COMMANDS } from "@/system/command-bus/shsCommandStorage";
import {
  auditCommand,
  checkCommandApproval,
  createBlockedLocalCommand,
  createLocalCommand,
  dryRunCommand,
  getCommandBusState,
  previewCommand,
  queueCommand,
} from "@/system/command-bus/shsCommandBus";
import { validateCommand } from "@/system/command-bus/shsCommandValidator";
import CommandApprovalPanel from "./components/CommandApprovalPanel";
import CommandAuditPanel from "./components/CommandAuditPanel";
import CommandHistoryPanel from "./components/CommandHistoryPanel";
import CommandMetricsPanel from "./components/CommandMetricsPanel";
import CommandOverviewPanel from "./components/CommandOverviewPanel";
import CommandPermissionsPanel from "./components/CommandPermissionsPanel";
import CommandPolicyPanel from "./components/CommandPolicyPanel";
import CommandPreviewPanel from "./components/CommandPreviewPanel";
import CommandQueuePanel from "./components/CommandQueuePanel";
import CommandReadinessPanel from "./components/CommandReadinessPanel";
import CommandSafetyPanel from "./components/CommandSafetyPanel";
import CommandValidatorPanel from "./components/CommandValidatorPanel";
import "./shsCommandBus.css";

export default function ShsCommandBusPage() {
  const initialState = React.useMemo(() => getCommandBusState(), []);
  const [state, setState] = React.useState(initialState);
  const [selectedSample, setSelectedSample] = React.useState(SHS_SAFE_SAMPLE_COMMANDS[0].command_name);
  const [preview, setPreview] = React.useState(() => previewCommand(initialState.commands[0] || {}));
  const [validation, setValidation] = React.useState(() => validateCommand(initialState.commands[0] || {}));
  const [approval, setApproval] = React.useState(initialState.approval_preview);
  const [audit, setAudit] = React.useState(() => auditCommand(initialState.commands[0] || {}));

  function refresh() {
    setState(getCommandBusState());
  }

  function handleCreateSample() {
    const sample = SHS_SAFE_SAMPLE_COMMANDS.find((item) => item.command_name === selectedSample) || SHS_SAFE_SAMPLE_COMMANDS[0];
    const result = createLocalCommand(sample);
    setValidation(result.validation);
    setApproval(result.approval);
    setPreview(previewCommand(result.command));
    setAudit(auditCommand(result.command));
    refresh();
  }

  function handleQueue(command) {
    queueCommand(command.command_id);
    refresh();
  }

  function handlePreview(command) {
    setPreview(previewCommand(command));
    setValidation(validateCommand(command));
    setApproval(checkCommandApproval(command));
    setAudit(auditCommand(command));
  }

  function handleDryRun(command) {
    setPreview(dryRunCommand(command));
    refresh();
  }

  function handleBlockDangerousCommand() {
    const result = createBlockedLocalCommand();
    setValidation(result.validation);
    setApproval(result.approval);
    setPreview(previewCommand(result.command));
    setAudit(auditCommand(result.command));
    refresh();
  }

  return (
    <main className="shs-command-bus-page">
      <section className="command-hero">
        <div>
          <p>SHS BOS Command Bus V1</p>
          <h1>Command Bus</h1>
          <span>Internal execution-request layer for validation, approval, routing, preview, dry-run, queueing, dispatch, and audit. Event Bus is communication; Command Bus is execution requests.</span>
        </div>
        <div className="command-actions">
          <button type="button" onClick={handleCreateSample}>Create Safe Sample Command</button>
          <button type="button" onClick={handleBlockDangerousCommand}>Block Dangerous Command</button>
          <button type="button" onClick={refresh}>Refresh Command Bus</button>
        </div>
      </section>

      <section className="command-toolbar">
        <label>
          Safe sample command
          <select value={selectedSample} onChange={(event) => setSelectedSample(event.target.value)}>
            {SHS_SAFE_SAMPLE_COMMANDS.map((sample) => (
              <option key={sample.command_name} value={sample.command_name}>{sample.command_name}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="pipeline-strip">
        {SHS_COMMAND_PIPELINE_STEPS.map((step) => <span key={step}>{step}</span>)}
      </section>

      <section className="command-grid">
        <CommandOverviewPanel metrics={state.metrics} />
        <CommandReadinessPanel readiness={state.readiness} />
        <CommandQueuePanel queue={state.queue} onPreview={handlePreview} onDryRun={handleDryRun} onQueue={handleQueue} />
        <CommandHistoryPanel history={state.history} />
        <CommandApprovalPanel approval={approval} />
        <CommandPermissionsPanel />
        <CommandPolicyPanel />
        <CommandSafetyPanel safety={state.safety} onBlock={handleBlockDangerousCommand} />
        <CommandMetricsPanel metrics={state.metrics} />
        <CommandValidatorPanel validation={validation} />
        <CommandPreviewPanel preview={preview} />
        <CommandAuditPanel audit={audit} />
      </section>
    </main>
  );
}
