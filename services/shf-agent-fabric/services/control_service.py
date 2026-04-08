import sqlite3
import uuid
from datetime import datetime

DB = "db/shf_agent_fabric.db"

def _conn():
    return sqlite3.connect(DB)

def create_hold(entity_type, entity_id, reason):
    conn = _conn()
    cur = conn.cursor()

    hold_id = str(uuid.uuid4())

    cur.execute("""
    INSERT INTO control_holds
    (hold_id, hold_type, entity_type, entity_id, reason_json, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        hold_id,
        "auto_hold",
        entity_type,
        entity_id,
        str(reason),
        "active",
        datetime.utcnow().isoformat()
    ))

    conn.commit()
    conn.close()

    return {"hold_id": hold_id, "status": "active"}


def release_hold(hold_id):
    conn = _conn()
    cur = conn.cursor()

    cur.execute("""
    UPDATE control_holds
    SET status='released', released_at=?
    WHERE hold_id=?
    """, (
        datetime.utcnow().isoformat(),
        hold_id
    ))

    conn.commit()
    conn.close()

    return {"hold_id": hold_id, "status": "released"}
