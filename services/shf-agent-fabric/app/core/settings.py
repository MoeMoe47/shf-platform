from __future__ import annotations
import os

def env(key: str, default: str = "") -> str:
    v = os.getenv(key, default)
    return v if v is not None else default

# Provider: postgres | sqlite | sim
GROWTH_PROVIDER = env("GROWTH_PROVIDER", "sim").lower().strip()

# Postgres DSN (example):
# postgresql://user:pass@localhost:5432/shf_watchtower
POSTGRES_DSN = env("POSTGRES_DSN", "")

# SQLite path for local/dev append-only logs + claims
SQLITE_PATH = env("GROWTH_SQLITE_PATH", "var/growth_market.sqlite3")

# Game theory parameters
MAX_CONFIDENCE = 0.99
MIN_CONFIDENCE = 0.01

# Default stake (virtual points) if none provided
DEFAULT_STAKE = float(env("GROWTH_DEFAULT_STAKE", "10"))

# Safety knobs
ENABLE_SIM_SEED = env("GROWTH_ENABLE_SIM_SEED", "1") == "1"
