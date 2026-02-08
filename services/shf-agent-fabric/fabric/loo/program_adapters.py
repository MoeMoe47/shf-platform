from __future__ import annotations

# Compatibility shim:
# Older imports may still reference fabric.loo.program_adapters.
# Source of truth is fabric.loo.adapter_registry.

from fabric.loo.adapter_registry import (  # noqa: F401
    PROGRAM_ADAPTERS,
    PROGRAM_ADAPTER_META,
    ProgramMetricsAdapter,
    ProgramAdapter,
    Metrics,
)
