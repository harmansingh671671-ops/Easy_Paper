from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# --- Shared Models ---

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correctIndex: int
    explanation: str
    section: Optional[str] = None

class TheoryQuestion(BaseModel):
    question: str
    answer: str = Field(description="The final short answer or result.")
    explanation: str = Field(description="Step-by-step method or detailed explanation.")
    section: Optional[str] = None

class Formula(BaseModel):
    title: str
    expression: str = Field(description="LaTeX format. Escape backslashes.")
    method: str = Field(description="Usage explanation.")
    section: Optional[str] = None

class Flashcard(BaseModel):
    id: int
    term: str
    definition: str

class MindMapNode(BaseModel):
    label: str
    children: List['MindMapNode'] = []

MindMapNode.model_rebuild()

# --- Response Schemas ---

class AnalysisSchema(BaseModel):
    analysis: str = Field(description="Comprehensive study guide using Markdown headers, bullets, bold text.")
    keyTopics: List[str] = Field(description="List of 5-8 main keywords/topics.")

class StructuredDataSchema(BaseModel):
    formulas: List[Formula]
    quiz: List[QuizQuestion]
    theoryQuestions: List[TheoryQuestion]
    flashcards: List[Flashcard]
    mindMap: MindMapNode

class TopicsSchema(BaseModel):
    topics: List[str] = Field(description="List of curriculum topics")

class TestPaperSchema(BaseModel):
    quiz: List[QuizQuestion]
    theoryQuestions: List[TheoryQuestion]

class DiagramSchema(BaseModel):
    diagramSVG: str = Field(description="Valid SVG code string.")

class MoreFormulasSchema(BaseModel):
    formulas: List[Formula]

class MoreQuestionsSchema(BaseModel):
    quiz: Optional[List[QuizQuestion]] = []
    theoryQuestions: Optional[List[TheoryQuestion]] = []

class CustomQuestion(BaseModel):
    id: int
    type: Literal['MULTIPLE_CHOICE', 'FILL_IN_THE_BLANK', 'OPEN_ENDED']
    question: str
    options: Optional[List[str]] = None
    correctIndex: Optional[int] = None
    answer: Optional[str] = None
    explanation: str
    keywords: Optional[List[str]] = None

class CustomQuizSchema(BaseModel):
    questions: List[CustomQuestion]

# --- Helper Schemas for specific endpoints ---

class FlashcardListSchema(BaseModel):
    flashcards: List[Flashcard]

class QuizQuestionLegacy(BaseModel):
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    difficulty: str
    explanation: Optional[str] = None

class QuizListSchema(BaseModel):
    questions: List[QuizQuestionLegacy]

class MindMapNodeLegacy(BaseModel):
    id: str
    label: str
    level: int
    parent: Optional[str] = None

class MindMapConnection(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")

class MindMapGraphSchema(BaseModel):
    central_topic: str
    nodes: List[MindMapNodeLegacy]
    connections: List[MindMapConnection]

class LectureSection(BaseModel):
    title: str
    duration: int
    key_points: List[str]
    activities: List[str]
    examples: List[str]

class LectureOutlineSchema(BaseModel):
    topic: str
    learning_objectives: List[str]
    sections: List[LectureSection]
    summary_duration: int
    qa_duration: int
