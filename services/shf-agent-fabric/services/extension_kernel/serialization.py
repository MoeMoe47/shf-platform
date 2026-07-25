from __future__ import annotations

import json
from typing import Any, Protocol


class SerializableKernelModel(Protocol):
    def as_dict(self) -> dict[str, Any]:
        ...


def to_plain_dict(model: SerializableKernelModel) -> dict[str, Any]:
    return model.as_dict()


def to_json(model: SerializableKernelModel) -> str:
    return json.dumps(model.as_dict(), sort_keys=True, separators=(",", ":"))


def require_json_object(value: str) -> dict[str, Any]:
    parsed = json.loads(value)
    if not isinstance(parsed, dict):
        raise ValueError("expected JSON object")
    return parsed
