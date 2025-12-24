import os
from google import genai
from google.genai import types
import PyPDF2
import io
import json
from typing import List, Dict, Optional

class AIService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Initialize the new Client
        self.client = genai.Client(api_key=api_key)
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract text content from PDF bytes (hidden from user)"""
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")
    
    def _generate_text(self, prompt: str, system_instruction: str = None) -> str:
        """Helper method to generate text using Gemini (Updated for new SDK)"""
        try:
            # Configure generation settings
            config = types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2000,
                system_instruction=system_instruction
            )
            
            # Call the model using the new client structure
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini")
            
            return response.text
        except Exception as e:
            raise ValueError(f"Failed to generate content: {str(e)}")
    
    async def generate_short_notes(self, content: str, topic: Optional[str] = None) -> str:
        """Generate concise short notes from content"""
        # Limit content to save tokens
        content_snippet = content[:8000] if len(content) > 8000 else content
        
        prompt = f"""Create concise, well-structured short notes from the following content.

{'Topic: ' + topic if topic else ''}

Content:
{content_snippet}

Instructions:
1. Create clear, concise notes
2. Use bullet points and headings
3. Highlight key concepts and definitions
4. Organize information logically
5. Keep it comprehensive but brief

Generate the short notes:"""
        
        system_instruction = "You are an expert educator who creates clear, concise study notes."
        
        try:
            return self._generate_text(prompt, system_instruction)
        except Exception as e:
            raise ValueError(f"Failed to generate notes: {str(e)}")
    
    async def generate_flashcards(self, content: str, num_cards: int = 10) -> List[Dict[str, str]]:
        """Generate flashcards from content"""
        # Use shorter content to save tokens
        content_snippet = content[:6000] if len(content) > 6000 else content
        
        prompt = f"""Create {num_cards} flashcards from the following content.

Content:
{content_snippet}

Instructions:
1. Create question-answer pairs
2. Questions should test understanding, not just recall
3. Answers should be concise but complete
4. Cover key concepts and important details

Return ONLY a valid JSON object with a "flashcards" array in this format:
{{"flashcards": [{{"front": "question", "back": "answer"}}, ...]}}

Generate the flashcards:"""
        
        system_instruction = "You are an expert educator. Return only valid JSON with a 'flashcards' array."
        
        try:
            response_text = self._generate_text(prompt, system_instruction)
            # Try to extract JSON from response
            response_text = response_text.strip()
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            result = json.loads(response_text)
            
            # Handle different response formats
            if isinstance(result, dict):
                if "flashcards" in result:
                    return result["flashcards"]
                elif "cards" in result:
                    return result["cards"]
                else:
                    # Try to find array in any key
                    for key, value in result.items():
                        if isinstance(value, list):
                            return value
            elif isinstance(result, list):
                return result
            return []
        except Exception as e:
            raise ValueError(f"Failed to generate flashcards: {str(e)}")
    
    async def generate_quiz(self, content: str, num_questions: int = 10, question_type: str = "mixed") -> List[Dict]:
        """Generate quiz questions from content"""
        # Use shorter content to save tokens
        content_snippet = content[:6000] if len(content) > 6000 else content
        
        prompt = f"""Create {num_questions} quiz questions from the following content.

Content:
{content_snippet}

Question Type: {question_type} (can be MCQ, TRUE_FALSE, FILL_BLANK, or mixed)

Instructions:
1. Create questions that test understanding
2. For MCQ: provide 4 options with one correct answer
3. For TRUE_FALSE: provide statement and answer
4. For FILL_BLANK: provide sentence with blank and answer
5. Include difficulty level (EASY, MEDIUM, HARD)

Return ONLY a valid JSON object with "questions" array. Each question should have:
- question_text: string
- question_type: string (MCQ, TRUE_FALSE, FILL_BLANK)
- options: array (for MCQ) or null
- correct_answer: string
- difficulty: string (EASY, MEDIUM, HARD)
- explanation: string (optional)

Generate the quiz:"""
        
        system_instruction = "You are an expert educator. Return only valid JSON."
        
        try:
            response_text = self._generate_text(prompt, system_instruction)
            # Clean JSON response
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            result = json.loads(response_text)
            return result.get("questions", [])
        except Exception as e:
            raise ValueError(f"Failed to generate quiz: {str(e)}")
    
    async def generate_mind_map_structure(self, content: str, topic: Optional[str] = None) -> Dict:
        """Generate mind map structure from content"""
        # Use shorter content to save tokens
        content_snippet = content[:6000] if len(content) > 6000 else content
        
        prompt = f"""Create a mind map structure from the following content.

{'Topic: ' + topic if topic else ''}

Content:
{content_snippet}

Instructions:
1. Identify main topics and subtopics
2. Create hierarchical structure
3. Show relationships between concepts

Return ONLY a valid JSON object with this structure:
{{
    "central_topic": "main topic",
    "nodes": [
        {{"id": "1", "label": "topic", "level": 1}},
        {{"id": "2", "label": "subtopic", "level": 2, "parent": "1"}}
    ],
    "connections": [
        {{"from": "1", "to": "2"}}
    ]
}}

Generate the mind map structure:"""
        
        system_instruction = "You are an expert educator. Return only valid JSON."
        
        try:
            response_text = self._generate_text(prompt, system_instruction)
            # Clean JSON response
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            return json.loads(response_text)
        except Exception as e:
            raise ValueError(f"Failed to generate mind map: {str(e)}")
    
    async def generate_lecture_outline(self, topic: str, duration: int = 60, level: str = "intermediate") -> Dict:
        """Generate lecture preparation outline"""
        prompt = f"""Create a comprehensive lecture outline.

Topic: {topic}
Duration: {duration} minutes
Level: {level}

Instructions:
1. Create a structured lecture outline
2. Include learning objectives
3. Break down into sections with time allocation
4. Include key points for each section
5. Suggest activities or examples
6. Include summary and Q&A time

Return ONLY a valid JSON object with this structure:
{{
    "topic": "topic name",
    "learning_objectives": ["objective1", "objective2"],
    "sections": [
        {{
            "title": "section title",
            "duration": 10,
            "key_points": ["point1", "point2"],
            "activities": ["activity1"],
            "examples": ["example1"]
        }}
    ],
    "summary_duration": 5,
    "qa_duration": 5
}}

Generate the lecture outline:"""
        
        system_instruction = "You are an expert educator. Return only valid JSON."
        
        try:
            response_text = self._generate_text(prompt, system_instruction)
            # Clean JSON response
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            return json.loads(response_text)
        except Exception as e:
            raise ValueError(f"Failed to generate lecture outline: {str(e)}")