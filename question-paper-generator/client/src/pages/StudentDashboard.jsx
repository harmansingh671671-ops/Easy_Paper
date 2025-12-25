import { useState } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useProfile } from '../App';
import {
  BookOpen,
  Brain,
  LogOut,
  PenTool,
  GraduationCap
} from 'lucide-react';
import QuestionLibrary from '../components/QuestionLibrary';
import RevisionTab from '../components/RevisionTab';

function StudentDashboard() {
  const { user } = useUser();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('practice'); // 'practice', 'revision'

  const categoryLabels = {
    college: 'College',
    school: 'School',
    competition: 'Competition'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <GraduationCap size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Easy Paper</h1>
                <p className="text-sm text-gray-600">
                  {categoryLabels[profile?.category] || 'Student'} Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Center Tabs for cleaner look */}
              <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('practice')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'practice'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <BookOpen size={18} />
                  Practice Question
                </button>
                <button
                  onClick={() => setActiveTab('revision')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'revision'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Brain size={18} />
                  Revision & AI
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-gray-600">{user?.primaryEmailAddress?.emailAddress}</span>
              <SignOutButton>
                <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
                  <LogOut size={20} />
                </button>
              </SignOutButton>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium border ${activeTab === 'practice'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600'
                }`}
            >
              <BookOpen size={18} />
              Practice
            </button>
            <button
              onClick={() => setActiveTab('revision')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium border ${activeTab === 'revision'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600'
                }`}
            >
              <Brain size={18} />
              Revision
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeTab === 'practice' && (
          <div className="bg-white rounded-lg shadow-sm p-6 h-[calc(100vh-140px)] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex-shrink-0">Question Bank Practice</h2>
            <div className="flex-1 overflow-y-auto">
              <QuestionLibrary showCreateButton={true} />
            </div>
          </div>
        )}

        {activeTab === 'revision' && (
          <RevisionTab />
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
