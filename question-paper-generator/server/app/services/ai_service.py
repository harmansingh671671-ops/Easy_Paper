import logging
import io
import json
import asyncio
import base64
from typing import List, Dict, Optional, Any, Union
import fitz  # PyMuPDF
from openai import AsyncOpenAI
import json_repair
from app.core.key_manager import KeyManager

# Configure debugging logger specific to this module
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self._setup_logging()
        self.key_manager = KeyManager()
        self.model_name = "nvidia/nemotron-nano-12b-v2-vl:free"
        logger.info(f"AI Service Initialized with Model: {self.model_name} (Vision-Language Mode)")

    def _setup_logging(self):
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

    def extract_images_from_pdf(self, pdf_bytes: bytes) -> List[str]:
        """
        Converts each page of the PDF to a PNG image, encoded as Base64 Data URI.
        Returns a list of Data URIs.
        """
        images = []
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # Scale up for better quality
                img_data = pix.tobytes("png")
                b64_data = base64.b64encode(img_data).decode('utf-8')
                images.append(f"data:image/png;base64,{b64_data}")
            doc.close()
            logger.info(f"Converted PDF to {len(images)} images")
            return images
        except Exception as e:
            logger.error(f"PDF Image Conversion Error: {e}")
            raise ValueError(f"Failed to convert PDF to images: {str(e)}")

    # Kept for compatibility, but redirects to image conversion
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> List[str]:
        return self.extract_images_from_pdf(pdf_bytes)

    async def _generate_with_retry(self, content_input: Union[str, List[str]], prompt_text: str, system_instruction: str = "You are a helpful assistant.") -> str:
        """
        Generates text using the Nvidia VL model.
        Handles text or List of Base64 Image URIs.
        """
        max_attempts = len(self.key_manager.keys) * 2 
        
        # Prepare content payload
        messages = [{"role": "system", "content": system_instruction}]
        
        user_content = []
        user_content.append({"type": "text", "text": prompt_text})

        if isinstance(content_input, list):
            # It's a list of images
            for img_uri in content_input:
                user_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": img_uri
                    }
                })
        elif isinstance(content_input, str) and content_input.startswith("data:"):
             # Single Base64 string (backwards compatibility)
             user_content.append({
                 "type": "image_url", 
                 "image_url": {
                     "url": content_input
                 }
             })
        else:
            # Fallback for plain text
            user_content[0]["text"] += f"\n\nContent:\n{str(content_input)[:25000]}"

        messages.append({"role": "user", "content": user_content})

        for attempt in range(max_attempts):
            key = self.key_manager.get_active_key()
            try:
                client = AsyncOpenAI(
                    api_key=key,
                    base_url="https://openrouter.ai/api/v1",
                    default_headers={
                        "HTTP-Referer": "https://localhost:3000",
                        "X-Title": "Easy Paper Generator"
                    }
                )
                
                logger.debug(f"Sending request to {self.model_name} with key ...{key[-4:]}")

                completion = await client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=0.7
                )
                
                content = completion.choices[0].message.content or ""
                return content

            except Exception as e:
                # Explicitly print for debugging
                print(f"API Error with key ...{key[-4:]}: {e}")
                logger.warning(f"Attempt {attempt+1} failed with key ...{key[-4:]}: {e}")
                self.key_manager.mark_rate_limited(key)
                await asyncio.sleep(1) 
        
        raise Exception("Failed to generate content after exhausting all retry attempts.")

    # ---------------- FEATURES ----------------

    async def generate_short_notes(self, content: Union[str, List[str]], topic: Optional[str] = None) -> str:
        # Content can be List[str] (images) now
        prompt = f"""
        Analyze the provided document images and create a comprehensive study guide.
        Topic: {topic if topic else 'General'}
        
        Instructions:
        1. Write a detailed analysis.
        2. Use Markdown Headers.
        3. Explain complex concepts clearly.
        4. Analyze the visual/text content thoroughly.
        
        Return valid JSON matching the schema: {{ "analysis": "markdown string" }}
        """
        try:
            response_text = await self._generate_with_retry(content, prompt, "You are an expert educator. Return only valid JSON.")
            data = json_repair.loads(response_text)
            return data.get("analysis", "")
        except Exception as e:
            logger.error(f"Generate Notes Error: {e}", exc_info=True)
            raise ValueError(f"Failed to generate notes: {str(e)}")

    async def generate_flashcards(self, content: Union[str, List[str]], num_cards: int = 10) -> List[Dict[str, str]]:
        prompt = f"""
        Create {num_cards} flashcards based on the provided document images.
        Return a valid JSON object with a key 'flashcards' which is a list of objects, each having 'term' and 'definition'.
        """
        try:
            response_text = await self._generate_with_retry(content, prompt, "You are an expert educator. Return only valid JSON.")
            data = json_repair.loads(response_text)
            flashcards = data.get("flashcards", [])
            return [{"front": f.get("term"), "back": f.get("definition")} for f in flashcards]
        except Exception as e:
            logger.error(f"Generate Flashcards Error: {e}", exc_info=True)
            return []

    async def generate_quiz(self, content: Union[str, List[str]], num_questions: int = 10, question_type: str = "mixed") -> List[Dict]:
        prompt = f"""
        Create {num_questions} quiz questions based on the provided document images.
        Type: {question_type}
        Return a valid JSON object with a key 'questions', where each question has 'question', 'options' (list), 'correct_answer', and 'explanation'.
        """
        try:
            response_text = await self._generate_with_retry(content, prompt, "You are an expert educator. Return only valid JSON.")
            data = json_repair.loads(response_text)
            return data.get("questions", [])
        except Exception as e:
            logger.error(f"Generate Quiz Error: {e}", exc_info=True)
            return []

    async def generate_mind_map_structure(self, content: Union[str, List[str]], topic: Optional[str] = None) -> Dict:
        prompt = "Create a hierarchical mind map structure for the provided content. Return valid JSON representing the node structure."
        try:
            response_text = await self._generate_with_retry(content, prompt, "You are an expert educator. Return only valid JSON.")
            return json_repair.loads(response_text)
        except Exception as e:
            logger.error(f"Generate Mindmap Error: {e}", exc_info=True)
            return {}

    async def generate_lecture_outline(self, topic: str, duration: int = 60, level: str = "intermediate") -> Dict:
        prompt = f"Create a lecture outline for {topic}, {duration} mins, level {level}. Return valid JSON."
        try:
            response_text = await self._generate_with_retry(topic, prompt)
            return json_repair.loads(response_text)
        except Exception as e:
            logger.error(f"Lecture Outline Error: {e}")
            return {}