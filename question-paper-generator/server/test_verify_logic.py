import asyncio
import os
import sys
# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv()

# We need to mock KeyManager if we don't have keys, but user has keys in .env hopefully
# or at least one key.

async def test_regex():
    try:
        from app.services.ai_service import AIService
        service = AIService()
        print("AIService initialized successfully.")
        
        # Test Key Manager
        print(f"Loaded keys: {len(service.key_manager.keys)}")
        
        # Test Regex Content
        content = """
        1. What is the process of photosynthesis?
        a) Respiration
        b) Making food using sunlight
        c) Digestion
        d) Excretion
        
        2. Who is the father of physics?
        a) Newton
        b) Einstein
        c) Galileo
        d) Darwin
        """
        
        print("\n--- Testing Regex Extraction ---")
        questions = await service.generate_quiz(content, num_questions=2)
        
        print(f"Returned {len(questions)} questions.")
        if len(questions) == 2:
            print("Question 1:", questions[0]['question_text'])
            print("Question 1 Options:", questions[0]['options'])
            if questions[0]['question_text'].strip() == "What is the process of photosynthesis?":
                print("SUCCESS: Regex extraction matched Question 1.")
            else:
                print("FAILURE: Question text mismatch.")
        else:
            print("FAILURE: Expected 2 questions from regex.")
            
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_regex())
