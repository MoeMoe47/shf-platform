from __future__ import annotations
from typing import Any, Dict, List, Optional
import os, random, time

from app.core import settings
from app.db import sqlite_growth
from app.core.growth_game import market_summary, settle, clamp

def _sid() -> str:
    return f"c{int(time.time())}_{random.randint(1000,9999)}"

class BaseProvider:
    def dashboard(self) -> Dict[str, Any]: raise NotImplementedError
    def list_claims(self) -> List[Dict[str, Any]]: raise NotImplementedError
    def ensure_seed(self) -> None: pass
    def add_position(self, claim_id: str, actor_id: str, side: str, confidence: float, stake: float) -> Dict[str, Any]: raise NotImplementedError
    def resolve(self, claim_id: str, outcome: int, note: str) -> Dict[str, Any]: raise NotImplementedError
    def add_journal(self, actor_id: str, kind: str, claim_id: Optional[str], entry: Dict[str, Any]) -> Dict[str, Any]: raise NotImplementedError

class SQLiteProvider(BaseProvider):
    def __init__(self) -> None:
        self.path = settings.SQLITE_PATH

    def ensure_seed(self) -> None:
        if not settings.ENABLE_SIM_SEED:
            return
        # seed a few claims if DB is empty
        claims = sqlite_growth.list_claims(self.path)
        if claims:
            return
        sqlite_growth.upsert_claim(self.path, claim_id="g1", title="New partner school onboarded this month", thesis="Signals show a new district partner is ready to sign an MOU.", tags=["partner","pipeline"])
        sqlite_growth.upsert_claim(self.path, claim_id="g2", title="Arcade retention will increase with Tower integration", thesis="Tower + market incentives increases weekly return rate.", tags=["arcade","retention","product"])
        sqlite_growth.upsert_claim(self.path, claim_id="g3", title="Funding momentum improving in Q2", thesis="Grant pipeline indicates higher close probability next quarter.", tags=["funding","grants"])

    def dashboard(self) -> Dict[str, Any]:
        self.ensure_seed()
        return sqlite_growth.dashboard(self.path)

    def list_claims(self) -> List[Dict[str, Any]]:
        self.ensure_seed()
        out = []
        for c in sqlite_growth.list_claims(self.path):
            positions = sqlite_growth.list_positions(self.path, c["id"])
            c["market"] = market_summary(positions)
            c["positions"] = positions[-10:]  # last 10 only
            out.append(c)
        return out

    def add_position(self, claim_id: str, actor_id: str, side: str, confidence: float, stake: float) -> Dict[str, Any]:
        self.ensure_seed()
        confidence = clamp(confidence, settings.MIN_CONFIDENCE, settings.MAX_CONFIDENCE)
        stake = float(stake if stake is not None else settings.DEFAULT_STAKE)
        sqlite_growth.add_position(self.path, claim_id=claim_id, actor_id=actor_id, side=side, confidence=confidence, stake=stake)
        positions = sqlite_growth.list_positions(self.path, claim_id)
        return {"claim_id": claim_id, "market": market_summary(positions), "positions": positions[-20:]}

    def resolve(self, claim_id: str, outcome: int, note: str) -> Dict[str, Any]:
        self.ensure_seed()
        sqlite_growth.resolve_claim(self.path, claim_id=claim_id, outcome=int(outcome), resolution_note=note)
        positions = sqlite_growth.list_positions(self.path, claim_id)
        settlements = settle(positions, int(outcome))
        return {"claim_id": claim_id, "outcome": int(outcome), "note": note, "settlements": settlements}

    def add_journal(self, actor_id: str, kind: str, claim_id: Optional[str], entry: Dict[str, Any]) -> Dict[str, Any]:
        self.ensure_seed()
        jid = sqlite_growth.add_journal(self.path, actor_id=actor_id, kind=kind, claim_id=claim_id, entry=entry)
        return {"journal_id": jid, "actor_id": actor_id, "kind": kind, "claim_id": claim_id, "entry": entry}

class SimProvider(SQLiteProvider):
    """
    SIM uses the same SQLite storage so the app stays alive,
    but it can optionally reseed aggressively on each boot.
    """
    def ensure_seed(self) -> None:
        # Always ensure at least 3 seeds exist
        super().ensure_seed()

class PostgresProvider(SQLiteProvider):
    """
    Top-1% direction:
      - read Watchtower attestations + journals from Postgres
      - still keep SQLite as fallback for local dev if psycopg isn't installed
    Current: tries Postgres for dashboard/claims if possible; otherwise falls back to SQLite.
    """
    def __init__(self) -> None:
        super().__init__()
        self.dsn = settings.POSTGRES_DSN

    def _pg_ok(self) -> bool:
        return bool(self.dsn)

    def _pg_connect(self):
        # psycopg (v3) preferred; fallback to psycopg2 if present
        try:
            import psycopg  # type: ignore
            return psycopg.connect(self.dsn)
        except Exception:
            try:
                import psycopg2  # type: ignore
                return psycopg2.connect(self.dsn)
            except Exception:
                return None

    def dashboard(self) -> Dict[str, Any]:
        # Try Postgres, else SQLite
        if not self._pg_ok():
            return super().dashboard()

        conn = self._pg_connect()
        if conn is None:
            return super().dashboard()

        try:
            cur = conn.cursor()
            # These tables are your future Watchtower truth.
            # If they don't exist yet, we fall back.
            cur.execute("SELECT to_regclass('public.watchtower_attestations')")
            exists = cur.fetchone()[0] is not None
            if not exists:
                return super().dashboard()

            cur.execute("SELECT COUNT(1) FROM watchtower_attestations")
            att = int(cur.fetchone()[0])

            # Optional: growth_journal table in Postgres (future)
            cur.execute("SELECT to_regclass('public.growth_journal')")
            gj = cur.fetchone()[0] is not None
            journals = 0
            if gj:
                cur.execute("SELECT COUNT(1) FROM growth_journal")
                journals = int(cur.fetchone()[0])

            base = super().dashboard()
            base["watchtower_attestations"] = att
            base["postgres_journals"] = journals
            base["provider"] = "postgres"
            return base
        except Exception:
            return super().dashboard()
        finally:
            try: conn.close()
            except Exception: pass

def get_provider() -> BaseProvider:
    p = settings.GROWTH_PROVIDER
    if p == "postgres":
        return PostgresProvider()
    if p == "sqlite":
        return SQLiteProvider()
    return SimProvider()
