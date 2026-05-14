#!/usr/bin/env bash
set -euo pipefail

echo "== Building CLEAN BFE Layer =="

mkdir -p services/ai_layer
mkdir -p routers

# ---------------------------
# bfe_engine.py (CORE)
# ---------------------------
cat > services/ai_layer/bfe_engine.py <<'PY'
from datetime import datetime

# Simple in-memory (safe start)
STORE = []

def record_decision(payload):
    payload["type"] = "decision"
    payload["timestamp"] = datetime.utcnow().isoformat()
    STORE.append(payload)
    return payload

def record_outcome(payload):
    payload["type"] = "outcome"
    payload["timestamp"] = datetime.utcnow().isoformat()
    STORE.append(payload)
    return payload

def summary():
    decisions = [x for x in STORE if x["type"] == "decision"]
    outcomes = [x for x in STORE if x["type"] == "outcome"]

    success = [o for o in outcomes if o.get("status") == "success"]

    return {
        "decisions": len(decisions),
        "outcomes": len(outcomes),
        "success_rate": round(len(success) / len(outcomes), 2) if outcomes else 0
    }

def health():
    return {
        "status": "ok",
        "engine": "BFE",
        "records": len(STORE)
    }
PY

# ---------------------------
# router
# ---------------------------
cat > routers/bfe_routes.py <<'PY'
from fastapi import APIRouter, Body
from services.ai_layer.bfe_engine import (
    record_decision,
    record_outcome,
    summary,
    health
)

router = APIRouter(prefix="/bfe", tags=["bfe"])

@router.get("/health")
def bfe_health():
    return health()

@router.post("/decision")
def bfe_decision(payload: dict = Body(...)):
    return record_decision(payload)

@router.post("/outcome")
def bfe_outcome(payload: dict = Body(...)):
    return record_outcome(payload)

@router.get("/summary")
def bfe_summary():
    return summary()
PY

echo "== Files Created =="

echo "➡️ Now manually add this to main.py:"
echo "from routers.bfe_routes import router as bfe_router"
echo "app.include_router(bfe_router)"

