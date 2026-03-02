from __future__ import annotations

import hashlib
import hmac
import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


# -----------------------------
# DB (same location strategy as store.py)
# -----------------------------
def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _db_path() -> Path:
    p = os.getenv("SHF_WATCHTOWER_STORE_PATH", "")
    if p.strip():
        return Path(p).expanduser().resolve()
    return _repo_root() / "var" / "watchtower_store.sqlite"


def _connect() -> sqlite3.Connection:
    dbp = _db_path()
    dbp.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(dbp))
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.row_factory = sqlite3.Row
    return conn


def ensure_attestation_schema() -> None:
    with _connect() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS attestations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at INTEGER NOT NULL,
                created_utc TEXT NOT NULL,
                root_hash TEXT NOT NULL,
                kid TEXT NOT NULL,
                signature TEXT NOT NULL,
                proof_json TEXT NOT NULL
            )
            """
        )
        c.execute("CREATE INDEX IF NOT EXISTS idx_attestations_created_at ON attestations(created_at DESC);")
        c.execute("CREATE INDEX IF NOT EXISTS idx_attestations_root ON attestations(root_hash);")
        c.commit()


# -----------------------------
# Deterministic encoding + hashing
# -----------------------------
def _canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


# -----------------------------
# Keyring (rotation + key-id)
# -----------------------------
def _load_keyring() -> Dict[str, str]:
    """
    Supported envs:

    1) SHF_ATTESTATION_KEYS_JSON='{"k1":"secret1","k2":"secret2"}'
       SHF_ATTESTATION_ACTIVE_KID='k2'

    2) Legacy single key:
       SHF_ATTESTATION_HMAC_KEY='secret'
       (kid defaults to 'v1')
    """
    keys_json = os.getenv("SHF_ATTESTATION_KEYS_JSON", "").strip()
    if keys_json:
        try:
            data = json.loads(keys_json)
            if isinstance(data, dict) and all(isinstance(k, str) and isinstance(v, str) for k, v in data.items()):
                return data
        except Exception:
            pass

    legacy = os.getenv("SHF_ATTESTATION_HMAC_KEY", "").strip()
    if legacy:
        return {"v1": legacy}

    return {}


def _active_kid(keyring: Dict[str, str]) -> str:
    kid = os.getenv("SHF_ATTESTATION_ACTIVE_KID", "").strip()
    if kid and kid in keyring:
        return kid
    # fallback deterministic choice
    if "v1" in keyring:
        return "v1"
    return sorted(keyring.keys())[0] if keyring else ""


def sign_root(root_hash: str) -> Tuple[bool, str, str]:
    """
    Returns (ok, kid, signature_hex)
    Signature is HMAC-SHA256 over:
      "shf.watchtower.attestation.v1|<root_hash>"
    """
    keyring = _load_keyring()
    if not keyring:
        return (False, "", "KEYRING_MISSING")

    kid = _active_kid(keyring)
    if not kid:
        return (False, "", "ACTIVE_KID_MISSING")

    secret = keyring.get(kid, "")
    if not secret:
        return (False, kid, "SECRET_MISSING")

    msg = f"shf.watchtower.attestation.v1|{root_hash}".encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return (True, kid, sig)


def verify_signature(root_hash: str, *, kid: str, signature_hex: str) -> Tuple[bool, str]:
    keyring = _load_keyring()
    if not keyring:
        return (False, "KEYRING_MISSING")

    secret = keyring.get(kid, "")
    if not secret:
        return (False, "UNKNOWN_KID")

    msg = f"shf.watchtower.attestation.v1|{root_hash}".encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    if hmac.compare_digest(expected, str(signature_hex or "")):
        return (True, "OK")
    return (False, "BAD_SIGNATURE")


# -----------------------------
# Global root + proof sample
# -----------------------------
def _latest_chain_hash(program_id: str) -> str:
    """
    Reads the newest chain_hash for this program from risk_snapshots.
    Returns "" if none.
    """
    with _connect() as c:
        row = c.execute(
            """
            SELECT chain_hash
            FROM risk_snapshots
            WHERE program_id=?
            ORDER BY id DESC
            LIMIT 1
            """,
            (program_id,),
        ).fetchone()
    return str(row["chain_hash"]) if row and row["chain_hash"] else ""


def compute_global_root(*, program_ids: List[str]) -> Dict[str, Any]:
    """
    Root = sha256(canonical_json(sorted(program_tip_list))).

    Each tip:
      {"program_id": ..., "tip_chain_hash": ...}
    """
    tips: List[Dict[str, str]] = []
    for pid in sorted({str(x) for x in program_ids if str(x).strip()}):
        tips.append({"program_id": pid, "tip_chain_hash": _latest_chain_hash(pid)})

    root_input = _canonical_json(tips)
    root = _sha256_hex(root_input)

    return {
        "root_hash": root,
        "tips": tips,
        "program_count": len(tips),
        "computed_at": int(time.time()),
    }


def root_proof_sample(*, tips: List[Dict[str, str]], n: int = 10) -> List[Dict[str, str]]:
    """
    Auditor-friendly spot-check sample (deterministic):
      - take first N tips after sort by program_id
    """
    n = max(1, min(int(n), 50))
    tips_sorted = sorted(tips, key=lambda t: (str(t.get("program_id") or ""), str(t.get("tip_chain_hash") or "")))
    return tips_sorted[:n]


def store_attestation(*, root_hash: str, kid: str, signature: str, proof: Dict[str, Any]) -> int:
    ensure_attestation_schema()
    now = int(time.time())
    created_utc = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now))
    proof_json = _canonical_json(proof)

    with _connect() as c:
        c.execute(
            """
            INSERT INTO attestations(created_at, created_utc, root_hash, kid, signature, proof_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (now, created_utc, root_hash, kid, signature, proof_json),
        )
        att_id = int(c.execute("SELECT last_insert_rowid()").fetchone()[0])
        c.commit()
    return att_id


def latest_attestation() -> Optional[Dict[str, Any]]:
    ensure_attestation_schema()
    with _connect() as c:
        row = c.execute(
            """
            SELECT id, created_at, created_utc, root_hash, kid, signature, proof_json
            FROM attestations
            ORDER BY created_at DESC
            LIMIT 1
            """
        ).fetchone()

    if not row:
        return None

    try:
        proof = json.loads(row["proof_json"]) if row["proof_json"] else {}
    except Exception:
        proof = {}

    return {
        "id": int(row["id"]),
        "created_at": int(row["created_at"]),
        "created_utc": str(row["created_utc"]),
        "root_hash": str(row["root_hash"]),
        "kid": str(row["kid"]),
        "signature": str(row["signature"]),
        "proof": proof,
    }
