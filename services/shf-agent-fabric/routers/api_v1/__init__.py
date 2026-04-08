from routers.api_v1.aal_routes import router as aal_router
from fastapi import APIRouter

from .apps_routes import router as apps_router
from .curriculum_routes import router as curriculum_router
from .outcomes_routes import router as outcomes_router
from .outcomes_verify_routes import router as outcomes_verify_router
from .credits_routes import router as credits_router
from .pools_routes import router as pools_router
from .payouts_routes import router as payouts_router
from .treasury_routes import router as treasury_router
from .governance_routes import router as governance_router
from .operator_routes import router as operator_router

router = APIRouter()
router.include_router(apps_router)
router.include_router(curriculum_router)
router.include_router(outcomes_router)
router.include_router(outcomes_verify_router)
router.include_router(credits_router)
router.include_router(pools_router)
router.include_router(payouts_router)
router.include_router(treasury_router)
router.include_router(governance_router)
router.include_router(operator_router)
router.include_router(aal_router)

from routers.api_v1.control_routes import router as control_router
router.include_router(control_router)


from routers.api_v1.execution_routes import router as execution_router
router.include_router(execution_router)


from routers.api_v1.efficiency_routes import router as efficiency_router
router.include_router(efficiency_router)

