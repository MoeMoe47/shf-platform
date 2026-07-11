import { validateCommandSchema } from "./shsCommandSchemas";
import { checkCommandPermissions } from "./shsCommandPermissions";
import { checkCommandPolicies } from "./shsCommandPolicies";
import { scanCommandSafety } from "./shsCommandSafety";

export function validateCommand(command = {}) {
  const schema = validateCommandSchema(command);
  const permissions = checkCommandPermissions(command);
  const safety = scanCommandSafety(command);
  const policy = checkCommandPolicies(command);
  const valid = schema.valid && permissions.granted && safety.safe && policy.policy_status === "allowed";
  return {
    valid,
    validation_status: valid ? "valid" : "blocked",
    schema,
    permissions,
    safety,
    policy,
  };
}
