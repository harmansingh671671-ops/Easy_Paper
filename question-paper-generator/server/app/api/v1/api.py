from fastapi import APIRouter
from app.api.v1.endpoints import questions

api_router = APIRouter()

# Include question endpoints
api_router.include_router(
    questions.router,
    prefix="/questions",
    tags=["questions"]
)