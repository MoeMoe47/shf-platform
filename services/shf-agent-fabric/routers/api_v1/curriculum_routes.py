from fastapi import APIRouter

router = APIRouter(prefix="/curriculum", tags=["api:v1"])

@router.get("/chapters")
def list_chapters():
    return {
        "ok": True,
        "items": [
            {"curriculum_id": "career-launchpad", "chapter": 1, "title": "Welcome"},
            {"curriculum_id": "career-launchpad", "chapter": 2, "title": "Goals"},
            {"curriculum_id": "career-launchpad", "chapter": 3, "title": "Habits"}
        ]
    }

@router.get("/chapters/{curriculum_id}/{chapter}")
def get_chapter(curriculum_id: str, chapter: int):
    return {
        "ok": True,
        "curriculum_id": curriculum_id,
        "chapter": chapter,
        "title": f"Chapter {chapter}",
        "sections": [
            {"id": "overview", "type": "text", "content": "Overview..."},
            {"id": "activity", "type": "activity", "content": "Activity..."}
        ]
    }
