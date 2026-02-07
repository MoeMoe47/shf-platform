from __future__ import annotations

from typing import Dict


def generate_explanation(*, strategy: str, score: float, signals: Dict[str, int]) -> Dict[str, str]:
    """
    Fixed deterministic explanation template.
    """
    top = sorted(signals.items(), key=lambda kv: kv[1], reverse=True)
    top2 = [k for (k, v) in top[:2] if v > 0] or ["CONSISTENCY"]

    return {
        "why": f"I chose {strategy.replace('_',' ').title()} because it fits this arena’s incentives.",
        "worked": f"What worked: {', '.join(top2)} signals were strongest.",
        "didnt": "What didn’t: Some areas were weaker this round.",
        "learned": f"What I learned: My score was {score}.",
        "next": "What I’ll try next: Adjust toward stronger signals without breaking the rules.",
    }
