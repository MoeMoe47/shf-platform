import { execFileSync } from "node:child_process";

export const TEAM_AUTHORITY_TABLES = [
  "studio_teams", "studio_team_members", "projects", "studio_builder_workspaces", "studio_qa_runs",
  "studio_review_submissions", "studio_review_decisions", "studio_review_assignments",
  "prepare_prove_evidence", "curriculum_lesson_completions", "portfolio_profiles", "portfolio_artifacts",
  "learner_credentials", "website_deployment_records", "studio_delivery_records", "studio_agent_packages",
  "agent_registry_submissions", "notifications", "integration_outbox",
];

function sql(database, statement) {
  return execFileSync("psql", [database, "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", statement], { encoding: "utf8" }).trim();
}

export function captureTeamAuthoritySnapshot(database, organizationId = "phase8_org_a") {
  const snapshot = {};
  for (const table of TEAM_AUTHORITY_TABLES) {
    const exists = sql(database, `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='${table}'`) === "1";
    if (!exists) continue;
    const scopedColumn = sql(database, `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='${table}' AND column_name IN ('organization_id','tenant_id')`);
    const scoped = Number(scopedColumn) > 0 ? ` AND organization_id='${organizationId}'` : "";
    snapshot[table] = { total: Number(sql(database, `SELECT COUNT(*) FROM ${table}`)), scoped: Number(sql(database, `SELECT COUNT(*) FROM ${table} WHERE TRUE${scoped}`)) };
  }
  return snapshot;
}

export function captureTeamRows(database, teamId) {
  return {
    teams: sql(database, `SELECT studio_team_id || ':' || organization_id || ':' || name || ':' || status FROM studio_teams WHERE studio_team_id='${teamId}'`),
    members: sql(database, `SELECT COALESCE(string_agg(studio_team_id || ':' || user_id || ':' || role || ':' || status || ':' || COALESCE(left_at::text,''), ',' ORDER BY user_id),'') FROM studio_team_members WHERE studio_team_id='${teamId}'`),
    projects: sql(database, `SELECT COALESCE(string_agg(project_id || ':' || studio_owner_type || ':' || COALESCE(studio_team_id,''), ',' ORDER BY project_id),'') FROM projects WHERE studio_team_id='${teamId}'`),
  };
}

export function captureOutbox(database, organizationId = "phase8_org_a") {
  return sql(database, `SELECT COALESCE(string_agg(event_type || ':' || COALESCE(subject_id,'') || ':' || COALESCE(idempotency_key,''), ',' ORDER BY created_at, event_type, subject_id),'') FROM integration_outbox WHERE organization_id='${organizationId}' AND (event_type LIKE 'studio.team.%' OR event_type='studio.project.created')`);
}
