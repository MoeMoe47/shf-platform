#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PRIMARY_DOMAINS = [
    "orchestrator",
    "command_bus",
    "job_scheduler",
    "notification_fabric",
    "tracking_intelligence",
    "executive_command_center",
]

CORE_FILES = [
    "src/system/persistence/migrations/criticalStateMigrationTypes.js",
    "src/system/persistence/migrations/criticalStateMigrationRegistry.js",
    "src/system/persistence/migrations/criticalStateMigrationPlanner.js",
    "src/system/persistence/migrations/criticalStateMigrationRunner.js",
    "src/system/persistence/migrations/criticalStateMigrationVerifier.js",
    "src/system/persistence/migrations/criticalStateMigrationRollback.js",
    "src/system/persistence/migrations/criticalStateMigrationSafety.js",
    "src/system/persistence/migrations/criticalStateMigrationMetrics.js",
    "src/system/persistence/migrations/criticalStateMigrationStorage.js",
    "src/system/persistence/migrations/criticalStateMigrationCompatibility.js",
]

REPOSITORY_FILES = [
    "src/system/persistence/repositories/orchestratorRepository.js",
    "src/system/persistence/repositories/commandBusRepository.js",
    "src/system/persistence/repositories/jobSchedulerRepository.js",
    "src/system/persistence/repositories/notificationRepository.js",
    "src/system/persistence/repositories/trackingRepository.js",
    "src/system/persistence/repositories/executiveCommandCenterRepository.js",
]

FEATURE_STORAGE_FILES = [
    "src/data/orchestrator/shsOrchestratorStorage.js",
    "src/system/command-bus/shsCommandStorage.js",
    "src/system/job-scheduler/shsJobQueue.js",
    "src/system/job-scheduler/shsJobHistory.js",
    "src/system/notification-fabric/shsNotificationStorage.js",
    "src/system/tracking/shsTrackingStorage.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterStorage.js",
]

UI_FILES = [
    "src/pages/admin/persistence/components/CriticalStateMigrationOverview.jsx",
    "src/pages/admin/persistence/components/CriticalStateMigrationDomainTable.jsx",
    "src/pages/admin/persistence/components/CriticalStateMigrationPlanPanel.jsx",
    "src/pages/admin/persistence/components/CriticalStateMigrationVerificationPanel.jsx",
    "src/pages/admin/persistence/components/CriticalStateMigrationBackupPanel.jsx",
    "src/pages/admin/persistence/components/CriticalStateMigrationRollbackPanel.jsx",
    "src/pages/admin/persistence/components/CriticalStateMigrationSafetyPanel.jsx",
    "src/pages/admin/persistence/components/CriticalStateMigrationCompatibilityPanel.jsx",
    "src/pages/admin/persistence/ShsPersistenceCenterPage.jsx",
]

DOC_FILES = [
    "docs/SHS_CRITICAL_STATE_PERSISTENCE_MIGRATION_V1.md",
    "docs/SHS_CRITICAL_STATE_PERSISTENCE_MIGRATION_V1.json",
    "docs/SHS_CRITICAL_STATE_PERSISTENCE_MIGRATION_V1_MANUAL_GOVERNANCE_REVIEW.md",
    "docs/SHS_CRITICAL_STATE_PERSISTENCE_MIGRATION_V1_MANUAL_GOVERNANCE_REVIEW.json",
]

ALLOWED_LOCAL_STORAGE_FILES = {
    "src/system/persistence/persistenceAdapters.js",
    "src/system/persistence/migrations/criticalStateMigrationCompatibility.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterStorage.js",
}


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def require_files(paths: list[str]) -> None:
    missing = [path for path in paths if not (ROOT / path).exists()]
    if missing:
        fail(f"missing files: {', '.join(missing)}")


def require_token(path: str, token: str) -> None:
    if token not in read(path):
        fail(f"missing token in {path}: {token}")


def load_doc_json() -> dict:
    try:
        return json.loads(read("docs/SHS_CRITICAL_STATE_PERSISTENCE_MIGRATION_V1.json"))
    except json.JSONDecodeError as exc:
        fail(f"invalid migration JSON: {exc}")


def validate_core() -> None:
    require_files(CORE_FILES + REPOSITORY_FILES + UI_FILES + DOC_FILES + ["tests/test_shs_critical_state_persistence_migration.py"])
    registry = read("src/system/persistence/migrations/criticalStateMigrationRegistry.js")
    for domain in PRIMARY_DOMAINS:
        if f'domain: "{domain}"' not in registry:
            fail(f"primary domain not registered: {domain}")
    for token in [
        "repository_primary_with_fallback",
        "legacy_primary",
        "repository_shadow",
        "repository_only_ready",
        "backup_required",
        "rollback_supported",
        "target_repository",
    ]:
        require_token("src/system/persistence/migrations/criticalStateMigrationTypes.js", token)
    for token in ["dry_run: input.dry_run !== false", "destructive: false", "backup_required: true"]:
        require_token("src/system/persistence/migrations/criticalStateMigrationTypes.js", token)
    for token in ["confirmMigration !== true", "createCriticalStateMigrationBackup", "verifyCriticalStateMigration"]:
        require_token("src/system/persistence/migrations/criticalStateMigrationRunner.js", token)
    for token in ["confirmRollback !== true", "preserveLegacyCriticalState", "repository history preserved"]:
        require_token("src/system/persistence/migrations/criticalStateMigrationRollback.js", token)
    for token in ["count_match", "id_set_match", "hash_match", "schema_match", "unsafe_field_count"]:
        require_token("src/system/persistence/migrations/criticalStateMigrationVerifier.js", token)
    for token in ["saveMigrationRun", "saveMigrationBackup", "saveMigrationVerification", "append_only"]:
        require_token("src/system/persistence/migrations/criticalStateMigrationStorage.js", token)


def validate_repositories() -> None:
    for path in REPOSITORY_FILES:
        for token in ["createCriticalStateRepository", "idField", "repository"]:
            require_token(path, token)
    factory = read("src/system/persistence/repositories/criticalStateRepositoryFactory.js")
    for token in ["list", "getById", "saveMany", "update", "archive", "restore", "getHistory", "createSnapshot", "validateRecord", "getSchemaVersion", "exportSafeBackup", "importValidatedBackup", "count", "computeRecordHash"]:
        if token not in factory:
            fail(f"repository factory missing method token: {token}")


def validate_feature_storage() -> None:
    for path in FEATURE_STORAGE_FILES:
        text = read(path)
        if "readCriticalStateRecords" not in text or "writeCriticalStateRecords" not in text:
            fail(f"feature storage not routed through critical-state compatibility facade: {path}")
    offenders = []
    for path in FEATURE_STORAGE_FILES:
        text = read(path)
        if "localStorage" in text and path not in ALLOWED_LOCAL_STORAGE_FILES:
            offenders.append(path)
    if offenders:
        fail(f"uncontrolled localStorage remains in critical feature storage: {', '.join(offenders)}")


def validate_safety() -> None:
    safety = read("src/system/persistence/migrations/criticalStateMigrationSafety.js")
    for token in ["password", "api[_-]?key", "access[_-]?token", "refresh[_-]?token", "oauth", "private[_-]?key", "seed[_-]?phrase", "public[_ -]?approved[_ -]?mutation", "shf[_ -]?impact[_ -]?mutation", "shell[_ -]?command", "python[_ -]?execution", "webhook[_ -]?delivery"]:
        if token not in safety:
            fail(f"safety scanner missing unsafe token: {token}")
    searchable = "\n".join(read(path) for path in CORE_FILES + REPOSITORY_FILES + FEATURE_STORAGE_FILES + UI_FILES)
    banned_patterns = [
        r"public_approved_mutation_enabled:\s*true",
        r"shf_impact_data_mutation_enabled:\s*true",
        r"external_api_enabled:\s*true",
        r"credential_persistence_enabled:\s*true",
        r"report_publish_enabled:\s*true",
        r"warehouse_write_enabled:\s*true",
        r"auth_mutation_enabled:\s*true",
        r"shell_execution_enabled:\s*true",
        r"python_execution_enabled:\s*true",
        r"fetch\(",
        r"axios\.",
        r"new WebSocket",
        r"sendEmail\(",
        r"sendSms\(",
    ]
    for pattern in banned_patterns:
        if re.search(pattern, searchable):
            fail(f"banned migration behavior found: {pattern}")


def validate_docs() -> None:
    doc = load_doc_json()
    if doc.get("name") != "SHS Critical-State Persistence Migration V1":
        fail("migration JSON name mismatch")
    if doc.get("v1_complete") is not True:
        fail("migration JSON v1_complete must be true")
    if doc.get("dangerous_flags", {}).get("enabled_count") != 0:
        fail("dangerous enabled flag count must be 0")
    domains = [item.get("domain") for item in doc.get("migration_domains", [])]
    for domain in PRIMARY_DOMAINS:
        if domain not in domains:
            fail(f"domain missing from docs JSON: {domain}")
    if len(doc.get("legacy_storage_inventory", [])) < 10:
        fail("legacy storage inventory must include the critical keys")
    manual = json.loads(read("docs/SHS_CRITICAL_STATE_PERSISTENCE_MIGRATION_V1_MANUAL_GOVERNANCE_REVIEW.json"))
    if manual.get("manual_review_complete") is not True:
        fail("manual governance review must be complete")
    if manual.get("blockers"):
        fail("manual governance review has blockers")


def validate_package_and_precommit() -> None:
    package = json.loads(read("package.json"))
    if "check:shs-critical-state-migration" not in package.get("scripts", {}):
        fail("missing package script check:shs-critical-state-migration")
    precommit = read(".pre-commit-config.yaml")
    ledger = read("tools/precommit/check_ledger_precommit.py")
    if "shf-ledger-verify" not in precommit or "shf-registry-guard" not in precommit:
        fail("pre-commit reliability hooks missing")
    if "SHRV1 ledger verification (direct, no server restart)" not in ledger:
        fail("pre-commit ledger direct/no-restart repair not intact")


def main() -> int:
    validate_core()
    validate_repositories()
    validate_feature_storage()
    validate_safety()
    validate_docs()
    validate_package_and_precommit()
    doc = load_doc_json()
    warning_count = len(doc.get("remaining_risks", []))
    print(
        "PASS: SHS Critical-State Persistence Migration V1 validation OK. "
        f"domains=6 deferred={len(doc.get('deferred_domains', []))} "
        f"legacy_keys={len(doc.get('legacy_storage_inventory', []))} "
        f"warnings={warning_count} dangerous_flags=0 database_adapter=disabled"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
