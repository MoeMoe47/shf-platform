from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError
import json
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "contracts" / "registry_entity.schema.json"

with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
    REGISTRY_SCHEMA = json.load(f)

_validator = Draft202012Validator(REGISTRY_SCHEMA)

def validate_registry_payload(payload: dict):
    errors = sorted(_validator.iter_errors(payload), key=lambda e: e.path)
    if errors:
        return [
            {
                "path": ".".join([str(p) for p in err.path]),
                "message": err.message
            }
            for err in errors
        ]
    return None
