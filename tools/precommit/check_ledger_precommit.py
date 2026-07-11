#!/usr/bin/env python3
from __future__ import annotations

import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SERVICE_DIR = ROOT / "services" / "shf-agent-fabric"
DEFAULT_TIMEOUT_SECONDS = 30

VERIFY_CODE = """
from fabric.registry_event_ledger import verify_ledger, auditor_one_liner
v = verify_ledger()
print(auditor_one_liner(v))
raise SystemExit(0 if v.get("pass") is True else 2)
""".strip()


@dataclass
class CommandResult:
    argv: list[str]
    returncode: int
    stdout: str
    stderr: str
    elapsed: float
    timed_out: bool = False
    pid: int | None = None
    cleanup_actions: list[str] | None = None


def debug_enabled() -> bool:
    return os.environ.get("SHRV1_PRECOMMIT_DEBUG") == "1"


def debug(message: str) -> None:
    if debug_enabled():
        print(f"[SHRV1_PRECOMMIT_DEBUG] {message}", file=sys.stderr)


def build_verify_command() -> list[str]:
    return [sys.executable, "-c", VERIFY_CODE]


def run_bounded_command(argv: list[str], cwd: Path, timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS) -> CommandResult:
    start = time.monotonic()
    cleanup_actions: list[str] = []
    debug(f"start command={argv!r} pid={os.getpid()} ppid={os.getppid()} cwd={cwd} timeout={timeout_seconds}s")
    proc = subprocess.Popen(
        argv,
        cwd=str(cwd),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    debug(f"subprocess pid={proc.pid}")
    try:
        stdout, stderr = proc.communicate(timeout=timeout_seconds)
        elapsed = time.monotonic() - start
        debug(f"finish pid={proc.pid} returncode={proc.returncode} elapsed={elapsed:.3f}s")
        return CommandResult(argv, proc.returncode, stdout, stderr, elapsed, pid=proc.pid, cleanup_actions=cleanup_actions)
    except subprocess.TimeoutExpired as exc:
        cleanup_actions.append(f"terminate pid={proc.pid}")
        debug(f"timeout pid={proc.pid}; terminate")
        proc.terminate()
        try:
            stdout, stderr = proc.communicate(timeout=3)
        except subprocess.TimeoutExpired:
            cleanup_actions.append(f"kill pid={proc.pid}")
            debug(f"terminate grace expired pid={proc.pid}; kill")
            proc.kill()
            stdout, stderr = proc.communicate()
        elapsed = time.monotonic() - start
        partial_stdout = stdout or exc.stdout or ""
        partial_stderr = stderr or exc.stderr or ""
        debug(f"cleanup complete pid={proc.pid} returncode={proc.returncode} elapsed={elapsed:.3f}s")
        return CommandResult(
            argv,
            proc.returncode if proc.returncode is not None else 124,
            partial_stdout,
            partial_stderr,
            elapsed,
            timed_out=True,
            pid=proc.pid,
            cleanup_actions=cleanup_actions,
        )


def verify_ledger(timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS) -> CommandResult:
    if not SERVICE_DIR.exists():
        return CommandResult(build_verify_command(), 2, "", f"Missing service directory: {SERVICE_DIR}\n", 0.0)
    return run_bounded_command(build_verify_command(), SERVICE_DIR, timeout_seconds=timeout_seconds)


def main() -> int:
    start = time.monotonic()
    timeout_seconds = int(os.environ.get("SHRV1_LEDGER_VERIFY_TIMEOUT", str(DEFAULT_TIMEOUT_SECONDS)))
    print("SHRV1 ledger verification (direct, no server restart)")
    result = verify_ledger(timeout_seconds=timeout_seconds)
    if result.stdout:
        print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
    if result.stderr:
        print(result.stderr, end="" if result.stderr.endswith("\n") else "\n", file=sys.stderr)
    if result.timed_out:
        print(f"ERROR: timed out after {timeout_seconds}s: {' '.join(result.argv)}", file=sys.stderr)
        for action in result.cleanup_actions or []:
            print(f"cleanup: {action}", file=sys.stderr)
        debug(f"final exit=124 total_elapsed={time.monotonic() - start:.3f}s")
        return 124
    if result.returncode != 0:
        print(f"ERROR: ledger verification failed with exit {result.returncode}", file=sys.stderr)
        debug(f"final exit={result.returncode} total_elapsed={time.monotonic() - start:.3f}s")
        return result.returncode
    debug(f"final exit=0 total_elapsed={time.monotonic() - start:.3f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
