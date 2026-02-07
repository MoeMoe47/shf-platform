from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from fabric.arena import store
from fabric.arena.engine import finalize_round
from fabric.arena.think_tank import summarize_recent
from fabric.arena.events import emit

# ✅ IMPORTANT: prefix must be /arena so smoke script hits /arena/agents/draft
router = APIRouter(prefix="/arena", tags=["arena"])


# -----------------------------
# Models (request bodies)
# -----------------------------

class AgentDraftBody(BaseModel):
    ownerStudentId: str = Field(..., min_length=3)
    name: str = Field(..., min_length=1)
    avatarId: str = Field(default="robot_01")
    persona: str = Field(default="TEACHER")
    strengths: Dict[str, int] = Field(default_factory=dict)
    communication: Dict[str, Any] = Field(default_factory=dict)
    learningMode: str = Field(default="ADAPTIVE")


class SignalBody(BaseModel):
    agentId: str = Field(..., min_length=3)
    signals: Dict[str, int] = Field(default_factory=dict)


class DevFinalizeRoundBody(BaseModel):
    """
    v1 helper: finalize a round using accumulated signals for roundId="dev_live".
    Delete later; dev-only runner.
    """
    prompt: str = Field(..., min_length=3)
    agentIds: List[str] = Field(default_factory=list)
    strategies: Dict[str, str] = Field(default_factory=dict)


# -----------------------------
# Local helpers
# -----------------------------

ROOT = Path(__file__).resolve().parents[1]
ROUNDS_PATH = ROOT / "db" / "arena" / "rounds.jsonl"
SIGNALS_PATH = ROOT / "db" / "arena" / "signals.jsonl"


def _read_jsonl(p: Path) -> List[Dict[str, Any]]:
    if not p.exists() or p.stat().st_size == 0:
        return []
    out: List[Dict[str, Any]] = []
    for line in p.read_text(encoding="utf-8").splitlines():
        s = (line or "").strip()
        if not s:
            continue
        try:
            out.append(json.loads(s))
        except Exception:
            continue
    return out


def _latest_round(arena_id: str, round_id: str) -> Optional[Dict[str, Any]]:
    rounds = _read_jsonl(ROUNDS_PATH)
    for r in reversed(rounds):
        if r.get("arenaId") == arena_id and r.get("roundId") == round_id:
            return r
    return None


# -----------------------------
# Agent Forge (v1 frozen)
# -----------------------------

@router.post("/agents/draft")
def create_agent_draft(body: AgentDraftBody):
    a = store.create_agent_draft(body.model_dump())

    emit(
        "ARENA_AGENT_DRAFT_SAVED",
        actor_type="student",
        context={"agent_id": a["agentId"]},
        flags={"manual_override": False},
    )

    return {"ok": True, "agentId": a["agentId"], "status": a["status"], "agent": a}


@router.post("/agents/{agent_id}/release")
def release_agent(agent_id: str):
    ok, a = store.release_agent(agent_id)
    if not ok:
        raise HTTPException(status_code=404, detail=a.get("error", "AGENT_NOT_FOUND"))

    e = emit(
        "ARENA_AGENT_RELEASED",
        actor_type="student",
        context={"agent_id": agent_id},
        flags={"manual_override": False},
    )
    return {"ok": True, "eventId": e["event_id"], "agentId": agent_id, "status": a["status"]}


# -----------------------------
# Watch Tower (v1 frozen)
# -----------------------------

@router.get("/{arena_id}/round/{round_id}/watch-tower")
def watch_tower(arena_id: str, round_id: str):
    r = _latest_round(arena_id, round_id)
    if not r:
        raise HTTPException(status_code=404, detail="ROUND_NOT_FOUND")

    emit(
        "ARENA_WATCH_TOWER_VIEWED",
        actor_type="student",
        context={"arena_id": arena_id, "round_id": round_id},
    )

    res = r.get("results") if isinstance(r.get("results"), dict) else {}
    entries = res.get("entries") if isinstance(res.get("entries"), list) else []

    public_entries: List[Dict[str, Any]] = []
    for e in entries:
        public_entries.append(
            {
                "agentId": e.get("agentId"),
                "strategyUsed": e.get("strategyUsed"),
                "score": e.get("score"),
                "rank": e.get("rank"),
            }
        )

    return {
        "ok": True,
        "arenaId": arena_id,
        "roundId": round_id,
        "prompt": r.get("prompt"),
        "status": r.get("status"),
        "entries": public_entries,
    }


@router.post("/{arena_id}/round/{round_id}/signal")
def post_signal(arena_id: str, round_id: str, body: SignalBody):
    doc = {
        "arenaId": arena_id,
        "roundId": round_id,
        "agentId": body.agentId,
        "signals": body.signals,
    }

    saved = store.append_signal(doc)  # after patch, returns dict; before patch may be None

    emit(
        "ARENA_SIGNAL_CAST",
        actor_type="student",
        context={"arena_id": arena_id, "round_id": round_id, "agent_id": body.agentId},
        flags={"manual_override": False},
    )

    return {"ok": True, "signal": saved or doc}


# -----------------------------
# Results Hall (v1 frozen)
# -----------------------------

@router.get("/{arena_id}/round/{round_id}/results-hall")
def results_hall(arena_id: str, round_id: str):
    r = _latest_round(arena_id, round_id)
    if not r:
        raise HTTPException(status_code=404, detail="ROUND_NOT_FOUND")

    res = r.get("results") if isinstance(r.get("results"), dict) else {}
    entries = res.get("entries") if isinstance(res.get("entries"), list) else []
    winner = res.get("winner") if isinstance(res.get("winner"), dict) else None

    emit(
        "ARENA_RESULTS_VIEWED",
        actor_type="student",
        context={"arena_id": arena_id, "round_id": round_id},
    )

    return {
        "ok": True,
        "arenaId": arena_id,
        "roundId": round_id,
        "winner": (
            {
                "agentId": winner.get("agentId"),
                "strategyUsed": winner.get("strategyUsed"),
                "score": winner.get("score"),
            }
            if winner
            else None
        ),
        "entries": [
            {
                "agentId": e.get("agentId"),
                "rank": e.get("rank"),
                "strategyUsed": e.get("strategyUsed"),
                "score": e.get("score"),
            }
            for e in entries
        ],
    }


# -----------------------------
# Agent Breakdown (v1 frozen)
# -----------------------------

@router.get("/agent/{agent_id}/round/{round_id}/breakdown")
def agent_breakdown(agent_id: str, round_id: str):
    rounds = _read_jsonl(ROUNDS_PATH)
    for r in reversed(rounds):
        if r.get("roundId") != round_id:
            continue

        res = r.get("results") if isinstance(r.get("results"), dict) else {}
        entries = res.get("entries") if isinstance(res.get("entries"), list) else []
        for e in entries:
            if e.get("agentId") != agent_id:
                continue

            emit(
                "ARENA_BREAKDOWN_VIEWED",
                actor_type="student",
                context={"agent_id": agent_id, "round_id": round_id},
            )

            exp = e.get("explanation") if isinstance(e.get("explanation"), dict) else {}
            return {
                "ok": True,
                "agentId": agent_id,
                "roundId": round_id,
                "arenaId": r.get("arenaId"),
                "strategyUsed": e.get("strategyUsed"),
                "score": e.get("score"),
                "explanation": exp,
            }

    raise HTTPException(status_code=404, detail="ENTRY_NOT_FOUND")


# -----------------------------
# Think Tank (v1 frozen)
# -----------------------------

@router.get("/{arena_id}/think-tank/summary")
def think_tank_summary(arena_id: str, window: int = 5):
    rounds = [r for r in _read_jsonl(ROUNDS_PATH) if r.get("arenaId") == arena_id]
    s = summarize_recent(rounds, window=window)

    emit(
        "ARENA_THINK_TANK_VIEWED",
        actor_type="student",
        context={"arena_id": arena_id},
    )

    return {"ok": True, "arenaId": arena_id, "roundWindow": f"LAST_{window}", **s}


# -----------------------------
# Facilitator Console (v1 frozen, read-only)
# -----------------------------

@router.get("/facilitator/console")
def facilitator_console(programId: str = "default", range: str = "30d"):
    rounds = _read_jsonl(ROUNDS_PATH)
    agents = store.list_agents()

    kpis = {
        "agents": len(agents),
        "rounds": len(rounds),
        "avgEngagement": 0.0,
        "creditsIssued": 0,
    }

    strat_counts: Dict[str, int] = {}
    for r in rounds:
        w = (r.get("results") or {}).get("winner")
        if isinstance(w, dict):
            s = str(w.get("strategyUsed") or "UNKNOWN")
            strat_counts[s] = strat_counts.get(s, 0) + 1

    total_wins = max(1, sum(strat_counts.values()))
    strategyPerformance = [
        {"strategy": k, "winRate": v / total_wins, "trend": "STABLE"}
        for k, v in sorted(strat_counts.items(), key=lambda kv: kv[1], reverse=True)
    ]

    integrity = {
        "rulesEnforced": True,
        "deterministicScoring": True,
        "humanInterferenceDetected": False,
    }

    e = emit(
        "ARENA_FACILITATOR_CONSOLE_VIEWED",
        actor_type="staff",
        context={"program_id": programId},
    )

    return {
        "ok": True,
        "eventId": e["event_id"],
        "program": {"programId": programId, "name": programId},
        "kpis": kpis,
        "strategyPerformance": strategyPerformance,
        "participation": {"activeAgentsWeekly": [], "signalsPerSession": 0.0, "completionRate": 0.0},
        "integrity": integrity,
        "note": "v1 read-only console. Engagement/credits/LOO rollups will be populated once workers are wired.",
    }


# -----------------------------
# Dev-only round finalizer (helps you test TODAY)
# -----------------------------

@router.post("/{arena_id}/round/finalize_dev")
def finalize_round_dev(arena_id: str, body: DevFinalizeRoundBody):
    signals = _read_jsonl(SIGNALS_PATH)
    sig_map: Dict[str, Dict[str, int]] = {}

    for s in signals:
        if s.get("arenaId") != arena_id:
            continue
        if s.get("roundId") != "dev_live":
            continue
        aid = str(s.get("agentId") or "")
        if not aid:
            continue

        cur = sig_map.get(aid, {})
        inc = s.get("signals") if isinstance(s.get("signals"), dict) else {}
        for k, v in inc.items():
            cur[k] = int(cur.get(k, 0) or 0) + int(v or 0)
        sig_map[aid] = cur

    agent_ids = body.agentIds or list(sig_map.keys())
    entries = []
    for aid in agent_ids:
        entries.append(
            {
                "entryId": f"ent_{aid}",
                "agentId": aid,
                "strategyUsed": body.strategies.get(aid, "BALANCED"),
                "signals": sig_map.get(aid, {}),
            }
        )

    summary = finalize_round(arena_id=arena_id, prompt=body.prompt, entries=entries)
    emit(
        "ARENA_ROUND_FINALIZED",
        actor_type="system",
        context={"arena_id": arena_id, "round_id": summary["roundId"]},
    )
    return {"ok": True, "arenaId": arena_id, "roundId": summary["roundId"]}
