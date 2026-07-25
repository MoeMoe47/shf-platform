from __future__ import annotations

from typing import Any, Protocol

from services.extension_kernel.models import (
    ExtensionActivationRequest,
    ExtensionApprovalRequest,
    ExtensionKernelResult,
    ExtensionManifest,
    ExtensionRegistrationRecord,
)


class ExtensionRegistry(Protocol):
    def register(self, record: ExtensionRegistrationRecord) -> ExtensionKernelResult:
        ...

    def unregister(self, registration_id: str) -> ExtensionKernelResult:
        ...

    def discover(self) -> tuple[ExtensionRegistrationRecord, ...]:
        ...

    def lookup(self, registration_id: str) -> ExtensionRegistrationRecord | None:
        ...

    def validate(self, registration_id: str) -> ExtensionKernelResult:
        ...

    def health(self, registration_id: str) -> ExtensionKernelResult:
        ...

    def metadata(self, registration_id: str) -> dict[str, Any]:
        ...

    def status(self, registration_id: str) -> str:
        ...

    def approval(self, request: ExtensionApprovalRequest) -> ExtensionKernelResult:
        ...


class ExtensionManifestValidator(Protocol):
    def validate_manifest(self, manifest: ExtensionManifest) -> ExtensionKernelResult:
        ...


class ExtensionHealthProvider(Protocol):
    def health(self, registration_id: str) -> ExtensionKernelResult:
        ...


class ExtensionDiagnosticsProvider(Protocol):
    def diagnostics(self, registration_id: str) -> ExtensionKernelResult:
        ...


class ExtensionApprovalProvider(Protocol):
    def approval(self, request: ExtensionApprovalRequest) -> ExtensionKernelResult:
        ...


class ExtensionActivationProvider(Protocol):
    def activation_request(self, request: ExtensionActivationRequest) -> ExtensionKernelResult:
        ...


class ExtensionEventCatalog(Protocol):
    def event_types(self) -> tuple[str, ...]:
        ...


class ExtensionConfigurationProvider(Protocol):
    def configuration(self, registration_id: str) -> dict[str, Any]:
        ...


class ReadCapability(Protocol):
    def read(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class WriteCapability(Protocol):
    def write(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class EventCapability(Protocol):
    def event_definition(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class ProjectionCapability(Protocol):
    def project(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class NotificationCapability(Protocol):
    def notify(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class ValidationCapability(Protocol):
    def validate(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class ObserverCapability(Protocol):
    def observe(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class AdapterCapability(Protocol):
    def adapt(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class HookCapability(Protocol):
    def invoke(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class MiddlewareCapability(Protocol):
    def handle(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class PluginCapability(Protocol):
    def capability(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...


class RegistryCapability(Protocol):
    def register(self, request: dict[str, Any]) -> ExtensionKernelResult:
        ...
