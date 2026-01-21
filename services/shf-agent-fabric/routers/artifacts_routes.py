from fastapi import APIRouter, HTTPException
from pathlib import Path
import json

router = APIRouter(tags=["artifacts"])

ARTIFACTS_DIR = Path("db/artifacts")

@router.get("/artifacts/{artifact_id}")
def get_artifact(artifact_id: str):
    path = ARTIFACTS_DIR / f"{artifact_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Artifact not found")
    try:
        return {"ok": True, "artifactId": artifact_id, "artifact": json.loads(path.read_text())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read artifact: {e}")
