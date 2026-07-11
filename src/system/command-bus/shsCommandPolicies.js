import { scanCommandSafety } from "./shsCommandSafety";

export function checkCommandPolicies(command = {}) {
  const safety = scanCommandSafety(command);
  const policyIssues = [];
  if (["automatic", "autonomous", "background execution"].includes(command.execution_mode)) {
    policyIssues.push("automatic and autonomous execution are blocked by Command Bus V1 policy.");
  }
  if (command.command_type === "production" || command.risk_level === "critical") {
    policyIssues.push("critical commands require governance review and remain blocked in V1 preview.");
  }
  if (command.execution_mode === "approved" && command.approval_status !== "approved") {
    policyIssues.push("approved execution mode requires explicit approval_status.");
  }
  return {
    policy_status: safety.safe && policyIssues.length === 0 ? "allowed" : "blocked",
    issues: [...safety.issues, ...policyIssues.map((reason) => ({ path: "policy", reason, severity: "critical" }))],
  };
}
