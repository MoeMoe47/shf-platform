export type ProgramStatus = "draft" | "active" | "paused" | "closed" | "archived";

export interface Program {
  program_id: string;
  organization_id: string;
  name: string;
  program_type: string;
  status: ProgramStatus;
  owner_team_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
