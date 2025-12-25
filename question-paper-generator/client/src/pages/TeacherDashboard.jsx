import { useState, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useProfile } from '../App';
import {
  BookOpen,
  FileText,
  Brain,
  HelpCircle,
  LogOut,
  Plus,
  Upload
} from 'lucide-react';
import QuestionLibrary from '../components/QuestionLibrary';
import LectureOutline from '../components/LectureOutline';
import MindMapViewer from '../components/MindMapViewer';
import PdfUpload from '../components/PdfUpload';
import TeacherPaperCreator from '../components/TeacherPaperCreator';
import aiService from '../services/aiService';
import teacherService from '../services/teacherService';

function TeacherDashboard() {
  const { user } = useUser();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('library');
  const [lectureOutline, setLectureOutline] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState('list'); // 'list' or 'create_paper'
  const [papers, setPapers] = useState([]);

  // Fetch papers when tab is active
  useEffect(() => {
    if (activeTab === 'papers' && viewState === 'list') {
      const fetchPapers = async () => {
        try {
          const data = await teacherService.getPapers();
          setPapers(data);
        } catch (err) {
          console.error("Failed to load papers", err);
        }
      };
      fetchPapers();
    }
  }, [activeTab, viewState]);

  const categoryLabels = {
    college: 'College',
    school: 'School',
    competition: 'Competition Exams'
  };

  const handlePdfProcessedForLecture = (data) => {
    // Logic to handle processed PDF for lecture prep
    // For now, just show the notes/outline generated
    if (data.notes) {
      // Maybe convert notes to Outline format or just show notes?
      // The prompt said "Prepare Lecture where he will upload the pdf and can get short notes"
      setLectureOutline(data.notes); // Reusing state for simplicity
    }
    alert("Lecture materials generated from PDF!");
  };

  if (viewState === 'create_paper') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <TeacherPaperCreator onBack={() => {
          setViewState('list');
          setActiveTab('papers'); // Ensure we go back to papers tab
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="text-indigo-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Easy Paper</h1>
                <p className="text-sm text-gray-600">
                  {categoryLabels[profile?.category] || 'Teacher'} Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.primaryEmailAddress?.emailAddress}</span>
              <SignOutButton>
                <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'library', label: 'Question Library', icon: BookOpen },
              { id: 'create', label: 'Create Question', icon: Plus },
              { id: 'papers', label: 'Question Papers', icon: FileText },
              { id: 'lectures', label: 'Prepare Lecture', icon: HelpCircle },
              { id: 'mindmaps', label: 'Mind Maps', icon: Brain },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-[500px]">
          {activeTab === 'library' && (
            <QuestionLibrary showCreateButton={true} />
          )}

          {activeTab === 'create' && (
            <div className="text-center py-12">
              {/* Reuse Question Library's modal or just direct the user */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add to Library</h2>
              <p className="text-gray-600 mb-6">Use the "+" button in the Question Library to add new questions.</p>
              <button
                onClick={() => setActiveTab('library')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Go to Library
              </button>
            </div>
          )}

          {activeTab === 'papers' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Question Papers</h2>
                <button
                  onClick={() => setViewState('create_paper')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create New Paper
                </button>
              </div>

              {papers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No papers created yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Click the button above to start.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {papers.map(paper => (
                    <div key={paper.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{paper.title}</h3>
                          <p className="text-sm text-gray-500">
                            {paper.questions?.length || 0} Questions • {paper.total_marks} Marks
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(paper.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'lectures' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Prepare Lecture</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Option A: Upload PDF</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload a textbook or reference material to extract notes and key points.</p>
                  <PdfUpload onProcessed={handlePdfProcessedForLecture} />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">Option B: Generate Outline</h3>
                  <p className="text-sm text-gray-600 mb-4">Enter a topic to generate a structured lecture plan.</p>
                  <LectureOutline
                    outline={lectureOutline}
                    onGenerate={async () => {
                      const topic = prompt('Enter the lecture topic:');
                      if (!topic) return;

                      const duration = parseInt(prompt('Enter lecture duration in minutes (default 60):') || '60');
                      const level = prompt('Enter level (beginner/intermediate/advanced, default intermediate):') || 'intermediate';

                      setLoading(true);
                      try {
                        const result = await aiService.generateLectureOutline(topic, duration, level);
                        setLectureOutline(result.outline);
                      } catch (err) {
                        alert(err.response?.data?.detail || 'Failed to generate lecture outline');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                </div>
              </div>

              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2 text-gray-600">Generating...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mindmaps' && (
            <div>
              {mindMap ? (
                <MindMapViewer mindmap={mindMap} />
              ) : (
                <div className="text-center py-12">
                  <Brain className="mx-auto text-gray-400 mb-4" size={48} />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Mind Maps</h2>
                  <p className="text-gray-600 mb-6">
                    Create and manage mind maps for your topics.
                  </p>
                  <div className="max-w-md mx-auto space-y-4">
                    <input
                      type="text"
                      placeholder="Enter topic or content"
                      id="mindmap-content"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={async () => {
                        const content = document.getElementById('mindmap-content').value;
                        if (!content) {
                          alert('Please enter content');
                          return;
                        }
                        setLoading(true);
                        try {
                          const result = await aiService.generateMindMap(content);
                          setMindMap(result.mindmap);
                        } catch (err) {
                          alert(err.response?.data?.detail || 'Failed to generate mind map');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Generate Mind Map
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;

