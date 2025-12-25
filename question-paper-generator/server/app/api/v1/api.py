from fastapi import APIRouter
from app.api.v1.endpoints import questions, auth, ai, profile, student, teacher

api_router = APIRouter()

# Include auth endpoints
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

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

# Include student endpoints
api_router.include_router(
    student.router,
    prefix="/student",
    tags=["student"]
)

# Include teacher endpoints
api_router.include_router(
    teacher.router,
    prefix="/teacher",
    tags=["teacher"]
)
