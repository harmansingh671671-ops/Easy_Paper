from fastapi import APIRouter, HTTPException, Depends, Header, Body
from app.core.auth_deps import get_current_user
from typing import List, Optional, Dict, Any
from app.services.teacher_service import TeacherService
from app.services.profile_service import ProfileService
from app.core.database import get_supabase
from supabase import Client
from pydantic import BaseModel
from uuid import UUID

router = APIRouter()

def get_services(supabase: Client = Depends(get_supabase)):
    return {
        "teacher": TeacherService(supabase),
        "profile": ProfileService(supabase)
    }

# Helper to get internal user ID
async def get_internal_user_id(user: dict, profile_service: ProfileService) -> str:
    # Use user.id (object notation)
    profile = await profile_service.get_profile_by_user_id(user.id)
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found. Please complete onboarding.")
    if profile.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Access denied. Teachers only.")
    return profile["id"]

class PaperCreate(BaseModel):
    title: str
    category: str
    total_marks: int
    duration_minutes: int
    instructions: str
    questions: List[Dict[str, Any]]

@router.get("/ping")
async def ping():
    print("PING PONG")
    return {"status": "ok", "module": "teacher"}

@router.post("/papers")
async def create_paper(
    paper: PaperCreate,
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    result = await services["teacher"].create_paper(
        user_id, 
        paper.title, paper.category, 
        paper.total_marks, paper.duration_minutes, 
        paper.instructions, paper.questions
    )
    return result

@router.get("/papers")
async def get_papers(
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    return await services["teacher"].get_papers(user_id)
