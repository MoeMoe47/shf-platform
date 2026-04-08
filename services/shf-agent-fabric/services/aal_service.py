from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from services.aal_repository import (
    _connect,
    get_signal_weight_map,
    insert_aal_event,
    insert_learning_feedback,
    select_anomalies,
    select_participant_risk,
    select_program_health,
    select_signal_weights,
    upsert_recompute_job,
    write_anomaly,
)


def ingest_aal_event(event: Dict[str, Any]) -> Dict[str, Any]:
    event = dict(event)
    event["received_at"] = datetime.now(timezone.utc)
    insert_aal_event(event)
    auto_recompute_from_new_event()
    return {
        "event_id": event["event_id"],
        "ingest_status": "accepted",
    }


def list_program_health(program_id: Optional[str] = None) -> List[Dict[str, Any]]:
    return select_program_health(program_id=program_id)


def list_participant_risk(participant_id: Optional[str] = None) -> List[Dict[str, Any]]:
    return select_participant_risk(participant_id=participant_id)


def list_signal_weights() -> List[Dict[str, Any]]:
    return select_signal_weights()


def list_anomaly_signals(status: Optional[str] = None) -> List[Dict[str, Any]]:
    return select_anomalies(status=status)


def record_learning_feedback(
    entity_type: Optional[str],
    entity_id: Optional[str],
    feedback_type: str,
    feedback_value: Optional[float],
    notes_json: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    feedback_id = str(uuid.uuid4())
    insert_learning_feedback(
        {
            "feedback_id": feedback_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "feedback_type": feedback_type,
            "feedback_value": feedback_value,
            "notes_json": notes_json or {},
            "created_at": datetime.utcnow(),
        }
    )
    return {"feedback_id": feedback_id, "recorded": True}


def auto_recompute_from_new_event() -> Dict[str, Any]:
    programs = recompute_program_health()
    participants = recompute_participant_risk()
    return {
        "programs_processed": programs,
        "participants_processed": participants,
    }


def recompute_program_health() -> int:
    conn = _connect()
    try:
        today = date.today().isoformat()
        weight_map = get_signal_weight_map()

        rows = conn.execute(
            """
            SELECT
                COALESCE(
                    json_extract(payload_json, '$.program_id'),
                    CASE WHEN entity_type = 'program' THEN entity_id ELSE NULL END
                ) AS derived_program_id,
                event_type,
                COUNT(*) AS event_count
            FROM aal_event_log
            WHERE
                (
                    entity_type = 'program'
                    OR json_extract(payload_json, '$.program_id') IS NOT NULL
                )
            GROUP BY 1, 2
            HAVING derived_program_id IS NOT NULL
            """
        ).fetchall()

        grouped: Dict[str, Dict[str, float]] = {}
        for row in rows:
            pid = row["derived_program_id"]
            event_type = row["event_type"]
            count = int(row["event_count"] or 0)
            weight = float(weight_map.get(event_type, 1.0))
            grouped.setdefault(pid, {"weighted_total": 0.0, "outcome_count": 0.0, "raw_total": 0.0})
            grouped[pid]["weighted_total"] += count * weight
            grouped[pid]["raw_total"] += count
            if str(event_type).startswith("outcome."):
                grouped[pid]["outcome_count"] += count

        processed = 0

        for program_id, agg in grouped.items():
            raw_total = int(agg["raw_total"])
            outcome_count = int(agg["outcome_count"])
            weighted_total = float(agg["weighted_total"])

            score = 0.0
            if raw_total > 0:
                score = round(min(1.0, weighted_total / max(raw_total, 1)), 4)

            snapshot_id = f"{program_id}:{today}"

            conn.execute(
                """
                INSERT OR REPLACE INTO aal_program_health (
                    snapshot_id,
                    program_id,
                    snapshot_date,
                    enrollment_count,
                    completion_count,
                    verified_outcome_count,
                    completion_rate,
                    verified_outcome_rate,
                    cost_per_outcome,
                    program_health_score,
                    anomaly_flag
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    snapshot_id,
                    program_id,
                    today,
                    raw_total,
                    0,
                    outcome_count,
                    0.0,
                    round(outcome_count / raw_total, 4) if raw_total else 0.0,
                    None,
                    score,
                    1 if raw_total >= 10 and outcome_count == 0 else 0,
                ),
            )

            if raw_total >= 10 and outcome_count == 0:
                write_anomaly(
                    anomaly_id=f"program-no-outcomes:{program_id}:{today}",
                    entity_type="program",
                    entity_id=program_id,
                    anomaly_type="no_outcomes_high_activity",
                    severity="medium",
                    explanation_json={
                        "raw_total": raw_total,
                        "outcome_count": outcome_count,
                        "method": "phase3_weighted_recompute",
                    },
                )

            processed += 1

        conn.commit()
        upsert_recompute_job("program_health", "ok", processed)
        return processed
    finally:
        conn.close()


def recompute_participant_risk() -> int:
    conn = _connect()
    try:
        today = date.today().isoformat()
        weight_map = get_signal_weight_map()

        rows = conn.execute(
            """
            SELECT
                COALESCE(
                    json_extract(payload_json, '$.participant_id'),
                    CASE WHEN entity_type = 'participant' THEN entity_id ELSE NULL END
                ) AS derived_participant_id,
                event_type,
                COUNT(*) AS event_count
            FROM aal_event_log
            WHERE
                (
                    entity_type = 'participant'
                    OR json_extract(payload_json, '$.participant_id') IS NOT NULL
                )
            GROUP BY 1, 2
            HAVING derived_participant_id IS NOT NULL
            """
        ).fetchall()

        grouped: Dict[str, Dict[str, float]] = {}
        for row in rows:
            pid = row["derived_participant_id"]
            event_type = row["event_type"]
            count = int(row["event_count"] or 0)
            weight = float(weight_map.get(event_type, 1.0))
            grouped.setdefault(pid, {"weighted_total": 0.0, "outcome_count": 0.0, "raw_total": 0.0})
            grouped[pid]["weighted_total"] += count * weight
            grouped[pid]["raw_total"] += count
            if str(event_type).startswith("outcome."):
                grouped[pid]["outcome_count"] += count

        processed = 0

        for participant_id, agg in grouped.items():
            raw_total = int(agg["raw_total"])
            outcome_count = int(agg["outcome_count"])
            weighted_total = float(agg["weighted_total"])

            if outcome_count == 0 and raw_total <= 1:
                dropout_risk_score = 0.8
            elif outcome_count == 0:
                dropout_risk_score = 0.6
            elif weighted_total < 2.5:
                dropout_risk_score = 0.4
            else:
                dropout_risk_score = 0.15

            completion_probability = round(max(0.0, 1.0 - dropout_risk_score), 4)
            intervention_need_score = round(dropout_risk_score, 4)

            if dropout_risk_score > 0.6:
                risk_band = "high"
            elif dropout_risk_score > 0.3:
                risk_band = "medium"
            else:
                risk_band = "low"

            risk_id = f"{participant_id}:{today}"

            conn.execute(
                """
                INSERT OR REPLACE INTO aal_participant_risk (
                    risk_id,
                    participant_id,
                    snapshot_date,
                    dropout_risk_score,
                    completion_probability,
                    intervention_need_score,
                    risk_band,
                    explanation_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    risk_id,
                    participant_id,
                    today,
                    dropout_risk_score,
                    completion_probability,
                    intervention_need_score,
                    risk_band,
                    '{"source":"aal_event_log","method":"phase3_weighted_recompute"}',
                ),
            )

            if raw_total >= 5 and outcome_count == 0:
                write_anomaly(
                    anomaly_id=f"participant-stalled:{participant_id}:{today}",
                    entity_type="participant",
                    entity_id=participant_id,
                    anomaly_type="stalled_no_outcomes",
                    severity="high" if dropout_risk_score >= 0.6 else "medium",
                    explanation_json={
                        "raw_total": raw_total,
                        "outcome_count": outcome_count,
                        "weighted_total": weighted_total,
                        "method": "phase3_weighted_recompute",
                    },
                )

            processed += 1

        conn.commit()
        upsert_recompute_job("participant_risk", "ok", processed)
        return processed
    finally:
        conn.close()


def build_priority_queue():

    participants = select_participant_risk()
    programs = select_program_health()
    anomalies = select_anomalies()

    queue = []

    for p in participants:
        risk = float(p.get("dropout_risk_score",0))
        score = risk * 0.6

        queue.append({
            "entity_type":"participant",
            "entity_id":p["participant_id"],
            "priority_score":round(score,3),
            "issue":"dropout_risk",
            "recommended_action":"intervention"
        })

    for pr in programs:
        health = float(pr.get("program_health_score",0))
        score = (1-health) * 0.5

        queue.append({
            "entity_type":"program",
            "entity_id":pr["program_id"],
            "priority_score":round(score,3),
            "issue":"program_underperformance",
            "recommended_action":"review_program"
        })

    for a in anomalies:
        sev = 0.7 if a.get("severity")=="high" else 0.4

        queue.append({
            "entity_type":"anomaly",
            "entity_id":a["entity_id"],
            "priority_score":sev,
            "issue":a["anomaly_type"],
            "recommended_action":"operator_review"
        })

    queue.sort(key=lambda x: x["priority_score"], reverse=True)

    return queue[:20]

