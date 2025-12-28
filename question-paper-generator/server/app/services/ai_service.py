import os
import time
import asyncio
import io
import json
import re
import logging
import json_repair
from typing import List, Dict, Optional, Any, Type, Union

from openai import AsyncOpenAI
import PyPDF2
from pydantic import BaseModel

from app.core.key_manager import KeyManager
from app.schemas.ai_schemas import (
    AnalysisSchema, StructuredDataSchema, TestPaperSchema, 
    MoreQuestionsSchema, MoreFormulasSchema, TopicsSchema, CustomQuizSchema,
    FlashcardListSchema, QuizListSchema, MindMapGraphSchema, LectureOutlineSchema
)

# Configure debugging logger specific to this module
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self._setup_logging()
        self.key_manager = KeyManager()
        
        # OpenRouter Model Name
        # User requested: "Xiaomi: MiMo-V2-Flash:Free"
        # Matches reference implementation
        self.model_name = "xiaomi/mimo-v2-flash:free" 
        
        logger.info(f"AI Service Initialized with Model: {self.model_name} (OpenRouter)")
        
        # Limit concurrent requests
        self.semaphore = asyncio.Semaphore(3)

    def _setup_logging(self):
        # Add file handler if not present
        if not logger.handlers:
            try:
                fh = logging.FileHandler('debug_ai.log')
                fh.setLevel(logging.DEBUG)
                formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
                fh.setFormatter(formatter)
                logger.addHandler(fh)
                logger.setLevel(logging.DEBUG)
            except Exception as e:
                print(f"Failed to setup debug_ai.log: {e}")

    async def _generate_content_with_retry(
        self, 
        messages: List[Dict],
        task_type: str = None, 
        response_format: Dict = None
    ) -> str:
        """
        Generic retry wrapper for OpenRouter/OpenAI. 
        """
        retries = 3
        
        async with self.semaphore:
            for attempt in range(retries + 1):
                key = self.key_manager.get_valid_key(task_type)
                
                try:
                    # Client per request to rotate keys
                    client = AsyncOpenAI(
                        api_key=key,
                        base_url="https://openrouter.ai/api/v1",
                        default_headers={
                            "HTTP-Referer": "https://localhost:3000",
                            "X-Title": "Easy Paper Generator"
                        }
                    )
                    
                    completion = await client.chat.completions.create(
                        model=self.model_name,
                        messages=messages,
                        temperature=0.7,
                        # response_format=response_format # Disable strict JSON for Xiaomi Free model
                    )
                    
                    return completion.choices[0].message.content or ""

                except Exception as e:
                    error_msg = str(e).lower()
                    
                    # Rate Limits (429) -> Rotate Key
                    if "429" in error_msg or "quota" in error_msg:
                        logger.warning(f"Rate Limited on key ...{key[-4:]}. Switching to next key immediately.")
                        self.key_manager.mark_rate_limited(key, cooldown_seconds=60)
                        continue 
                    
                    # Fatal Errors -> Stop
                    logger.error(f"OPENROUTER CRITICAL ERROR (No Retry): {type(e).__name__} - {e}")
                    raise e 
            
            raise Exception("Max retries exceeded and all keys exhausted")

    def extract_pages_from_pdf(self, pdf_bytes: bytes) -> List[str]:
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            pages = []
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text and text.strip():
                    pages.append(text)
            return pages
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        pages = self.extract_pages_from_pdf(pdf_bytes)
        return "\n".join(pages)
    
    def _safe_parse_json(self, text: str) -> Any:
        if not text:
            return {}
        cleaned = re.sub(r'```json\s*', '', text)
        cleaned = re.sub(r'```\s*', '', cleaned)
        cleaned = cleaned.strip()
        try:
            parsed = json_repair.loads(cleaned)
            return parsed
        except Exception as e:
            logger.error(f"JSON parsing failed: {e}")
            return {}

    async def _generate_text(
        self, 
        prompt: str, 
        system_instruction: str = "You are an expert educator. Return only valid JSON.", 
        task_type: str = None, 
        json_mode: bool = True
    ) -> str:
        """Helper method to generate text using OpenRouter."""
        
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]
        
        response_format = {"type": "json_object"} if json_mode else None
        
        try:
            response_text = await self._generate_content_with_retry(
                messages=messages,
                task_type=task_type,
                response_format=response_format
            )
            return response_text
        except Exception as e:
            logger.error(f"Failed to generate content: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to generate content: {str(e)}")
    
    # ---------------- FEATURES ----------------

    async def generate_short_notes(self, content: Union[str, Any], topic: Optional[str] = None) -> str:
        # Simplify content handling: Expect text
        # If content is a dict/object from previous logic, try to stringify or access it
        # But we will update the caller to pass text.
        
        if hasattr(content, "read"): # It's a file-like?
             # User should have extracted it.
             pass
        
        text_content = str(content)
        
        final_prompt = f"""
        Analyze the following content and create a comprehensive study guide.
        
        Topic: {topic if topic else 'General'}
        
        Content:
        {text_content[:20000]}  # Hard limit for token safety if needed, though models handle large context now. We'll trust the model context window.
        
        Instructions:
        1. Write a detailed analysis.
        2. Use Markdown Headers.
        3. Keep it comprehensive.
        4. If the document contains math, formulas, or diagrams, explain them clearly using LaTeX or descriptive text.
        
        Return valid JSON matching the schema: {{ "analysis": "markdown string" }}
        """

        try:
            response_text = await self._generate_text(
                final_prompt, 
                "You are an expert educator. Return only valid JSON.", 
                task_type="notes",
                json_mode=True
            )
            data = self._safe_parse_json(response_text)
            return data.get("analysis", "")
        except Exception as e:
            logger.error(f"Failed to generate notes: {e}")
            raise ValueError(f"Failed to generate notes: {str(e)}")
    
    async def generate_flashcards(self, content: str, num_cards: int = 10) -> List[Dict[str, str]]:
        content_snippet = content[:15000] 
        prompt = f"Create {num_cards} flashcards (question/answer). Content: {content_snippet}. Return valid JSON with 'flashcards' list of objects having 'term' and 'definition'."
        
        try:
            response_text = await self._generate_text(
                prompt, 
                task_type="flashcards"
            )
            data = self._safe_parse_json(response_text)
            flashcards = data.get("flashcards", [])
            return [{"front": f.get("term"), "back": f.get("definition")} for f in flashcards]
        except Exception as e:
            raise ValueError(f"Failed to generate flashcards: {str(e)}")
    
    async def generate_quiz(self, content: str, num_questions: int = 10, question_type: str = "mixed") -> List[Dict]:
        content_snippet = content[:15000]
        prompt = f"Create {num_questions} quiz questions. Content: {content_snippet}. Type: {question_type}. Return valid JSON with 'questions' list."
        
        try:
            response_text = await self._generate_text(
                prompt, 
                task_type="quiz"
            )
            data = self._safe_parse_json(response_text)
            return data.get("questions", [])
        except Exception as e:
            raise ValueError(f"Failed to generate quiz: {str(e)}")
    
    async def generate_mind_map_structure(self, content: str, topic: Optional[str] = None) -> Dict:
        content_snippet = content[:15000]
        prompt = f"Create a mind map structure. Content: {content_snippet}. Return valid JSON."
        
        try:
            response_text = await self._generate_text(
                prompt, 
                task_type="mindmap"
            )
            return self._safe_parse_json(response_text)
        except Exception as e:
            raise ValueError(f"Failed to generate mind map: {str(e)}")

    async def generate_lecture_outline(self, topic: str, duration: int = 60, level: str = "intermediate") -> Dict:
        prompt = f"Create a lecture outline for {topic}, {duration} mins, {level}. Return valid JSON."
        
        try:
            response_text = await self._generate_text(
                prompt,
            )
            return self._safe_parse_json(response_text)
        except Exception as e:
            raise ValueError(f"Failed to generate lecture outline: {str(e)}")