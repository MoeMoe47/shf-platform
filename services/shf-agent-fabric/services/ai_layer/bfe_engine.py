from datetime import datetime
import json
from pathlib import Path

DB_PATH = Path("db/bfe_journal.jsonl")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def _write(record):
    with open(DB_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

def _read_all():
    if not DB_PATH.exists():
        return []
    with open(DB_PATH, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]

def record_decision(payload):
    payload["type"] = "decision"
    payload["timestamp"] = datetime.utcnow().isoformat()
    _write(payload)
    return payload

def record_outcome(payload):
    payload["type"] = "outcome"
    payload["timestamp"] = datetime.utcnow().isoformat()
    _write(payload)
    return payload

def summary():
    data = _read_all()
    decisions = [x for x in data if x.get("type") == "decision"]
    outcomes = [x for x in data if x.get("type") == "outcome"]
    success = [o for o in outcomes if o.get("status") == "success"]
    return {
        "decisions": len(decisions),
        "outcomes": len(outcomes),
        "success_rate": round(len(success) / len(outcomes), 2) if outcomes else 0
    }

def health():
    data = _read_all()
    return {
        "status": "ok",
        "engine": "BFE CLEAN",
        "records": len(data)
    }

def compute_confidence(data, history):
    if not data:
        return 0
    decisions = data.get("decisions", 0)
    outcomes = data.get("outcomes", 0)
    success = data.get("success_rate", 0)

    volume = min((decisions + outcomes) / 10, 1)
    history_factor = min(len(history) / 7, 1)

    return round((success * 0.5 + volume * 0.3 + history_factor * 0.2) * 100)


def compute_volatility(history):
    if len(history) < 3:
        return "Low"

    diffs = [abs(history[i] - history[i - 1]) for i in range(1, len(history))]
    avg = sum(diffs) / len(diffs)

    if avg < 0.08:
        return "Low"
    if avg < 0.2:
        return "Medium"
    return "High"


def compute_prediction(data, history, trend, volatility, confidence):
    success = data.get("success_rate", 0)
    avg = sum(history) / len(history) if history else success

    projection = avg

    if trend == "improving":
        projection += 0.05
    elif trend == "declining":
        projection -= 0.08

    if volatility == "Medium":
        projection -= 0.04
    elif volatility == "High":
        projection -= 0.1

    projection += ((confidence / 100) - 0.5) * 0.08
    projection = max(0, min(1, projection))

    risk = "Low"
    if projection < 0.85 or volatility == "Medium":
        risk = "Medium"
    if projection < 0.6 or volatility == "High":
        risk = "High"

    return {
        "next_likely_outcome": "SUCCESS" if projection >= 0.7 else "AT RISK",
        "risk_level": risk,
        "projected_success": round(projection * 100),
        "continuation_probability": round((projection * 0.92 + 0.04) * 100),
    }


def compute_action(data, trend, volatility, confidence):
    success = data.get("success_rate", 0)
    decisions = data.get("decisions", 0)

    if success >= 0.9 and volatility == "Low" and confidence >= 80:
        return "Test Controlled Expansion" if decisions >= 3 else "Maintain Current Strategy"

    if trend == "improving" and confidence >= 70:
        return "Increase Decision Volume"

    if volatility == "High":
        return "Investigate Strategy Instability"

    if success < 0.6:
        return "Intervene Before Scaling"

    return "Maintain Current Strategy"


def build_intelligence(summary):
    history = [summary.get("success_rate", 0)]  # simple start

    confidence = compute_confidence(summary, history)
    volatility = compute_volatility(history)

    trend = "stable"
    prediction = compute_prediction(summary, history, trend, volatility, confidence)
    action = compute_action(summary, trend, volatility, confidence)

    return {
        **summary,
        "trend": trend,
        "confidence": confidence,
        "volatility": volatility,
        **prediction,
        "recommended_action": action,
    }

