from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from uuid import UUID
from app.models.question import (
    Question, 
    QuestionCreate, 
    QuestionUpdate, 
    QuestionFilter,
    QuestionListResponse,
    QuestionType
)
from app.services.question_service import QuestionService
from app.core.database import get_supabase
from supabase import Client

router = APIRouter()

# Dependency to get question service
def get_question_service(supabase: Client = Depends(get_supabase)) -> QuestionService:
    return QuestionService(supabase)

@router.get("/", response_model=QuestionListResponse)
async def get_questions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    subject: Optional[str] = None,
    class_grade: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[QuestionType] = None,
    is_starred: Optional[bool] = None,
    search: Optional[str] = None,
    service: QuestionService = Depends(get_question_service)
):
    """
    Get paginated list of questions with optional filters.
    
    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 20, max: 100)
    - **subject**: Filter by subject
    - **class_grade**: Filter by class/grade
    - **topic**: Filter by topic
    - **difficulty**: Filter by difficulty (EASY, MEDIUM, HARD)
    - **question_type**: Filter by type (MCQ, LONG, TRUE_FALSE, FILL_BLANK)
    - **is_starred**: Filter by starred status
    - **search**: Search in question text
    """
    # Create filter object
    filters = QuestionFilter(
        subject=subject,
        class_grade=class_grade,
        topic=topic,
        difficulty=difficulty,
        question_type=question_type,
        is_starred=is_starred,
        search=search
    )
    
    # Get questions
    questions_data, total = await service.get_all_questions(filters, page, page_size)
    
    # Convert to Pydantic models
    questions = [Question(**q) for q in questions_data]
    
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size
    
    return QuestionListResponse(
        questions=questions,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{question_id}", response_model=Question)
async def get_question(
    question_id: UUID,
    service: QuestionService = Depends(get_question_service)
):
    """Get a single question by ID"""
    question_data = await service.get_question_by_id(question_id)
    
    if not question_data:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return Question(**question_data)

@router.post("/", response_model=Question, status_code=201)
async def create_question(
    question: QuestionCreate,
    service: QuestionService = Depends(get_question_service)
):
    """
    Create a new question.
    
    - For **MCQ**: Provide option_a, option_b, option_c, option_d, and answer_text (full correct option text)
    - For **LONG**: Provide question_text, optional answer_text (final answer), and detailed_solution
    - For **TRUE_FALSE**: Provide question_text and answer_text ("True" or "False")
    - For **FILL_BLANK**: Provide question_text with _______ and answer_text (the answer)
    """
    try:
        question_data = await service.create_question(question)
        return Question(**question_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create question: {str(e)}")

@router.put("/{question_id}", response_model=Question)
async def update_question(
    question_id: UUID,
    question: QuestionUpdate,
    service: QuestionService = Depends(get_question_service)
):
    """Update an existing question (only provided fields will be updated)"""
    question_data = await service.update_question(question_id, question)
    
    if not question_data:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return Question(**question_data)

@router.delete("/{question_id}", status_code=204)
async def delete_question(
    question_id: UUID,
    service: QuestionService = Depends(get_question_service)
):
    """Delete a question"""
    success = await service.delete_question(question_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return None

@router.patch("/{question_id}/star", response_model=Question)
async def toggle_star_question(
    question_id: UUID,
    service: QuestionService = Depends(get_question_service)
):
    """Toggle the starred status of a question"""
    question_data = await service.toggle_star(question_id)
    
    if not question_data:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return Question(**question_data)

@router.get("/stats/overview")
async def get_statistics(
    service: QuestionService = Depends(get_question_service)
):
    """Get statistics about questions (counts by type, subject, difficulty, etc.)"""
    stats = await service.get_statistics()
    return stats