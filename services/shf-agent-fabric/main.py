from __future__ import annotations
from api.routes.operator_issuances_alias import router as operator_issuances_alias_router
from api.routes.operator_allocations import router as operator_allocations_router
from api.routes.operator_treasury_ledger import router as operator_treasury_ledger_router
from api.routes.operator_contract_issuances import router as operator_contract_issuances_router
from api.routes.operator_contracts import router as operator_contracts_router
from api.routes.operator_actions import router as operator_actions_router
import hashlib
import inspect
import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Callable, Iterable

from dotenv import load_dotenv
from fastapi import FastAPI
from fabric.funding.middleware_ruleset_sha import RulesetShaMiddleware
from routes.exports import router as exports_router
from app.api.routes.growth import router as growth_router
from app.api.routes.self_audit import router as self_audit_router
from fastapi.middleware.cors import CORSMiddleware

# Load env early
load_dotenv()

# Compliance Gate G must hard-pass at import time (locked behavior)
from fabric.startup_verify import verify_compliance_gate_g_or_die  # noqa: E402

verify_compliance_gate_g_or_die()

# Minimum enforcement checks (registers into layer check registry)
import fabric.layers.checks_min  # noqa: F401,E402

# LOO parity + contracts
from fabric.loo.adapter_contract import validate_program_adapters  # noqa: E402
from fabric.loo.adapter_meta_parity import assert_adapter_meta_parity  # noqa: E402
from fabric.loo.adapter_registry import PROGRAM_ADAPTERS, PROGRAM_ADAPTER_META  # noqa: E402
from fabric.loo.catalog_parity import validate_program_catalog_parity  # noqa: E402

# Registry ledger
from fabric.registry_event_ledger import auditor_one_liner, verify_ledger  # noqa: E402

# DB
from db.db import init_db  # noqa: E402

# Routers
from routers.api_v1 import router as api_v1_router  # noqa: E402
from routers.funding_simulator import router as funding_simulator_router
from routers.status_routes import router as status_router  # noqa: E402
from routers.health_routes import router as health_router  # noqa: E402
from routers.funding_replay_crypto import router as funding_replay_crypto_router

from routers.alignment.routes_gateway import router as alignment_gateway_router  # noqa: E402
from routers.alignment.routes_admin import router as alignment_admin_router  # noqa: E402
from routers.alignment.routes_plans_admin import router as alignment_plans_admin_router  # noqa: E402

from routers.watchtower_routes import router as watchtower_router
from routers.watchtower_attestation_routes import router as watchtower_attestation_router  # noqa: E402

try:
    from fabric.watchtower.snapshot_verify import verify_snapshot_store  # type: ignore
except Exception:
    verify_snapshot_store = None  # type: ignore

from routers.loo_routes import router as loo_router  # noqa: E402
from routers.loo_rankings_routes import router as loo_rankings_router  # noqa: E402
from routers.loo_adapters_routes import router as loo_adapters_router  # noqa: E402

from routers.loe_routes import router as loe_router  # noqa: E402
from routers.predict_routes import router as predict_router  # noqa: E402

from routers.artifacts_routes import router as artifacts_router  # noqa: E402
from routers.registry_routes import router as registry_router  # noqa: E402
from routers.plan_routes import router as plan_router  # noqa: E402
from routers.run_routes import router as run_router  # noqa: E402
from routers.run_report_routes import router as run_report_router  # noqa: E402
from routers.tools_routes import router as tools_router  # noqa: E402
from routers.runs_routes import router as runs_router  # noqa: E402
from routers.runs_registry_routes import router as runs_registry_router  # noqa: E402
from routers.runs_loo_payload_routes import router as runs_loo_payload_router  # noqa: E402

from routers.reports_routes import router as reports_router  # noqa: E402
from routers.source_registry_routes import router as source_registry_router  # noqa: E402
from routers.data_aggregator_routes import router as data_aggregator_router  # noqa: E402
from routers.data_normalization_routes import router as data_normalization_router  # noqa: E402
from routers.evidence_package_routes import router as evidence_package_router  # noqa: E402
from routers.data_verification_routes import router as data_verification_router  # noqa: E402
from routers.data_approval_routes import router as data_approval_router  # noqa: E402
from routers.truth_routes import router as truth_router  # noqa: E402
from routers.oracle_routes import router as oracle_router  # noqa: E402
from routers.ai_guardrails_routes import router as ai_guardrails_router  # noqa: E402
from routers.game_theory_routes import router as game_theory_router  # noqa: E402
from routers.feedback_routes import router as feedback_router  # noqa: E402
from routers.events_routes import router as events_router
from routers.live_optimizer_routes import router as live_optimizer_router
from routers.comparison_routes import router as comparison_router  # noqa: E402
from routers.lifecycle_routes import router as lifecycle_router  # noqa: E402
from routers.rules_routes import router as rules_router  # noqa: E402
from routers.decision_routes import router as decision_router  # noqa: E402
from routers.ai_feedback_routes import router as ai_feedback_router  # noqa: E402

# ✅ Arena (v1 frozen)
from routers.arena_routes import router as arena_router  # noqa: E402
from routers.arena_rollup_routes import router as arena_rollup_router  # noqa: E402

# Admin
from routers.admin_force_routes import router as admin_force_router  # noqa: E402
from routers.admin_agents_routes import router as admin_agents_router  # noqa: E402
from routers.admin_registry_routes import router as admin_registry_router  # noqa: E402
from routers.admin_layers_routes import router as admin_layers_router  # noqa: E402
from routers.admin_gate_routes import router as admin_gate_router  # noqa: E402
from routers.admin_infra_verify_routes import router as admin_infra_verify_router  # noqa: E402
from routers.admin_observability_routes import router as admin_observability_router  # noqa: E402
from routers.funding_rulesets import router as funding_rulesets_router


from routers.funding_capabilities import router as funding_capabilities_router
from routers.funding_partner import router as funding_partner_router
from routers.funding_replay import router as funding_replay_router
from routers.bfe_routes import router as bfe_router
log = logging.getLogger("shf-agent-fabric")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())


def _env_true(name: str, default: str = "1") -> bool:
    v = os.getenv(name, default).strip().lower()
    return v in {"1", "true", "yes", "y", "on"}


def _maybe_await(res):
    if inspect.isawaitable(res):
        return res
    return None


def _repo_root() -> Path:
    # services/shf-agent-fabric/main.py -> services/shf-agent-fabric/
    return Path(__file__).resolve().parent


# -------------------------
# Startup tasks (called by lifespan)
# -------------------------

def _startup_init_db() -> None:
    # Safe init (idempotent)
    init_db()


def _startup_verify_registry_ledger() -> None:
    """
    Auto-verify registry ledger on startup.
    Hard failure is intentional (ledger integrity is non-negotiable).
    """
    if not _env_true("SHF_LEDGER_VERIFY_ON_STARTUP", "1"):
        log.warning("[LEDGER] startup verify disabled by SHF_LEDGER_VERIFY_ON_STARTUP=0")
        return

    # verify_ledger() signature can evolve; treat tuple/list and dict safely
    res = verify_ledger()
    ok = False
    reason = "unknown"
    if isinstance(res, (tuple, list)) and len(res) >= 1:
        ok = bool(res[0])
        reason = str(res[1]) if len(res) >= 2 else ""
    elif isinstance(res, dict):
        ok = bool(res.get("ok", False))
        reason = str(res.get("reason", res.get("error", "")))
    else:
        ok = bool(res)
        reason = ""

    if not ok:
        msg = f"[LEDGER] FAIL: {reason}"
        log.error(msg)
        raise RuntimeError(msg)

    # Optional one-liner summary
    try:
        log.info(auditor_one_liner())
    except Exception:
        # Do not fail startup for logging-only issues
        log.info("[LEDGER] verified (auditor_one_liner unavailable)")




def _startup_verify_watchtower_snapshot_store() -> None:
    """
    Hard-fail startup if Watchtower snapshot store cannot be verified.
    This guarantees: schema exists, DB is writable, and (if enabled) hash-chain is consistent.
    """
    if not _env_true("SHF_WATCHTOWER_SNAPSHOT_VERIFY_ON_STARTUP", "1"):
        log.warning("[WATCHTOWER] snapshot verify disabled by SHF_WATCHTOWER_SNAPSHOT_VERIFY_ON_STARTUP=0")
        return

    res = verify_snapshot_store()
    # --- normalize verify_snapshot_store return (dict or tuple) ---
    if isinstance(res, tuple):
        a = res[0] if len(res) > 0 else None
        b = res[1] if len(res) > 1 else None
        if isinstance(a, dict):
            res = a
            if b is not None:
                res.setdefault("details", b)
        else:
            res = {"ok": bool(a), "details": b}
    elif not isinstance(res, dict):
        res = {"ok": bool(res), "details": None}
    if not bool(res.get('ok')):
        msg = f"[WATCHTOWER] snapshot verify FAIL: {res}"
        log.error(msg)
        raise RuntimeError(msg)

    log.info("[WATCHTOWER] snapshot store verified (enforcement-grade)")
def _sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _startup_hard_fail_watchtower_risk_engine_lock() -> None:
    """
    Startup hard-fail: Watchtower risk engine must match the runtime enforcement lock.
    This makes your quarantine/risk gates enforcement-grade end-to-end.
    """
    if not _env_true("SHF_RISK_ENGINE_LOCK_ON_STARTUP", "1"):
        log.warning("[LOCK] risk_engine lock verify disabled by SHF_RISK_ENGINE_LOCK_ON_STARTUP=0")
        return

    rr = _repo_root()
    lock_file = rr / "contracts" / "locks" / "runtime_enforcement.lock.json"
    rel = "fabric/watchtower/risk_engine.py"
    target = rr / rel

    if not lock_file.exists():
        raise RuntimeError(f"[LOCK] missing lock file: {lock_file}")
    if not target.exists():
        raise RuntimeError(f"[LOCK] missing target file: {target}")

    lock = json.loads(lock_file.read_text(encoding="utf-8"))
    files = lock.get("files") or {}
    spec = files.get(rel) or {}
    expected = str(spec.get("sha256") or "").strip()
    required = bool(spec.get("required", True))

    if required and not expected:
        raise RuntimeError(f"[LOCK] missing sha256 entry for {rel} in {lock_file}")

    actual = _sha256_file(target)

    if required and actual != expected:
        msg = (
            "[LOCK] risk_engine lock FAIL\n"
            f"  file: {rel}\n"
            f"  expected: {expected}\n"
            f"  actual:   {actual}\n"
        )
        log.error(msg)
        raise RuntimeError(msg)

    log.info("[LOCK] risk_engine verified (sha256 match)")


def _startup_validate_program_adapters() -> None:
    # Fail fast if any program adapter violates the metrics contract.
    validate_program_adapters(PROGRAM_ADAPTERS, days=30, baseline_weeks=8)


def _startup_validate_adapter_meta_parity() -> None:
    # Fail fast if adapter registry + meta drift out of sync.
    assert_adapter_meta_parity(PROGRAM_ADAPTERS, PROGRAM_ADAPTER_META)


def _startup_validate_program_catalog_parity() -> None:
    # Fail fast if /loo/programs and PROGRAM_ADAPTERS drift.
    validate_program_catalog_parity(PROGRAM_ADAPTERS)


_STARTUP_TASKS: Iterable[Callable[[], object]] = (
    _startup_init_db,
    _startup_verify_registry_ledger,
    _startup_verify_watchtower_snapshot_store,
    _startup_hard_fail_watchtower_risk_engine_lock,  # ✅ NEW: enforcement-grade startup lock
    _startup_validate_program_adapters,
    _startup_validate_adapter_meta_parity,
    _startup_validate_program_catalog_parity,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    for fn in _STARTUP_TASKS:
        if fn is None:
            continue
        res = fn()
        maybe = _maybe_await(res)
        if maybe is not None:
            await maybe

    yield
    # SHUTDOWN (none right now)


# -------------------------
# App
# -------------------------

app = FastAPI(lifespan=lifespan, title="SHF Agent Fabric")


# 🔥 AI SYSTEM ROUTES (NEW)
app.include_router(lifecycle_router)
app.include_router(rules_router)
app.include_router(decision_router)
app.include_router(ai_feedback_router)


# 🔥 LIVE OPTIMIZER ROUTES
app.include_router(live_optimizer_router)
app.include_router(comparison_router)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):(5173|5174|5175|5176)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Top-1%: ruleset integrity hashes (sha256) for /rulesets + /discovery
app.add_middleware(RulesetShaMiddleware)

# === FUNDING POLICY GUARD (CANONICAL, SINGLE SOURCE) ===
# Enforces: funding is read-only + compute-only.
# Allow:  GET/HEAD/OPTIONS under /api/funding/*
# Allow:  POST /api/funding/simulate
# Deny:   POST/PUT/PATCH/DELETE for any other /api/funding/* endpoint.
from fastapi import Request
from fastapi.responses import JSONResponse

@app.middleware("http")
async def funding_policy_guard(request: Request, call_next):
    # === ALLOWLIST_REPLAY_TOP1P BEGIN ===
    # Deterministic Policy Replay Engine endpoints must be writable for audit journaling.
    try:
        _pg_path = request.scope.get('path', '')
    except Exception:
        _pg_path = ''
    if isinstance(_pg_path, str) and _pg_path.startswith('/api/funding/replay/'):
        return await call_next(request)
    # === ALLOWLIST_REPLAY_TOP1P END ===

    path = request.url.path
    # ALLOWLIST: deterministic audit replay endpoints must be writable
    # (record decisions + replay them later)
    if str(path).startswith('/api/funding/replay/'):
        return await call_next(request)

    method = request.method.upper()

    if path.startswith("/api/funding/"):
        if method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)

        if method == "POST" and path == "/api/funding/simulate":
            return await call_next(request)

        return JSONResponse(
            status_code=405,
            content={
                "schema_version": "AIM_POLICY_GUARD_V2",
                "ok": False,
                "error": "METHOD_NOT_ALLOWED",
                "message": "Funding API is read-only + compute-only. Only POST /api/funding/simulate is allowed.",
                "path": path,
                "method": method,
                "allowed": ["GET", "HEAD", "OPTIONS", "POST /api/funding/simulate"],
            },
        )

    return await call_next(request)


# Funding Policy Guard (locks funding surface)
app.include_router(exports_router)
app.include_router(funding_simulator_router)
app.include_router(funding_rulesets_router)
app.include_router(growth_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv("SHF_WEB_ORIGIN", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routers
app.include_router(status_router)
app.include_router(health_router)
app.include_router(api_v1_router)
app.include_router(self_audit_router)

# Alignment
app.include_router(alignment_gateway_router)
app.include_router(alignment_admin_router)
app.include_router(alignment_plans_admin_router)

# Watchtower / LOO / LOE / Predict
app.include_router(watchtower_router)


app.include_router(watchtower_attestation_router)
app.include_router(loo_router)
app.include_router(loo_rankings_router)
app.include_router(loo_adapters_router)

app.include_router(loe_router)
app.include_router(predict_router)

# Runs + artifacts + registry + plans
app.include_router(artifacts_router)
app.include_router(registry_router)
app.include_router(plan_router)
app.include_router(run_router)
app.include_router(run_report_router)
app.include_router(tools_router)

app.include_router(runs_router)
app.include_router(runs_registry_router)
app.include_router(runs_loo_payload_router)

# Reports / feedback / events
app.include_router(source_registry_router)
app.include_router(data_aggregator_router)
app.include_router(data_normalization_router)
app.include_router(evidence_package_router)
app.include_router(data_verification_router)
app.include_router(data_approval_router)
app.include_router(truth_router)
app.include_router(oracle_router)
app.include_router(ai_guardrails_router)
app.include_router(game_theory_router)
app.include_router(reports_router)
app.include_router(feedback_router)
app.include_router(events_router)

# Arena (v1 frozen)
app.include_router(arena_router)
app.include_router(arena_rollup_router)

# Admin
app.include_router(admin_force_router)
app.include_router(admin_agents_router)
app.include_router(admin_registry_router)
app.include_router(admin_layers_router)
app.include_router(admin_gate_router)
app.include_router(admin_infra_verify_router)
app.include_router(admin_observability_router)


app.include_router(funding_capabilities_router)
app.include_router(funding_partner_router)
app.include_router(funding_replay_router)
app.include_router(funding_replay_crypto_router)
@app.get("/", tags=["meta"])
def root() -> dict:
    return {"ok": True, "service": "shf-agent-fabric"}


if __name__ == "__main__":
    # Optional local run
    import uvicorn  # type: ignore

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8090")),
        reload=_env_true("RELOAD", "0"),
    )




app.include_router(operator_actions_router)
app.include_router(operator_contracts_router)
app.include_router(operator_contract_issuances_router)
app.include_router(operator_treasury_ledger_router)
app.include_router(operator_allocations_router)
app.include_router(operator_issuances_alias_router)
app.include_router(bfe_router)
