from fastapi import APIRouter
from fabric.tools_registry import list_tools

router = APIRouter(tags=["tools"])

@router.get("/tools")
def tools():
    return list_tools()
