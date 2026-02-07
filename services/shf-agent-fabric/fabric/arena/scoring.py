from __future__ import annotations

from typing import Dict

# Deterministic weights (v1)
WEIGHTS = {
    "CLEAR": 0.30,
    "STRUCTURE": 0.25,
    "ENGAGE": 0.25,
    "CREATIVE": 0.15,
    "HUMOR": 0.05,
}

# Clean default: signals are expected 0..100 per category.
# With weights summing to 1.0, total lands naturally in 0..100.
SIGNAL_MAX_PER_KEY = 100.0


def score_from_signals(signals: Dict[str, int]) -> float:
    """
    Deterministic payoff. No randomness. Stable 0..100.
    """
    total = 0.0
    for k, w in WEIGHTS.items():
        v = float(signals.get(k, 0) or 0)

        # Clamp per key for stability and safety
        if v < 0:
            v = 0.0
        if v > SIGNAL_MAX_PER_KEY:
            v = SIGNAL_MAX_PER_KEY

        total += v * float(w)

    total = max(0.0, min(100.0, total))
    return float(round(total, 2))
