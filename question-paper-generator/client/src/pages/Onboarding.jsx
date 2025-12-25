import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../App';
import api from '../services/api';
import { BookOpen, GraduationCap, School, Trophy, User, Loader } from 'lucide-react';

function Onboarding() {
  const { user } = useUser();
  const { setProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'teacher') {
      // Teachers don't need category, go directly to submit
      handleSubmit(selectedRole, null);
    } else {
      // Students need to select category
      setStep(2);
    }
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    handleSubmit(role, selectedCategory);
  };

  const handleSubmit = async (role, category) => {
    if (!role) {
      setError('Please select your role');
      return;
    }

    if (role === 'student' && !category) {
      setError('Please select your category');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/profile', {
        clerk_user_id: user?.id,
        role,
        category: role === 'student' ? category : null,
      });

      // Update profile context
      setProfile(response.data);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        const errorDetails = err.response.data.detail.map(d => `${d.loc[1]}: ${d.msg}`).join(', ');
        setError(`Validation error: ${errorDetails}`);
      } else {
        setError(err.response?.data?.detail || 'Failed to save profile. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <BookOpen className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Easy Paper!</h1>
          <p className="text-gray-600 mt-2">Let's set up your profile</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Are you a Student or Teacher?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleSelect('student')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
              >
                <GraduationCap className="text-indigo-600 mb-3" size={32} />
                <h3 className="font-semibold text-gray-900 mb-1">Student</h3>
                <p className="text-sm text-gray-600">
                  Access study materials, practice questions, and flashcards
                </p>
              </button>
              <button
                onClick={() => handleRoleSelect('teacher')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
              >
                <User className="text-indigo-600 mb-3" size={32} />
                <h3 className="font-semibold text-gray-900 mb-1">Teacher</h3>
                <p className="text-sm text-gray-600">
                  Create question papers, prepare lectures, and manage content
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Category Selection (Students only) */}
        {step === 2 && role === 'student' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(1)}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              What category are you in?
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleCategorySelect('college')}
                className={`p-6 border-2 rounded-lg transition-all text-center ${
                  category === 'college'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <GraduationCap className="text-indigo-600 mb-3 mx-auto" size={32} />
                <h3 className="font-semibold text-gray-900">College</h3>
              </button>
              <button
                onClick={() => handleCategorySelect('school')}
                className={`p-6 border-2 rounded-lg transition-all text-center ${
                  category === 'school'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <School className="text-indigo-600 mb-3 mx-auto" size={32} />
                <h3 className="font-semibold text-gray-900">School</h3>
              </button>
              <button
                onClick={() => handleCategorySelect('competition')}
                className={`p-6 border-2 rounded-lg transition-all text-center ${
                  category === 'competition'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <Trophy className="text-indigo-600 mb-3 mx-auto" size={32} />
                <h3 className="font-semibold text-gray-900">Competition</h3>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;

