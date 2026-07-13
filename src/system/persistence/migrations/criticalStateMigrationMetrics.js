import { listCriticalStateMigrations } from "./criticalStateMigrationRegistry";
import { buildAllCriticalStateMigrationPlans } from "./criticalStateMigrationPlanner";
import { listMigrationBackups, listMigrationRuns, listMigrationVerifications } from "./criticalStateMigrationStorage";

export function scoreCriticalStateMigrationDomain(plan, backupExists = false, verification = null) {
  let score = 100;
  const deductions = [];
  function subtract(points, reason) {
    score -= points;
    deductions.push({ points, reason });
  }
  if (!backupExists) subtract(40, "backup_missing");
  if (plan.safety_result?.unsafe_field_count || plan.safety_result?.safe === false) subtract(30, "safety_scan_failed");
  if (plan.record_count_blocked) subtract(25, "record_validation_failed");
  if (!plan.target_repository) subtract(25, "target_repository_missing");
  if (!plan.target_schema_version) subtract(20, "schema_version_missing");
  if (plan.record_count_duplicate) subtract(20, "duplicate_ids_detected");
  if (verification && !verification.count_match) subtract(20, "verification_count_mismatch");
  if (verification && !verification.hash_match) subtract(20, "verification_hash_mismatch");
  if (!plan.compatibility_mode) subtract(15, "compatibility_mode_missing");
  if (plan.warnings?.length) subtract(10, "warnings_remain");
  if (plan.destructive) subtract(100, "destructive_behavior_requested");
  return {
    score: Math.max(0, score),
    deductions,
    migration_ready: score >= 85 && backupExists && !plan.blockers?.length && plan.destructive === false,
  };
}

export function calculateCriticalStateMigrationMetrics() {
  const plans = buildAllCriticalStateMigrationPlans();
  const backups = listMigrationBackups();
  const runs = listMigrationRuns();
  const verifications = listMigrationVerifications();
  const domains = listCriticalStateMigrations().map((migration) => {
    const plan = plans.find((item) => item.domain === migration.domain);
    const backupExists = backups.some((backup) => backup.domain === migration.domain);
    const verification = verifications.filter((item) => item.migration_run_id && runs.some((run) => run.migration_run_id === item.migration_run_id && run.domain === migration.domain)).slice(-1)[0] || null;
    return {
      ...migration,
      plan,
      backup_exists: backupExists,
      verification,
      readiness: scoreCriticalStateMigrationDomain(plan, backupExists, verification),
    };
  });
  return {
    total_domains: domains.length,
    migrated_domains: runs.filter((run) => run.status === "verified").length,
    backup_count: backups.length,
    verification_count: verifications.length,
    domains,
    database_adapter_enabled: false,
  };
}
