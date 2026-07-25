from __future__ import annotations

from services.extension_kernel.models import ExtensionKernelResult, ExtensionManifest
from services.extension_kernel.validation import validate_manifest


def diagnostics_for_manifest(manifest: ExtensionManifest) -> ExtensionKernelResult:
    result = validate_manifest(manifest)
    payload = {
        "extension_id": manifest.descriptor.extension_id,
        "lifecycle_state": manifest.lifecycle_state,
        "capability_count": len(manifest.capabilities),
        "dependency_count": len(manifest.dependencies),
        "validation_status": result.status,
    }
    return ExtensionKernelResult(ok=result.ok, status="diagnostic_pass" if result.ok else "diagnostic_fail", issues=result.issues, payload=payload)
