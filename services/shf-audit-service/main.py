import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg
from psycopg.rows import dict_row
from routes.exports import router as exports_router

DATABASE_URL = os.getenv("AUDIT_DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("AUDIT_DATABASE_URL not set")

app = FastAPI(title="SHF Audit Service")


app.include_router(exports_router)

# ------------------------
# Models
# ------------------------

class Actor(BaseModel):
    user_id: str
    role: str
    org_id: Optional[str] = None
    device_id: Optional[str] = None
    ip: Optional[str] = None

class Action(BaseModel):
    type: str
    severity: str
    reason: Optional[str] = None
    request_id: Optional[str] = None
    approval_chain: Optional[List[Dict]] = None

class Target(BaseModel):
    entity_type: str
    entity_id: str
    entity_version: Optional[str] = None

class Diff(BaseModel):
    before_hash: Optional[str] = None
    after_hash: Optional[str] = None
    summary: Optional[str] = None

class AuditEventIn(BaseModel):
    event_id: str
    env: str
    actor: Actor
    action: Action
    target: Target
    diff: Optional[Diff] = None

# ------------------------
# Helpers
# ------------------------

def sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

def canonical_json(obj: dict) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def get_last_chain_hash(conn) -> str:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT chain_hash FROM audit_events ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        return row["chain_hash"] if row else "GENESIS"

# ------------------------
# Startup DB Init
# ------------------------

def init_db():
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS audit_events (
                    id BIGSERIAL PRIMARY KEY,
                    event_id TEXT UNIQUE NOT NULL,
                    ts TIMESTAMPTZ NOT NULL,
                    env TEXT NOT NULL,
                    actor JSONB NOT NULL,
                    action JSONB NOT NULL,
                    target JSONB NOT NULL,
                    diff JSONB,
                    event_hash TEXT NOT NULL,
                    prev_chain_hash TEXT NOT NULL,
                    chain_hash TEXT NOT NULL
                );
            """)
        conn.commit()

init_db()

# ------------------------
# Routes
# ------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "shf-audit-service"}

@app.post("/audit/events")
def create_event(event: AuditEventIn):
    ts = datetime.now(timezone.utc)

    payload = {
        "event_id": event.event_id,
        "ts": ts.isoformat(),
        "env": event.env,
        "actor": event.actor.model_dump(),
        "action": event.action.model_dump(),
        "target": event.target.model_dump(),
        "diff": event.diff.model_dump() if event.diff else None,
    }

    event_hash = sha256(canonical_json(payload))

    with psycopg.connect(DATABASE_URL) as conn:
        prev_chain_hash = get_last_chain_hash(conn)
        chain_hash = sha256(prev_chain_hash + event_hash)

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO audit_events
                (event_id, ts, env, actor, action, target, diff,
                 event_hash, prev_chain_hash, chain_hash)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                event.event_id,
                ts,
                event.env,
                json.dumps(event.actor.model_dump()),
                json.dumps(event.action.model_dump()),
                json.dumps(event.target.model_dump()),
                json.dumps(event.diff.model_dump()) if event.diff else None,
                event_hash,
                prev_chain_hash,
                chain_hash
            ))
        conn.commit()

    return {"status": "recorded", "chain_hash": chain_hash}
