from __future__ import annotations

from fabric.watchtower.risk_engine import classify_row


def test_quarantine_on_contract_errors():
    row = {
        "ok": True,
        "adapter_ok": True,
        "adapter_error": "",
        "evidence": {"contract_errors": ["X"]},
        "health_01": 1.0,
        "rank_score_01": 1.0,
        "delta_score_01": 0.0,
        "trend_band": "FLAT",
    }
    r = classify_row(row)
    assert r.quarantined is True
    assert r.risk_band == "QUARANTINE"


def test_green_when_healthy():
    row = {
        "ok": True,
        "adapter_ok": True,
        "adapter_error": "",
        "evidence": {"contract_errors": []},
        "health_01": 0.9,
        "rank_score_01": 0.8,
        "delta_score_01": 0.1,
        "trend_band": "UP",
    }
    r = classify_row(row)
    assert r.quarantined is False
    assert r.risk_band == "GREEN"
