import { useState } from 'react';
import {
    FileText,
    Brain,
    Upload,
    Zap,
    ChevronRight
} from 'lucide-react';
import PdfUpload from './PdfUpload';
import NotesViewer from './NotesViewer';
import QuizViewer from './QuizViewer';
import MindMapViewer from './MindMapViewer';
import aiService from '../services/aiService';

function LecturePreparationTab() {
    const [activeSubTab, setActiveSubTab] = useState('upload'); // 'upload', 'notes', 'quizzes', 'mindmaps'
    const [loading, setLoading] = useState(false);

    // State to hold generated content (Ephemeral for Teacher as per current backend)
    const [generatedContent, setGeneratedContent] = useState({
        notes: null,
        quizzes: null,
        mindmap: null,
        filename: ''
    });

    const handlePdfProcessed = (data) => {
        setGeneratedContent({
            notes: data.notes,
            quizzes: data.quiz,
            mindmap: data.mindmap,
            filename: data.filename
        });

        alert('Lecture materials generated successfully!');
        if (data.notes) setActiveSubTab('notes');
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-100 flex-shrink-0">
                <div className="p-4">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Lecture Tools</h2>
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
                            Short Notes
                        </button>
                        <button
                            onClick={() => setActiveSubTab('quizzes')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'quizzes' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Zap size={18} />
                            Class Quizzes
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Prepare Lecture</h2>
                        <p className="text-gray-600 mb-8">Upload textbook chapters or notes to generate lecture materials.</p>
                        <PdfUpload onProcessed={handlePdfProcessed} />
                    </div>
                )}

                {activeSubTab === 'notes' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Lecture Notes</h2>
                        {generatedContent.notes ? (
                            <div className="border rounded-lg p-6 bg-yellow-50">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg">Generated Notes</h3>
                                    <span className="text-sm text-gray-500">Source: {generatedContent.filename}</span>
                                </div>
                                <NotesViewer notes={generatedContent.notes} title="" />
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <FileText className="mx-auto mb-4" size={48} />
                                <p>No notes generated yet. Please upload a PDF.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeSubTab === 'quizzes' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Class Quizzes</h2>
                        {generatedContent.quizzes ? (
                            <div className="border rounded-lg p-6">
                                <h3 className="font-bold text-lg mb-4">Generated Quiz</h3>
                                <QuizViewer questions={generatedContent.quizzes} />
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Zap className="mx-auto mb-4" size={48} />
                                <p>No quizzes generated yet. Please upload a PDF.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeSubTab === 'mindmaps' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Mind Maps</h2>
                        {generatedContent.mindmap ? (
                            <div className="border rounded-lg p-6">
                                <h3 className="font-bold text-lg mb-4">Concept Map</h3>
                                <div className="h-[500px]">
                                    <MindMapViewer mindmap={generatedContent.mindmap} />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Brain className="mx-auto mb-4" size={48} />
                                <p>No mind maps generated yet. Please upload a PDF.</p>

                                {/* Fallback manual generation for teachers */}
                                <div className="max-w-md mx-auto mt-8 border-t pt-8">
                                    <p className="text-sm text-gray-600 mb-2">Or generate from topic:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter topic"
                                            id="manual-mindmap-input"
                                            className="flex-1 px-4 py-2 border rounded-lg"
                                        />
                                        <button
                                            onClick={async () => {
                                                const topic = document.getElementById('manual-mindmap-input').value;
                                                if (!topic) return;
                                                setLoading(true);
                                                try {
                                                    const res = await aiService.generateMindMap(topic);
                                                    setGeneratedContent(prev => ({ ...prev, mindmap: res.mindmap }));
                                                } catch (e) {
                                                    alert('Failed to generate');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                        >
                                            {loading ? '...' : 'Go'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default LecturePreparationTab;
