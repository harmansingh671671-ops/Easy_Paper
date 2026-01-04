import unittest
from unittest.mock import MagicMock, AsyncMock
import asyncio
import sys
import os

# Add server directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock fitz before importing ai_service
sys.modules['fitz'] = MagicMock()
sys.modules['openai'] = MagicMock()
sys.modules['json_repair'] = MagicMock() # Mocking this too just in case

from app.services.ai_service import AIService

class TestTopicHandling(unittest.TestCase):
    def setUp(self):
        # Mock KeyManager to avoid file/env issues during test init
        with unittest.mock.patch('app.services.ai_service.KeyManager') as MockKeyManager:
             MockKeyManager.return_value.keys = ["dummy_key"]
             self.service = AIService()
        
        # Mock the generation method to capture prompts
        self.service._generate_with_retry = AsyncMock(return_value='{"analysis": "test note", "questions": [], "flashcards": [], "central_topic": "test"}')

    def test_notes_with_content_ignores_topic(self):
        asyncio.run(self.service.generate_short_notes("some content", topic="Biology"))
        
        # Check call args
        args, _ = self.service._generate_with_retry.call_args
        prompt = args[1] # 2nd arg is prompt
        
        print(f"\n[Notes] Prompt with Content: {prompt[:100]}...")
        
        # Assertions
        self.assertNotIn("Topic: Biology", prompt, "Topic SHOULD be ignored when content is present")
        self.assertIn("Step 1: Identify the main topic", prompt, "Should use Auto-Detect prompt header")

    def test_notes_without_content_uses_topic(self):
        asyncio.run(self.service.generate_short_notes(None, topic="Biology"))
        
        args, _ = self.service._generate_with_retry.call_args
        prompt = args[1]
        
        print(f"\n[Notes] Prompt WITHOUT Content: {prompt[:100]}...")
        
        # The prompt template for topic-only is: '...topic: "{topic}"...'
        self.assertIn('topic: "Biology"', prompt, "Topic SHOULD be used when content is missing")

    def test_quiz_with_content_ignores_topic(self):
        asyncio.run(self.service.generate_quiz("some content", topic="History"))
        
        args, _ = self.service._generate_with_retry.call_args
        prompt = args[1]
        
        print(f"\n[Quiz] Prompt with Content: {prompt[:100]}...")
        
        self.assertNotIn("Topic: History", prompt)
        self.assertIn("Step 1: Identify the main topic", prompt)

    def test_flashcards_with_content_ignores_topic(self):
        asyncio.run(self.service.generate_flashcards("some content", topic="Physics"))
        
        args, _ = self.service._generate_with_retry.call_args
        prompt = args[1]
        
        print(f"\n[Flashcards] Prompt with Content: {prompt[:100]}...")
        
        self.assertNotIn("Topic: Physics", prompt)
        self.assertIn("Step 1: Identify the main topic", prompt)

if __name__ == '__main__':
    unittest.main()
