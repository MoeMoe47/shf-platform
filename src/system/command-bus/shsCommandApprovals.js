export function determineApprovalLevel(command = {}) {
  if (command.execution_mode === "blocked" || command.risk_level === "critical") return "Blocked";
  if (command.risk_level === "high" || command.approval_required) return "Governance Review";
  if (command.risk_level === "medium") return "Owner Review";
  return "Safe";
}

export function checkCommandApproval(command = {}) {
  const approval_level = determineApprovalLevel(command);
  return {
    approval_level,
    approval_status: approval_level === "Safe" ? "not_required" : "needs_review",
    approved_for_execution: false,
    review_required: approval_level !== "Safe",
  };
}
