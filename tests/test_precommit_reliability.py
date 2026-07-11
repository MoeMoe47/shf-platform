from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER_PATH = ROOT / "tools" / "precommit" / "check_ledger_precommit.py"


def load_ledger_module():
    spec = importlib.util.spec_from_file_location("check_ledger_precommit", LEDGER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_ledger_already_valid_exits_zero(monkeypatch):
    ledger = load_ledger_module()

    def fake_verify(timeout_seconds=30):
        return ledger.CommandResult(["python"], 0, "LEDGER PASS: chained v1 verified, events=1.\n", "", 0.01)

    monkeypatch.setattr(ledger, "verify_ledger", fake_verify)
    assert ledger.main() == 0


def test_ledger_invalid_exits_nonzero(monkeypatch):
    ledger = load_ledger_module()

    def fake_verify(timeout_seconds=30):
        return ledger.CommandResult(["python"], 2, "LEDGER FAIL: hash_mismatch at index=1.\n", "", 0.01)

    monkeypatch.setattr(ledger, "verify_ledger", fake_verify)
    assert ledger.main() == 2


def test_verification_command_timeout_cleans_exact_child():
    ledger = load_ledger_module()
    result = ledger.run_bounded_command(
        [sys.executable, "-c", "import time; time.sleep(10)"],
        ROOT,
        timeout_seconds=1,
    )
    assert result.timed_out is True
    assert result.returncode != 0
    assert result.pid is not None
    assert any(action == f"terminate pid={result.pid}" for action in result.cleanup_actions or [])


def test_port_occupied_by_unrelated_process_is_not_touched(monkeypatch):
    ledger = load_ledger_module()

    def fake_verify(timeout_seconds=30):
        return ledger.CommandResult(["python"], 0, "LEDGER PASS while unrelated port is ignored.\n", "", 0.01)

    monkeypatch.setattr(ledger, "verify_ledger", fake_verify)
    assert ledger.main() == 0
    ledger_text = LEDGER_PATH.read_text()
    assert "lsof" not in ledger_text
    assert "restart_8090" not in ledger_text
    assert "kill_port_listeners" not in ledger_text


def test_server_already_running_is_not_restarted_or_killed():
    legacy_bin = ROOT / "services" / "shf-agent-fabric" / "bin" / "ledger_precommit.sh"
    legacy_scripts = ROOT / "services" / "shf-agent-fabric" / "scripts" / "ledger_precommit.sh"
    combined = legacy_bin.read_text() + "\n" + legacy_scripts.read_text()
    assert "restart_8090" not in combined
    assert "lsof" not in combined
    assert "kill " not in combined
    assert "/admin/registry/events/verify" not in combined


def test_http_route_unavailable_cannot_hang_precommit_path():
    hook_text = (ROOT / ".pre-commit-config.yaml").read_text()
    ledger_text = LEDGER_PATH.read_text()
    assert "check_ledger_precommit.py" in hook_text
    assert "/admin/registry/events/verify" not in ledger_text
    assert "curl" not in ledger_text


def test_repeated_bounded_execution_terminates():
    ledger = load_ledger_module()
    for _ in range(5):
        result = ledger.run_bounded_command([sys.executable, "-c", "print('LEDGER PASS')"], ROOT, timeout_seconds=2)
        assert result.returncode == 0
        assert result.timed_out is False
        assert "LEDGER PASS" in result.stdout


def test_interrupted_run_cleanup_path_handles_sigterm_style_child():
    ledger = load_ledger_module()
    result = ledger.run_bounded_command(
        [sys.executable, "-c", "import signal, time; signal.signal(signal.SIGTERM, lambda *_: exit(7)); time.sleep(10)"],
        ROOT,
        timeout_seconds=1,
    )
    assert result.timed_out is True
    assert result.returncode == 7
    assert result.cleanup_actions == [f"terminate pid={result.pid}"]


def test_live_hook_runs_ledger_before_registry_guard():
    config = (ROOT / ".pre-commit-config.yaml").read_text()
    assert config.index("id: shf-ledger-verify") < config.index("id: shf-registry-guard")
