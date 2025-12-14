import sys
from pathlib import Path

# Add the server directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.models.question import Question, QuestionCreate, QuestionType
from datetime import datetime
from uuid import uuid4

# Test creating a question model
test_question = QuestionCreate(
    question_type=QuestionType.MCQ,
    source="Test Source",
    subject="Mathematics",
    class_grade="12",
    topic="Calculus",
    difficulty="MEDIUM",
    question_text="What is the derivative of $x^2$?",
    option_a="$2x$",
    option_b="$x$",
    option_c="$2$",
    option_d="$x^2$",
    answer_text="$2x$",
    marks=2
)

print("✅ QuestionCreate model validated successfully!")
print(f"Question Type: {test_question.question_type}")
print(f"Subject: {test_question.subject}")
print(f"Answer: {test_question.answer_text}")

# Test response model
test_response = Question(
    id=uuid4(),
    created_at=datetime.now(),
    updated_at=datetime.now(),
    **test_question.dict()
)

print("\n✅ Question response model validated successfully!")
print(f"ID: {test_response.id}")
print(f"Created: {test_response.created_at}")