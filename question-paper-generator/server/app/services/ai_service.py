import os
import time
import asyncio
import io
import json
import re
import logging
import json_repair
from typing import List, Dict, Optional, Any, Type, Union

from google import genai
from google.genai import types, errors
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
        
        # --- ROBUST MODEL NAME CLEANING ---
        model_env = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        model_env = model_env.strip().strip('"').strip("'")
        if model_env.startswith("models/"):
            model_env = model_env.replace("models/", "")
            
        self.model_name = model_env
        logger.info(f"AI Service Initialized with Model: {self.model_name}")
        
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

    def _extract_wait_time(self, error_message: str) -> float:
        """Attempts to find 'retry in X s' in the error message."""
        try:
            match = re.search(r"retry in (\d+\.?\d*)s", error_message)
            if match:
                return float(match.group(1)) + 1.0 # Add 1s buffer
        except:
            pass
        return 20.0 # Default safe fallback

    async def _generate_content_with_retry(
        self, 
        content_generator_func, 
        task_type: str = None, 
        override_key: str = None,
        capture_key_ref: Dict = None
    ):
        """
        Generic retry wrapper. 
        """
        
        # --- CASE 1: STICKY KEY (File Ownership) ---
        # We MUST use the provided key. We CANNOT rotate.
        if override_key:
            sticky_retries = 10  # Try up to 10 times (very patient)
            
            for attempt in range(sticky_retries):
                try:
                    client = genai.Client(api_key=override_key)
                    return await content_generator_func(client)
                except Exception as e:
                    error_str = str(e).lower()
                    
                    # Check for Rate Limit (429)
                    is_rate_limit = (
                        (isinstance(e, errors.ClientError) and e.code == 429) or 
                        "429" in error_str or 
                        "resource_exhausted" in error_str or
                        "quota" in error_str
                    )

                    if is_rate_limit:
                        # Parse wait time or default to 20s
                        wait_time = self._extract_wait_time(error_str)
                        
                        logger.warning(f"⚠️ Quota Hit on Sticky Key. Waiting {wait_time:.1f}s... (Attempt {attempt+1}/{sticky_retries})")
                        await asyncio.sleep(wait_time)
                        continue # RETRY loop
                    else:
                        # Fatal error (Permissions, Bad Request, etc)
                        logger.error(f"Sticky Key Fatal Error: {e}")
                        raise e
            
            raise Exception("Sticky Key: Max retries exceeded (Quota stuck).")

        # --- CASE 2: STANDARD ROTATION ---
        # We can rotate keys here.
        retries = 3
        delay = 2 
        
        async with self.semaphore:
            for attempt in range(retries + 1):
                key = self.key_manager.get_valid_key(task_type)
                
                try:
                    client = genai.Client(api_key=key)
                    response = await content_generator_func(client)
                    
                    if capture_key_ref is not None:
                        capture_key_ref['key'] = key
                        
                    return response

                except errors.ClientError as e:
                    error_msg = str(e).lower()
                    
                    # Rate Limits (429) -> Rotate Key
                    if e.code == 429 or "429" in error_msg or "resource_exhausted" in error_msg:
                        logger.warning(f"Rate Limited (429) on key ...{key[-4:]}. Rotating.")
                        self.key_manager.mark_rate_limited(key, cooldown_seconds=60)
                        await asyncio.sleep(delay)
                        delay *= 2
                        continue 
                    
                    # Fatal Errors -> Stop
                    logger.error(f"GOOGLE CRITICAL ERROR (No Retry): {type(e).__name__} - {e}")
                    raise e 

                except Exception as e:
                    error_msg = str(e).lower()
                    if "429" in error_msg or "quota" in error_msg or "resource_exhausted" in error_msg:
                         logger.warning(f"Rate Limited (General Exception) ...{key[-4:]}. Rotating.")
                         self.key_manager.mark_rate_limited(key, cooldown_seconds=60)
                         await asyncio.sleep(delay)
                         delay *= 2
                         continue
                    
                    logger.error(f"GENERAL CRITICAL ERROR (No Retry): {type(e).__name__} - {e}")
                    raise e
            
            raise Exception("Max retries exceeded and all keys exhausted")

    async def upload_file(self, file_path: str, mime_type: str = "application/pdf") -> Dict:
        """
        Uploads a file and returns BOTH the file_ref and the api_key used.
        """
        key_capture = {} 

        async def _upload(client):
            logger.info("Starting upload...")
            file_ref = await client.aio.files.upload(file=file_path)
            logger.info(f"Upload initiated: {file_ref.name}. Waiting for processing...")
            
            # Polling Loop
            while True:
                file_ref = await client.aio.files.get(name=file_ref.name)
                state = str(file_ref.state.name).upper()
                if state == "ACTIVE":
                    logger.info("File is ACTIVE and ready.")
                    break
                elif state == "FAILED":
                    raise ValueError(f"Google failed to process PDF. State: {state}")
                await asyncio.sleep(2)
            return file_ref

        file_ref = await self._generate_content_with_retry(
            _upload, 
            task_type="upload",
            capture_key_ref=key_capture 
        )
        
        return {
            "file": file_ref,
            "api_key": key_capture.get("key")
        }

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
        prompt: Union[str, List[Any]], 
        system_instruction: str = None, 
        task_type: str = None, 
        response_schema: Optional[Type[BaseModel]] = None, 
        specific_key: str = None
    ) -> str:
        """Helper method to generate text using Gemini. Supports Sticky Keys."""
        try:
            config = types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=8192,
                system_instruction=system_instruction
            )
            
            if response_schema:
                config.response_mime_type = "application/json"
                config.response_schema = response_schema
            
            # Pass specific_key to the retry wrapper
            response = await self._generate_content_with_retry(
                lambda client: client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[prompt] if isinstance(prompt, str) else prompt,
                    config=config
                ),
                task_type=task_type,
                override_key=specific_key  # <--- Forces use of the file owner key
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini")
            
            return response.text
        except Exception as e:
            logger.error(f"Failed to generate content: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to generate content: {str(e)}")
    
    # ---------------- FEATURES ----------------

    async def generate_short_notes(self, content: Union[str, List[str], Any], topic: Optional[str] = None) -> str:
        prompt_content = []
        sticky_key = None 

        if isinstance(content, dict) and "file" in content and "api_key" in content:
            logger.info("Using Sticky Key for file generation.")
            prompt_content.append(content["file"])
            sticky_key = content["api_key"]
            text_instruction = "Analyze the attached document and create a comprehensive study guide."
        elif hasattr(content, "name") and "files/" in str(content.name): 
             prompt_content.append(content)
             text_instruction = "Analyze the attached document."
        elif isinstance(content, list):
             text_instruction = "Analyze the following content sections."
             prompt_content.append("\n\n".join(content))
        else:
             text_instruction = "Analyze the following content."
             prompt_content.append(str(content))
        
        final_prompt = f"""{text_instruction}

{'Topic: ' + topic if topic else ''}

Instructions:
1. Write a detailed analysis.
2. Use Markdown Headers.
3. Keep it comprehensive.
4. If the document contains math, formulas, or diagrams, explain them clearly using LaTeX or descriptive text.

Return valid JSON matching the schema."""

        prompt_content.append(final_prompt)
    
        try:
            response_text = await self._generate_text(
                prompt_content, 
                "You are an expert educator. Return only valid JSON.", 
                task_type="notes",
                response_schema=AnalysisSchema,
                specific_key=sticky_key 
            )
            data = self._safe_parse_json(response_text)
            return data.get("analysis", "")
        except Exception as e:
            logger.error(f"Failed to generate notes: {e}")
            raise ValueError(f"Failed to generate notes: {str(e)}")
    
    async def generate_flashcards(self, content: str, num_cards: int = 10) -> List[Dict[str, str]]:
        content_snippet = content[:15000] 
        prompt = f"Create {num_cards} flashcards (question/answer). Content: {content_snippet}. Return valid JSON."
        
        try:
            response_text = await self._generate_text(
                prompt, 
                "You are an expert educator. Return only valid JSON.", 
                task_type="flashcards",
                response_schema=FlashcardListSchema
            )
            data = self._safe_parse_json(response_text)
            flashcards = data.get("flashcards", [])
            return [{"front": f.get("term"), "back": f.get("definition")} for f in flashcards]
        except Exception as e:
            raise ValueError(f"Failed to generate flashcards: {str(e)}")
    
    async def generate_quiz(self, content: str, num_questions: int = 10, question_type: str = "mixed") -> List[Dict]:
        content_snippet = content[:15000]
        prompt = f"Create {num_questions} quiz questions. Content: {content_snippet}. Type: {question_type}. Return valid JSON."
        
        try:
            response_text = await self._generate_text(
                prompt, 
                "You are an expert educator. Return only valid JSON.", 
                task_type="quiz",
                response_schema=QuizListSchema
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
                "You are an expert educator. Return only valid JSON.", 
                task_type="mindmap",
                response_schema=MindMapGraphSchema
            )
            return self._safe_parse_json(response_text)
        except Exception as e:
            raise ValueError(f"Failed to generate mind map: {str(e)}")

    async def generate_lecture_outline(self, topic: str, duration: int = 60, level: str = "intermediate") -> Dict:
        prompt = f"Create a lecture outline for {topic}, {duration} mins, {level}. Return valid JSON."
        
        try:
            response_text = await self._generate_text(
                prompt,
                "You are an expert educator.",
                response_schema=LectureOutlineSchema
            )
            return self._safe_parse_json(response_text)
        except Exception as e:
            raise ValueError(f"Failed to generate lecture outline: {str(e)}")