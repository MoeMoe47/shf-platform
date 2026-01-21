from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.alignment.routes_gateway import router as alignment_gateway_router
from routers.alignment.routes_admin import router as alignment_admin_router
from routers.alignment.routes_plans_admin import router as alignment_plans_admin_router
from routers.health_routes import router as health_router
from routers.admin_force_routes import router as admin_force_router
from routers.api_v1 import router as api_v1_router
from routers.loo_routes import router as loo_router
from db.db import init_db
from routers.status_routes import router as status_router
from routers.artifacts_routes import router as artifacts_router
from routers.registry_routes import router as registry_router
from routers.plan_routes import router as plan_router
from routers.run_routes import router as run_router
from routers.run_report_routes import router as run_report_router
from routers.tools_routes import router as tools_router
from routers.runs_routes import router as runs_router
from routers.admin_agents_routes import router as admin_agents_router
from routers.admin_layers_routes import router as admin_layers_router
from routers.feedback_routes import router as feedback_router
from routers.loe_routes import router as loe_router
from routers.predict_routes import router as predict_router
from routers.events_routes import router as events_router
from routers.runs_registry_routes import router as runs_registry_router
from routers.reports_routes import router as reports_router
from routers.runs_loo_payload_routes import router as runs_loo_payload_router
app = FastAPI(title="SHF Agent Fabric")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(alignment_gateway_router)
app.include_router(alignment_admin_router)
app.include_router(alignment_plans_admin_router)
app.include_router(api_v1_router, prefix="/api/v1")
init_db()
app.include_router(status_router)
app.include_router(loo_router)
app.include_router(artifacts_router)
app.include_router(registry_router)
app.include_router(plan_router)
app.include_router(run_router)
app.include_router(run_report_router)
app.include_router(tools_router)
app.include_router(runs_router)
app.include_router(admin_agents_router)
app.include_router(admin_layers_router)
app.include_router(feedback_router)
app.include_router(reports_router)
app.include_router(health_router)
app.include_router(admin_force_router)
app.include_router(loe_router)
app.include_router(predict_router)
app.include_router(events_router)
app.include_router(runs_registry_router)
app.include_router(runs_loo_payload_router)
