import sys
from pathlib import Path

# Add the server directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.models.question import Question, QuestionCreate, QuestionType
from datetime import datetime
from uuid import uuid4

print("=" * 60)
print("Testing Pydantic Models")
print("=" * 60)

# Test 1: MCQ Question
print("\n✅ Test 1: Creating MCQ Question")
mcq_question = QuestionCreate(
    question_type=QuestionType.MCQ,
    source="JEE 2022",
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
print(f"   Type: {mcq_question.question_type}")
print(f"   Subject: {mcq_question.subject}")
print(f"   Answer: {mcq_question.answer_text}")

# Test 2: LONG Question with Answer
print("\n✅ Test 2: Creating LONG Question (with final answer)")
long_question = QuestionCreate(
    question_type=QuestionType.LONG,
    subject="Physics",
    class_grade="12",
    topic="Mechanics",
    difficulty="HARD",
    question_text="Calculate force on 2kg mass with 5 m/s² acceleration.",
    answer_text="F = 10 N",
    detailed_solution="Using F = ma: F = 2 × 5 = 10 N",
    marks=5
)
print(f"   Type: {long_question.question_type}")
print(f"   Final Answer: {long_question.answer_text}")
print(f"   Has Solution: {'Yes' if long_question.detailed_solution else 'No'}")

# Test 3: TRUE_FALSE Question
print("\n✅ Test 3: Creating TRUE_FALSE Question")
tf_question = QuestionCreate(
    question_type=QuestionType.TRUE_FALSE,
    subject="Biology",
    class_grade="10",
    topic="Cell Structure",
    difficulty="EASY",
    question_text="Mitochondria is the powerhouse of the cell.",
    answer_text="True",
    marks=1
)
print(f"   Type: {tf_question.question_type}")
print(f"   Answer: {tf_question.answer_text}")

# Test 4: FILL_BLANK Question
print("\n✅ Test 4: Creating FILL_BLANK Question")
fill_question = QuestionCreate(
    question_type=QuestionType.FILL_BLANK,
    subject="Chemistry",
    class_grade="9",
    topic="Photosynthesis",
    difficulty="EASY",
    question_text="Plants make food through _______.",
    answer_text="photosynthesis",
    marks=1
)
print(f"   Type: {fill_question.question_type}")
print(f"   Answer: {fill_question.answer_text}")

# Test 5: Response Model (with database fields)
print("\n✅ Test 5: Creating Full Question Response Model")
response = Question(
    id=uuid4(),
    created_at=datetime.now(),
    updated_at=datetime.now(),
    **mcq_question.dict()
)
print(f"   ID: {response.id}")
print(f"   Created: {response.created_at.strftime('%Y-%m-%d %H:%M:%S')}")

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED! Models are working correctly.")
print("=" * 60)