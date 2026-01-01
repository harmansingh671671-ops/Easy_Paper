
import sys
import asyncio
from unittest.mock import MagicMock

# 1. Mock External Dependencies
sys.modules["fitz"] = MagicMock()
sys.modules["openai"] = MagicMock()
# Mock json_repair to return a dict so .get() works
json_repair_mock = MagicMock()
json_repair_mock.loads.return_value = {"analysis": "markdown", "flashcards": [], "questions": []}
sys.modules["json_repair"] = json_repair_mock

# Ensure app can be imported
sys.path.append("c:/Question_Paper/Easy_Paper/question-paper-generator/server")

# 2. Mock Internal Dependencies BEFORE importing AIService
# We need to mock KeyManager inside 'app.core.key_manager' if possible OR 'app.services.ai_service'
# Since AIService imports KeyManager from app.core.key_manager, let's mock that module
app_core_key_manager_mock = MagicMock()
KeyManagerMock = MagicMock()
KeyManagerMock.return_value.get_active_key.return_value = "fake-key"
KeyManagerMock.return_value.keys = ["fake-key"]
app_core_key_manager_mock.KeyManager = KeyManagerMock
sys.modules["app.core.key_manager"] = app_core_key_manager_mock

from app.services.ai_service import AIService

async def verify():
    print("Initializing AIService...")
    service = AIService()
    
    # Manually ensure key_manager is mocked if import mock failed
    service.key_manager = MagicMock()
    service.key_manager.keys = ["fake-key"]
    service.key_manager.get_active_key.return_value = "fake-key"
    
    # Mock AsyncOpenAI client creation inside _generate_with_retry
    # We can patch 'app.services.ai_service.AsyncOpenAI' which is already a mock from sys.modules
    # We need to configure it to return our client mock
    from app.services.ai_service import AsyncOpenAI as MockAsyncOpenAI
    
    start_client = MagicMock()
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock(message=MagicMock(content='{"analysis": "markdown"}'))]
    
    # Make crate return an awaitable
    future = asyncio.Future()
    future.set_result(mock_completion)
    start_client.chat.completions.create.return_value = future
    
    MockAsyncOpenAI.return_value = start_client
    
    print("\n--- Test 1: Generate Short Notes (Topic) ---")
    await service.generate_short_notes("Photosynthesis")
    call_args = start_client.chat.completions.create.call_args
    model_used = call_args.kwargs['model']
    print(f"Model used: {model_used}")
    if model_used == "xiaomi/mimo-v2-flash":
        print("PASS: Correct model for Topic")
    else:
        print(f"FAIL: Expected xiaomi, got {model_used}")

    print("\n--- Test 2: Generate Short Notes (Image) ---")
    await service.generate_short_notes(["data:image/png;base64,abc"])
    call_args = start_client.chat.completions.create.call_args
    model_used = call_args.kwargs['model']
    print(f"Model used: {model_used}")
    if model_used == "nvidia/nemotron-nano-12b-v2-vl:free":
        print("PASS: Correct model for Image")
    else:
        print(f"FAIL: Expected nvidia, got {model_used}")

if __name__ == "__main__":
    asyncio.run(verify())
