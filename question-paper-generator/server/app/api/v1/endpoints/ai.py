from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
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
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Generate short notes from content"""
    try:
        user_id = user.id
        # Check DB if topic provided (and not re-generating explicitly?)
        # For now, if topic & user match, return existing.
        # Note: If generating from PDF content without a topic, we usually assign filename as topic.
        
        search_topic = topic
        if not search_topic and len(content) < 200: # Heuristic: if content is short, it might be the topic
             search_topic = content

        if search_topic:
             existing = supabase.table("lecture_notes").select("*").eq("user_id", user_id).eq("topic", search_topic).execute()
             if existing.data and len(existing.data) > 0:
                  logger.info(f"Returning cached notes for topic: {search_topic}")
                  return {"notes": existing.data[0]['content']}

        ai_service = get_ai_service()
        notes = await ai_service.generate_short_notes(content, topic)
        
        # Store result
        if search_topic and notes:
             try:
                 print(f"DEBUG: Attempting to insert NOTE into DB. User: {user_id}, Topic: {search_topic}")
                 data = {
                     "user_id": user_id,
                     "topic": search_topic,
                     "content": notes
                 }
                 res = supabase.table("lecture_notes").insert(data).execute()
                 print(f"DEBUG: Insert Success! Response: {res}")
             except Exception as e:
                 print(f"DEBUG: Insert FAILED: {e}")
                 logger.error(f"Failed to cache notes: {e}")

        return {"notes": notes}
    except Exception as e:
        logger.error(f"Generate Notes Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-flashcards")
async def generate_flashcards(
    content: str = Form(...),
    num_cards: int = Form(10),
    topic: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Generate flashcards from content"""
    try:
        user_id = user.id
        search_topic = topic
        if not search_topic and len(content) < 200:
             search_topic = content
        
        if search_topic:
             existing = supabase.table("ai_flashcards").select("*").eq("user_id", user_id).eq("topic", search_topic).execute()
             if existing.data:
                  logger.info(f"Returning cached flashcards for topic: {search_topic}")
                  return {"flashcards": existing.data[0]['cards']}

        ai_service = get_ai_service()
        flashcards = await ai_service.generate_flashcards(content, num_cards)
        
        if search_topic and flashcards:
             try:
                 print(f"DEBUG: Attempting to insert FLASHCARDS. User: {user_id}, Topic: {search_topic}")
                 supabase.table("ai_flashcards").insert({
                     "user_id": user_id,
                     "topic": search_topic,
                     "cards": flashcards
                 }).execute()
                 print("DEBUG: Flashcard insert success")
             except Exception as e:
                 print(f"DEBUG: Flashcard Insert FAILED: {e}")
                 logger.error(f"Failed to cache flashcards: {e}")

        return {"flashcards": flashcards}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-quiz")
async def generate_quiz(
    content: str = Form(...),
    num_questions: int = Form(10),
    question_type: str = Form("mixed"),
    topic: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Generate quiz questions from content"""
    try:
        user_id = user.id
        search_topic = topic
        if not search_topic and len(content) < 200:
             search_topic = content
        
        if search_topic:
             existing = supabase.table("ai_quizzes").select("*").eq("user_id", user_id).eq("topic", search_topic).execute()
             if existing.data:
                  logger.info(f"Returning cached quiz for topic: {search_topic}")
                  return {"questions": existing.data[0]['questions']}

        ai_service = get_ai_service()
        quiz = await ai_service.generate_quiz(content, num_questions, question_type)
        
        if search_topic and quiz:
             try:
                 print(f"DEBUG: Attempting to insert QUIZ. User: {user_id}, Topic: {search_topic}")
                 supabase.table("ai_quizzes").insert({
                     "user_id": user_id,
                     "topic": search_topic,
                     "questions": quiz
                 }).execute()
                 print("DEBUG: Quiz insert success")
             except Exception as e:
                 print(f"DEBUG: Quiz Insert FAILED: {e}")
                 logger.error(f"Failed to cache quiz: {e}")

        return {"questions": quiz}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-mindmap")
async def generate_mindmap(
    content: str = Form(...),
    topic: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Generate mind map structure from content"""
    try:
        user_id = user.id
        search_topic = topic
        if not search_topic and len(content) < 200:
             search_topic = content
             
        if search_topic:
             existing = supabase.table("ai_mindmaps").select("*").eq("user_id", user_id).eq("topic", search_topic).execute()
             if existing.data:
                  logger.info(f"Returning cached mindmap for topic: {search_topic}")
                  return {"mindmap": existing.data[0]['structure']}

        ai_service = get_ai_service()
        mindmap = await ai_service.generate_mind_map_structure(content, topic)
        
        if search_topic and mindmap:
             try:
                 print(f"DEBUG: Attempting to insert MINDMAP. User: {user_id}, Topic: {search_topic}")
                 supabase.table("ai_mindmaps").insert({
                     "user_id": user_id,
                     "topic": search_topic,
                     "structure": mindmap
                 }).execute()
                 print("DEBUG: Mindmap insert success")
             except Exception as e:
                 print(f"DEBUG: Mindmap Insert FAILED: {e}")
                 logger.error(f"Failed to cache mindmap: {e}")

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
    """
    Process PDF and stream notes generation (Batched).
    Returns an NDJSON stream.
    """
    try:
        logger.info(f"Processing PDF (Streaming): {file.filename}")
        ai_service = get_ai_service()
        pdf_bytes = await file.read()
        logger.debug(f"Read PDF bytes: {len(pdf_bytes)}")
        
        # Use Streaming Generator
        # The generator handles image conversion and batching internally
        return StreamingResponse(
            ai_service.generate_notes_stream(pdf_bytes, topic),
            media_type="application/x-ndjson"
        )

    except Exception as e:
        logger.error(f"Process PDF failed: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))



