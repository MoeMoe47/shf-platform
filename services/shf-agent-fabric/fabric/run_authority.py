from __future__ import annotations

"""
AFCC-3 Phase 5 — which store is the governed run authority.

`postgres`: plans, approval decisions, execution claims and run events live in
the shared Postgres run authority (migration 149, `fabric/run_authority_pg.py`)
and single-flight holds across replicas.

`file`: the Phase 1–4 replica-local stores (development default).

Selection follows the existing Fabric convention (see Truth Spine storage):
`SHF_RUN_AUTHORITY_STORAGE=postgres|file`, and production is always
`postgres` — there is no file fallback in production. If production cannot
reach the database, run authority calls fail closed with 503.
"""

import os
from typing import Dict

from auth.config import is_production
from fabric.run_claims import EXECUTION_SAFETY as LOCAL_EXECUTION_SAFETY

POSTGRES = "postgres"
FILE = "file"

DISTRIBUTED_EXECUTION_SAFETY = {
    "level": "DISTRIBUTED",
    "claim_authority": "SHARED_POSTGRES_RUN_AUTHORITY",
    "thread_single_flight": "YES",
    "cross_process_same_store": "YES",
    "cross_replica_distributed_single_flight": "YES",
    "local_single_flight": "ACTIVE",
    "distributed_single_flight": "GUARANTEED",
    "production_blocker": "NONE",
    # AFCC-3 Phase 6: JSON run artifacts commit with the terminal event in the
    # same store (migration 150). Readiness is reported by the storage projection.
    "artifact_storage": "SHARED_POSTGRES_RUN_ARTIFACTS",
    "artifact_blocker": "NONE_FOR_JSON_RUN_ARTIFACTS",
    "summary": "DISTRIBUTED SINGLE-FLIGHT ACTIVE (SHARED TRANSACTIONAL RUN AUTHORITY); RUN ARTIFACTS DURABLE IN THE SAME STORE",
}


def storage_mode() -> str:
    configured = os.getenv("SHF_RUN_AUTHORITY_STORAGE", "").strip().lower()
    if is_production():
        return POSTGRES
    return POSTGRES if configured == POSTGRES else FILE


def is_postgres() -> bool:
    return storage_mode() == POSTGRES


def execution_safety() -> Dict[str, str]:
    """The guarantee the active run authority actually provides."""
    if is_postgres():
        return dict(DISTRIBUTED_EXECUTION_SAFETY)
    return {**LOCAL_EXECUTION_SAFETY, "artifact_storage": "REPLICA_LOCAL"}
