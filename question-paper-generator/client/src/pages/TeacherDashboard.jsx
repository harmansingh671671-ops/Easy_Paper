import { useState, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useProfile } from '../App';
import {
  BookOpen,
  FileText,
  HelpCircle,
  LogOut,
  Plus
} from 'lucide-react';
import QuestionLibrary from '../components/QuestionLibrary';
import LecturePreparationTab from '../components/LecturePreparationTab';
import TeacherPaperCreator from '../components/TeacherPaperCreator';
import teacherService from '../services/teacherService';

function TeacherDashboard() {
  const { user } = useUser();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('library');
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
              { id: 'papers', label: 'Question Papers', icon: FileText },
              { id: 'lectures', label: 'Prepare Lecture', icon: HelpCircle },
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

          {activeTab === 'papers' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Question Papers</h2>
              </div>

              {papers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No papers created yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Go to Question Library, select questions, and click "View Paper" to create one.</p>
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
            <LecturePreparationTab />
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;

