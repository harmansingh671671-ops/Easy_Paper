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
import LecturePreparationTab from '../components/LecturePreparationTab';
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
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      {/* Navigation Tabs */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'practice'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <BookOpen size={20} />
              <span className="hidden sm:inline">Practice Question</span>
            </button>
            <button
              onClick={() => setActiveTab('revision')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'revision'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Brain size={20} />
              <span className="hidden sm:inline">Revision & AI</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-[500px]">
          {activeTab === 'practice' && (
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <QuestionLibrary showCreateButton={true} title="Question Bank Practice" />
              </div>
            </div>
          )}

          {activeTab === 'revision' && (
            <LecturePreparationTab />
          )}
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

export default StudentDashboard;
