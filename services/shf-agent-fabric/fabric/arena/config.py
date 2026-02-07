from __future__ import annotations

from pathlib import Path

# config.py lives at: repo_root/fabric/arena/config.py
ROOT = Path(__file__).resolve().parents[2]
DB_DIR = ROOT / "db" / "arena"

# Files
EVENTS_JSONL = DB_DIR / "arena_events.jsonl"
AGENTS_JSON = DB_DIR / "agents.json"
ROUNDS_JSONL = DB_DIR / "rounds.jsonl"
SIGNALS_JSONL = DB_DIR / "signals.jsonl"

APP_ID = "agent_arena"  # stable app_id for events/LOO
SCHEMA_VERSION = 1


def ensure_db() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    for p in (EVENTS_JSONL, ROUNDS_JSONL, SIGNALS_JSONL):
        if not p.exists():
            p.write_text("")
    if not AGENTS_JSON.exists():
        AGENTS_JSON.write_text('{"agents": {}}')
