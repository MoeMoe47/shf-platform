import {
  SHS_COMMAND_EXECUTION_MODES,
  SHS_COMMAND_REQUIRED_FIELDS,
  SHS_COMMAND_RISK_LEVELS,
  SHS_COMMAND_TYPES,
} from "./shsCommandTypes";

export function validateCommandSchema(command = {}) {
  const issues = [];
  SHS_COMMAND_REQUIRED_FIELDS.forEach((field) => {
    if (!(field in command)) issues.push({ field, reason: "required field missing" });
  });
  if (!SHS_COMMAND_TYPES.includes(command.command_type)) {
    issues.push({ field: "command_type", reason: "unsupported command_type" });
  }
  if (!SHS_COMMAND_EXECUTION_MODES.includes(command.execution_mode)) {
    issues.push({ field: "execution_mode", reason: "unsupported execution_mode" });
  }
  if (["automatic", "autonomous", "background execution"].includes(command.execution_mode)) {
    issues.push({ field: "execution_mode", reason: "automatic and autonomous modes are not supported in V1" });
  }
  if (!SHS_COMMAND_RISK_LEVELS.includes(command.risk_level)) {
    issues.push({ field: "risk_level", reason: "unsupported risk_level" });
  }
  return {
    valid: issues.length === 0,
    validation_status: issues.length ? "blocked" : "valid",
    issues,
  };
}

export function describeCommandModel() {
  return SHS_COMMAND_REQUIRED_FIELDS.map((field) => ({ field, required: true }));
}
