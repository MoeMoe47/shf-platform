from __future__ import annotations

from services.extension_kernel.models import (
    ExtensionApprovalRequest,
    ExtensionKernelIssue,
    ExtensionKernelResult,
    ExtensionRegistrationRecord,
)
from services.extension_kernel.validation import validate_manifest


class InMemoryExtensionRegistry:
    def __init__(self) -> None:
        self._records: dict[str, ExtensionRegistrationRecord] = {}

    def register(self, record: ExtensionRegistrationRecord) -> ExtensionKernelResult:
        validation = validate_manifest(record.manifest)
        if not validation.ok:
            return validation
        if record.registration_id in self._records:
            return ExtensionKernelResult(
                ok=False,
                status="duplicate",
                issues=(ExtensionKernelIssue(code="duplicate_registration", message="registration_id already exists", field="registration_id"),),
            )
        self._records[record.registration_id] = record
        return ExtensionKernelResult(ok=True, status="registered", payload=record.as_dict())

    def unregister(self, registration_id: str) -> ExtensionKernelResult:
        removed = self._records.pop(registration_id, None)
        if removed is None:
            return ExtensionKernelResult(
                ok=False,
                status="not_found",
                issues=(ExtensionKernelIssue(code="registration_not_found", message="registration_id was not found", field="registration_id"),),
            )
        return ExtensionKernelResult(ok=True, status="unregistered", payload=removed.as_dict())

    def discover(self) -> tuple[ExtensionRegistrationRecord, ...]:
        return tuple(self._records[key] for key in sorted(self._records))

    def lookup(self, registration_id: str) -> ExtensionRegistrationRecord | None:
        return self._records.get(registration_id)

    def validate(self, registration_id: str) -> ExtensionKernelResult:
        record = self.lookup(registration_id)
        if record is None:
            return ExtensionKernelResult(
                ok=False,
                status="not_found",
                issues=(ExtensionKernelIssue(code="registration_not_found", message="registration_id was not found", field="registration_id"),),
            )
        return validate_manifest(record.manifest)

    def health(self, registration_id: str) -> ExtensionKernelResult:
        record = self.lookup(registration_id)
        if record is None:
            return ExtensionKernelResult(
                ok=False,
                status="not_found",
                issues=(ExtensionKernelIssue(code="registration_not_found", message="registration_id was not found", field="registration_id"),),
            )
        return ExtensionKernelResult(ok=True, status=record.manifest.health.status, payload=record.manifest.health.as_dict())

    def metadata(self, registration_id: str) -> dict[str, object]:
        record = self.lookup(registration_id)
        return {} if record is None else record.manifest.metadata.as_dict()

    def status(self, registration_id: str) -> str:
        record = self.lookup(registration_id)
        return "NOT_FOUND" if record is None else record.manifest.lifecycle_state

    def approval(self, request: ExtensionApprovalRequest) -> ExtensionKernelResult:
        if request.registration_id not in self._records:
            return ExtensionKernelResult(
                ok=False,
                status="not_found",
                issues=(ExtensionKernelIssue(code="registration_not_found", message="registration_id was not found", field="registration_id"),),
            )
        return ExtensionKernelResult(ok=True, status="approval_requested", payload=request.as_dict())
