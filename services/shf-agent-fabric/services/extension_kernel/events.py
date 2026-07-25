from __future__ import annotations

from services.extension_kernel.constants import EVENT_TYPES
from services.extension_kernel.models import ExtensionKernelEvent


def event_catalog() -> tuple[str, ...]:
    return EVENT_TYPES


def define_event(event_type: str, registration_id: str, payload: dict[str, object] | None = None) -> ExtensionKernelEvent:
    if event_type not in EVENT_TYPES:
        raise ValueError(f"unknown extension event type: {event_type}")
    return ExtensionKernelEvent(event_type=event_type, registration_id=registration_id, payload=dict(payload or {}))
