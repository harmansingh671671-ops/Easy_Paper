import asyncio
import time
import sys
import os

# Add server dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import AIService

async def mock_generate_text(*args, **kwargs):
    print("  -> Mock AI Call")
    return '{"analysis": "Valid analysis"}'

async def test_sequential():
    service = AIService()
    # Mock the API call to avoid actual cost/networking
    service._generate_text = mock_generate_text
    
    chunks = ["Page 1", "Page 2", "Page 3"]
    
    print("Starting test with 3 chunks (Expect ~4s delay total)...")
    start = time.time()
    
    result = await service.generate_short_notes(chunks)
    
    end = time.time()
    duration = end - start
    
    print(f"Total duration: {duration:.2f}s")
    print(f"Result length: {len(result)}")
    
    if duration >= 4.0:
        print("PASS: Sequential delay observed.")
    else:
        print("FAIL: Too fast! Parallel or no delay?")

if __name__ == "__main__":
    asyncio.run(test_sequential())
