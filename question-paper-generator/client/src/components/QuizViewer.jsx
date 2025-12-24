import { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

function QuizViewer({ questions: initialQuestions }) {
  const [questions, setQuestions] = useState(
    initialQuestions.map((q, idx) => ({ ...q, id: idx, userAnswer: null, isAnswered: false }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].userAnswer = answer;
    updatedQuestions[currentIndex].isAnswered = true;
    setQuestions(updatedQuestions);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      calculateScore();
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (q.question_type === 'MCQ') {
        if (q.userAnswer === q.correct_answer || q.userAnswer === q.correct_answer?.toUpperCase()) {
          correct++;
        }
      } else if (q.question_type === 'TRUE_FALSE') {
        if (q.userAnswer?.toLowerCase() === q.correct_answer?.toLowerCase()) {
          correct++;
        }
      } else {
        // FILL_BLANK or other types
        if (q.userAnswer?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim()) {
          correct++;
        }
      }
    });
    setScore(correct);
  };

  const handleReset = () => {
    setQuestions(
      initialQuestions.map((q, idx) => ({ ...q, id: idx, userAnswer: null, isAnswered: false }))
    );
    setCurrentIndex(0);
    setShowResults(false);
    setScore(0);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Results</h2>
        <div className="text-6xl font-bold text-indigo-600 mb-2">
          {score}/{questions.length}
        </div>
        <div className="text-2xl text-gray-600 mb-6">{percentage}%</div>
        
        <div className="space-y-4 mt-8 text-left">
          {questions.map((q, idx) => {
            const isCorrect = 
              (q.question_type === 'MCQ' && q.userAnswer === q.correct_answer) ||
              (q.question_type !== 'MCQ' && q.userAnswer?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim());
            
            return (
              <div key={idx} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="text-green-600 mt-1" size={20} />
                  ) : (
                    <XCircle className="text-red-600 mt-1" size={20} />
                  )}
                  <p className="font-semibold">{q.question_text}</p>
                </div>
                <div className="ml-7 space-y-1 text-sm">
                  <p className="text-gray-600">Your answer: <span className="font-medium">{q.userAnswer || 'Not answered'}</span></p>
                  {!isCorrect && (
                    <p className="text-gray-600">Correct answer: <span className="font-medium text-green-700">{q.correct_answer}</span></p>
                  )}
                  {q.explanation && (
                    <p className="text-gray-500 italic">{q.explanation}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleReset}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RotateCcw size={20} />
          Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(currentQuestion.difficulty)}`}>
            {currentQuestion.difficulty || 'MEDIUM'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-xl font-semibold text-gray-900 mb-6">
          {currentQuestion.question_text}
        </p>

        {/* MCQ Options */}
        {currentQuestion.question_type === 'MCQ' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={currentQuestion.isAnswered}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  currentQuestion.userAnswer === option
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                } ${currentQuestion.isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {String.fromCharCode(65 + idx)}. {option}
              </button>
            ))}
          </div>
        )}

        {/* TRUE_FALSE Options */}
        {currentQuestion.question_type === 'TRUE_FALSE' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer('True')}
              disabled={currentQuestion.isAnswered}
              className={`p-4 rounded-lg border-2 transition-colors ${
                currentQuestion.userAnswer === 'True'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              } ${currentQuestion.isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              True
            </button>
            <button
              onClick={() => handleAnswer('False')}
              disabled={currentQuestion.isAnswered}
              className={`p-4 rounded-lg border-2 transition-colors ${
                currentQuestion.userAnswer === 'False'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              } ${currentQuestion.isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              False
            </button>
          </div>
        )}

        {/* FILL_BLANK Input */}
        {currentQuestion.question_type === 'FILL_BLANK' && (
          <input
            type="text"
            value={currentQuestion.userAnswer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            disabled={currentQuestion.isAnswered}
            placeholder="Enter your answer"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        )}
      </div>

      {/* Next Button */}
      {currentQuestion.isAnswered && (
        <button
          onClick={handleNext}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          {currentIndex < questions.length - 1 ? (
            <>
              Next Question
              <ArrowRight size={20} />
            </>
          ) : (
            'View Results'
          )}
        </button>
      )}
    </div>
  );
}

export default QuizViewer;








