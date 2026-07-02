#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

CORE_FILES = [
    "src/system/persistence/persistenceTypes.js",
    "src/system/persistence/persistenceSafety.js",
    "src/system/persistence/persistenceAdapters.js",
    "src/system/persistence/persistenceService.js",
    "src/system/persistence/repositoryFactory.js",
    "src/system/persistence/transactionHistory.js",
    "src/system/persistence/versionHistory.js",
    "src/system/persistence/migrationRegistry.js",
    "src/system/persistence/sessionSnapshots.js",
    "src/system/persistence/persistenceMetrics.js",
]

REPOSITORY_FILES = [
    "src/system/persistence/repositories/agentRepository.js",
    "src/system/persistence/repositories/orchestratorRepository.js",
    "src/system/persistence/repositories/directConnectRepository.js",
    "src/system/persistence/repositories/reportsRepository.js",
    "src/system/persistence/repositories/productionAutomationRepository.js",
]

ADMIN_FILES = [
    "src/pages/admin/persistence/ShsPersistenceCenterPage.jsx",
    "src/pages/admin/persistence/components/PersistenceOverviewPanel.jsx",
    "src/pages/admin/persistence/components/PersistenceRepositoryPanel.jsx",
    "src/pages/admin/persistence/components/PersistenceTransactionHistory.jsx",
    "src/pages/admin/persistence/components/PersistenceVersionHistory.jsx",
    "src/pages/admin/persistence/components/PersistenceSessionSnapshots.jsx",
    "src/pages/admin/persistence/components/PersistenceMigrationPanel.jsx",
    "src/pages/admin/persistence/components/PersistenceSafetyPanel.jsx",
    "src/pages/admin/persistence/shsPersistenceCenter.css",
]

DOC_FILES = [
    "docs/SHS_DURABLE_PERSISTENCE_LAYER_V1.md",
    "docs/SHS_DURABLE_PERSISTENCE_LAYER_V1.json",
]

WIRING_FILES = [
    "package.json",
    "src/router/AdminRoutes.jsx",
    "src/components/admin/AdminSidebar.jsx",
    "src/system/identity/hubAccessControl.js",
    "src/system/routes/crossAppRouteBridge.js",
]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def fail(message):
    print(f"FAIL: {message}")
    sys.exit(1)


def require_files(paths):
    missing = [path for path in paths if not (ROOT / path).exists()]
    if missing:
        fail(f"missing files: {', '.join(missing)}")


def require_token(path, token):
    if token not in read(path):
        fail(f"missing token in {path}: {token}")


def main():
    require_files(CORE_FILES + REPOSITORY_FILES + ADMIN_FILES + DOC_FILES + WIRING_FILES)

    data = json.loads(read("docs/SHS_DURABLE_PERSISTENCE_LAYER_V1.json"))
    if data.get("name") != "SHS Durable Persistence Layer V1":
        fail("docs JSON name mismatch")

    package = read("package.json")
    if '"check:shs-persistence": "python3 scripts/check_shs_persistence_layer.py"' not in package:
        fail("package script missing")

    require_token("src/system/persistence/persistenceAdapters.js", "Database adapter is not enabled in Persistence V1.")
    require_token("src/system/persistence/persistenceAdapters.js", "enabled: false")
    require_token("src/system/persistence/persistenceSafety.js", "scanPersistencePayload")
    require_token("src/system/persistence/persistenceSafety.js", "credential")
    require_token("src/system/persistence/persistenceSafety.js", "api[_-]?key")
    require_token("src/system/persistence/persistenceSafety.js", "oauth")
    require_token("src/system/persistence/persistenceSafety.js", "private[_-]?key")
    require_token("src/system/persistence/persistenceTypes.js", "SHS Durable Persistence Layer V1 stores approved local operational records only")

    transaction = read("src/system/persistence/transactionHistory.js")
    for token in ["transaction_id", "entity_type", "entity_id", "operation", "before_hash", "after_hash", "safety_result", "status"]:
        if token not in transaction:
            fail(f"transaction model token missing: {token}")

    version = read("src/system/persistence/versionHistory.js")
    for token in ["version_id", "version_number", "record_hash", "previous_hash", "Rollback"]:
        if token not in version:
            fail(f"version model token missing: {token}")

    migrations = read("src/system/persistence/migrationRegistry.js")
    for token in [
        "agents_local_v1_to_persistence_v1",
        "orchestrator_local_v1_to_persistence_v1",
        "direct_connect_local_v1_to_persistence_v1",
        "reports_local_v1_to_persistence_v1",
        "production_automation_v2_to_persistence_v1",
        "dryRunPersistenceMigration",
        "would_mutate: false",
    ]:
        if token not in migrations:
            fail(f"migration token missing: {token}")

    snapshots = read("src/system/persistence/sessionSnapshots.js")
    for token in ["createSessionSnapshot", "listSessionSnapshots", "restoreSessionSnapshot", "validateSnapshot", "compareSnapshots", "confirmRestore"]:
        if token not in snapshots:
            fail(f"session snapshot token missing: {token}")

    for path in REPOSITORY_FILES:
        source = read(path)
        for token in ["list", "getById", "save", "update", "archive", "restore", "getHistory", "createSnapshot", "validateRecord"]:
            if token not in read("src/system/persistence/repositoryFactory.js"):
                fail(f"repository factory missing operation: {token}")
        if "createPersistenceRepository" not in source:
            fail(f"repository not using factory: {path}")

    require_token("src/router/AdminRoutes.jsx", 'path="/ops/persistence"')
    require_token("src/components/admin/AdminSidebar.jsx", 'to: "/ops/persistence"')
    require_token("src/system/identity/hubAccessControl.js", '"/ops/persistence": ["shs_admin"]')
    require_token("src/system/routes/crossAppRouteBridge.js", "admin.html#/ops/persistence")

    combined = "\n".join(read(path) for path in CORE_FILES + REPOSITORY_FILES + ADMIN_FILES + DOC_FILES)
    forbidden_patterns = [
        r"public_approved_mutation_enabled:\s*true",
        r"shf_impact_data_mutation_enabled:\s*true",
        r"credential_persistence_enabled:\s*true",
        r"external_database_enabled:\s*true",
        r"external_api_enabled:\s*true",
        r"token_persistence_enabled:\s*true",
        r"postgres://",
        r"mysql://",
        r"mongodb://",
        r"snowflake",
        r"supabase",
        r"firebase",
        r"accessToken\s*:",
        r"refreshToken\s*:",
        r"privateKey\s*:",
        r"markPublicApproved\(",
        r"mutateShfImpactData\(",
        r"fetch\(",
        r"axios\.",
        r"XMLHttpRequest",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, combined, re.IGNORECASE):
            fail(f"forbidden persistence token present: {pattern}")

    print("PASS: SHS Durable Persistence Layer V1 validation OK.")


if __name__ == "__main__":
    main()
