from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List
import os


def _env_int(name: str, default: str) -> int:
    try:
        return int(os.getenv(name, default).strip())
    except Exception:
        return int(default)


def _env_true(name: str, default: str = "0") -> bool:
    v = os.getenv(name, default).strip().lower()
    return v in {"1", "true", "yes", "y", "on"}


@dataclass(frozen=True)
class PolicyDecision:
    ok: bool
    policy_version: str
    reasons: List[str]
    meta: Dict[str, Any]


POLICY_VERSION = "watchtower_policy_v1"


def evaluate_attestation_policy(components: List[Dict[str, Any]]) -> PolicyDecision:
    """
    Policy scaffold for attestations (global chain roots).
    Keep it simple + deterministic.

    Defaults:
      - Require at least N programs present (env: SHF_ATTEST_MIN_PROGRAMS, default 1)
      - Optional strict rule: fail if any quarantined program exists (env: SHF_ATTEST_FAIL_ON_QUARANTINE, default 0)
    """
    reasons: List[str] = []
    min_programs = _env_int("SHF_ATTEST_MIN_PROGRAMS", "1")
    fail_on_quarantine = _env_true("SHF_ATTEST_FAIL_ON_QUARANTINE", "0")

    if len(components) < min_programs:
        reasons.append(f"min_programs_not_met:{len(components)}<{min_programs}")

    if fail_on_quarantine:
        q = [c.get("program_id") for c in components if bool(c.get("quarantined"))]
        if q:
            reasons.append(f"quarantined_present:{len(q)}")

    ok = len(reasons) == 0
    return PolicyDecision(
        ok=ok,
        policy_version=POLICY_VERSION,
        reasons=reasons,
        meta={
            "min_programs": min_programs,
            "fail_on_quarantine": fail_on_quarantine,
            "components_count": len(components),
        },
    )
