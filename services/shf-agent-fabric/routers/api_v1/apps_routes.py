from fastapi import APIRouter
from fabric.registry_canon import list_entities

router = APIRouter(prefix="/apps", tags=["api:v1"])

@router.get("")
def list_apps():
    items = []
    for e in list_entities(kind="app"):
        items.append({
            "app_id": e.get("app_id") or e.get("id"),
            "title": e.get("title") or e.get("name"),
            "entry": e.get("entry"),
            "lifecycle": (e.get("lifecycle") or {}).get("status", "draft"),
            "legal": e.get("legal", {}),
            "policy": e.get("policy", {}),
        })
    return {"ok": True, "items": items}
