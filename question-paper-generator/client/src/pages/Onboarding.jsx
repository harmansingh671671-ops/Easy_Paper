import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../App';
import api from '../services/api';
import { BookOpen, GraduationCap, School, Trophy, User, Loader } from 'lucide-react';

function Onboarding() {
  const { user, signOut } = useAuth();
  const { setProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 3 State
  const [selectedDetails, setSelectedDetails] = useState({
    grades: [],
    years: [],
    exam: ''
  });

  // Check for existing partial profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        setLoading(true);
        // We can just use the context profile if available, 
        // but fetching fresh might be safer for "resuming" logic if context isn't ready
        const { data: profile } = await api.get('/profile/me');
        if (profile) {
          if (profile.role) {
            setRole(profile.role);
            if (!profile.category) {
              setStep(2);
            } else if (
              (!profile.selected_grades || profile.selected_grades.length === 0) &&
              (!profile.selected_years || profile.selected_years.length === 0) &&
              !profile.target_exam
            ) {
              setCategory(profile.category);
              setStep(3);
            } else {
              navigate('/dashboard');
            }
          }
          // Update context just in case
          setProfile(profile);
        }
      } catch (err) {
        // 404 is expected for new users
        if (err.response?.status !== 404) {
          console.error('Error checking profile:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkExistingProfile();
  }, [navigate, setProfile]);

  const handleRoleSelect = async (selectedRole) => {
    setRole(selectedRole);
    setLoading(true);
    try {
      // Save step 1 (Role) immediately
      const response = await api.post('/profile/', {
        role: selectedRole,
      });
      setProfile(response.data);
      setStep(2);
    } catch (err) {
      console.error('Failed to save role:', err);
      setError('Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (selectedCategory) => {
    setCategory(selectedCategory);
    setLoading(true);
    try {
      // Save step 2 (Category) immediately
      const response = await api.post('/profile', {
        role: role,
        category: selectedCategory,
      });
      setProfile(response.data);
      setStep(3);
    } catch (err) {
      console.error('Failed to save category:', err);
      setError('Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (role, category) => {
    if (!role || !category) return;

    setLoading(true);
    setError('');

    try {
      // Prepare payload based on category
      const payload = {
        role,
        category,
        selected_grades: category === 'school' ? selectedDetails.grades : [],
        selected_years: category === 'college' ? selectedDetails.years : [],
        target_exam: category === 'competition' ? selectedDetails.exam : null
      };

      // Update profile with category and details
      const response = await api.post('/profile', payload);

      // Update profile context
      setProfile(response.data);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          const errorDetails = err.response.data.detail.map(d => `${d.loc[1]}: ${d.msg}`).join(', ');
          setError(`Validation error: ${errorDetails}`);
        } else if (typeof err.response.data.detail === 'object') {
          setError(JSON.stringify(err.response.data.detail));
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Failed to save profile. Please try again.');
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome to BudyforStudy!</h1>
          <p className="text-gray-600 mt-2">
            Logging in from <span className="font-semibold text-indigo-600">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="ml-2 text-sm text-gray-500 hover:text-red-600 underline"
            >
              (Not you? Logout)
            </button>
          </p>
          <p className="text-gray-600 mt-1">Let's set up your profile</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= s
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

        {/* Step 2: Category Selection (Students and Teachers) */}
        {step === 2 && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(1)}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {role === 'teacher' ? 'What category do you teach?' : 'What category are you in?'}
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleCategorySelect('college')}
                className={`p-6 border-2 rounded-lg transition-all text-center ${category === 'college'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
                  }`}
              >
                <GraduationCap className="text-indigo-600 mb-3 mx-auto" size={32} />
                <h3 className="font-semibold text-gray-900">College</h3>
              </button>
              <button
                onClick={() => handleCategorySelect('school')}
                className={`p-6 border-2 rounded-lg transition-all text-center ${category === 'school'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
                  }`}
              >
                <School className="text-indigo-600 mb-3 mx-auto" size={32} />
                <h3 className="font-semibold text-gray-900">School</h3>
              </button>
              <button
                onClick={() => handleCategorySelect('competition')}
                className={`p-6 border-2 rounded-lg transition-all text-center ${category === 'competition'
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

        {/* Step 3: Specific Selection (Grade/Year/Exam) */}
        {step === 3 && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(2)}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {category === 'school' && (role === 'teacher' ? 'Which grades do you teach?' : 'Which grade are you in?')}
              {category === 'college' && (role === 'teacher' ? 'Which years do you teach?' : 'Which year are you in?')}
              {category === 'competition' && 'Which exam are you preparing for?'}
            </h2>

            <div className={`grid ${category === 'competition' ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
              {/* School Grades Options */}
              {category === 'school' && ['12th', '11th', '10th', '9th', '8th', '7th', '6th', '5th', '4th', '3rd', '2nd', '1st'].map((grade) => {
                const isSelected = selectedDetails.grades.includes(grade);
                return (
                  <button
                    key={grade}
                    onClick={() => {
                      if (role === 'teacher') {
                        // Multi-select for teachers
                        setSelectedDetails(prev => ({
                          ...prev,
                          grades: isSelected
                            ? prev.grades.filter(g => g !== grade)
                            : [...prev.grades, grade]
                        }));
                      } else {
                        // Single-select for students
                        setSelectedDetails(prev => ({ ...prev, grades: [grade] }));
                      }
                    }}
                    className={`p-3 border rounded-lg transition-all text-sm font-medium ${isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                      }`}
                  >
                    {grade} Grade
                  </button>
                );
              })}

              {/* College Years Options */}
              {category === 'college' && ['1st Year', '2nd Year', '3rd Year', '4th Year'].map((year) => {
                const isSelected = selectedDetails.years.includes(year);
                return (
                  <button
                    key={year}
                    onClick={() => {
                      if (role === 'teacher') {
                        setSelectedDetails(prev => ({
                          ...prev,
                          years: isSelected
                            ? prev.years.filter(y => y !== year)
                            : [...prev.years, year]
                        }));
                      } else {
                        setSelectedDetails(prev => ({ ...prev, years: [year] }));
                      }
                    }}
                    className={`p-3 border rounded-lg transition-all text-sm font-medium ${isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                      }`}
                  >
                    {year}
                  </button>
                );
              })}

              {/* Competition Exam Options */}
              {category === 'competition' && ['JEE', 'NEET', 'NDA', 'Other'].map((exam) => {
                return (
                  <button
                    key={exam}
                    onClick={() => setSelectedDetails(prev => ({ ...prev, exam: exam }))}
                    className={`p-4 border rounded-lg transition-all text-sm font-medium ${selectedDetails.exam === exam
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                      }`}
                  >
                    {exam}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => handleSubmit(role, category)}
                disabled={loading || (
                  (category === 'school' && selectedDetails.grades.length === 0) ||
                  (category === 'college' && selectedDetails.years.length === 0) ||
                  (category === 'competition' && !selectedDetails.exam)
                )}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="animate-spin" size={18} />
                    Saving...
                  </span>
                ) : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
