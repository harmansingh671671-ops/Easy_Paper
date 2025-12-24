import { useState } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useProfile } from '../App';
import { 
  BookOpen, 
  FileText, 
  Brain, 
  HelpCircle, 
  LogOut,
  Upload,
  BookMarked,
  Zap
} from 'lucide-react';
import QuestionLibrary from '../components/QuestionLibrary';
import PdfUpload from '../components/PdfUpload';
import NotesViewer from '../components/NotesViewer';
import FlashcardViewer from '../components/FlashcardViewer';
import QuizViewer from '../components/QuizViewer';
import MindMapViewer from '../components/MindMapViewer';

function StudentDashboard() {
  const { user } = useUser();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('library');
  const [processedData, setProcessedData] = useState(null);

  const categoryLabels = {
    college: 'College',
    school: 'School',
    competition: 'Competition Exams'
  };

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
                  {categoryLabels[profile?.category] || 'Student'} Dashboard
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
          <div className="flex space-x-1">
            {[
              { id: 'library', label: 'Question Library', icon: BookOpen },
              { id: 'practice', label: 'Practice', icon: HelpCircle },
              { id: 'notes', label: 'My Notes', icon: FileText },
              { id: 'flashcards', label: 'Flashcards', icon: BookMarked },
              { id: 'mindmaps', label: 'Mind Maps', icon: Brain },
              { id: 'upload', label: 'Upload PDF', icon: Upload },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'library' && (
            <QuestionLibrary showCreateButton={false} />
          )}

          {activeTab === 'practice' && (
            <div>
              {processedData?.quiz ? (
                <QuizViewer questions={processedData.quiz} />
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="mx-auto text-gray-400 mb-4" size={48} />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Practice Sessions</h2>
                  <p className="text-gray-600 mb-6">
                    Create practice sessions and track your progress.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upload PDF to Generate Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {processedData?.notes ? (
                <NotesViewer notes={processedData.notes} title="My Notes" />
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">My Notes</h2>
                  <p className="text-gray-600 mb-6">
                    AI-generated short notes from your uploaded PDFs.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upload PDF to Generate Notes
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div>
              {processedData?.flashcards ? (
                <FlashcardViewer flashcards={processedData.flashcards} />
              ) : (
                <div className="text-center py-12">
                  <BookMarked className="mx-auto text-gray-400 mb-4" size={48} />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Flashcards</h2>
                  <p className="text-gray-600 mb-6">
                    Study with AI-generated flashcards from your notes.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upload PDF to Generate Flashcards
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mindmaps' && (
            <div>
              {processedData?.mindmap ? (
                <MindMapViewer mindmap={processedData.mindmap} />
              ) : (
                <div className="text-center py-12">
                  <Brain className="mx-auto text-gray-400 mb-4" size={48} />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Mind Maps</h2>
                  <p className="text-gray-600 mb-6">
                    Visualize topics with AI-generated mind maps.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upload PDF to Generate Mind Map
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload PDF</h2>
              <p className="text-gray-600 mb-6">
                Upload your PDF notes to generate short notes, flashcards, quizzes, and mind maps.
              </p>
              <PdfUpload
                onProcessed={(data) => {
                  setProcessedData(data);
                  // Auto-switch to notes tab if notes are generated
                  if (data.notes) {
                    setActiveTab('notes');
                  }
                }}
              />
              {processedData?.quiz && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Generated Quiz</h3>
                  <QuizViewer questions={processedData.quiz} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;

