"""Read-only Truth Spine fact providers.

Truth creation remains owned by SHS curriculum projection. These providers
only supply governed query input; they never mirror facts into another store.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Protocol


class TruthFactProvider(Protocol):
    def list_facts(self) -> List[Dict[str, Any]]: ...


class JsonlTruthFactProvider:
    def __init__(self, claims_path: Path, read_list):
        self.claims_path = claims_path
        self._read_list = read_list

    def list_facts(self) -> List[Dict[str, Any]]:
        return self._read_list(self.claims_path)


class ShsCurriculumTruthProvider:
    """Read durable SHS curriculum_truth_facts through PostgreSQL only."""

    def __init__(self, database_url: str | None = None):
        self.database_url = (database_url or os.getenv("SHS_DATABASE_URL") or os.getenv("DATABASE_URL") or "").strip()

    def list_facts(self) -> List[Dict[str, Any]]:
        if not self.database_url:
            raise RuntimeError("shs_truth_provider_database_url_missing")
        try:
            import psycopg2
        except ImportError as exc:
            raise RuntimeError("shs_truth_provider_postgres_driver_missing") from exc
        with psycopg2.connect(self.database_url, connect_timeout=5) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT truth_fact_id, organization_id, learner_user_id, fact_type,
                           source_type, source_record_id, evidence_id, assignment_id,
                           curriculum_release_id, release_version, course_id,
                           unit_stable_key, lesson_stable_key, definition_id,
                           evidence_rule_id, evidence_rule_version, competency_id,
                           provenance_json, occurred_at
                    FROM curriculum_truth_facts
                    ORDER BY occurred_at ASC, truth_fact_id ASC
                    """
                )
                columns = [item.name for item in cursor.description]
                return [self._to_claim(dict(zip(columns, row))) for row in cursor.fetchall()]

    @staticmethod
    def _to_claim(fact: Dict[str, Any]) -> Dict[str, Any]:
        organization_id = str(fact["organization_id"])
        source_id = str(fact["source_record_id"])
        assignment_id = fact.get("assignment_id")
        release_id = fact.get("curriculum_release_id")
        provenance = fact.get("provenance_json") or {}
        if isinstance(provenance, str):
            try:
                provenance = json.loads(provenance)
            except json.JSONDecodeError:
                provenance = {}
        occurred_at = fact.get("occurred_at")
        if hasattr(occurred_at, "isoformat"):
            occurred_at = occurred_at.isoformat()
        return {
            "claim_id": str(fact["truth_fact_id"]),
            "version": 1,
            "claim_type": "fact",
            "claim_text": str(fact["fact_type"]),
            "subject_id": str(fact["learner_user_id"]),
            "predicate": str(fact["fact_type"]),
            "tenant_id": f"tenant:{organization_id}",
            "organization_id": organization_id,
            "ownership_status": "scoped",
            "verification_status": "verified",
            "public_approved": False,
            "internal_approval_status": "pending",
            "occurred_at": occurred_at,
            "created_at": occurred_at,
            "updated_at": occurred_at,
            "evidence_ids": [str(fact["evidence_id"])] if fact.get("evidence_id") else [],
            "source_ids": [source_id],
            "lineage_id": "|".join(str(value) for value in (assignment_id, release_id, source_id) if value),
            "producer_id": "shs.curriculum",
            "producer_event_type": str(fact["source_type"]),
            "curriculum_fact_type": str(fact["fact_type"]),
            "source_type": str(fact["source_type"]),
            "source_record_id": source_id,
            "assignment_id": assignment_id,
            "curriculum_release_id": release_id,
            "release_version": fact.get("release_version"),
            "course_id": fact.get("course_id"),
            "unit_stable_key": fact.get("unit_stable_key"),
            "lesson_stable_key": fact.get("lesson_stable_key"),
            "definition_id": fact.get("definition_id"),
            "evidence_rule_id": fact.get("evidence_rule_id"),
            "evidence_rule_version": fact.get("evidence_rule_version"),
            "competency_id": fact.get("competency_id"),
            "provenance": provenance,
        }


def provider_name(environ: Dict[str, str] | None = None) -> str:
    environ = os.environ if environ is None else environ
    configured = str(environ.get("SHF_TRUTH_PROVIDER") or "").strip().lower()
    if configured:
        return configured
    if str(environ.get("SHS_AUTH_ENV") or environ.get("NODE_ENV") or "").lower() == "production":
        return "shs_postgres"
    return "jsonl"
