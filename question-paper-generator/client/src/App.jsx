import { useEffect, useState } from 'react';
import { FileText, BookOpen } from 'lucide-react';
import questionService from './services/questionService';
import FilterPanel from './components/FilterPanel';
import QuestionCard from './components/QuestionCard';
import { usePaper } from './contexts/PaperContext';
import  PaperView  from './pages/PaperView';

function App() {
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
  });
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  const { PaperItems, getTotalMarks } = usePaper();

  // Fetch questions when filters change
  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
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
    });
  };

  const handleToggleStar = async (questionId) => {
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
  };

  return currentView === 'paper' ? (
  <PaperView onBack={() => setCurrentView('library')} />
) : (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    {/* ... existing header and content ... */}
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="text-indigo-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Question Paper Generator
                </h1>
                <p className="text-sm text-gray-600">
                  {totalQuestions} questions available
                </p>
              </div>
            </div>
            
            {/* Paper Summary */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Questions in Paper</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {PaperItems.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Marks</p>
                <p className="text-2xl font-bold text-green-600">
                  {getTotalMarks()}
                </p>
              </div>
              <button 
                onClick={() => setCurrentView('paper')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FileText size={20} />
                <span className="font-semibold">View Paper</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

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
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;