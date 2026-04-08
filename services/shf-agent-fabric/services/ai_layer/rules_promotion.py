from pathlib import Path
from datetime import datetime
import json

BASE_DIR = Path(__file__).resolve().parent / "data"
PROMOTION_PATH = BASE_DIR / "rules_promotion.json"


def _ts():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _ensure_dir():
    BASE_DIR.mkdir(parents=True, exist_ok=True)


def get_default_promotion_state():
    return {
        "stable_version": None,
        "candidate_version": None,
        "history": []
    }


def load_promotion_state():
    if not PROMOTION_PATH.exists():
        return get_default_promotion_state()
    return json.loads(PROMOTION_PATH.read_text())


def save_promotion_state(state):
    _ensure_dir()
    PROMOTION_PATH.write_text(json.dumps(state, indent=2))
    return {
        "ok": True,
        "path": str(PROMOTION_PATH),
    }


def set_candidate_version(version, label=None):
    state = load_promotion_state()
    state["candidate_version"] = {
        "version": version,
        "label": label,
        "set_at": _ts(),
    }
    save_promotion_state(state)
    return state


def promote_candidate_to_stable(reason="passed_promotion_gates"):
    state = load_promotion_state()
    candidate = state.get("candidate_version")

    if not candidate:
        return {
            "ok": False,
            "reason": "no_candidate_version"
        }

    previous_stable = state.get("stable_version")

    state["stable_version"] = {
        "version": candidate.get("version"),
        "label": candidate.get("label"),
        "promoted_at": _ts(),
        "reason": reason,
    }

    state["history"].append({
        "event": "promoted_to_stable",
        "version": candidate.get("version"),
        "label": candidate.get("label"),
        "timestamp": _ts(),
        "reason": reason,
        "previous_stable": previous_stable,
    })

    state["candidate_version"] = None
    save_promotion_state(state)

    return {
        "ok": True,
        "stable_version": state["stable_version"],
        "previous_stable": previous_stable,
    }


def mark_rolled_back(version, reason="rollback_guard"):
    state = load_promotion_state()
    state["history"].append({
        "event": "rolled_back",
        "version": version,
        "timestamp": _ts(),
        "reason": reason,
    })
    save_promotion_state(state)
    return {
        "ok": True,
        "rolled_back_version": version,
    }
