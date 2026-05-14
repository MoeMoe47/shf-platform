from fastapi import APIRouter
from .apps_routes import router as apps_router
from .curriculum_routes import router as curriculum_router
from .outcomes_routes import router as outcomes_router

router = APIRouter()
router.include_router(apps_router)
router.include_router(curriculum_router)
router.include_router(outcomes_router)
