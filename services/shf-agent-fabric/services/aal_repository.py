from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional


def _db_path() -> str:
    return os.environ.get(
        "SHF_AGENT_FABRIC_DB",
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "shf_agent_fabric.db"),
    )


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    return conn


def insert_aal_event(event: Dict[str, Any]) -> None:
    conn = _connect()
    try:
        conn.execute(
            """
            INSERT OR IGNORE INTO aal_event_log (
                event_id,
                event_type,
                source_system,
                source_record_id,
                entity_type,
                entity_id,
                occurred_at,
                received_at,
                payload_json,
                schema_version,
                ingest_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event["event_id"],
                event["event_type"],
                event["source_system"],
                event.get("source_record_id"),
                event.get("entity_type"),
                event.get("entity_id"),
                _to_iso(event["occurred_at"]),
                _to_iso(event["received_at"]),
                json.dumps(event["payload_json"]),
                event.get("schema_version", "1.0"),
                "accepted",
            ),
        )
        conn.commit()
    finally:
        conn.close()


def select_program_health(program_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = _connect()
    try:
        try:
            if program_id:
                rows = conn.execute(
                    """
                    SELECT *
                    FROM aal_program_health
                    WHERE program_id = ?
                    ORDER BY snapshot_date DESC
                    """,
                    (program_id,),
                ).fetchall()
            else:
                rows = conn.execute(
                    """
                    SELECT *
                    FROM aal_program_health
                    ORDER BY snapshot_date DESC, program_id
                    LIMIT 200
                    """
                ).fetchall()
            return [_row_to_dict(row) for row in rows]
        except sqlite3.OperationalError:
            return []
    finally:
        conn.close()


def select_participant_risk(participant_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = _connect()
    try:
        try:
            if participant_id:
                rows = conn.execute(
                    """
                    SELECT *
                    FROM aal_participant_risk
                    WHERE participant_id = ?
                    ORDER BY snapshot_date DESC
                    """,
                    (participant_id,),
                ).fetchall()
            else:
                rows = conn.execute(
                    """
                    SELECT *
                    FROM aal_participant_risk
                    ORDER BY snapshot_date DESC, participant_id
                    LIMIT 200
                    """
                ).fetchall()
            return [_row_to_dict(row) for row in rows]
        except sqlite3.OperationalError:
            return []
    finally:
        conn.close()


def select_signal_weights() -> List[Dict[str, Any]]:
    conn = _connect()
    try:
        rows = conn.execute(
            """
            SELECT event_type, weight, updated_at
            FROM aal_signal_weights
            ORDER BY event_type
            """
        ).fetchall()
        return [_row_to_dict(row) for row in rows]
    except sqlite3.OperationalError:
        return []
    finally:
        conn.close()


def select_anomalies(status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = _connect()
    try:
        if status:
            rows = conn.execute(
                """
                SELECT *
                FROM aal_anomaly_signals
                WHERE status = ?
                ORDER BY detected_at DESC
                """,
                (status,),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT *
                FROM aal_anomaly_signals
                ORDER BY detected_at DESC
                LIMIT 200
                """
            ).fetchall()
        return [_row_to_dict(row) for row in rows]
    except sqlite3.OperationalError:
        return []
    finally:
        conn.close()


def insert_learning_feedback(feedback: Dict[str, Any]) -> None:
    conn = _connect()
    try:
        conn.execute(
            """
            INSERT INTO aal_learning_feedback (
                feedback_id,
                entity_type,
                entity_id,
                feedback_type,
                feedback_value,
                notes_json,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                feedback["feedback_id"],
                feedback.get("entity_type"),
                feedback.get("entity_id"),
                feedback["feedback_type"],
                feedback.get("feedback_value"),
                json.dumps(feedback.get("notes_json", {})),
                _to_iso(feedback["created_at"]),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def upsert_recompute_job(job_name: str, status: str, processed_count: int) -> None:
    conn = _connect()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO aal_recompute_jobs (
                job_name,
                last_status,
                processed_count,
                updated_at
            ) VALUES (?, ?, ?, ?)
            """,
            (job_name, status, processed_count, _to_iso(datetime.utcnow())),
        )
        conn.commit()
    finally:
        conn.close()


def get_signal_weight_map() -> Dict[str, float]:
    conn = _connect()
    try:
        rows = conn.execute(
            """
            SELECT event_type, weight
            FROM aal_signal_weights
            """
        ).fetchall()
        return {row["event_type"]: float(row["weight"]) for row in rows}
    except sqlite3.OperationalError:
        return {}
    finally:
        conn.close()


def write_anomaly(
    anomaly_id: str,
    entity_type: str,
    entity_id: str,
    anomaly_type: str,
    severity: str,
    explanation_json: Dict[str, Any],
) -> None:
    conn = _connect()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO aal_anomaly_signals (
                anomaly_id,
                entity_type,
                entity_id,
                anomaly_type,
                severity,
                detected_at,
                explanation_json,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                anomaly_id,
                entity_type,
                entity_id,
                anomaly_type,
                severity,
                _to_iso(datetime.utcnow()),
                json.dumps(explanation_json),
                "open",
            ),
        )
        conn.commit()
    finally:
        conn.close()


def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {k: row[k] for k in row.keys()}


def _to_iso(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)
