export type CaseStatus =
  | "draft"
  | "open"
  | "assigned"
  | "in_review"
  | "on_hold"
  | "resolved"
  | "closed"
  | "reopened";

export type CasePriority = "low" | "medium" | "high" | "urgent";

export interface CaseRecord {
  case_id: string;
  organization_id: string;
  case_type: string;
  status: CaseStatus;
  priority: CasePriority;
  program_id?: string | null;
  assigned_user_id?: string | null;
  assigned_team_id?: string | null;
}
