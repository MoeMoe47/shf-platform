from pathlib import Path
import sqlite3

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "watchtower.db"

DB_PATH.parent.mkdir(parents=True, exist_ok=True)

with sqlite3.connect(DB_PATH) as conn:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS risk_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            program_id TEXT NOT NULL,
            risk_band TEXT NOT NULL,
            quarantined INTEGER NOT NULL,
            action TEXT NOT NULL,
            decision_hash TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_utc TEXT NOT NULL
        );
        """
    )
    conn.commit()

print("✅ risk_snapshots table ensured at", DB_PATH)
