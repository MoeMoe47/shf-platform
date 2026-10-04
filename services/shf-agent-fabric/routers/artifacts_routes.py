from __future__ import annotations

"""
Run artifact retrieval.

AFCC-3 Phase 6: with the shared Postgres run authority active, artifacts are
read from `fabric_run_artifacts` (migration 150) on any replica and their
SHA-256 is re-verified on every read. Access needs a session with the Command
Center read grant and is scoped exactly like the run: global operators see all;
organization-scoped readers see only their verified organization and tenant.
Out-of-scope and unknown ids are indistinguishable (404).

Replica-local artifact files are served only outside production and are always
labelled as not durable: never as shared evidence.
"""

import json
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException

from auth.config import is_production
from auth.dependencies import require_permission
from auth.permissions import has_global_scope
from fabric import run_authority
from fabric.run_authority_pg import verify_artifact_row
from fabric.run_lifecycle import is_valid_id

router = APIRouter(tags=["artifacts"])

ARTIFACT_READ_PERMISSION = "bos.governance.read"


def reader_may_see(session: Any, record: Dict[str, Any]) -> bool:
    org = getattr(session, "organization_id", None)
    if not org:
        return has_global_scope(getattr(session, "role", None))
    return record.get("organization_id") == org and record.get("tenant_id") == f"tenant:{org}"


def _local_artifacts_dir():
    import routers.runs_routes as runs_routes

    return runs_routes.ARTIFACTS_DIR


@router.get("/artifacts/{artifact_id}")
def get_artifact(artifact_id: str, session=Depends(require_permission(ARTIFACT_READ_PERMISSION))):
    if not is_valid_id(artifact_id):
        raise HTTPException(status_code=404, detail="Artifact not found")

    if run_authority.is_postgres():
        from fabric import run_authority_pg

        row = run_authority_pg.get_artifact(artifact_id)
        if row is not None:
            if not reader_may_see(session, row):
                raise HTTPException(status_code=404, detail="Artifact not found")
            verification = verify_artifact_row(row)
            if verification != "VERIFIED":
                raise HTTPException(status_code=409, detail="ARTIFACT_INTEGRITY_FAILED")
            return {
                "ok": True,
                "artifactId": artifact_id,
                "artifact": json.loads(row["body_canonical"]),
                "metadata": {
                    "canonical_ref": row["canonical_ref"],
                    "run_id": row["run_id"],
                    "plan_id": row["plan_id"],
                    "artifact_type": row["artifact_type"],
                    "media_type": row["media_type"],
                    "content_hash": row["content_hash"],
                    "content_length": row["content_length"],
                    "completeness": row["completeness"],
                    "created_at": row["created_at"].isoformat(),
                    "storage": "FABRIC_RUN_ARTIFACTS",
                    "storage_state": "STORED",
                    "durable": True,
                    "verification_state": verification,
                },
            }
        if is_production():
            # Production never falls back to replica-local artifact files.
            raise HTTPException(status_code=404, detail="Artifact not found")

    # Replica-local file (development, or a legacy artifact alongside Postgres).
    if not has_global_scope(getattr(session, "role", None)) or getattr(session, "organization_id", None):
        raise HTTPException(status_code=404, detail="Artifact not found")  # local files carry no scope
    path = _local_artifacts_dir() / f"{artifact_id}.json"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Artifact not found")
    try:
        artifact = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise HTTPException(status_code=500, detail="ARTIFACT_UNREADABLE")
    return {
        "ok": True,
        "artifactId": artifact_id,
        "artifact": artifact,
        "metadata": {
            "storage": "REPLICA_LOCAL_FILE",
            "storage_state": "LEGACY_REPLICA_LOCAL" if run_authority.is_postgres() else "REPLICA_LOCAL",
            "durable": False,
            "verification_state": "NOT_VERIFIABLE",
        },
    }
