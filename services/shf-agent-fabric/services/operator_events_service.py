import uuid
from datetime import datetime, timezone

def _now():
    return datetime.now(timezone.utc).isoformat()

def _id(prefix="evt"):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

EVENT_STORE = []

def write_operator_event(event_type, entity_type, entity_id, actor_id, payload):
    event = {
        "id": _id(),
        "event_type": event_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "actor_id": actor_id,
        "payload": payload,
        "created_at": _now()
    }

    EVENT_STORE.append(event)

    return event

def list_operator_events(limit=50):
    return list(reversed(EVENT_STORE[-limit:]))
