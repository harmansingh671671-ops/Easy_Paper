# AI Features Setup Guide

## Overview
The Easy Paper platform now includes AI-powered features for generating study materials and lecture preparation tools.

## Required Setup

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

### 2. Configure Backend

Add the OpenAI API key to your backend `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # Optional: defaults to gpt-4o-mini (cheaper)
```

### 3. Install Dependencies

The required packages are already in `requirements.txt`:
- `openai==1.12.0`
- `PyPDF2==3.0.1`

Install them if not already installed:
```bash
cd question-paper-generator/server
pip install openai PyPDF2
```

## Available AI Features

### For Students

1. **PDF Upload & Processing**
   - Upload PDF notes
   - Automatically extract text
   - Generate multiple outputs at once

2. **Short Notes Generation**
   - AI-generated concise notes from PDF content
   - Organized with bullet points and headings
   - Key concepts highlighted

3. **Flashcards**
   - Auto-generated question-answer pairs
   - Interactive flashcard viewer
   - Study progress tracking

4. **Quiz Generation**
   - Multiple question types (MCQ, True/False, Fill in the Blank)
   - Automatic scoring
   - Detailed explanations

5. **Mind Maps**
   - Visual topic structure
   - Hierarchical organization
   - Relationship mapping

### For Teachers

1. **Lecture Preparation**
   - AI-generated lecture outlines
   - Learning objectives
   - Time allocation per section
   - Key points and activities
   - Examples and Q&A time

2. **Mind Map Creation**
   - Generate mind maps from topics
   - Visual representation of concepts
   - Topic relationships

## API Endpoints

All AI endpoints require authentication:

- `POST /api/v1/ai/extract-pdf-text` - Extract text from PDF
- `POST /api/v1/ai/generate-notes` - Generate short notes
- `POST /api/v1/ai/generate-flashcards` - Generate flashcards
- `POST /api/v1/ai/generate-quiz` - Generate quiz questions
- `POST /api/v1/ai/generate-mindmap` - Generate mind map structure
- `POST /api/v1/ai/generate-lecture-outline` - Generate lecture outline
- `POST /api/v1/ai/process-pdf` - Process PDF with multiple features

## Usage

### Student Workflow

1. Go to "Upload PDF" tab
2. Select or drag & drop a PDF file
3. Optionally enter a topic name
4. Click "Process PDF"
5. Wait for processing (may take 30-60 seconds)
6. View generated content in respective tabs:
   - Notes → "My Notes" tab
   - Flashcards → "Flashcards" tab
   - Quiz → "Practice" tab
   - Mind Map → "Mind Maps" tab

### Teacher Workflow

1. **Lecture Preparation:**
   - Go to "Lectures" tab
   - Click "Generate Outline"
   - Enter topic, duration, and level
   - View structured outline

2. **Mind Maps:**
   - Go to "Mind Maps" tab
   - Enter topic or content
   - Click "Generate Mind Map"
   - View visual structure

## Cost Considerations

- **Model Used:** `gpt-4o-mini` (default, cheaper option)
- **Typical Costs:**
  - PDF processing: ~$0.01-0.05 per PDF
  - Notes generation: ~$0.01-0.02
  - Flashcards (10 cards): ~$0.01-0.02
  - Quiz (10 questions): ~$0.02-0.03
  - Mind map: ~$0.01-0.02
  - Lecture outline: ~$0.01-0.02

**Total per PDF processing:** Approximately $0.05-0.15

## Troubleshooting

### Error: "OPENAI_API_KEY not found"
- Make sure the API key is set in the backend `.env` file
- Restart the backend server after adding the key

### Error: "Failed to generate..."
- Check your OpenAI account has credits
- Verify the API key is valid
- Check network connectivity

### PDF Processing Fails
- Ensure PDF is not password protected
- Check PDF is not corrupted
- Verify PDF contains extractable text (not just images)

### JSON Parsing Errors
- The AI service handles various response formats
- If issues persist, check OpenAI API status

## Model Configuration

You can change the model in `.env`:
- `gpt-4o-mini` - Cheapest, good quality (default)
- `gpt-4` - More expensive, better quality
- `gpt-3.5-turbo` - Alternative cheaper option

## Notes

- All AI features require an active internet connection
- Processing time varies (typically 10-60 seconds)
- Generated content is stored in browser state (not persisted to database yet)
- PDFs are processed in memory (not stored on server)








