export function validateCaseAssignment(input: {
  assigned_user_id?: string | null;
  assigned_team_id?: string | null;
  reason_text?: string | null;
}) {
  if (!input.assigned_user_id && !input.assigned_team_id) {
    throw new Error("Case assignment requires assigned_user_id or assigned_team_id.");
  }
  if (!input.reason_text) {
    throw new Error("Case assignment requires reason_text.");
  }
  return true;
}
