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

# Helper for Untitled(i) naming
def get_next_untitled_topic(supabase: Client, user_id: str) -> str:
    try:
        # Fetch all topics from ALL tables to ensure global uniqueness and continuity
        tables = ["lecture_notes", "ai_flashcards", "ai_quizzes", "ai_mindmaps"]
        existing_topics = []
        
        for table in tables:
             res = supabase.table(table).select("topic").eq("user_id", user_id).ilike("topic", "Untitled%").execute()
             existing_topics.extend([item['topic'] for item in res.data])

        max_index = 0
        for t in existing_topics:
            if t == "Untitled":
                if max_index < 1: max_index = 1
            elif t.startswith("Untitled(") and t.endswith(")"):
                try:
                    num = int(t[9:-1])
                    if num > max_index:
                        max_index = num
                except:
                    pass
        
        return f"Untitled({max_index + 1})"
    except Exception as e:
        logger.error(f"Error determining next Untitled topic: {e}")
        return f"Untitled-{os.urandom(4).hex()}"

# Simple auth check - verify user is logged in (has Clerk user ID)


@router.get("/get-next-untitled")
async def get_next_untitled_endpoint(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get the next available Untitled(i) topic name"""
    return {"topic": get_next_untitled_topic(supabase, user.id)}

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
    save_topic: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Generate short notes from content"""
    try:
        user_id = user.id
        
        # Determine saving topic
        db_topic_save = save_topic if save_topic else topic
        
        ai_service = get_ai_service()
        # Pass original 'topic' (which might be None/Empty) to AI so it runs Auto-Detect if needed
        notes = await ai_service.generate_short_notes(content, topic)
        
        # Store result
        if notes:
             try:
                 # If still no topic to save as, calculate one now
                 if not db_topic_save:
                    db_topic_save = get_next_untitled_topic(supabase, user_id)
                 
                 print(f"DEBUG: Attempting to insert NOTE into DB. User: {user_id}, Topic: {db_topic_save}")
                 data = {
                     "user_id": user_id,
                     "topic": db_topic_save,
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
    save_topic: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Generate flashcards from content"""
    try:
        user_id = user.id
        db_topic_save = save_topic if save_topic else topic

        ai_service = get_ai_service()
        flashcards = await ai_service.generate_flashcards(content, num_cards, topic)
        
        if flashcards:
             try:
                 if not db_topic_save:
                     db_topic_save = get_next_untitled_topic(supabase, user_id)

                 print(f"DEBUG: Attempting to insert FLASHCARDS. User: {user_id}, Topic: {db_topic_save}")
                 supabase.table("ai_flashcards").insert({
                     "user_id": user_id,
                     "topic": db_topic_save,
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
    save_topic: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Generate quiz questions from content"""
    try:
        user_id = user.id
        db_topic_save = save_topic if save_topic else topic

        ai_service = get_ai_service()
        quiz = await ai_service.generate_quiz(content, num_questions, question_type, topic)
        
        if quiz:
             try:
                 if not db_topic_save:
                    db_topic_save = get_next_untitled_topic(supabase, user_id)

                 print(f"DEBUG: Attempting to insert QUIZ. User: {user_id}, Topic: {db_topic_save}")
                 supabase.table("ai_quizzes").insert({
                     "user_id": user_id,
                     "topic": db_topic_save,
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
    save_topic: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Generate mind map structure from content"""
    try:
        user_id = user.id
        db_topic_save = save_topic if save_topic else topic
        
        ai_service = get_ai_service()
        mindmap = await ai_service.generate_mind_map_structure(content, topic)
        
        if mindmap:
             try:
                 if not db_topic_save:
                    db_topic_save = get_next_untitled_topic(supabase, user_id)

                 print(f"DEBUG: Attempting to insert MINDMAP. User: {user_id}, Topic: {db_topic_save}")
                 supabase.table("ai_mindmaps").insert({
                     "user_id": user_id,
                     "topic": db_topic_save,
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

@router.post("/save-notes")
async def save_notes(
    content: str = Form(...),
    topic: str = Form(...),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Save provided text content as lecture notes directly.
    Used for streaming responses where notes are generated client-side/streamed.
    """
    try:
        user_id = user.id
        
        final_topic = topic
        if not final_topic:
             final_topic = get_next_untitled_topic(supabase, user_id)

        print(f"DEBUG: Saving streamed notes. User: {user_id}, Topic: {final_topic}")
        
        data = {
            "user_id": user_id,
            "topic": final_topic,
            "content": content
        }
        
        res = supabase.table("lecture_notes").insert(data).execute()
        return {"success": True, "topic": final_topic}

    except Exception as e:
        logger.error(f"Save Notes Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))



