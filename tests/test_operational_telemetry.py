from __future__ import annotations

from services.operational_telemetry import (
    emit_operational_telemetry,
    operational_telemetry_snapshot,
    reset_operational_telemetry_for_tests,
    set_operational_telemetry_sink,
)


def teardown_function():
    reset_operational_telemetry_for_tests()


def test_telemetry_allowlists_metadata_without_sensitive_values():
    events = []
    set_operational_telemetry_sink(events.append)
    event = emit_operational_telemetry(
        event_name="report_failed",
        severity="ERROR",
        component="agent_fabric",
        category="REPORTING",
        outcome="SYSTEM_FAILURE",
        metadata={"reason": "calculation_failure", "password": "secret", "payload": "private", "email": "person@example.com"},
    )
    assert event["metadata"] == {"reason": "calculation_failure"}
    assert events[0] == event
    assert len(operational_telemetry_snapshot()) == 1


def test_telemetry_sink_failure_does_not_break_core_operation():
    set_operational_telemetry_sink(lambda _event: (_ for _ in ()).throw(RuntimeError("sink down")))
    event = emit_operational_telemetry(event_name="db_failure", severity="ERROR", component="agent_fabric", category="DATABASE", outcome="SYSTEM_FAILURE")
    assert event["outcome"] == "SYSTEM_FAILURE"
