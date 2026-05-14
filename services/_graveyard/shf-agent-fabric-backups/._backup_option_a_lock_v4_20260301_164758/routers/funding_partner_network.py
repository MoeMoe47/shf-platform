from fastapi import APIRouter
from typing import Dict,Any

from fabric.funding.partner_registry_db import (
    register_partner,
    add_webhook,
    network_map,
    verify_outcome
)

router = APIRouter(prefix="/api/funding", tags=["funding_network"])


