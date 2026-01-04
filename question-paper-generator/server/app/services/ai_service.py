import logging
import io
import json
import asyncio
import base64
from typing import List, Dict, Optional, Any, Union, AsyncGenerator
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
        Converts ALL PDF pages to PNG images.
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

    # Kept for compatibility
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> List[str]:
        return self.extract_images_from_pdf(pdf_bytes)

    async def _generate_with_retry(self, content_input: Union[str, List[str]], prompt_text: str, system_instruction: str = "You are a helpful assistant.") -> str:
        """
        Generates text using the Nvidia VL model.
        Handles text or List of Base64 Image URIs.
        """
        # Strengthen system instruction for JSON tasks
        if "JSON" in system_instruction:
            system_instruction += " IMPORTANT: Output ONLY valid JSON. Do not include any thinking, reasoning, chain-of-thought, or markdown code blocks outside the JSON. Do not output 'Wait' or 'Correction'."
        # Attempt to parse JSON string if it looks like a list
        if isinstance(content_input, str) and content_input.strip().startswith("["):
            try:
                parsed = json.loads(content_input)
                if isinstance(parsed, list):
                    content_input = parsed
            except:
                pass # Treat as normal string

        max_attempts = len(self.key_manager.keys) * 2 
        
        # Prepare content payload
        messages = [{"role": "system", "content": system_instruction}]
        
        user_content = []
        user_content.append({"type": "text", "text": prompt_text})

        if isinstance(content_input, list):
            # It's a list of images or text chunks? 
            # We assume list of images (data URIs) for this model context
            for item in content_input:
                # Basic check if it's an image URI
                if isinstance(item, str) and item.startswith("data:"):
                     user_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": item
                        }
                    })
                else:
                    # Append as text if not image
                     user_content[0]["text"] += f"\n\nPart:\n{str(item)[:5000]}"

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

    async def generate_notes_stream(self, pdf_bytes: bytes, topic: Optional[str] = None) -> AsyncGenerator[str, None]:
        """
        Generates notes in batches (chunks of 10 pages) and yields results as NDJSON.
        """
        try:
            # 1. Convert ALL pages to images
            all_images = self.extract_images_from_pdf(pdf_bytes)
            total_images = len(all_images)
            
            # 2. Chunking Logic (Batch size 10)
            BATCH_SIZE = 10
            
            for i in range(0, total_images, BATCH_SIZE):
                chunk_images = all_images[i : i + BATCH_SIZE]
                chunk_index = (i // BATCH_SIZE) + 1
                total_chunks = (total_images + BATCH_SIZE - 1) // BATCH_SIZE
                
                logger.info(f"Processing Batch {chunk_index}/{total_chunks} ({len(chunk_images)} pages)")
                
                # Yield progress info (optional, but good for UI)
                # yield json.dumps({"status": f"Analyzing pages {i+1} to {min(i+BATCH_SIZE, total_images)}..."}) + "\n"

                # Auto-detect logic for streaming
                # If we have content (which we always do in this streaming function), we ignore the provided topic for the PROMPT
                # to avoid hallucination, as requested.
                display_topic = "Auto-Detect"
                prompt_header = "Step 1: Identify the main topic of this chunk."
                constraint_text = "The content MUST be exclusively about the identified main topic."

                # Logic that was here before is replaced by force-ignoring topic for prompt.
                # display_topic = topic (Old) -> Now we ignore 'topic' argument for the prompt generation.


                prompt = f"""
                Analyze the provided document images (Part {chunk_index} of {total_chunks}) and provide detailed study notes.
                {prompt_header}
                
                **STRICT CONTENT RULES**:
                1.  **STRICT ADHERENCE**: {constraint_text}
                2.  **NEGATIVE CONSTRAINT**: Do NOT discuss unrelated subjects. (e.g., If Physics, NO Biology. If History, NO Science).
                3.  **SOURCE ONLY**: Use ONLY the provided document images. Do NOT hallucinate external information.
 
                Return valid JSON matching the schema: {{ "analysis": "markdown string" }}
                """
                
                try:
                    response_text = await self._generate_with_retry(chunk_images, prompt, "You are a strict academic expert. Return only valid JSON.")
                    data = json_repair.loads(response_text)
                    notes_part = data.get("analysis", "")
                    
                    # Yield partial result
                    yield json.dumps({
                        "notes": notes_part, 
                        "done": False,
                        "batch": chunk_index,
                        "total_batches": total_chunks
                    }) + "\n"
                    
                except Exception as e:
                    logger.error(f"Batch {chunk_index} failed: {e}")
                    yield json.dumps({"error": str(e)}) + "\n"

            # Final 'done' message
            yield json.dumps({"notes": "", "done": True}) + "\n"

        except Exception as e:
             logger.error(f"Streaming Error: {e}")
             yield json.dumps({"error": str(e)}) + "\n"


    async def generate_short_notes(self, content: Union[str, List[str]], topic: Optional[str] = None) -> str:
        # Parse if stringified list
        if isinstance(content, str) and content.strip().startswith("["):
            try:
                parsed = json.loads(content)
                if isinstance(parsed, list):
                    content = parsed
            except: pass

        # If content is empty/None but topic is provided, generate from topic
        if not content and topic:
            prompt = f"""
            Create a comprehensive study guide for the topic: "{topic}".
            
            **STRICT CONTENT RULES**:
            1.  **STRICT ADHERENCE**: The content MUST be exclusively about "{topic}".
            2.  **NEGATIVE CONSTRAINT**: Do NOT discuss unrelated subjects. (e.g., If Physics, NO Biology. If History, NO Science).
            3.  **NO HALLUCINATIONS**: Do not generate generic filler content.

            Instructions:
            1. Write a detailed analysis.
            2. Use Markdown Headers.
            3. Explain complex concepts clearly.
            
            Return valid JSON matching the schema: {{ "analysis": "markdown string" }}
            """
            image_content = [] 
        else:
            if isinstance(content, list) and len(content) > 10:
                 content = content[:10]
            
            # Auto-detect topic logic
            # Update: If content is present, we FORCE Auto-Detect logic for the prompt to ignore user topic
            display_topic = None 
            if not content:
                 # Only use user topic if NO content is provided (Topic-only generation)
                 display_topic = topic

            prompt_header = ""
            constraint_text = ""
            
            if not display_topic or display_topic == "None" or display_topic == "null":
                display_topic = "Auto-Detect"
                prompt_header = "Step 1: Identify the main topic of the provided content. Step 2: Create a comprehensive study guide based on that topic."
                constraint_text = "The content MUST be exclusively about the identified main topic."
                # Don't include "Topic: Auto-Detect" line in prompt
                topic_line = "" 
            else:
                topic_line = f"Topic: {display_topic}"
                constraint_text = f"The content MUST be exclusively about '{display_topic}'."

            prompt = f"""
            Analyze the provided document images/content and create a comprehensive study guide.
            {prompt_header} {topic_line}
            
            **STRICT CONTENT RULES**:
            1.  **STRICT ADHERENCE**: {constraint_text}
            2.  **NEGATIVE CONSTRAINT**: Do NOT discuss unrelated subjects.
            3.  **SOURCE BASED**: Base every point on the provided content.

            **CRITICAL FORMATTING RULES (Follow Strictly)**:
            1.  **Main Headers**: Use `## Header` for main topics.
            2.  **Sub Headers**: Use `### Subheader` for sub-topics.
            3.  **Strict Nesting**:
                -   Use **4 SPACES** for indentation of nested items (Do not use tabs).
                -   Level 1: `- Main Point`
                -   Level 2: `    - Detail for main point` (Indented 4 spaces)
                -   Level 3: `        - Sub-detail` (Indented 8 spaces)
            4.  **Spacing**:
                -   Add an empty line before every Main Header.
                -   Add an empty line between distinct list items if they are long.
            
            **Content Style**:
            -   Be detailed and educational (ChatGPT style).
            -   Use Bold for keywords: `- **Concept**: Definition`.
            
            Return valid JSON matching the schema: {{ "analysis": "markdown string" }}
            """
            image_content = content

        try:
             # If no images (topic only), we pass simple text content if possible or just use prompt
            response_text = await self._generate_with_retry(image_content if image_content else topic, prompt, "You are a strict academic expert. Return only valid JSON.")
            data = json_repair.loads(response_text)
            return data.get("analysis", "")
        except Exception as e:
            logger.error(f"Generate Notes Error: {e}", exc_info=True)
            raise ValueError(f"Failed to generate notes: {str(e)}")

    async def generate_flashcards(self, content: Union[str, List[str]], num_cards: int = 10, topic: Optional[str] = None) -> List[Dict[str, str]]:
        if isinstance(content, str) and content.strip().startswith("["):
            try:
                parsed = json.loads(content)
                if isinstance(parsed, list):
                    content = parsed
            except: pass

        # Take first 10 for now given other limitations, or implement similar batching
        input_content = content
        if isinstance(content, list) and len(content) > 10:
             input_content = content[:10]
        elif not content and topic:
             # Topic based generation
             input_content = f"Generate flashcards regarding the topic: {topic}"
        elif not content:
             input_content = f"Generate flashcards regarding the general topic." # Fallback

        # Auto-detect logic
        # Update: Ignore topic for PROMPT if content is present
        display_topic = None
        if not content:
             display_topic = topic

        prompt_header = ""
        constraint_text = ""
        
        if not display_topic or display_topic == "None" or display_topic == "null":
             display_topic = "Auto-Detect"
             prompt_header = "Step 1: Identify the main topic. Step 2: Create flashcards based on that topic."
             constraint_text = "Flashcards MUST be strictly derived from the identified main topic."
             topic_line = ""
        else:
             topic_line = f"Topic: {display_topic}"
             constraint_text = f"Flashcards MUST be strictly derived from the provided content/topic '{display_topic}'."

        prompt = f"""
        Create {num_cards} flashcards based on the provided material.
        {prompt_header} {topic_line}
        
        **STRICT CONTENT RULES**:
        1.  **RELEVANCE**: {constraint_text}
        2.  **NEGATIVE CONSTRAINT**: Do NOT create cards for unrelated topics. (e.g., No Biology cards for Physics material).
        3.  **ACCURACY**: Ensure definitions are precise and academic.

        Return a valid JSON object with a key 'flashcards' which is a list of objects, each having 'term' and 'definition'.
        """
        try:
            response_text = await self._generate_with_retry(input_content, prompt, "You are a strict academic expert. Return only valid JSON.")
            data = json_repair.loads(response_text)
            flashcards = data.get("flashcards", [])
            return [{"front": f.get("term"), "back": f.get("definition")} for f in flashcards]
        except Exception as e:
            logger.error(f"Generate Flashcards Error: {e}", exc_info=True)
            return []

    async def generate_quiz(self, content: Union[str, List[str]], num_questions: int = 10, question_type: str = "mixed", topic: Optional[str] = None) -> List[Dict]:
        if not content and isinstance(content, str): # Handle empty string topic case if passed as content
             pass 
        
        # Check if content needs parsing
        if isinstance(content, str) and content.strip().startswith("["):
             try:
                 parsed = json.loads(content)
                 if isinstance(parsed, list):
                     content = parsed
             except: pass

        # Auto-detect logic
        # Update: Ignore topic for PROMPT if content is present
        display_topic = None
        if not content:
             display_topic = topic

        prompt_header = ""
        constraint_text = ""
        
        if not display_topic or display_topic == "None" or display_topic == "null":
             display_topic = "Auto-Detect"
             prompt_header = "Step 1: Identify the main topic. Step 2: Create questions based on that topic."
             constraint_text = "ALL questions must be derived *directly* from the identified topic."
             topic_line = ""
        else:
             topic_line = f"Topic: {display_topic}"
             constraint_text = f"ALL questions must be derived *directly* from the provided content/topic '{display_topic}'."

        source_display = "Provided Document Images" if isinstance(content, list) else (display_topic if topic else (content[:200] if content else 'Topic: ' + str(question_type)))
        
        # Quiz Prompt Update
        prompt = f"""
        Create {num_questions} quiz questions.
        Source Material: {source_display} 
        Type: {question_type}
        {prompt_header} {topic_line}
        
        **STRICT CONTENT RULES**:
        1.  **STRICT RELEVANCE**: {constraint_text}
        2.  **NEGATIVE CONSTRAINT**: Do NOT ask about unrelated fields. (e.g., No Chemistry questions in a History quiz).
        3.  **NO AMBIGUITY**: Questions must have one clear correct answer.

        **CRITICAL INSTRUCTION**: Ensure a mix of difficulties:
        - Include at least 2 'HARD' (Very Difficult) questions.
        - The rest should be a mix of 'EASY' and 'MEDIUM'.

        Return valid JSON with key 'questions', where each question has:
        - 'question_text': The question string.
        - 'question_type': 'MCQ', 'TRUE_FALSE', or 'FILL_BLANK'.
        - 'options': List of strings (if MCQ).
        - 'correct_answer': The correct answer string.
        - 'explanation': Brief explanation.
        - 'difficulty': 'EASY', 'MEDIUM', or 'HARD'.

        **ANTI-HALLUCINATION & FORMATTING**:
        - Output ONLY raw JSON. No markdown ticks.
        - Do NOT output your internal monologue or "thinking" process (e.g., "Wait, let me calculate...").
        - Ensure ALL questions are unique. Do not duplicate questions.
        """
        
        # Adjust input for _generate_with_retry
        input_content = content
        if isinstance(content, list) and len(content) > 10:
             input_content = content[:10]
        elif not content and topic:
             input_content = f"Generate {question_type} questions strictly about the topic: {topic}"
        elif not content:
             input_content = f"Generate questions about {question_type}" # Fallback if topic is passed elsewhere

        try:
            response_text = await self._generate_with_retry(input_content, prompt, "You are a strict academic expert. Return only valid JSON.")
            data = json_repair.loads(response_text)
            return data.get("questions", [])
        except Exception as e:
            logger.error(f"Generate Quiz Error: {e}", exc_info=True)
            return []

    async def generate_mind_map_structure(self, content: Union[str, List[str]], topic: Optional[str] = None) -> Dict:
        """
        Generates a hierarchical mind map structure.
        """
        if isinstance(content, str) and content.strip().startswith("["):
            try:
                parsed = json.loads(content)
                if isinstance(parsed, list):
                    content = parsed
            except: pass

        # Auto-detect logic
        # Update: Ignore topic for PROMPT if content is present
        display_topic = None
        if not content:
             display_topic = topic

        prompt_header = ""
        constraint_text = ""
        
        if not display_topic or display_topic == "None" or display_topic == "null":
             display_topic = "Auto-Detect"
             prompt_header = "Step 1: Identify the main topic. Step 2: Create the structure."
             constraint_text = "All nodes must be strictly related to the identified central topic."
             topic_line = ""
        else:
             topic_line = f"Topic: {display_topic}"
             constraint_text = f"All nodes must be strictly related to the central topic: '{display_topic}'."

        prompt = f"""
        Create a hierarchical mind map structure.
        {prompt_header} {topic_line}
        
        **STRICT CONTENT RULES**:
        1.  **RELEVANCE**: {constraint_text}
        2.  **NEGATIVE CONSTRAINT**: Eliminate any node that is off-topic or generic filler.
        
        **CRITICAL INSTRUCTION**: Create a STRICT TREE STRUCTURE.
        - A single '0' level Root Node.
        - Level 1 Nodes (Main Branches) connect ONLY to the Root.
        - Level 2 Nodes (Sub-branches) connect ONLY to Level 1 Nodes.
        - Do NOT cross-link branches. Do NOT merge sub-branches from different parents.
        - Keep it simple: show only the most important core concepts.

        Return valid JSON with keys:
        - 'central_topic': String
        - 'nodes': List of {{ "id": "1", "label": "Main Idea", "level": 0/1/2 }}
        - 'connections': List of {{ "from": "id1", "to": "id2" }}
        """
        
        input_content = content
        if isinstance(content, list) and len(content) > 10:
             input_content = content[:10]
        elif not content and topic:
             input_content = f"Topic: {topic}"

        try:
            response_text = await self._generate_with_retry(input_content, prompt, "You are a strict academic expert. Return only valid JSON.")
            return json_repair.loads(response_text)
        except Exception as e:
            logger.error(f"Generate Mind Map Error: {e}", exc_info=True)
            return {}



    async def generate_lecture_outline(self, topic: str, duration: int = 60, level: str = "intermediate") -> Dict:
        prompt = f"Create a lecture outline for {topic}, {duration} mins, level {level}. Return valid JSON."
        try:
            response_text = await self._generate_with_retry(topic, prompt)
            return json_repair.loads(response_text)
        except Exception as e:
            logger.error(f"Lecture Outline Error: {e}")
            return {}