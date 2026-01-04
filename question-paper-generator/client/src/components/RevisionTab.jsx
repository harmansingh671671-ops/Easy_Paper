import { useState, useEffect } from 'react';
import {
    FileText,
    Brain,
    Upload,
    Zap,
    Loader,
    CreditCard,
    Clock
} from 'lucide-react';
import PdfUpload from './PdfUpload';
import NotesViewer from './NotesViewer';
import QuizViewer from './QuizViewer';
import MindMapViewer from './MindMapViewer';
import FlashcardsViewer from './FlashcardsViewer';
import aiService from '../services/aiService';

function RevisionTab() {
    const [activeSubTab, setActiveSubTab] = useState('upload');
    const [loadingStates, setLoadingStates] = useState({
        notes: false,
        quizzes: false,
        mindmaps: false,
        flashcards: false
    });

    const [generatedContent, setGeneratedContent] = useState({
        notes: null,
        quizzes: null,
        mindmap: null,
        flashcards: null,
        filename: ''
    });

    // New: Global Topic handling
    const [topic, setTopic] = useState('');

    // History Component
    const [history, setHistory] = useState([]);

    useEffect(() => {
        aiService.getHistory().then(setHistory);
    }, []);

    const handleStatusChange = (feature, isLoading) => {
        setLoadingStates(prev => ({
            ...prev,
            [feature]: isLoading
        }));
    };

    const handlePdfProcessed = (data) => {
        setGeneratedContent(prev => ({
            ...prev,
            notes: data.notes || prev.notes,
            quizzes: data.quiz || prev.quizzes,
            mindmap: data.mindmap || prev.mindmap,
            flashcards: data.flashcards || prev.flashcards,
            filename: data.filename || prev.filename
        }));

        if (data.notes && activeSubTab === 'upload') setActiveSubTab('notes');
    };

    const handleGlobalGenerate = async (overrideTopic) => {
        const topicToUse = overrideTopic || topic || generatedContent.filename;
        if (!topicToUse) return;

        if (overrideTopic) setTopic(overrideTopic);

        // Use topic state if override not provided
        const finalTopic = overrideTopic || topic || generatedContent.filename;
        if (!finalTopic) return;

        setLoadingStates({
            notes: true,
            quizzes: true,
            mindmaps: true,
            flashcards: true
        });

        try {
            const [notesRes, quizRes, mindMapRes, flashcardsRes] = await Promise.allSettled([
                aiService.generateNotes([], topicToUse),
                aiService.generateQuiz([], 5, "mixed", topicToUse),
                aiService.generateMindMap([], topicToUse),
                aiService.generateFlashcards([], 10, topicToUse)
            ]);

            setGeneratedContent(prev => ({
                ...prev,
                notes: notesRes.status === 'fulfilled' ? (notesRes.value.notes || notesRes.value) : prev.notes,
                quizzes: quizRes.status === 'fulfilled' ? (quizRes.value.questions || quizRes.value) : prev.quizzes,
                mindmap: mindMapRes.status === 'fulfilled' ? (mindMapRes.value.mindmap || mindMapRes.value) : prev.mindmap,
                flashcards: flashcardsRes.status === 'fulfilled' ? (flashcardsRes.value.flashcards || flashcardsRes.value) : prev.flashcards,
                filename: prev.filename || topicToUse
            }));

        } catch (error) {
            console.error("Global generation failed:", error);
        } finally {
            setLoadingStates({
                notes: false,
                quizzes: false,
                mindmaps: false,
                flashcards: false
            });
            setActiveSubTab('notes');
        }
    };

    // Local Generator for empty tabs
    const handleLocalGenerate = async (type, source, inputData) => {
        // source: 'topic' | 'file' | 'existing'
        // inputData: topic string | file object | null

        setLoadingStates(prev => ({ ...prev, [type]: true }));
        try {
            let contentToUse = [];
            let topicToUse = '';

            if (source === 'topic') {
                topicToUse = inputData;
            } else if (source === 'existing') {
                contentToUse = generatedContent.notes || "";
                topicToUse = generatedContent.filename || "Lecture Context";
            } else if (source === 'file') {
                // Extract text first
                const { text } = await aiService.extractPdfText(inputData);
                contentToUse = text;
                topicToUse = inputData.name;
            }

            if (type === 'notes') {
                const res = await aiService.generateNotes(contentToUse, topicToUse);
                setGeneratedContent(prev => ({
                    ...prev,
                    notes: res.notes || res,
                    filename: source === 'file' ? inputData.name : prev.filename
                }));
            } else if (type === 'quizzes') {
                const res = await aiService.generateQuiz(contentToUse, 5, "mixed", topicToUse);
                setGeneratedContent(prev => ({ ...prev, quizzes: res.questions || res }));
            } else if (type === 'mindmaps') {
                const res = await aiService.generateMindMap(contentToUse, topicToUse);
                setGeneratedContent(prev => ({ ...prev, mindmap: res.mindmap || res }));
            } else if (type === 'flashcards') {
                const res = await aiService.generateFlashcards(contentToUse, 10, topicToUse);
                setGeneratedContent(prev => ({ ...prev, flashcards: res.flashcards || res }));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate " + type);
        } finally {
            setLoadingStates(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleGenerateMoreQuiz = async () => {
        if (!generatedContent.notes) return;
        try {
            const newQuestions = await aiService.generateQuiz(generatedContent.notes, 5, 'mixed');
            setGeneratedContent(prev => ({
                ...prev,
                quizzes: [...(prev.quizzes || []), ...newQuestions]
            }));
        } catch (error) {
            console.error("Failed to generate more quiz questions:", error);
        }
    };

    const getTabClass = (tabName) => {
        return activeSubTab === tabName ? "block h-full" : "hidden";
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Horizontal Toolbar */}
            <div className="flex border-b border-gray-200 bg-gray-50/50 px-6 sticky top-0 z-10 overflow-x-auto no-scrollbar">
                {[
                    { id: 'upload', icon: Upload, label: 'Upload & Generate' },
                    { id: 'notes', icon: FileText, label: 'Short Notes' },
                    { id: 'quizzes', icon: Zap, label: 'Quizzes' },
                    { id: 'flashcards', icon: CreditCard, label: 'Flashcards' },
                    { id: 'mindmaps', icon: Brain, label: 'Mind Map' },
                    { id: 'history', icon: Clock, label: 'History' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`
                            group flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                            ${activeSubTab === tab.id
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }
                        `}
                    >
                        <tab.icon size={16} className={activeSubTab === tab.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 relative">

                {/* 1. Upload & Generate Tab */}
                <div className={getTabClass('upload')}>
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Revision</h2>
                            <p className="text-gray-600">Upload materials OR enter a topic to generate everything at once.</p>
                        </div>

                        {/* Option A: File Upload */}
                        <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-4">Option A: Upload PDF/Images</h3>
                            <PdfUpload onProcessed={handlePdfProcessed} onStatusChange={handleStatusChange} />
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">OR</span></div>
                        </div>

                        {/* Option B: Topic */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-4">Option B: Generate from Topic</h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Enter a topic (e.g., Photosynthesis)"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    onClick={() => handleGlobalGenerate()}
                                    disabled={!topic || Object.values(loadingStates).some(Boolean)}
                                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {Object.values(loadingStates).some(Boolean) ? <Loader className="animate-spin" size={18} /> : <Zap size={18} />}
                                    Generate All
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Generates Notes, Quiz, Flashcards and Mind Map instantly.</p>
                        </div>
                    </div>
                </div>

                {/* 2. History Tab */}
                <div className={getTabClass('history')}>
                    <div className="max-w-4xl mx-auto h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Your History</h2>
                            <button onClick={() => aiService.getHistory().then(setHistory)} className="text-sm text-indigo-600 hover:text-indigo-800">Refresh</button>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No history yet</h3>
                                <p className="text-gray-500 max-w-sm mx-auto mt-2">Generate some content to see it appear here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {history.map((item, idx) => {
                                    // Determine Icon based on types
                                    let Icon = FileText; // Default
                                    let iconColor = "text-gray-500";

                                    const types = item.types || [];
                                    const hasNotes = types.includes('notes');
                                    const hasQuiz = types.includes('quizzes');
                                    const hasFlash = types.includes('flashcards');
                                    const hasMind = types.includes('mindmaps');

                                    const allGenerated = hasNotes && hasQuiz && hasFlash && hasMind;

                                    if (allGenerated) {
                                        Icon = Zap;
                                        iconColor = "text-yellow-500 fill-yellow-50";
                                    } else if (hasQuiz && !hasNotes) {
                                        Icon = Zap;
                                        iconColor = "text-indigo-500";
                                    } else if (hasFlash && !hasNotes) {
                                        Icon = CreditCard;
                                        iconColor = "text-purple-500";
                                    } else if (hasMind && !hasNotes) {
                                        Icon = Brain;
                                        iconColor = "text-pink-500";
                                    } else {
                                        Icon = FileText;
                                        iconColor = "text-blue-500";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleGlobalGenerate(item.topic)}
                                            className="text-left p-4 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-3 right-3">
                                                <Icon size={20} className={iconColor} />
                                            </div>
                                            <div className="font-semibold text-gray-800 mb-1 line-clamp-1 pr-8">{item.topic}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(item.date).toLocaleDateString()}
                                                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-400">
                                                    {types.length} items
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Notes Tab */}
                <div className={getTabClass('notes')}>
                    <div className="max-w-4xl mx-auto h-full">
                        {loadingStates.notes && !generatedContent.notes ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Loader className="animate-spin mb-4" size={32} />
                                <p>Generating detailed notes...</p>
                            </div>
                        ) : generatedContent.notes ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-900">Revision Notes</h2>
                                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                        Source: {generatedContent.filename || "Topic: " + topic}
                                    </span>
                                </div>
                                <NotesViewer notes={generatedContent.notes} title="" />
                            </div>
                        ) : (
                            <EmptyState
                                icon={FileText}
                                label="Short Notes"
                                hasExisting={!!generatedContent.notes}
                                onGenerate={(source, data) => handleLocalGenerate('notes', source, data)}
                            />
                        )}
                    </div>
                </div>

                {/* 3. Quizzes Tab */}
                <div className={getTabClass('quizzes')}>
                    <div className="max-w-4xl mx-auto h-full">
                        {loadingStates.quizzes && !generatedContent.quizzes ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Loader className="animate-spin mb-4" size={32} />
                                <p>Preparing quiz questions...</p>
                            </div>
                        ) : generatedContent.quizzes ? (
                            <QuizViewer
                                questions={generatedContent.quizzes}
                                onGenerateMore={handleGenerateMoreQuiz}
                            />
                        ) : (
                            <EmptyState
                                icon={Zap}
                                label="Class Quiz"
                                hasExisting={!!generatedContent.notes}
                                onGenerate={(source, data) => handleLocalGenerate('quizzes', source, data)}
                            />
                        )}
                    </div>
                </div>

                {/* 4. Flashcards Tab */}
                <div className={getTabClass('flashcards')}>
                    <div className="max-w-4xl mx-auto h-full">
                        {loadingStates.flashcards && !generatedContent.flashcards ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Loader className="animate-spin mb-4" size={32} />
                                <p>Creating flashcards...</p>
                            </div>
                        ) : generatedContent.flashcards ? (
                            <div className="h-full">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Flashcards</h2>
                                <FlashcardsViewer flashcards={generatedContent.flashcards} />
                            </div>
                        ) : (
                            <EmptyState
                                icon={CreditCard}
                                label="Flashcards"
                                hasExisting={!!generatedContent.notes}
                                onGenerate={(source, data) => handleLocalGenerate('flashcards', source, data)}
                            />
                        )}
                    </div>
                </div>

                {/* 5. Mind Maps Tab */}
                <div className={getTabClass('mindmaps')}>
                    <div className="max-w-4xl mx-auto h-full">
                        {loadingStates.mindmaps && !generatedContent.mindmap ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Loader className="animate-spin mb-4" size={32} />
                                <p>Structuring mind map...</p>
                            </div>
                        ) : generatedContent.mindmap ? (
                            <div className="h-full flex flex-col">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Concept Map</h3>
                                <div className="flex-1 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden min-h-[500px]">
                                    <MindMapViewer mindmap={generatedContent.mindmap} />
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                icon={Brain}
                                label="Mind Map"
                                hasExisting={!!generatedContent.notes}
                                onGenerate={(source, data) => handleLocalGenerate('mindmaps', source, data)}
                            />
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Sub-component for Empty State with Local Generation
function EmptyState({ icon: Icon, label, hasExisting, onGenerate }) {
    const [topic, setTopic] = useState('');

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center max-w-lg mx-auto">
            <div className="bg-gray-50 p-6 rounded-full mb-6">
                <Icon className="text-gray-400" size={48} />
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">No {label} Generated</h3>
            <p className="text-gray-500 mb-8">
                Choose how you want to generate {label}:
            </p>

            <div className="w-full space-y-4">

                {/* 1. Existing Context Option (Prioritize this) */}
                {hasExisting && (
                    <button
                        onClick={() => onGenerate('existing', null)}
                        className="w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-200"
                    >
                        <FileText size={18} />
                        Generate from Existing Notes
                    </button>
                )}

                {/* divider if existing exists */}
                {hasExisting && (
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-white text-gray-400">OR</span></div>
                    </div>
                )}

                {/* 2. Topic Option */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={`Topic for ${label}...`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                    <button
                        onClick={() => topic && onGenerate('topic', topic)}
                        disabled={!topic}
                        className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:opacity-50 font-medium"
                    >
                        Go
                    </button>
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-white text-gray-400">Or Upload PDF</span></div>
                </div>

                {/* 3. File Upload Option */}
                <div className="relative group">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                            if (e.target.files[0]) onGenerate('file', e.target.files[0]);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full py-3 px-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                        <Upload size={18} />
                        Upload PDF to Generate
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RevisionTab;
