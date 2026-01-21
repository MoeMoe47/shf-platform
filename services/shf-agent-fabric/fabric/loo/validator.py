from jsonschema import Draft202012Validator

def validate_report(schema: dict, payload: dict) -> dict:
    v = Draft202012Validator(schema)
    errors = sorted(v.iter_errors(payload), key=lambda e: e.path)
    if errors:
        return {
            "ok": False,
            "errors": [e.message for e in errors]
        }
    return {"ok": True, "errors": []}
