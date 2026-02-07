from fastapi import APIRouter
from fabric.registry import list_agents

router = APIRouter()

@router.get("/agents")
def agents():
    return {"agents": list_agents()}
