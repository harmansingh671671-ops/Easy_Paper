import { useState, useEffect } from 'react';
import {
    FileText,
    Brain,
    Upload,
    BookMarked,
    Zap,
    Clock,
    ChevronRight
} from 'lucide-react';
import PdfUpload from './PdfUpload';
import NotesViewer from './NotesViewer';
import FlashcardViewer from './FlashcardViewer';
import QuizViewer from './QuizViewer';
import MindMapViewer from './MindMapViewer';
import studentService from '../services/studentService';

function RevisionTab() {
    const [activeSubTab, setActiveSubTab] = useState('upload'); // 'upload', 'notes', 'flashcards', 'quizzes', 'mindmaps'
    const [processedData, setProcessedData] = useState(null);

    // Persistent Data
    const [myNotes, setMyNotes] = useState([]);
    const [myFlashcards, setMyFlashcards] = useState([]);
    const [myQuizzes, setMyQuizzes] = useState([]);
    const [myMindMaps, setMyMindMaps] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeSubTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeSubTab === 'notes' && myNotes.length === 0) {
                const data = await studentService.getNotes();
                setMyNotes(data);
            } else if (activeSubTab === 'flashcards' && myFlashcards.length === 0) {
                const data = await studentService.getFlashcards();
                setMyFlashcards(data);
            } else if (activeSubTab === 'quizzes' && myQuizzes.length === 0) {
                const data = await studentService.getQuizzes();
                setMyQuizzes(data);
            } else if (activeSubTab === 'mindmaps' && myMindMaps.length === 0) {
                const data = await studentService.getMindMaps();
                setMyMindMaps(data);
            }
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePdfProcessed = async (data) => {
        setProcessedData(data);

        try {
            // Save all generated content
            if (data.notes) await studentService.createNote(`Notes: ${data.filename}`, data.notes, data.filename);
            if (data.flashcards) await studentService.createFlashcards(`Deck: ${data.filename}`, data.flashcards, data.filename);
            if (data.quiz) await studentService.createQuiz(`Quiz: ${data.filename}`, data.quiz, data.filename);
            if (data.mindmap) await studentService.createMindMap(`Map: ${data.filename}`, data.mindmap, data.filename);

            alert('Content generated and saved! Check the sub-tabs.');

            // Refresh local state if needed (or just let the user navigate)
            setMyNotes([]); setMyFlashcards([]); setMyQuizzes([]); setMyMindMaps([]); // Force reload next time

            if (data.notes) setActiveSubTab('notes');
        } catch (err) {
            console.error("Failed to save content", err);
            alert("Failed to save generated content.");
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-100 flex-shrink-0">
                <div className="p-4">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Revision Tools</h2>
                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveSubTab('upload')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'upload' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Upload size={18} />
                            Upload & Generate
                        </button>
                        <button
                            onClick={() => setActiveSubTab('notes')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'notes' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <FileText size={18} />
                            Smart Notes
                        </button>
                        <button
                            onClick={() => setActiveSubTab('flashcards')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'flashcards' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <BookMarked size={18} />
                            Flashcards
                        </button>
                        <button
                            onClick={() => setActiveSubTab('quizzes')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'quizzes' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Zap size={18} />
                            AI Quizzes
                        </button>
                        <button
                            onClick={() => setActiveSubTab('mindmaps')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'mindmaps' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Brain size={18} />
                            Mind Maps
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeSubTab === 'upload' && (
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">New Revision Material</h2>
                        <p className="text-gray-600 mb-8">Upload your course PDF to automatically generate study materials.</p>
                        <PdfUpload onProcessed={handlePdfProcessed} />
                    </div>
                )}

                {activeSubTab === 'notes' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Smart Notes</h2>
                        {loading ? <p>Loading...</p> : (
                            <div className="space-y-6">
                                {myNotes.length === 0 && <p className="text-gray-500">No notes yet. Upload a PDF to start.</p>}
                                {myNotes.map((note) => (
                                    <div key={note.id} className="border rounded-lg p-6 bg-yellow-50">
                                        <h3 className="font-bold text-lg mb-2">{note.title}</h3>
                                        <NotesViewer notes={note.content} title="" />
                                        <p className="text-xs text-gray-400 mt-4">Source: {note.source_pdf_name}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeSubTab === 'flashcards' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Flashcard Decks</h2>
                        {loading ? <p>Loading...</p> : (
                            <div className="space-y-8">
                                {myFlashcards.length === 0 && <p className="text-gray-500">No flashcards yet. Upload a PDF to start.</p>}
                                {myFlashcards.map((deck) => (
                                    <div key={deck.id} className="border rounded-lg p-6">
                                        <h3 className="font-bold text-lg mb-4">{deck.deck_title}</h3>
                                        <FlashcardViewer flashcards={deck.cards} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeSubTab === 'quizzes' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Practice Quizzes</h2>
                        {loading ? <p>Loading...</p> : (
                            <div className="space-y-8">
                                {myQuizzes.length === 0 && <p className="text-gray-500">No quizzes yet. Upload a PDF to start.</p>}
                                {myQuizzes.map((quiz) => (
                                    <div key={quiz.id} className="border rounded-lg p-6">
                                        <h3 className="font-bold text-lg mb-4">{quiz.title}</h3>
                                        <QuizViewer questions={quiz.questions} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeSubTab === 'mindmaps' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Mind Maps</h2>
                        {loading ? <p>Loading...</p> : (
                            <div className="space-y-8">
                                {myMindMaps.length === 0 && <p className="text-gray-500">No mind maps yet. Upload a PDF to start.</p>}
                                {myMindMaps.map((map) => (
                                    <div key={map.id} className="border rounded-lg p-6">
                                        <h3 className="font-bold text-lg mb-4">{map.title}</h3>
                                        <div className="h-[400px]">
                                            <MindMapViewer mindmap={map.data} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RevisionTab;
