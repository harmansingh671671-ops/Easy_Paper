from typing import List, Optional
from pydantic import BaseModel

class PDFRequest(BaseModel):
    question_ids: List[str]
    title: Optional[str] = "Question Paper"
    duration: Optional[int] = None
    instructions: Optional[str] = None
    total_marks: Optional[int] = None
