import { useEffect, useState } from 'react';
import { useProfile } from '../App';
import questionService from '../services/questionService';
import FilterPanel from './FilterPanel';
import QuestionCard from './QuestionCard';
import { Filter } from 'lucide-react';
import { usePaper } from '../contexts/PaperContext';
import PaperView from '../pages/PaperView';

function QuestionLibrary({ showCreateButton = true, enableSelection = false, selectedIds = [], onToggleSelection, title }) {
  const { profile: user, loading: profileLoading } = useProfile();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('library'); // 'library' or 'paper'
  const [showFilters, setShowFilters] = useState(false); // New state for filter visibility
  const [filters, setFilters] = useState({
    subject: '',
    class_grade: '',
    difficulty: '',
    question_type: '',
    source: '',
    search: '',
    page: 1,
    page_size: 20,
    category: user?.category || '',
    grade: user?.role === 'student' && user?.selected_grades?.length ? user.selected_grades[0] : '',
    year: user?.role === 'student' && user?.selected_years?.length ? user.selected_years[0] : '',
    exam: user?.role === 'student' && user?.target_exam ? user.target_exam : '',
  });
  const [totalQuestions, setTotalQuestions] = useState(0);

  const { paperQuestions, getTotalMarks } = usePaper();

  // Sync filters with user profile when it loads (handling async updates)
  useEffect(() => {
    if (user) {
      setFilters(prev => ({
        ...prev,
        category: user.category || prev.category,
        // Reset/Update fields based on current profile strictly. 
        // Do NOT fall back to 'prev.grade' if user is student; we must match their profile exactly.
        grade: user.role === 'student' ? (user.selected_grades?.[0] || '') : prev.grade,
        year: user.role === 'student' ? (user.selected_years?.[0] || '') : prev.year,
        exam: user.role === 'student' ? (user.target_exam || '') : prev.exam,
      }));
    }
  }, [user]);

  // Fetch questions when filters change
  useEffect(() => {
    // wait for profile to load
    if (profileLoading) return;
    fetchQuestions();
  }, [filters, user?.category, profileLoading]);

  const fetchQuestions = async () => {
    // 1. Guard against loading state
    if (profileLoading) return;

    // 2. Guard for Students: Do NOT fetch "everything" if filters are momentarily empty during init
    // Only fetch if they have at least one specific filter relevant to their category
    const isStudent = user?.role === 'student';
    if (isStudent && user?.category === 'school' && !filters.grade && !filters.search) {
      // Don't fetch yet, wait for filter sync
      return;
    }
    if (isStudent && user?.category === 'college' && !filters.year && !filters.search) {
      return;
    }
    if (isStudent && user?.category === 'competition' && !filters.exam && !filters.search) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Enforce student constraints strictly before fetch
      const isTeacher = user?.role === 'teacher';

      const cleanFilters = {
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
        category: user?.category || filters.category,
      };

      if (isStudent) {
        if (user.selected_grades?.length) cleanFilters.grade = user.selected_grades[0];
        if (user.selected_years?.length) cleanFilters.year = user.selected_years[0];
        if (user.target_exam) cleanFilters.exam = user.target_exam;
      }

      if (isTeacher) {
        // If no specific grade selected in filter, restrain to ALL selected grades
        if (!cleanFilters.grade && user.selected_grades?.length) {
          cleanFilters.grade = user.selected_grades;
        }
        if (!cleanFilters.year && user.selected_years?.length) {
          cleanFilters.year = user.selected_years;
        }
      }

      const data = await questionService.getAllQuestions(cleanFilters);
      setQuestions(data.questions);
      setTotalQuestions(data.total);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      subject: '',
      class_grade: '',
      difficulty: '',
      question_type: '',
      source: '',
      search: '',
      page: 1,
      page_size: 20,
      // Reset to profile defaults for students
      category: user?.category || '',
      grade: user?.role === 'student' && user?.selected_grades?.length ? user.selected_grades[0] : '',
      year: user?.role === 'student' && user?.selected_years?.length ? user.selected_years[0] : '',
      exam: user?.role === 'student' && user?.target_exam ? user.target_exam : '',
    });
  };

  const handleToggleStar = async (questionId) => {
    try {
      const updatedQuestion = await questionService.toggleStar(questionId);
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.id === questionId ? updatedQuestion : q
        )
      );
    } catch (err) {
      console.error('Failed to toggle star:', err);
      alert('Failed to star question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await questionService.deleteQuestion(questionId);
      setQuestions(prevQuestions =>
        prevQuestions.filter(q => q.id !== questionId)
      );
      setTotalQuestions(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question. Please try again.');
    }
  };

  if (currentView === 'paper') {
    return <PaperView onBack={() => setCurrentView('library')} />;
  }

  return (
    <div>
      {/* Paper Summary Bar ... */}
      {!enableSelection && paperQuestions.length > 0 && (
        // ... existing summary bar code ...
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-center justify-between sticky top-20 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-600">Questions</p>
              <p className="text-lg font-bold text-indigo-600">
                {paperQuestions.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Marks</p>
              <p className="text-lg font-bold text-green-600">
                {getTotalMarks()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('paper')}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-semibold"
          >
            View Paper
          </button>
        </div>
      )}

      {/* Header Row: Title & Filter Toggle */}
      <div className={`mb-4 flex items-center ${title ? 'justify-between' : 'justify-end'}`}>
        {title && (
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        )}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm"
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close filters"
              >
                <div className="w-5 h-5 text-gray-500">✕</div>
              </button>
            </div>
            <div className="p-6">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                openCreateModal={undefined}
              />
            </div>
            <div className="border-t p-4 flex justify-end sticky bottom-0 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading questions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Questions List */}
      {!loading && !error && (
        <>
          {questions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-xl text-gray-600">No questions found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="relative">
                  {enableSelection && (
                    <div className="absolute top-4 right-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(question.id)}
                        onChange={() => onToggleSelection(question)}
                        className="w-6 h-6 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                  <QuestionCard
                    question={question}
                    onToggleStar={handleToggleStar}
                    onDelete={handleDeleteQuestion}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}


    </div>
  );
}

export default QuestionLibrary;








