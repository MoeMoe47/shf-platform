def build_context(input_data):
    return {
        "region": input_data.get("region"),
        "issue": input_data.get("issue"),
        "priority": input_data.get("priority"),
        "confidence": input_data.get("confidence"),
        "funding": input_data.get("funding"),
        "status": input_data.get("status"),
    }
