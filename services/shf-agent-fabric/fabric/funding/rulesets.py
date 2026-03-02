from __future__ import annotations


# --------------------------------------------
# Contract classification (clean separation)
# --------------------------------------------
AIM_RULESET_SCHEMA = "AIM_RULESET_V1"
AIM_LOCK_TRIGGERS_SCHEMA = "AIM_LOCK_TRIGGERS_V1"

def _schema_of(obj: dict) -> str | None:
    if not isinstance(obj, dict):
        return None
    v = obj.get("schema_version")
    if isinstance(v, str) and v.strip():
        return v.strip()
    return None

def _kind_of(obj: dict) -> str | None:
    sv = _schema_of(obj)
    if sv == AIM_RULESET_SCHEMA:
        return "ruleset"
    if sv == AIM_LOCK_TRIGGERS_SCHEMA:
        return "lock_triggers"
    return None

def _as_discovery_item(obj: dict, filename: str) -> dict:
    # normalized shape used by /discovery and indices
    return {
        "schema_version": "AIM_DISCOVERY_ITEM_V1",
        "kind": _kind_of(obj),
        "ruleset_id": obj.get("ruleset_id"),
        "ruleset_version": obj.get("ruleset_version"),
        "status": obj.get("status"),
        "program_category": obj.get("program_category"),
        "scope": obj.get("scope"),
        "metric_standard": obj.get("metric_standard"),
        "effective_start": obj.get("effective_start"),
        "effective_end": obj.get("effective_end"),
        "filename": filename,
    }

def _classify_kind(filename: str, obj: dict) -> str:
    """Return 'ruleset' or 'lock_triggers' (defensive: uses schema_version OR filename)."""
    sv = (obj or {}).get("schema_version")
    if sv == "AIM_RULESET_V1":
        return "ruleset"
    if sv == "AIM_LOCK_TRIGGERS_V1":
        return "lock_triggers"
    # Fallback: filename convention (covers legacy files missing metadata)
    low = filename.lower()
    if "lock_trigger" in low or "lock-triggers" in low:
        return "lock_triggers"
    if low.startswith("rs_"):
        return "ruleset"
    return "unknown"


import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


AIM_RULESET_SCHEMA = "AIM_RULESET_V1"
AIM_LOCK_TRIGGERS_SCHEMA = "AIM_LOCK_TRIGGERS_V1"

INDEX_SCHEMA = "AIM_DISCOVERY_INDEX_V1"
INDEX_ITEM_SCHEMA = "AIM_DISCOVERY_ITEM_V1"


def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _safe_get(d: Dict[str, Any], *keys: str) -> Any:
    cur: Any = d
    for k in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(k)
    return cur


def _classify(doc: Dict[str, Any], filename: str) -> str:
    """
    Returns one of:
      - "ruleset"
      - "lock_triggers"
      - "unknown"
    """
    sv = doc.get("schema_version")
    if sv == AIM_RULESET_SCHEMA:
        return "ruleset"
    if sv == AIM_LOCK_TRIGGERS_SCHEMA:
        return "lock_triggers"

    # Back-compat heuristics (in case schema_version missing)
    if filename.startswith("rs_") and "payout_rules" in doc:
        return "ruleset"
    if "lock_triggers" in doc and isinstance(doc.get("lock_triggers"), list):
        return "lock_triggers"

    return "unknown"


def _extract_ruleset_index_item(doc: Dict[str, Any], filename: str) -> Dict[str, Any]:
    applies = doc.get("applies_to") if isinstance(doc.get("applies_to"), dict) else {}
    return {
        "schema_version": INDEX_ITEM_SCHEMA,
        "kind": "ruleset",
        "ruleset_id": doc.get("ruleset_id") or filename.replace(".json", ""),
        "ruleset_version": doc.get("ruleset_version"),
        "status": doc.get("status"),
        "program_category": _safe_get(applies, "program_category"),
        "scope": _safe_get(applies, "scope"),
        "metric_standard": _safe_get(applies, "metric_standard"),
        "effective_start": _safe_get(applies, "effective_start"),
        "effective_end": _safe_get(applies, "effective_end"),
        "filename": filename,
    }


def _extract_lock_triggers_index_item(doc: Dict[str, Any], filename: str) -> Dict[str, Any]:
    return {
        "schema_version": INDEX_ITEM_SCHEMA,
        "kind": "lock_triggers",
        "ruleset_id": doc.get("ruleset_id") or filename.replace(".json", ""),
        "ruleset_version": doc.get("ruleset_version"),
        "status": doc.get("status"),
        "program_category": None,
        "scope": None,
        "metric_standard": None,
        "effective_start": None,
        "effective_end": None,
        "filename": filename,
    }


def _contracts_dir() -> Path:
    # repo-root relative
    return Path(__file__).resolve().parents[2] / "contracts" / "aim_rulesets"


def list_discoverable(include_kinds: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Read-only discovery index for partners.

    include_kinds:
      - ["ruleset"]         -> only rulesets
      - ["lock_triggers"]   -> only lock triggers
      - None/[]             -> all known kinds
    """
    base = _contracts_dir()
    base.mkdir(parents=True, exist_ok=True)

    kinds_filter = set([k.strip() for k in (include_kinds or []) if str(k).strip()])
    files = sorted([p for p in base.glob("*.json") if p.is_file()])

    items: List[Dict[str, Any]] = []
    for f in files:
        try:
            doc = _read_json(f)
        except Exception:
            continue

        kind = _classify(doc, f.name)
        if kind == "unknown":
            continue
        if kinds_filter and kind not in kinds_filter:
            continue

        if kind == "ruleset":
            items.append(_extract_ruleset_index_item(doc, f.name))
        elif kind == "lock_triggers":
            items.append(_extract_lock_triggers_index_item(doc, f.name))

    return {
        "schema_version": INDEX_SCHEMA,
        "count": len(items),
        "items": items,
    }


def get_ruleset_doc(ruleset_id: str) -> Tuple[Dict[str, Any], str]:
    """
    Returns (doc, filename) for an exact ruleset id.
    """
    base = _contracts_dir()
    base.mkdir(parents=True, exist_ok=True)

    # exact match by filename OR by doc.ruleset_id
    target_file = base / f"{ruleset_id}.json"
    if target_file.exists():
        return _read_json(target_file), target_file.name

    for f in sorted(base.glob("*.json")):
        try:
            doc = _read_json(f)
        except Exception:
            continue
        if doc.get("ruleset_id") == ruleset_id:
            return doc, f.name

    raise FileNotFoundError(f"ruleset_id not found: {ruleset_id}")


from pathlib import Path
import json

def _contracts_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "contracts" / "aim_rulesets"

def _load_all_contracts() -> list[tuple[str, dict]]:
    d = _contracts_dir()
    if not d.exists():
        return []
    out: list[tuple[str, dict]] = []
    for fp in sorted(d.glob("*.json")):
        try:
            obj = json.loads(fp.read_text(encoding="utf-8"))
            if isinstance(obj, dict):
                out.append((fp.name, obj))
        except Exception:
            # ignore unreadable contract; discovery remains best-effort
            continue
    return out

def list_rulesets() -> dict:
    """
    /api/funding/rulesets
    Clean separation: ONLY AIM_RULESET_V1 contracts.
    """
    items = []
    for filename, obj in _load_all_contracts():
        if _schema_of(obj) != AIM_RULESET_SCHEMA:
            continue
        items.append({
            "ruleset_id": obj.get("ruleset_id"),
            "ruleset_version": obj.get("ruleset_version"),
            "status": obj.get("status"),
            "program_category": obj.get("program_category"),
            "scope": obj.get("scope"),
            "metric_standard": obj.get("metric_standard"),
            "effective_start": obj.get("effective_start"),
            "effective_end": obj.get("effective_end"),
            "filename": filename,
        })
    return {"schema_version": "AIM_RULESET_INDEX_V1", "count": len(items), "rulesets": items}

def get_ruleset(ruleset_id: str) -> dict:
    """
    /api/funding/rulesets/{ruleset_id}
    Clean separation: ONLY AIM_RULESET_V1 contracts.
    """
    for filename, obj in _load_all_contracts():
        if _schema_of(obj) != AIM_RULESET_SCHEMA:
            continue
        if obj.get("ruleset_id") == ruleset_id:
            # return full contract plus filename
            out = dict(obj)
            out["_filename"] = filename
            return out
    return {"detail": f"ruleset not found: {ruleset_id}"}

def list_lock_triggers() -> dict:
    """
    /api/funding/lock-triggers
    Clean separation: ONLY AIM_LOCK_TRIGGERS_V1 contracts.
    """
    items = []
    for filename, obj in _load_all_contracts():
        if _schema_of(obj) != AIM_LOCK_TRIGGERS_SCHEMA:
            continue
        items.append(_as_discovery_item(obj, filename))
    return {"schema_version": "AIM_LOCK_TRIGGERS_INDEX_V1", "count": len(items), "items": items}

def get_lock_triggers(ruleset_id: str) -> dict:
    """
    /api/funding/lock-triggers/{ruleset_id}
    Clean separation: ONLY AIM_LOCK_TRIGGERS_V1 contracts.
    """
    for filename, obj in _load_all_contracts():
        if _schema_of(obj) != AIM_LOCK_TRIGGERS_SCHEMA:
            continue
        if obj.get("ruleset_id") == ruleset_id:
            out = dict(obj)
            out["_filename"] = filename
            return out
    return {"detail": f"lock-triggers ruleset not found: {ruleset_id}"}

def list_discovery() -> dict:
    """
    /api/funding/discovery
    Partners can self-integrate: returns BOTH kinds.
    """
    items = []
    for filename, obj in _load_all_contracts():
        k = _kind_of(obj)
        if k is None:
            continue
        items.append(_as_discovery_item(obj, filename))
    return {"schema_version": "AIM_DISCOVERY_INDEX_V1", "count": len(items), "items": items}
