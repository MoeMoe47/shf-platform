from __future__ import annotations


class ExtensionKernelError(Exception):
    pass


class ExtensionKernelValidationError(ExtensionKernelError):
    pass


class ExtensionKernelRegistrationError(ExtensionKernelError):
    pass


class ExtensionKernelCompatibilityError(ExtensionKernelError):
    pass
