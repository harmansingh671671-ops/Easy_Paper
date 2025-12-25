from fastapi import APIRouter, HTTPException, Depends, Header, Body
from typing import List, Optional, Dict, Any
from app.services.student_service import StudentService
from app.services.profile_service import ProfileService
from app.core.database import get_supabase
from supabase import Client
from pydantic import BaseModel
from uuid import UUID

router = APIRouter()

def get_services(supabase: Client = Depends(get_supabase)):
    return {
        "student": StudentService(supabase),
        "profile": ProfileService(supabase)
    }

# Pydantic models
class NoteCreate(BaseModel):
    title: str
    content: str
    source_pdf_name: Optional[str] = None

class FlashcardsCreate(BaseModel):
    deck_title: str
    cards: List[Dict[str, str]]
    source_pdf_name: Optional[str] = None

class QuizCreate(BaseModel):
    title: str
    questions: List[Dict[str, Any]]
    source_pdf_name: Optional[str] = None

class MindMapCreate(BaseModel):
    title: str
    data: Dict[str, Any]
    source_pdf_name: Optional[str] = None

# Helper to get internal user ID
async def get_internal_user_id(x_clerk_user_id: str, profile_service: ProfileService) -> str:
    profile = await profile_service.get_profile_by_clerk_id(x_clerk_user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")
    return profile["id"]

# --- Notes Endpoints ---

@router.post("/notes")
async def create_note(
    note: NoteCreate,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    result = await services["student"].create_note(user_id, note.title, note.content, note.source_pdf_name)
    return result

@router.get("/notes")
async def get_notes(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    return await services["student"].get_notes(user_id)

# --- Flashcards Endpoints ---

@router.post("/flashcards")
async def create_flashcards(
    flashcards: FlashcardsCreate,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    result = await services["student"].create_flashcards(user_id, flashcards.deck_title, flashcards.cards, flashcards.source_pdf_name)
    return result

@router.get("/flashcards")
async def get_flashcards(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    return await services["student"].get_flashcards(user_id)

# --- Quiz Endpoints ---

@router.post("/quizzes")
async def create_quiz(
    quiz: QuizCreate,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    result = await services["student"].create_quiz(user_id, quiz.title, quiz.questions, quiz.source_pdf_name)
    return result

@router.get("/quizzes")
async def get_quizzes(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    return await services["student"].get_quizzes(user_id)

# --- Mind Map Endpoints ---

@router.post("/mindmaps")
async def create_mindmap(
    mindmap: MindMapCreate,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    result = await services["student"].create_mindmap(user_id, mindmap.title, mindmap.data, mindmap.source_pdf_name)
    return result

@router.get("/mindmaps")
async def get_mindmaps(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    services: dict = Depends(get_services)
):
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = await get_internal_user_id(x_clerk_user_id, services["profile"])
    return await services["student"].get_mindmaps(user_id)
