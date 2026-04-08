from pathlib import Path
import json
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent / "data"
RULES_PATH = BASE_DIR / "tuned_rules.json"
HISTORY_DIR = BASE_DIR / "history"


def _timestamp():
    return datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")


def _ensure_dirs():
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)


def save_rules(rules, label="tuned_rules"):
    _ensure_dirs()

    ts = _timestamp()
    versioned = {
        "version": ts,
        "label": label,
        "saved_at": ts,
        "rules": rules,
    }

    # save active
    RULES_PATH.write_text(json.dumps(versioned, indent=2))

    # save snapshot
    snapshot_path = HISTORY_DIR / f"{label}_{ts}.json"
    snapshot_path.write_text(json.dumps(versioned, indent=2))

    return {
        "ok": True,
        "active_path": str(RULES_PATH),
        "snapshot_path": str(snapshot_path),
        "version": ts,
    }


def load_rules():
    if not RULES_PATH.exists():
        return None

    data = json.loads(RULES_PATH.read_text())

    # backward compatibility
    if "rules" in data:
        return data["rules"]
    return data


def load_rules_with_meta():
    if not RULES_PATH.exists():
        return None
    return json.loads(RULES_PATH.read_text())


def rules_exist():
    return RULES_PATH.exists()


def list_rule_versions():
    _ensure_dirs()
    files = sorted(HISTORY_DIR.glob("*.json"), reverse=True)
    return [str(f) for f in files]


def load_rule_version(path):
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Rule version not found: {path}")
    return json.loads(path.read_text())


def rollback_rules(path):
    versioned = load_rule_version(path)
    RULES_PATH.write_text(json.dumps(versioned, indent=2))
    return {
        "ok": True,
        "rolled_back_to": str(path),
        "active_path": str(RULES_PATH),
        "version": versioned.get("version"),
    }


def load_rules_version_by_version(version: str):
    files = list_rule_versions()
    for path_str in files:
        path = Path(path_str)
        data = json.loads(path.read_text())
        if data.get("version") == version:
            return data
    return None

