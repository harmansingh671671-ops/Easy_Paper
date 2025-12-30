import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../App';
import {
  BookOpen,
  Brain,
  GraduationCap,
  User
} from 'lucide-react';
import QuestionLibrary from '../components/QuestionLibrary';
import RevisionTab from '../components/RevisionTab';
import ProfileModal from '../components/ProfileModal';

function StudentDashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('practice'); // 'practice', 'revision'
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
                <h1 className="text-2xl font-bold text-gray-900">BudyforStudy</h1>
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
              <span className="hidden sm:inline text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-200 transition-colors"
                title="My Profile"
              >
                <User size={20} />
              </button>
            </div>
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

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

export default StudentDashboard;
