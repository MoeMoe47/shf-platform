from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
import json
import os
import re
import uuid

from .store import append_round
from .scoring import score_from_signals
from .explain import generate_explanation
from .rollup import build_loo_payload


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _env_true(name: str, default: str = "1") -> bool:
    v = (os.getenv(name, default) or "").strip().lower()
    return v in {"1", "true", "yes", "y", "on"}


def _slug_words(prompt: str, n: int = 6) -> List[str]:
    s = (prompt or "").strip().lower()
    s = re.sub(r"[^a-z0-9\s\-]+", "", s)
    parts = [p for p in re.split(r"\s+", s) if p]
    return parts[:n] if parts else ["arena", "prompt"]


def _title_case_words(words: List[str]) -> str:
    return " ".join(w[:1].upper() + w[1:] if w else "" for w in words)


def _content_card(prompt: str, strategy: str) -> Dict[str, Any]:
    """
    Deterministic, spectator-safe content card.
    No raw agent text. No LLM calls. No randomness.
    """
    words = _slug_words(prompt, n=6)
    base_title = _title_case_words(words[:4])

    strategy = (strategy or "BALANCED").upper()

    w1 = words[0] if len(words) > 0 else "topic"
    w2 = words[1] if len(words) > 1 else "steps"
    w3 = words[2] if len(words) > 2 else "rules"

    if strategy == "HOOK_FIRST":
        title = f"{base_title}: The 5-Second Hook"
        hook = f"Stop scrolling—here’s the fastest way to understand {w1}."
        beats = [
            f"Hook: one bold claim about {w1}.",
            f"Proof: a quick example tied to {w2}.",
            f"Payoff: what you can do today without breaking {w3}.",
        ]
    elif strategy == "STEP_BY_STEP":
        title = f"{base_title}: Step-by-Step Guide"
        hook = f"Here’s a simple checklist to handle {w1} correctly."
        beats = [
            f"Step 1: Define the goal for {w1}.",
            f"Step 2: Apply rules/constraints for {w2}.",
            f"Step 3: Verify outcomes and log evidence for {w3}.",
        ]
    elif strategy == "STORYTELLING":
        title = f"{base_title}: A Short Story Version"
        hook = f"Imagine a team trying {w1}—this is what happens."
        beats = [
            f"Setup: the challenge around {w1}.",
            f"Conflict: tradeoffs in {w2} and incentives.",
            f"Resolution: the lesson that protects {w3}.",
        ]
    elif strategy == "DEBATE":
        title = f"{base_title}: Debate Style"
        hook = f"Two strong sides argue {w1}—who wins and why?"
        beats = [
            f"Side A: the strongest argument for {w1}.",
            f"Side B: the strongest risk against {w2}.",
            f"Verdict: a balanced rule that prevents {w3}.",
        ]
    elif strategy == "SHORT_PUNCHY":
        title = f"{base_title}: Quick Hits"
        hook = f"{w1}. {w2}. {w3}. Done."
        beats = [
            f"One-liner: what matters most about {w1}.",
            f"Do this next: a fast action tied to {w2}.",
            f"Avoid this: the common mistake that breaks {w3}.",
        ]
    else:
        title = f"{base_title}: Clean Summary"
        hook = f"Here’s the cleanest way to understand {w1} without overthinking it."
        beats = [
            f"Core idea: what {w1} means in plain English.",
            f"How it works: the key parts of {w2}.",
            f"Safety check: the rule that protects {w3}.",
        ]

    return {"title": title, "hook": hook, "beats": beats}


def _write_latest_loo_payload(days: int = 30) -> Dict[str, Any]:
    """
    Background-only: generates and writes db/arena/loo_payload.latest.json
    """
    payload = build_loo_payload(days=int(days))

    # repo_root/services/shf-agent-fabric/fabric/arena/engine.py -> repo_root/services/shf-agent-fabric
    root = Path(__file__).resolve().parents[2]
    out_dir = root / "db" / "arena"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "loo_payload.latest.json"
    out_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return {"ok": True, "days": int(days), "path": str(out_file)}


def finalize_round(arena_id: str, prompt: str, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Deterministically finalize a round:
      - compute score per entry
      - rank
      - add winner
      - attach spectator-safe contentCard
      - store summary to rounds.jsonl
      - (NEW) write LOO rollup payload (background-only)
    """
    round_id = f"rnd_{uuid.uuid4().hex[:12]}"
    now = _utc_iso()

    scored: List[Dict[str, Any]] = []
    for e in entries:
        sig = e.get("signals") if isinstance(e.get("signals"), dict) else {}
        sig2 = {k: int(v or 0) for k, v in sig.items()}

        score = score_from_signals(sig2)
        strat = str(e.get("strategyUsed") or "BALANCED")

        scored.append(
            {
                **e,
                "strategyUsed": strat,
                "score": score,
                "contentCard": _content_card(prompt=prompt, strategy=strat),
                "explanation": generate_explanation(strategy=strat, score=score, signals=sig2),
            }
        )

    scored.sort(key=lambda x: float(x.get("score") or 0.0), reverse=True)
    for i, e in enumerate(scored, start=1):
        e["rank"] = i

    winner = scored[0] if scored else None

    summary = {
        "roundId": round_id,
        "arenaId": arena_id,
        "status": "FINAL",
        "startedAt": now,
        "endedAt": now,
        "prompt": prompt,
        "rulesetVersion": "arena_v1",
        "results": {
            "winner": winner,
            "entries": scored,
        },
    }

    append_round(summary)

    # ✅ Auto-rollup for LOO (background-only)
    rollup_note = None
    if _env_true("ARENA_LOO_ROLLUP_ON_FINALIZE", "1"):
        try:
            rollup_note = _write_latest_loo_payload(days=int(os.getenv("ARENA_LOO_ROLLUP_DAYS", "30")))
        except Exception as ex:
            rollup_note = {"ok": False, "error": "ROLLUP_WRITE_FAILED", "detail": str(ex)}

    summary["looRollup"] = rollup_note
    return summary
