from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from enum import Enum
from datetime import datetime
from uuid import UUID

# Enums matching database
class QuestionType(str, Enum):
    MCQ = "MCQ"
    LONG = "LONG"
    TRUE_FALSE = "TRUE_FALSE"
    FILL_BLANK = "FILL_BLANK"

# Base Model (shared fields for all operations)
class QuestionBase(BaseModel):
    question_type: QuestionType
    source: Optional[str] = None
    subject: str = Field(..., min_length=1, max_length=100)
    class_grade: str = Field(..., min_length=1, max_length=20)
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: str = Field(default="MEDIUM", max_length=20)
    
    # Question content
    question_text: str = Field(..., min_length=1)
    image_url: Optional[str] = Field(None, max_length=500)
    
    # MCQ-specific (nullable for other types)
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    
    # Answer fields
    answer_text: Optional[str] = None  # Universal answer column
    detailed_solution: Optional[str] = None
    hint: Optional[str] = None
    
    # Metadata
    marks: int = Field(default=1, ge=1)
    is_starred: bool = False

# Request Model (for creating/updating questions)
class QuestionCreate(QuestionBase):
    """Used when creating a new question"""
    pass

class QuestionUpdate(BaseModel):
    """Used when updating a question (all fields optional)"""
    question_type: Optional[QuestionType] = None
    source: Optional[str] = None
    subject: Optional[str] = None
    class_grade: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    question_text: Optional[str] = None
    image_url: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    answer_text: Optional[str] = None
    detailed_solution: Optional[str] = None
    hint: Optional[str] = None
    marks: Optional[int] = None
    is_starred: Optional[bool] = None

# Response Model (includes database-generated fields)
class Question(QuestionBase):
    """Complete question model returned from database"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Allows ORM mode for SQLAlchemy

# Filter Model (for querying questions)
class QuestionFilter(BaseModel):
    """Used for filtering questions in the library"""
    subject: Optional[str] = None
    class_grade: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    question_type: Optional[QuestionType] = None
    is_starred: Optional[bool] = None
    search: Optional[str] = None  # For searching in question_text

# List Response Model (for paginated results)
class QuestionListResponse(BaseModel):
    """Response for list endpoints with pagination"""
    questions: list[Question]
    total: int
    page: int
    page_size: int
    total_pages: int