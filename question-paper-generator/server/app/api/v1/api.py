from fastapi import APIRouter
from app.api.v1.endpoints import questions, ai, profile

api_router = APIRouter()

# Include question endpoints
api_router.include_router(
    questions.router,
    prefix="/questions",
    tags=["questions"]
)

# Include AI endpoints
api_router.include_router(
    ai.router,
    prefix="/ai",
    tags=["ai"]
)

# Include profile endpoints
api_router.include_router(
    profile.router,
    prefix="",
    tags=["profile"]
)