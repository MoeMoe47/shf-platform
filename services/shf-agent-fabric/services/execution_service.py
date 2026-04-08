import sqlite3
import uuid
from datetime import datetime

DB = "db/shf_agent_fabric.db"

def _conn():
    return sqlite3.connect(DB)

def create_action(action_type, entity_type, entity_id, payload):

    conn = _conn()
    cur = conn.cursor()

    action_id = str(uuid.uuid4())

    cur.execute("""
    INSERT INTO execution_actions
    (action_id, action_type, entity_type, entity_id, payload_json, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        action_id,
        action_type,
        entity_type,
        entity_id,
        str(payload),
        "queued",
        datetime.utcnow().isoformat()
    ))

    conn.commit()
    conn.close()

    return {"action_id": action_id, "status": "queued"}


def execute_action(action_id):

    conn = _conn()
    cur = conn.cursor()

    cur.execute("""
    UPDATE execution_actions
    SET status='executed', executed_at=?
    WHERE action_id=?
    """, (
        datetime.utcnow().isoformat(),
        action_id
    ))

    conn.commit()
    conn.close()

    return {"action_id": action_id, "status": "executed"}
