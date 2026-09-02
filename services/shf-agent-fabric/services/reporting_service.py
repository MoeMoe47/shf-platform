from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from services.metric_registry_service import MetricCalculationError, MetricRegistryError, calculate_metric, get_metric_definition

SERVICE_ROOT = Path(__file__).resolve().parents[1]
REPORT_REGISTRY_PATH = SERVICE_ROOT / "contracts" / "reporting" / "report_registry.v1.json"

class ReportingRegistryError(ValueError): pass

def validate_report_registry(registry: Dict[str, Any]) -> None:
    definitions = registry.get("definitions") if isinstance(registry, dict) else None
    if not isinstance(definitions, list) or not definitions: raise ReportingRegistryError("report registry must contain definitions")
    seen = set()
    for definition in definitions:
        key = (definition.get("report_definition_id"), definition.get("version"))
        if key in seen: raise ReportingRegistryError("duplicate report definition")
        seen.add(key)
        if not definition.get("metric_ids") or not definition.get("permission") or definition.get("status") == "UNRESOLVED": raise ReportingRegistryError("invalid report definition")
        for metric_id in definition["metric_ids"]:
            try:
                get_metric_definition(metric_id)
            except MetricRegistryError as exc:
                raise ReportingRegistryError("report references unknown metric") from exc

def load_report_registry(path: Path = REPORT_REGISTRY_PATH) -> Dict[str, Any]:
    try: registry = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc: raise ReportingRegistryError("report registry unavailable") from exc
    validate_report_registry(registry)
    return registry


def _get_report_definition(report_definition_id: str) -> Dict[str, Any]:
    matches = [definition for definition in load_report_registry()["definitions"] if definition.get("report_definition_id") == report_definition_id and definition.get("status") == "active"]
    if len(matches) != 1:
        raise ReportingRegistryError("report definition not authorized")
    return matches[0]


def _generate_report(report_definition_id: str, actor: Any, period_start: str, period_end: str, public: bool = False, correlation_id: str | None = None) -> Dict[str, Any]:
    definition = _get_report_definition(report_definition_id)
    metrics = [calculate_metric(metric_id, actor.organization_id, period_start, period_end, actor, public=public, correlation_id=correlation_id) for metric_id in definition["metric_ids"]]
    if public and any(metric.get("public_eligibility") is not True for metric in metrics):
        raise MetricCalculationError("public_metric_not_eligible")
    metric = metrics[0]
    claim_ids = sorted({claim_id for item in metrics for claim_id in item.get("source_claim_ids", [])})
    claim_versions = [version for item in metrics for version in item.get("source_claim_versions", [])]
    evidence_ids = sorted({evidence_id for item in metrics for evidence_id in item.get("source_evidence_ids", [])})
    assignment_ids = sorted({assignment_id for item in metrics for assignment_id in item.get("assignment_ids", [])})
    release_ids = sorted({release_id for item in metrics for release_id in item.get("curriculum_release_ids", [])})
    calculated_at = max(item["calculated_at"] for item in metrics)
    return {
        "report_id": f"report.{definition['report_definition_id']}.v{definition['version']}",
        "report_result_id": f"{definition['report_definition_id']}:v{definition['version']}:{period_start}:{period_end}:{actor.organization_id}",
        "report_definition_id": definition["report_definition_id"],
        "report_definition_version": definition["version"],
        "tenant_id": f"tenant:{actor.organization_id}",
        "organization_id": actor.organization_id,
        "period_start": period_start,
        "period_end": period_end,
        "generated_at": calculated_at,
        "metric_results": metrics,
        "verification_status": "verified" if all(item["verification_status"] == "verified" for item in metrics) else "pending",
        "public_eligibility": public and all(item.get("public_eligibility") is True for item in metrics),
        "suppression_status": "not_suppressed" if all(item.get("suppression_status") == "not_suppressed" for item in metrics) else "suppressed",
        "definition_digest": metric["definition_digest"],
        "lineage_reference": {"source_claim_ids": claim_ids, "source_claim_versions": claim_versions, "source_evidence_ids": evidence_ids, "assignment_ids": assignment_ids, "curriculum_release_ids": release_ids, "organization_id": actor.organization_id},
        "freshness": {"calculated_at": calculated_at, "data_through": period_end, "source_watermarks": sorted({item.get("source_watermark") for item in metrics if item.get("source_watermark")})},
        "warnings": [warning for item in metrics for warning in item.get("warnings", [])],
        "correlation_id": correlation_id,
    }

def generate_curriculum_completion_report(actor: Any, period_start: str, period_end: str, public: bool = False, correlation_id: str | None = None) -> Dict[str, Any]:
    return _generate_report("curriculum.lesson_completion_count", actor, period_start, period_end, public=public, correlation_id=correlation_id)


def generate_curriculum_learning_progress_report(actor: Any, period_start: str, period_end: str, public: bool = False, correlation_id: str | None = None) -> Dict[str, Any]:
    return _generate_report("curriculum.learning_progress", actor, period_start, period_end, public=public, correlation_id=correlation_id)


def generate_hub_referral_created_count_report(actor: Any, period_start: str, period_end: str, public: bool = False, correlation_id: str | None = None) -> Dict[str, Any]:
    return _generate_report("hub.referral.created_count", actor, period_start, period_end, public=public, correlation_id=correlation_id)


def generate_exchange_funding_commitment_count_report(actor: Any, period_start: str, period_end: str, public: bool = False, correlation_id: str | None = None) -> Dict[str, Any]:
    if public:
        raise MetricCalculationError("public_metric_not_eligible")
    return _generate_report("exchange.funding.commitment_count", actor, period_start, period_end, public=False, correlation_id=correlation_id)


def generate_workforce_employment_started_verified_count_report(actor: Any, period_start: str, period_end: str, public: bool = False, correlation_id: str | None = None) -> Dict[str, Any]:
    if public:
        raise MetricCalculationError("public_metric_not_eligible")
    return _generate_report("workforce.employment.started_verified_count", actor, period_start, period_end, public=False, correlation_id=correlation_id)
