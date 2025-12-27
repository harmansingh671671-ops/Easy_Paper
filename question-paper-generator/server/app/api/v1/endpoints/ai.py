from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from app.core.auth_deps import get_current_user
from typing import Optional
from app.services.ai_service import AIService
from app.core.database import get_supabase
from supabase import Client
import os

router = APIRouter()

import logging

# Configure logger
logger = logging.getLogger(__name__)

from functools import lru_cache

@lru_cache()
def get_ai_service() -> AIService:
    """Get AI service singleton instance"""
    try:
        return AIService()
    except ValueError as e:
        logger.error(f"Failed to init AIService: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Simple auth check - verify user is logged in (has Clerk user ID)


@router.post("/extract-pdf-text")
async def extract_pdf_text(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
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
    user: dict = Depends(get_current_user)
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
    user: dict = Depends(get_current_user)
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
    user: dict = Depends(get_current_user)
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
    user: dict = Depends(get_current_user)
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
    user: dict = Depends(get_current_user)
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
    user: dict = Depends(get_current_user)
):
    """Process PDF and generate short notes only (other features queued from frontend)"""
    try:
        logger.info(f"Processing PDF: {file.filename}")
        ai_service = get_ai_service()
        pdf_bytes = await file.read()
        logger.debug(f"Read PDF bytes: {len(pdf_bytes)}")
        
        # 1. Save upload to temp file
        import tempfile
        import pathlib
        
        # Create temp file with .pdf extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
            
        logger.info(f"Saved temp PDF to {tmp_path}")
        
        try:
            # 2. Upload to Gemini (Multimodal)
            uploaded_file = await ai_service.upload_file(tmp_path)
            logger.info("Successfully uploaded PDF to Gemini")
            
            # 3. Generate Notes from File
            notes = await ai_service.generate_short_notes(uploaded_file, topic)
            logger.info("Successfully generated notes from PDF")
            
            # Clean up temp file
            os.unlink(tmp_path)
            
        except Exception as e:
            # Try to cleanup if failed
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise e
        
        # Return response
        return {
            "notes": notes,
            "text": "(Processed as File directly - Text not extracted locally)", 
            "filename": file.filename,
            "has_more": True 
        }
    except Exception as e:
        logger.error(f"Process PDF failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))



