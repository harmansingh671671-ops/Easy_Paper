from fastapi import APIRouter, HTTPException, Depends, Header, Body
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
async def get_internal_user_id(x_clerk_user_id: str, profile_service: ProfileService) -> str:
    profile = await profile_service.get_profile_by_clerk_id(x_clerk_user_id)
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
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    result = await services["teacher"].create_paper(
        user_id, 
        paper.title, paper.category, 
        paper.total_marks, paper.duration_minutes, 
        paper.instructions, paper.questions
    )
    return result

@router.get("/papers")
async def get_papers(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    return await services["teacher"].get_papers(user_id)
