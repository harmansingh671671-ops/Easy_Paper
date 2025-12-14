import { useEffect, useState } from 'react';
import questionService from './services/questionService';

function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const data = await questionService.getAllQuestions({ page: 1, page_size: 5 });
        setQuestions(data.questions);
        setError(null);
      } catch (err) {
        setError('Failed to load questions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-600 mb-8">
          Question Paper Generator
        </h1>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">
                ✅ API Connection Successful!
              </h2>
              <p className="text-gray-600 mb-4">
                Loaded {questions.length} questions from the database.
              </p>
            </div>

            {questions.map((question) => (
              <div key={question.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                      {question.subject}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      {question.question_type}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      Class {question.class_grade}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{question.marks} marks</span>
                </div>

                <p className="text-gray-800 font-medium">
                  {question.question_text}
                </p>

                {question.question_type === 'MCQ' && (
                  <div className="mt-4 space-y-2">
                    {['a', 'b', 'c', 'd'].map((opt) => {
                      const optionKey = `option_${opt}`;
                      const optionValue = question[optionKey];
                      if (!optionValue) return null;
                      
                      return (
                        <div key={opt} className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-indigo-600">{opt.toUpperCase()}.</span>
                          <span>{optionValue}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {question.answer_text && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm text-green-600 font-semibold">
                      Answer: {question.answer_text}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;