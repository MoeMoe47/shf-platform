import sqlite3
from pathlib import Path

DB = Path("services/shf-agent-fabric/data/watchtower.db")

conn = sqlite3.connect(DB)
cur = conn.cursor()

cur.execute("""
ALTER TABLE risk_snapshots
ADD COLUMN prev_hash TEXT
""")

cur.execute("""
ALTER TABLE risk_snapshots
ADD COLUMN block_hash TEXT
""")

conn.commit()
conn.close()

print("✅ Hash-chain columns added")
