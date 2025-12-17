from typing import List, Optional
from pydantic import BaseModel

class PDFRequest(BaseModel):
    question_ids: List[str]
    title: Optional[str] = "Question Paper"
