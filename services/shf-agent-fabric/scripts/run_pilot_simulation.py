import json
import sqlite3
import uuid
from datetime import datetime, UTC

DB = "db/shf_agent_fabric.db"

def now_iso() -> str:
    return datetime.now(UTC).isoformat()

conn = sqlite3.connect(DB)
cur = conn.cursor()

participant_id = "pilot_participant_" + str(uuid.uuid4())[:8]
program_id = "program_workforce_pilot"
outcome_id = str(uuid.uuid4())
payment_id = str(uuid.uuid4())
event_id = str(uuid.uuid4())
ts = now_iso()

print("Creating participant:", participant_id)

cur.execute("""
INSERT INTO aal_event_log
(
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
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    event_id,
    "participant.created",
    "pilot_simulator",
    participant_id,
    "participant",
    participant_id,
    ts,
    ts,
    json.dumps({
        "source": "pilot_simulator",
        "participant_id": participant_id,
        "program_id": program_id
    }),
    "1.0",
    "accepted"
))

print("Submitting verified outcome")

cur.execute("""
INSERT INTO verified_outcomes
(outcome_id, participant_id, program_id, outcome_type, verification_status, verified_at, evidence_hash)
VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    outcome_id,
    participant_id,
    program_id,
    "JOB_90D",
    "verified",
    ts,
    "simulated_hash"
))

print("Releasing payment")

cur.execute("""
INSERT INTO outcome_payments
(payment_id, outcome_id, contract_id, payment_amount, payment_status, released_at)
VALUES (?, ?, ?, ?, ?, ?)
""", (
    payment_id,
    outcome_id,
    "contract_workforce_job90",
    2500.0,
    "released",
    ts
))

conn.commit()
conn.close()

print("")
print("Pilot simulation completed")
print("participant:", participant_id)
print("outcome:", outcome_id)
print("payment:", payment_id)
