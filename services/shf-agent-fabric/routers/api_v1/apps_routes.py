from fastapi import APIRouter

router = APIRouter(prefix="/apps", tags=["api:v1"])

@router.get("")
def list_apps():
    return {
        "ok": True,
        "items": [
            {"app_id": "foundation", "title": "Foundation", "entry": "/foundation.html"},
            {"app_id": "curriculum", "title": "Curriculum", "entry": "/curriculum.html"},
            {"app_id": "career", "title": "Career", "entry": "/career.html"},
            {"app_id": "arcade", "title": "Arcade", "entry": "/arcade.html"},
            {"app_id": "treasury", "title": "Treasury", "entry": "/treasury.html"},
            {"app_id": "admin", "title": "Admin", "entry": "/admin.html"}
        ]
    }
