from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple
import math

def clamp(x: float, lo: float, hi: float) -> float:
    return lo if x < lo else hi if x > hi else x

def brier(p: float, outcome: int) -> float:
    # Lower is better. outcome ∈ {0,1}
    return (p - float(outcome)) ** 2

def payout_from_brier(p: float, outcome: int, stake: float) -> float:
    """
    Simple but strong:
    - If you predict well, you get positive payout.
    - If you predict badly, you lose stake (negative payout).
    Range: [-stake, +stake]
    """
    score = 1.0 - brier(p, outcome)  # 1 best, 0 worst
    return (2.0 * score - 1.0) * stake

def market_summary(positions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Weighted mean confidence per side + combined "market probability".
    Market probability = (scout_weighted - skeptic_weighted + 1) / 2 mapped into [0,1]
    (So skeptic pushes probability down.)
    """
    sw_sum = 0.0
    sw_w   = 0.0
    sk_sum = 0.0
    sk_w   = 0.0

    for pos in positions:
        p = float(pos["confidence"])
        w = float(pos["stake"])
        if pos["side"] == "scout":
            sw_sum += p * w
            sw_w += w
        else:
            sk_sum += p * w
            sk_w += w

    scout_mean  = (sw_sum / sw_w) if sw_w > 0 else None
    skeptic_mean= (sk_sum / sk_w) if sk_w > 0 else None

    # Convert skeptic_mean into "probability claim is false"
    # So if skeptic_mean=0.8, they are 80% confident claim is false → pushes claim true prob down.
    # If skeptic_mean=0.2, they are weak skeptic → minor push down.
    market_p = 0.5
    if scout_mean is not None and skeptic_mean is not None:
        market_p = clamp((scout_mean - skeptic_mean + 1.0) / 2.0, 0.0, 1.0)
    elif scout_mean is not None:
        market_p = clamp(0.5 + (scout_mean - 0.5) * 0.8, 0.0, 1.0)
    elif skeptic_mean is not None:
        market_p = clamp(0.5 - (skeptic_mean - 0.5) * 0.8, 0.0, 1.0)

    return {
        "scout_mean": scout_mean,
        "skeptic_mean": skeptic_mean,
        "market_p_true": market_p,
        "scout_stake": sw_w,
        "skeptic_stake": sk_w,
        "total_stake": sw_w + sk_w,
    }

def settle(positions: List[Dict[str, Any]], outcome: int) -> List[Dict[str, Any]]:
    """
    Settle each position with a payout rule:
    - Scouts predict P(claim true) using their confidence.
    - Skeptics predict P(claim false) using their confidence; convert to P(claim true)=1-confidence.
    """
    results = []
    for pos in positions:
        side = pos["side"]
        stake = float(pos["stake"])
        conf = float(pos["confidence"])
        if side == "scout":
            p_true = conf
        else:
            p_true = 1.0 - conf  # skeptic confidence is about falsehood
        pay = payout_from_brier(p_true, outcome, stake)
        results.append({
            "position_id": pos["id"],
            "actor_id": pos["actor_id"],
            "side": side,
            "stake": stake,
            "p_true_used": p_true,
            "outcome": outcome,
            "payout": pay,
        })
    return results
