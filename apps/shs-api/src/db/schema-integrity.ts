import type { MigrationExecutor } from "./migration-runner.js";

export type CriticalMigrationObject = {
  migrationId: string;
  table: string;
  requiredColumns: string[];
  requiredIndexes: string[];
  requiredConstraints: string[];
};

export type SchemaIntegrityFailure = {
  migrationId: string;
  table: string;
  missingTable?: boolean;
  missingColumns: string[];
  missingIndexes: string[];
  missingConstraints: string[];
};

export const CRITICAL_MIGRATION_OBJECTS: CriticalMigrationObject[] = [
  {
    migrationId: "030",
    table: "rate_limit_windows",
    requiredColumns: ["limiter_key", "window_started_at", "window_seconds", "request_count", "expires_at", "updated_at"],
    requiredIndexes: ["rate_limit_windows_expiry_idx"],
    requiredConstraints: ["rate_limit_windows_pkey"],
  },
  {
    migrationId: "032",
    table: "organization_relationships",
    requiredColumns: ["relationship_id", "source_organization_id", "target_organization_id", "relationship_type", "status", "effective_from", "effective_to", "created_by", "created_at", "updated_by", "updated_at", "metadata_version"],
    requiredIndexes: ["idx_organization_relationships_source", "idx_organization_relationships_target"],
    requiredConstraints: ["organization_relationships_pkey", "organization_relationship_known_type", "organization_relationship_known_status", "organization_relationship_effective_range", "organization_relationship_no_active_overlap"],
  },
  {
    migrationId: "032",
    table: "programs",
    requiredColumns: ["program_classification", "owner_organization_id", "operator_organization_id", "accountable_organization_id"],
    requiredIndexes: ["idx_programs_owner_organization", "idx_programs_operator_organization", "idx_programs_accountable_organization"],
    requiredConstraints: ["programs_known_classification", "programs_owner_organization_id_fkey", "programs_operator_organization_id_fkey", "programs_accountable_organization_id_fkey"],
  },
  {
    migrationId: "033",
    table: "career_families",
    requiredColumns: ["career_family_id", "slug", "name", "status", "created_at", "updated_at"],
    requiredIndexes: [],
    requiredConstraints: ["career_families_pkey", "career_families_slug_key", "career_families_status_check"],
  },
  {
    migrationId: "033",
    table: "careers",
    requiredColumns: ["career_id", "slug", "title", "description", "status", "career_family_id", "sector", "created_at", "updated_at"],
    requiredIndexes: ["careers_active_family_idx"],
    requiredConstraints: ["careers_pkey", "careers_slug_key", "careers_career_family_id_fkey", "careers_status_check"],
  },
  {
    migrationId: "033",
    table: "career_curriculum_requirements",
    requiredColumns: ["career_curriculum_requirement_id", "career_id", "curriculum_id", "lesson_id", "requirement_type", "min_grade", "max_grade", "developmental_stage", "created_at", "updated_at"],
    requiredIndexes: ["career_curriculum_requirements_lookup_idx"],
    requiredConstraints: ["career_curriculum_requirements_pkey", "career_curriculum_requirements_career_id_fkey", "career_curriculum_requirements_requirement_type_check"],
  },
  {
    migrationId: "031",
    table: "curriculum_lesson_completions",
    requiredColumns: ["completion_id", "user_id", "organization_id", "curriculum_id", "lesson_id", "completed_at", "idempotency_key", "created_at"],
    requiredIndexes: ["curriculum_lesson_completions_reporting_idx"],
    requiredConstraints: ["curriculum_lesson_completions_pkey", "curriculum_lesson_completions_organization_id_fkey", "curriculum_lesson_completions_user_id_fkey", "curriculum_lesson_completions_organization_id_idempotency_k_key", "curriculum_lesson_completions_organization_id_user_id_curri_key"],
  },
  {
    migrationId: "035",
    table: "program_specialization_assignments",
    requiredColumns: ["assignment_id", "learner_id", "organization_id", "tenant_id", "program_id", "specialization_id", "grade", "stage", "assignment_type", "status", "effective_from", "effective_to", "assigned_by_user_id", "assignment_source", "created_at", "updated_at"],
    requiredIndexes: ["program_specialization_active_primary_idx", "program_specialization_assignments_scope_idx"],
    requiredConstraints: ["program_specialization_assignments_pkey", "program_specialization_assignments_organization_id_fkey", "program_specialization_assignments_program_id_fkey", "program_specialization_assignments_learner_id_fkey"],
  },
  {
    migrationId: "036",
    table: "program_specialization_requests",
    requiredColumns: ["request_id", "learner_id", "organization_id", "tenant_id", "program_id", "requested_specialization_id", "grade", "stage", "request_type", "status", "learner_rationale", "staff_note", "requested_at", "reviewed_at", "reviewed_by_user_id", "resulting_assignment_id", "created_at", "updated_at"],
    requiredIndexes: ["program_specialization_pending_primary_request_idx", "program_specialization_requests_scope_idx"],
    requiredConstraints: ["program_specialization_requests_pkey", "program_specialization_requests_organization_id_fkey", "program_specialization_requests_program_id_fkey", "program_specialization_requests_learner_id_fkey", "program_specialization_requests_resulting_assignment_id_fkey"],
  },
  {
    migrationId: "037",
    table: "program_course_assignments",
    requiredColumns: ["assignment_id", "learner_id", "organization_id", "tenant_id", "program_id", "course_id", "grade", "stage", "specialization_id", "status", "assigned_by_user_id", "effective_at", "ended_at", "created_at", "updated_at"],
    requiredIndexes: ["program_course_active_assignment_idx", "program_course_assignment_scope_idx"],
    requiredConstraints: ["program_course_assignments_pkey", "program_course_assignments_organization_id_fkey", "program_course_assignments_program_id_fkey", "program_course_assignments_learner_id_fkey"],
  },
  {
    migrationId: "038",
    table: "projects",
    requiredColumns: ["project_id", "organization_id", "tenant_id", "program_id", "course_id", "title", "project_type", "status", "created_by_user_id", "created_at", "updated_at"],
    requiredIndexes: ["project_scope_idx"],
    requiredConstraints: ["projects_pkey", "projects_organization_id_fkey", "projects_program_id_fkey", "projects_created_by_user_id_fkey"],
  },
  {
    migrationId: "038",
    table: "project_teams",
    requiredColumns: ["team_id", "project_id", "organization_id", "tenant_id", "mode", "status", "created_at", "updated_at"],
    requiredIndexes: ["project_team_scope_idx"],
    requiredConstraints: ["project_teams_pkey", "project_teams_project_id_fkey", "project_teams_organization_id_fkey"],
  },
  {
    migrationId: "038",
    table: "project_team_members",
    requiredColumns: ["membership_id", "team_id", "learner_id", "organization_id", "tenant_id", "specialization_id", "role_id", "joined_at", "left_at"],
    requiredIndexes: [],
    requiredConstraints: ["project_team_members_pkey", "project_team_members_team_id_fkey", "project_team_members_learner_id_fkey", "project_team_members_organization_id_fkey"],
  },
  {
    migrationId: "038",
    table: "project_submissions",
    requiredColumns: ["submission_id", "project_id", "team_id", "organization_id", "tenant_id", "submitted_by_user_id", "version", "payload_json", "artifact_refs_json", "status", "submitted_at", "created_at"],
    requiredIndexes: ["project_submission_scope_idx"],
    requiredConstraints: ["project_submissions_pkey", "project_submissions_project_id_fkey", "project_submissions_team_id_fkey", "project_submissions_organization_id_fkey", "project_submissions_submitted_by_user_id_fkey"],
  },
  {
    migrationId: "041",
    table: "cohorts",
    requiredColumns: ["cohort_id", "organization_id", "tenant_id", "program_id", "name", "description", "status", "starts_at", "ends_at", "created_by_user_id", "created_at", "updated_at", "version"],
    requiredIndexes: ["cohorts_scope_idx"],
    requiredConstraints: ["cohorts_pkey", "cohorts_organization_id_fkey", "cohorts_program_same_org_fk", "cohorts_tenant_matches_org", "cohorts_valid_dates"],
  },
  {
    migrationId: "041",
    table: "enrollments",
    requiredColumns: ["enrollment_id", "organization_id", "tenant_id", "learner_user_id", "program_id", "cohort_id", "status", "enrolled_at", "starts_at", "ends_at", "created_by_user_id", "updated_by_user_id", "created_at", "updated_at", "version"],
    requiredIndexes: ["enrollments_active_program_idx", "enrollments_learner_scope_idx", "enrollments_program_scope_idx", "enrollments_cohort_scope_idx"],
    requiredConstraints: ["enrollments_pkey", "enrollments_organization_id_fkey", "enrollments_learner_same_org_fk", "enrollments_program_same_org_fk", "enrollments_cohort_same_org_fk", "enrollments_tenant_matches_org", "enrollments_valid_dates"],
  },
  {
    migrationId: "041",
    table: "cohort_staff",
    requiredColumns: ["cohort_staff_id", "organization_id", "tenant_id", "cohort_id", "user_id", "role", "status", "created_by_user_id", "created_at", "updated_at"],
    requiredIndexes: ["cohort_staff_active_role_idx"],
    requiredConstraints: ["cohort_staff_pkey", "cohort_staff_organization_id_fkey", "cohort_staff_cohort_same_org_fk", "cohort_staff_user_same_org_fk", "cohort_staff_tenant_matches_org"],
  },
  {
    migrationId: "043",
    table: "assignment_targets",
    requiredColumns: ["assignment_target_id", "assignment_id", "organization_id", "target_type", "user_id", "cohort_id", "program_id", "created_by", "created_at"],
    requiredIndexes: ["assignment_targets_unique_learner_idx", "assignment_targets_unique_cohort_idx", "assignment_targets_unique_program_idx", "assignment_targets_unique_organization_idx", "assignment_targets_entitlement_idx"],
    requiredConstraints: ["assignment_targets_pkey", "assignment_targets_assignment_same_org_fk", "assignment_targets_user_same_org_fk", "assignment_targets_cohort_same_org_fk", "assignment_targets_program_same_org_fk", "assignment_targets_target_type_check", "assignment_targets_exact_target_check"],
  },
  {
    migrationId: "044",
    table: "live_sessions",
    requiredColumns: ["live_session_id", "organization_id", "cohort_id", "audience_scope"],
    requiredIndexes: ["idx_live_sessions_audience_scope"],
    requiredConstraints: ["live_sessions_pkey", "live_sessions_organization_id_fkey", "live_sessions_cohort_same_org_fk", "live_sessions_audience_scope_check", "live_sessions_audience_scope_cohort_check"],
  },
  {
    migrationId: "046",
    table: "career_events",
    requiredColumns: ["career_event_id", "organization_id", "tenant_id", "title", "event_type", "status", "starts_at", "ends_at", "timezone", "delivery_mode", "audience_scope", "program_id", "cohort_id", "created_by_user_id", "created_at", "updated_at", "version"],
    requiredIndexes: ["career_events_scope_idx", "career_events_audience_idx"],
    requiredConstraints: ["career_events_pkey", "career_events_organization_id_fkey", "career_events_program_same_org_fk", "career_events_cohort_same_org_fk", "career_events_tenant_matches_org", "career_events_valid_dates", "career_events_audience_shape_check"],
  },
  {
    migrationId: "046",
    table: "opportunities",
    requiredColumns: ["opportunity_id", "organization_id", "tenant_id", "title", "opportunity_type", "status", "application_deadline", "audience_scope", "program_id", "cohort_id", "created_by_user_id", "created_at", "updated_at", "version"],
    requiredIndexes: ["opportunities_scope_idx", "opportunities_audience_idx"],
    requiredConstraints: ["opportunities_pkey", "opportunities_organization_id_fkey", "opportunities_program_same_org_fk", "opportunities_cohort_same_org_fk", "opportunities_tenant_matches_org", "opportunities_action_destination_check", "opportunities_audience_shape_check"],
  },
];

export async function checkCriticalSchemaIntegrity(executor: MigrationExecutor, manifest = CRITICAL_MIGRATION_OBJECTS): Promise<SchemaIntegrityFailure[]> {
  const migrationIds = Array.from(new Set(manifest.map((item) => item.migrationId)));
  const ledger = await executor.query("SELECT migration_id FROM schema_migrations WHERE migration_id = ANY($1::text[])", [migrationIds]);
  const applied = new Set(ledger.rows.map((row: any) => String(row.migration_id)));
  const relevant = manifest.filter((item) => applied.has(item.migrationId));
  if (!relevant.length) return [];

  const tables = relevant.map((item) => item.table);
  const tableRows = await executor.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1::text[])",
    [tables],
  );
  const existingTables = new Set(tableRows.rows.map((row: any) => String(row.table_name)));

  const columnRows = await executor.query(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND table_name = ANY($1::text[])",
    [tables],
  );
  const columns = new Map<string, Set<string>>();
  for (const row of columnRows.rows) {
    const table = String(row.table_name);
    if (!columns.has(table)) columns.set(table, new Set());
    columns.get(table)?.add(String(row.column_name));
  }

  const indexRows = await executor.query(
    "SELECT tablename, indexname FROM pg_indexes WHERE schemaname='public' AND tablename = ANY($1::text[])",
    [tables],
  );
  const indexes = new Map<string, Set<string>>();
  for (const row of indexRows.rows) {
    const table = String(row.tablename);
    if (!indexes.has(table)) indexes.set(table, new Set());
    indexes.get(table)?.add(String(row.indexname));
  }

  const constraintRows = await executor.query(
    "SELECT conrelid::regclass::text AS table_name, conname FROM pg_constraint WHERE conrelid::regclass::text = ANY($1::text[])",
    [tables],
  );
  const constraints = new Map<string, Set<string>>();
  for (const row of constraintRows.rows) {
    const table = String(row.table_name);
    if (!constraints.has(table)) constraints.set(table, new Set());
    constraints.get(table)?.add(String(row.conname));
  }

  return relevant.flatMap((item) => {
    const missingTable = !existingTables.has(item.table);
    const tableColumns = columns.get(item.table) || new Set();
    const tableIndexes = indexes.get(item.table) || new Set();
    const tableConstraints = constraints.get(item.table) || new Set();
    const failure: SchemaIntegrityFailure = {
      migrationId: item.migrationId,
      table: item.table,
      missingTable,
      missingColumns: item.requiredColumns.filter((column) => !tableColumns.has(column)),
      missingIndexes: item.requiredIndexes.filter((index) => !tableIndexes.has(index)),
      missingConstraints: item.requiredConstraints.filter((constraint) => !tableConstraints.has(constraint)),
    };
    return failure.missingTable || failure.missingColumns.length || failure.missingIndexes.length || failure.missingConstraints.length
      ? [failure]
      : [];
  });
}
