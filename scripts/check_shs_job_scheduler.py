#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

CORE_FILES = [
    "src/system/job-scheduler/shsJobTypes.js",
    "src/system/job-scheduler/shsJobDefinitions.js",
    "src/system/job-scheduler/shsJobScheduler.js",
    "src/system/job-scheduler/shsJobQueue.js",
    "src/system/job-scheduler/shsJobRetryPolicy.js",
    "src/system/job-scheduler/shsJobHistory.js",
    "src/system/job-scheduler/shsJobSafety.js",
    "src/system/job-scheduler/shsJobMetrics.js",
    "src/system/job-scheduler/shsJobReadiness.js",
]

ADMIN_FILES = [
    "src/pages/admin/scheduler/ShsJobSchedulerPage.jsx",
    "src/pages/admin/scheduler/shsJobScheduler.css",
]

DOC_FILES = [
    "docs/SHS_JOB_SCHEDULER_V1.md",
    "docs/SHS_JOB_SCHEDULER_V1.json",
]

WIRING_FILES = [
    "package.json",
    "src/router/AdminRoutes.jsx",
    "src/components/admin/AdminSidebar.jsx",
    "src/system/identity/hubAccessControl.js",
    "src/system/routes/crossAppRouteBridge.js",
]

SAFETY_COPY = (
    "SHS BOS Job Scheduler V1 coordinates local admin-safe job previews only. "
    "It does not run a cron server, start external workers, execute dangerous automation, "
    "mutate production data, publish reports, send webhooks or notifications, write warehouse records, "
    "modify auth, or store credentials."
)


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
    require_files(CORE_FILES + ADMIN_FILES + DOC_FILES + WIRING_FILES)

    docs_json = json.loads(read("docs/SHS_JOB_SCHEDULER_V1.json"))
    if docs_json.get("name") != "SHS BOS Job Scheduler V1":
        fail("docs JSON name mismatch")
    if docs_json.get("route") != "admin.html#/ops/scheduler":
        fail("docs JSON route mismatch")

    types = read("src/system/job-scheduler/shsJobTypes.js")
    for token in [
        SAFETY_COPY,
        "cron_server_enabled: false",
        "external_worker_enabled: false",
        "autonomous_execution_enabled: false",
        "production_mutation_enabled: false",
        "credential_storage_enabled: false",
        "createJob",
        "queued",
        "delayed",
        "paused",
        "retry_preview",
        "completed",
        "blocked",
    ]:
        if token not in types:
            fail(f"missing token in shsJobTypes.js: {token}")

    for path, tokens in {
        "src/system/job-scheduler/shsJobDefinitions.js": [
            "SHS_RECURRING_JOB_TEMPLATES",
            "daily.governance.review.preview",
            "runtime.hygiene.review.preview",
            "event.bus.replay.review.preview",
        ],
        "src/system/job-scheduler/shsJobScheduler.js": [
            "getJobSchedulerState",
            "createRecurringTemplateJob",
            "blockDangerousJob",
            "createRetryPreview",
            "delayJob",
            "pauseJob",
            "resumeJob",
            "markJobComplete",
        ],
        "src/system/job-scheduler/shsJobQueue.js": [
            "createLocalJob",
            "delayJob",
            "pauseJob",
            "resumeJob",
            "markJobComplete",
            "blockDangerousJob",
            "readCriticalStateRecords",
            "writeCriticalStateRecords",
        ],
        "src/system/job-scheduler/shsJobRetryPolicy.js": [
            "createRetryPreview",
            "preview_only: true",
            "execution_enabled: false",
        ],
        "src/system/job-scheduler/shsJobHistory.js": [
            "recordJobHistory",
            "getJobHistory",
            "local_only: true",
        ],
        "src/system/job-scheduler/shsJobSafety.js": [
            "scanJobSafety",
            "createBlockedDangerousJobPreview",
            "blocked key pattern",
            "blocked value pattern",
        ],
        "src/system/job-scheduler/shsJobMetrics.js": ["calculateJobMetrics"],
        "src/system/job-scheduler/shsJobReadiness.js": ["calculateJobReadiness"],
        "src/pages/admin/scheduler/ShsJobSchedulerPage.jsx": [
            "Create Local Job",
            "Create Recurring Job Template",
            "Delay Job",
            "Pause",
            "Resume",
            "Retry Preview",
            "Mark Complete Locally",
            "Block Dangerous Job",
            "Local Job History",
        ],
    }.items():
        source = read(path)
        for token in tokens:
            if token not in source:
                fail(f"missing token in {path}: {token}")

    require_token("src/router/AdminRoutes.jsx", 'path="/ops/scheduler"')
    require_token("src/components/admin/AdminSidebar.jsx", 'to: "/ops/scheduler"')
    require_token("src/system/identity/hubAccessControl.js", '"/ops/scheduler": ["shs_admin"]')
    require_token("src/system/routes/crossAppRouteBridge.js", "admin.html#/ops/scheduler")
    require_token("package.json", '"check:shs-job-scheduler": "python3 scripts/check_shs_job_scheduler.py"')

    combined = "\n".join(read(path) for path in CORE_FILES + ADMIN_FILES + DOC_FILES)
    forbidden_patterns = [
        r"cron_server_enabled:\s*true",
        r"external_worker_enabled:\s*true",
        r"autonomous_execution_enabled:\s*true",
        r"production_mutation_enabled:\s*true",
        r"public_approval_mutation_enabled:\s*true",
        r"shf_impact_data_mutation_enabled:\s*true",
        r"report_publish_enabled:\s*true",
        r"webhook_send_enabled:\s*true",
        r"notification_send_enabled:\s*true",
        r"warehouse_write_enabled:\s*true",
        r"auth_mutation_enabled:\s*true",
        r"credential_storage_enabled:\s*true",
        r"fetch\(",
        r"axios\.",
        r"XMLHttpRequest",
        r"new Worker",
        r"setInterval\(",
        r"setTimeout\(",
        r"sendWebhook\(",
        r"sendNotification\(",
        r"writeWarehouse",
        r"markPublicApproved\(",
        r"mutateShfImpactData\(",
        r"executeAgent\(",
        r"executeWorkflow\(",
        r"accessToken\s*:",
        r"refreshToken\s*:",
        r"privateKey\s*:",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, combined, re.IGNORECASE):
            fail(f"forbidden Scheduler token present: {pattern}")

    print("PASS: SHS BOS Job Scheduler V1 validation OK.")


if __name__ == "__main__":
    main()
