from fastapi import APIRouter
from services.ai_layer.rules_store import (
    load_rules_with_meta,
    list_rule_versions,
)

router = APIRouter(tags=["rules"])


@router.get("/rules/active")
def get_active_rules():
    return load_rules_with_meta()


@router.get("/rules/versions")
def get_rule_versions():
    return {
        "versions": list_rule_versions()
    }
