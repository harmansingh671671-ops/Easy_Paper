from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Header
from typing import Optional
from app.services.ai_service import AIService
from app.core.database import get_supabase
from supabase import Client
import os

router = APIRouter()

def get_ai_service() -> AIService:
    """Get AI service instance"""
    try:
        return AIService()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

# Simple auth check - verify user is logged in (has Clerk user ID)
def verify_user(x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")):
    """Verify user is authenticated"""
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return x_clerk_user_id

@router.post("/extract-pdf-text")
async def extract_pdf_text(
    file: UploadFile = File(...),
    user_id: str = Depends(verify_user)
):
    """Extract text from uploaded PDF"""
    try:
        ai_service = get_ai_service()
        pdf_bytes = await file.read()
        text = ai_service.extract_text_from_pdf(pdf_bytes)
        return {"text": text, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-notes")
async def generate_notes(
    content: str = Form(...),
    topic: Optional[str] = Form(None),
    user_id: str = Depends(verify_user)
):
    """Generate short notes from content"""
    try:
        ai_service = get_ai_service()
        notes = await ai_service.generate_short_notes(content, topic)
        return {"notes": notes}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-flashcards")
async def generate_flashcards(
    content: str = Form(...),
    num_cards: int = Form(10),
    user_id: str = Depends(verify_user)
):
    """Generate flashcards from content"""
    try:
        ai_service = get_ai_service()
        flashcards = await ai_service.generate_flashcards(content, num_cards)
        return {"flashcards": flashcards}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-quiz")
async def generate_quiz(
    content: str = Form(...),
    num_questions: int = Form(10),
    question_type: str = Form("mixed"),
    user_id: str = Depends(verify_user)
):
    """Generate quiz questions from content"""
    try:
        ai_service = get_ai_service()
        quiz = await ai_service.generate_quiz(content, num_questions, question_type)
        return {"questions": quiz}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-mindmap")
async def generate_mindmap(
    content: str = Form(...),
    topic: Optional[str] = Form(None),
    user_id: str = Depends(verify_user)
):
    """Generate mind map structure from content"""
    try:
        ai_service = get_ai_service()
        mindmap = await ai_service.generate_mind_map_structure(content, topic)
        return {"mindmap": mindmap}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-lecture-outline")
async def generate_lecture_outline(
    topic: str = Form(...),
    duration: int = Form(60),
    level: str = Form("intermediate"),
    user_id: str = Depends(verify_user)
):
    """Generate lecture preparation outline"""
    try:
        ai_service = get_ai_service()
        outline = await ai_service.generate_lecture_outline(topic, duration, level)
        return {"outline": outline}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/process-pdf")
async def process_pdf(
    file: UploadFile = File(...),
    topic: Optional[str] = Form(None),
    user_id: str = Depends(verify_user)
):
    """Process PDF and generate short notes only (other features queued from frontend)"""
    try:
        ai_service = get_ai_service()
        pdf_bytes = await file.read()
        
        # Extract text (hidden from user)
        text = ai_service.extract_text_from_pdf(pdf_bytes)
        
        # Generate short notes only (fastest response)
        notes = await ai_service.generate_short_notes(text, topic)
        
        # Return minimal response - frontend will queue other features
        return {
            "notes": notes,
            "filename": file.filename,
            "has_more": True  # Signal to frontend to queue other features
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



