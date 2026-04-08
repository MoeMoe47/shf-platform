from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.core.openai_client import run_analysis
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    try:
        result = run_analysis(payload.model_dump())
        return AnalyzeResponse(
            ok=True,
            result=result,
            model=settings.openai_model if settings.openai_api_key else "mock-mode",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {exc}")
