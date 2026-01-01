
import asyncio
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure app can be imported
sys.path.append("c:/Question_Paper/Easy_Paper/question-paper-generator/server")

# Mock fitz before importing app.services.ai_service
sys.modules["fitz"] = MagicMock()
sys.modules["openai"] = MagicMock()
json_repair_mock = MagicMock()
json_repair_mock.loads.return_value = {"analysis": "markdown", "flashcards": [], "questions": []}
sys.modules["json_repair"] = json_repair_mock

from app.services.ai_service import AIService

class TestModelSelection(unittest.TestCase):
    def setUp(self):
        # Patch KeyManager
        self.key_manager_patcher = patch("app.services.ai_service.KeyManager")
        self.mock_key_manager_cls = self.key_manager_patcher.start()
        
        self.ai_service = AIService()
        # Mock KeyManager to avoid needing real keys
        self.ai_service.key_manager = MagicMock()
        self.ai_service.key_manager.get_active_key.return_value = "fake-key"
        self.ai_service.key_manager.keys = ["fake-key"]

    def tearDown(self):
        self.key_manager_patcher.stop()

    @patch("app.services.ai_service.AsyncOpenAI")
    def test_generate_short_notes_topic(self, mock_openai_cls):
        # Setup Mock
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_completion = MagicMock()
        mock_completion.choices = [MagicMock(message=MagicMock(content='{"analysis": "markdown"}'))]
        mock_client.chat.completions.create.return_value = asyncio.Future()
        mock_client.chat.completions.create.return_value.set_result(mock_completion)

        # Execute
        asyncio.run(self.ai_service.generate_short_notes("Photosynthesis"))

        # Verify
        call_args = mock_client.chat.completions.create.call_args
        self.assertIsNotNone(call_args)
        # Check model name
        self.assertEqual(call_args.kwargs['model'], "xiaomi/mimo-v2-flash")

    @patch("app.services.ai_service.AsyncOpenAI")
    def test_generate_short_notes_image(self, mock_openai_cls):
        # Setup Mock
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_completion = MagicMock()
        mock_completion.choices = [MagicMock(message=MagicMock(content='{"analysis": "markdown"}'))]
        mock_client.chat.completions.create.return_value = asyncio.Future()
        mock_client.chat.completions.create.return_value.set_result(mock_completion)

        # Execute
        dummy_image = "data:image/png;base64,ivborw0kggo="
        asyncio.run(self.ai_service.generate_short_notes([dummy_image]))

        # Verify
        call_args = mock_client.chat.completions.create.call_args
        self.assertEqual(call_args.kwargs['model'], "nvidia/nemotron-nano-12b-v2-vl:free")

    @patch("app.services.ai_service.AsyncOpenAI")
    def test_generate_flashcards_topic(self, mock_openai_cls):
         # Setup Mock
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_completion = MagicMock()
        mock_completion.choices = [MagicMock(message=MagicMock(content='{"flashcards": []}'))]
        mock_client.chat.completions.create.return_value = asyncio.Future()
        mock_client.chat.completions.create.return_value.set_result(mock_completion)

        # Execute
        asyncio.run(self.ai_service.generate_flashcards("Biology"))

        # Verify
        call_args = mock_client.chat.completions.create.call_args
        self.assertEqual(call_args.kwargs['model'], "xiaomi/mimo-v2-flash")

    @patch("app.services.ai_service.AsyncOpenAI")
    def test_generate_flashcards_image(self, mock_openai_cls):
        # Setup Mock
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_completion = MagicMock()
        mock_completion.choices = [MagicMock(message=MagicMock(content='{"flashcards": []}'))]
        mock_client.chat.completions.create.return_value = asyncio.Future()
        mock_client.chat.completions.create.return_value.set_result(mock_completion)

        # Execute
        dummy_image = "data:image/png;base64,ivborw0kggo="
        asyncio.run(self.ai_service.generate_flashcards([dummy_image]))

        # Verify
        call_args = mock_client.chat.completions.create.call_args
        self.assertEqual(call_args.kwargs['model'], "nvidia/nemotron-nano-12b-v2-vl:free")

    @patch("app.services.ai_service.AsyncOpenAI")
    def test_generate_lecture_outline(self, mock_openai_cls):
        # Setup Mock
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_completion = MagicMock()
        mock_completion.choices = [MagicMock(message=MagicMock(content='{}'))]
        mock_client.chat.completions.create.return_value = asyncio.Future()
        mock_client.chat.completions.create.return_value.set_result(mock_completion)

        # Execute
        asyncio.run(self.ai_service.generate_lecture_outline("Physics"))

        # Verify
        call_args = mock_client.chat.completions.create.call_args
        self.assertEqual(call_args.kwargs['model'], "xiaomi/mimo-v2-flash")

if __name__ == '__main__':
    unittest.main()
