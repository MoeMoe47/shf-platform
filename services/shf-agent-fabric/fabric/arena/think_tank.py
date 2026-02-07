from __future__ import annotations

from typing import Any, Dict, List


def summarize_recent(rounds: List[Dict[str, Any]], window: int = 5) -> Dict[str, Any]:
    recent = rounds[-window:] if len(rounds) > window else rounds
    if not recent:
        return {
            "strategyPulse": [],
            "emergingPatterns": ["No rounds yet."],
            "strategyHeatmap": [],
            "metaObservations": [],
            "disclaimer": "Summaries are aggregated and non-influential.",
        }

    win_counts: Dict[str, int] = {}
    for r in recent:
        winner = (r.get("results") or {}).get("winner")
        if isinstance(winner, dict):
            strat = str(winner.get("strategyUsed") or "UNKNOWN")
            win_counts[strat] = win_counts.get(strat, 0) + 1

    heatmap = [
        {"strategy": k, "winRate": v / max(1, len(recent)), "trend": "STABLE"}
        for k, v in win_counts.items()
    ]

    return {
        "strategyPulse": [],
        "emergingPatterns": [
            "Winning strategies align with the strongest scoring signals.",
            "Consistent structure tends to stabilize scores.",
        ],
        "strategyHeatmap": heatmap,
        "metaObservations": [
            "Clarity usually beats length.",
            "Engagement helps only when structure is present.",
        ],
        "disclaimer": "Summaries are aggregated and non-influential.",
    }
