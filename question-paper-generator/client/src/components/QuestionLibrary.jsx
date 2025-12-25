import { useEffect, useState, useCallback } from 'react';
import { useProfile } from '../App';
import questionService from '../services/questionService';
import FilterPanel from './FilterPanel';
import QuestionCard from './QuestionCard';
import CreateQuestionModal from './CreateQuestionModal';
import { usePaper } from '../contexts/PaperContext';
import PaperView from '../pages/PaperView';

function QuestionLibrary({ showCreateButton = true }) {
  const { profile: user } = useProfile();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('library'); // 'library' or 'paper'
  const [filters, setFilters] = useState({
    subject: '',
    class_grade: '',
    difficulty: '',
    question_type: '',
    source: '',
    search: '',
    page: 1,
    page_size: 20,
    category: user?.category || '', // Auto-filter by user category
  });
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { paperQuestions, getTotalMarks } = usePaper();

  // Fetch questions when filters change
  useEffect(() => {
    fetchQuestions();
  }, [filters, user?.category]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always include user's category filter
      const cleanFilters = {
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
        category: user?.category || filters.category, // Ensure category is always set
      };
      
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
      page: 1, // Reset to page 1 when filter changes
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
      category: user?.category || '', // Keep user category
    });
  };

  const handleToggleStar = useCallback(async (questionId) => {
    try {
      const updatedQuestion = await questionService.toggleStar(questionId);
      
      // Update the question in the list
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.id === questionId ? updatedQuestion : q
        )
      );
    } catch (err) {
      console.error('Failed to toggle star:', err);
      alert('Failed to star question');
    }
  }, []);

  const handleQuestionCreated = (newQuestion) => {
    setTotalQuestions(prev => prev + 1);
    setQuestions(prev => [newQuestion, ...prev]);
  };

  const handleDeleteQuestion = useCallback(async (questionId) => {
    try {
      await questionService.deleteQuestion(questionId);
      
      // Update the question list and total count
      setQuestions(prevQuestions =>
        prevQuestions.filter(q => q.id !== questionId)
      );
      setTotalQuestions(prev => prev - 1);

    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question. Please try again.');
    }
  }, []);

  if (currentView === 'paper') {
    return <PaperView onBack={() => setCurrentView('library')} />;
  }

  return (
    <div>
      {/* Paper Summary Bar */}
      {paperQuestions.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600">Questions in Paper</p>
              <p className="text-2xl font-bold text-indigo-600">
                {paperQuestions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Marks</p>
              <p className="text-2xl font-bold text-green-600">
                {getTotalMarks()}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentView('paper')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            View Paper
          </button>
        </div>
      )}

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        openCreateModal={showCreateButton ? () => setIsModalOpen(true) : undefined}
      />

      {/* Info about category filtering */}
      {user?.category && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          Showing questions for: <strong>{user.category.charAt(0).toUpperCase() + user.category.slice(1)}</strong>
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
                <QuestionCard
                  key={question.id}
                  question={question}
                  onToggleStar={handleToggleStar}
                  onDelete={handleDeleteQuestion}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreateQuestionModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        onQuestionCreated={handleQuestionCreated}
      />
    </div>
  );
}

export default QuestionLibrary;








