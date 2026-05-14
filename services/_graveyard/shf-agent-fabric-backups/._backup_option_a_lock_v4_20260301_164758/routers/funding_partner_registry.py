from __future__ import annotations

from fastapi import APIRouter, HTTPException
from typing import Any, Dict, List, Optional

from fabric.funding.partner_registry import (
    register_partner,
    add_webhook,
    network_map,
    verify_outcome,
)

router = APIRouter(prefix="/api/funding", tags=["funding_partner_network"])


