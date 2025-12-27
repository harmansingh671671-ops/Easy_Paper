import { useState, useRef } from 'react';
import { Upload, FileText, Loader, CheckCircle, X } from 'lucide-react';
import aiService from '../services/aiService';

function PdfUpload({ onProcessed, topic: initialTopic = '' }) {
  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError('');
      setResult(null);
    } else {
      setError('Please drop a PDF file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Step 1: Process PDF and get notes (fastest - shown immediately)
      const data = await aiService.processPdf(file, topic || undefined);

      // Show notes immediately
      const initialResult = { notes: data.notes, filename: data.filename };
      setResult(initialResult);
      if (onProcessed) {
        onProcessed(initialResult);
      }

      setLoading(false); // User sees notes now

      // Step 2: Queue other features sequentially to reduce API load
      const contextForNext = data.text || data.notes;

      // Sequence: Notes (Done) -> Quiz -> Mind Map -> Flashcards
      try {
        // 1. Generate Quiz
        console.log("Starting Quiz Generation...");
        const quizRes = await aiService.generateQuiz(contextForNext, 10, 'mixed');
        setResult(prev => ({ ...prev, quiz: quizRes.questions }));
        if (onProcessed) onProcessed(prev => ({ ...prev, quiz: quizRes.questions }));

        // 2. Generate Mind Map
        console.log("Starting Mind Map Generation...");
        const mmRes = await aiService.generateMindMap(contextForNext, topic || undefined);
        setResult(prev => ({ ...prev, mindmap: mmRes.mindmap }));
        if (onProcessed) onProcessed(prev => ({ ...prev, mindmap: mmRes.mindmap }));

        // 3. Generate Flashcards
        console.log("Starting Flashcard Generation...");
        const fcRes = await aiService.generateFlashcards(contextForNext, 10);
        setResult(prev => ({ ...prev, flashcards: fcRes.flashcards }));
        if (onProcessed) onProcessed(prev => ({ ...prev, flashcards: fcRes.flashcards }));

      } catch (seqError) {
        console.error("Sequential generation error:", seqError);
        // Don't block UI if one fails, but maybe show partial success?
        // Current error handler at outer level catches this. 
        // We might want to just log it and let the user see what finished.
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process PDF. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Topic Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Topic (Optional)
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="space-y-2">
            <CheckCircle className="mx-auto text-green-600" size={48} />
            <p className="font-semibold text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setResult(null);
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">PDF files only</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <X size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Process Button */}
      {file && !result && (
        <button
          onClick={handleProcess}
          disabled={loading}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={20} />
              Processing PDF...
            </>
          ) : (
            <>
              <FileText size={20} />
              Process PDF
            </>
          )}
        </button>
      )}

      {/* Result Summary */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-600" size={20} />
            <span className="font-semibold text-green-900">Processing Complete!</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            {result.notes && <p>✓ Short notes generated</p>}
            {result.flashcards && <p>✓ {result.flashcards.length} flashcards created</p>}
            {result.quiz && <p>✓ {result.quiz.length} quiz questions generated</p>}
            {result.mindmap && <p>✓ Mind map structure created</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default PdfUpload;



