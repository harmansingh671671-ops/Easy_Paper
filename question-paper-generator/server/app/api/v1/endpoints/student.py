from fastapi import APIRouter, HTTPException, Depends, Header, Body
from app.core.auth_deps import get_current_user
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
async def get_internal_user_id(user: dict, profile_service: ProfileService) -> str:
    # Use user.id (object notation)
    profile = await profile_service.get_profile_by_user_id(user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")
    return profile["id"]

# --- Notes Endpoints ---

@router.post("/notes")
async def create_note(
    note: NoteCreate,
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    result = await services["student"].create_note(user_id, note.title, note.content, note.source_pdf_name)
    return result

@router.get("/notes")
async def get_notes(
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    return await services["student"].get_notes(user_id)

# --- Flashcards Endpoints ---

@router.post("/flashcards")
async def create_flashcards(
    flashcards: FlashcardsCreate,
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    result = await services["student"].create_flashcards(user_id, flashcards.deck_title, flashcards.cards, flashcards.source_pdf_name)
    return result

@router.get("/flashcards")
async def get_flashcards(
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    return await services["student"].get_flashcards(user_id)

# --- Quiz Endpoints ---

@router.post("/quizzes")
async def create_quiz(
    quiz: QuizCreate,
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    result = await services["student"].create_quiz(user_id, quiz.title, quiz.questions, quiz.source_pdf_name)
    return result

@router.get("/quizzes")
async def get_quizzes(
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    return await services["student"].get_quizzes(user_id)

# --- Mind Map Endpoints ---

@router.post("/mindmaps")
async def create_mindmap(
    mindmap: MindMapCreate,
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    result = await services["student"].create_mindmap(user_id, mindmap.title, mindmap.data, mindmap.source_pdf_name)
    return result

@router.get("/mindmaps")
async def get_mindmaps(
    user: dict = Depends(get_current_user),
    services: dict = Depends(get_services)
):
    user_id = await get_internal_user_id(user, services["profile"])
    return await services["student"].get_mindmaps(user_id)
