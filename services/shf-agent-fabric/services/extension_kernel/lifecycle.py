from __future__ import annotations

from services.extension_kernel.constants import ExtensionLifecycleState, LIFECYCLE_STATES
from services.extension_kernel.errors import ExtensionKernelValidationError

TRANSITIONS: dict[str, tuple[str, ...]] = {
    ExtensionLifecycleState.DISCOVERED.value: (ExtensionLifecycleState.REGISTERED.value, ExtensionLifecycleState.DISABLED.value),
    ExtensionLifecycleState.REGISTERED.value: (ExtensionLifecycleState.VALIDATED.value, ExtensionLifecycleState.SUSPENDED.value, ExtensionLifecycleState.DISABLED.value),
    ExtensionLifecycleState.VALIDATED.value: (ExtensionLifecycleState.OWNER_APPROVED.value, ExtensionLifecycleState.LIMITED.value, ExtensionLifecycleState.SUSPENDED.value),
    ExtensionLifecycleState.OWNER_APPROVED.value: (ExtensionLifecycleState.READY.value, ExtensionLifecycleState.SUSPENDED.value),
    ExtensionLifecycleState.READY.value: (ExtensionLifecycleState.ACTIVE.value, ExtensionLifecycleState.LIMITED.value, ExtensionLifecycleState.DISABLED.value),
    ExtensionLifecycleState.ACTIVE.value: (ExtensionLifecycleState.LIMITED.value, ExtensionLifecycleState.SUSPENDED.value, ExtensionLifecycleState.DISABLED.value, ExtensionLifecycleState.RETIRED.value),
    ExtensionLifecycleState.LIMITED.value: (ExtensionLifecycleState.READY.value, ExtensionLifecycleState.ACTIVE.value, ExtensionLifecycleState.SUSPENDED.value, ExtensionLifecycleState.DISABLED.value),
    ExtensionLifecycleState.SUSPENDED.value: (ExtensionLifecycleState.LIMITED.value, ExtensionLifecycleState.DISABLED.value, ExtensionLifecycleState.RETIRED.value),
    ExtensionLifecycleState.DISABLED.value: (ExtensionLifecycleState.REGISTERED.value, ExtensionLifecycleState.RETIRED.value),
    ExtensionLifecycleState.RETIRED.value: (),
}


def allowed_next_states(state: str) -> tuple[str, ...]:
    if state not in LIFECYCLE_STATES:
        raise ExtensionKernelValidationError(f"unknown lifecycle state: {state}")
    return TRANSITIONS[state]


def can_transition(current: str, target: str) -> bool:
    return target in allowed_next_states(current)


def require_transition(current: str, target: str) -> None:
    if not can_transition(current, target):
        raise ExtensionKernelValidationError(f"invalid lifecycle transition: {current} -> {target}")
