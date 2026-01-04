import { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, HelpCircle, CheckSquare, Loader } from 'lucide-react';

function QuizViewer({ questions: initialQuestions, onGenerateMore }) {
  const [questions, setQuestions] = useState(
    initialQuestions.map((q, idx) => ({
      ...q,
      id: idx,
      userAnswer: null,
      isAnswered: false, // This now means "Checked" 
      showAnswer: false
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null); // Temp state before "Check Answer"

  // Sync state logic
  if (initialQuestions.length > questions.length) {
    const newQs = initialQuestions.slice(questions.length).map((q, idx) => ({
      ...q,
      id: questions.length + idx,
      userAnswer: null,
      isAnswered: false,
      showAnswer: false
    }));
    setQuestions([...questions, ...newQs]);
  }

  const currentQuestion = questions[currentIndex];

  // 1. Select Logic (Doesn't validate yet)
  const handleSelect = (answer) => {
    if (questions[currentIndex].isAnswered) return;
    setSelectedOption(answer);
  };

  const handleDoubleClick = (answer) => {
    if (questions[currentIndex].isAnswered) return;
    setSelectedOption(answer);
    // Immediate submission
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].userAnswer = answer;
    updatedQuestions[currentIndex].isAnswered = true;
    updatedQuestions[currentIndex].isCorrect = checkCorrectness(updatedQuestions[currentIndex], answer);
    updatedQuestions[currentIndex].showAnswer = true; // Also show explanation
    setQuestions(updatedQuestions);
  };

  // 2. Check Answer Logic (Validates and locks)
  const handleCheckAnswer = () => {
    if (!selectedOption) return;

    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].userAnswer = selectedOption;
    updatedQuestions[currentIndex].isAnswered = true;
    updatedQuestions[currentIndex].isCorrect = checkCorrectness(updatedQuestions[currentIndex], selectedOption);

    setQuestions(updatedQuestions);
  };

  const checkCorrectness = (q, answer) => {
    if (q.question_type === 'MCQ') {
      return answer === q.correct_answer;
    }
    return answer?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null); // Reset selection for next
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedOption(null); // Reset selection for previous
    }
  };

  const handleShowAnswer = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].showAnswer = true;
    setQuestions(updatedQuestions);
  };



  const handleGenerateMoreClick = async () => {
    if (!onGenerateMore) return;
    setLoadingMore(true);
    await onGenerateMore();
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4">
      {/* Progress & Difficulty */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {(currentIndex + 1)} of {questions.length}
          </span>

        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {!currentQuestion ? (
          <div className="text-center py-12 text-gray-500">
            <p>No questions available.</p>
          </div>
        ) : (
          <>
            <p className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.question_text}
            </p>

            {/* Options */}
            {currentQuestion.question_type === 'MCQ' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  let optionClass = "border-gray-200 hover:border-indigo-300";

                  // Display Logic
                  if (currentQuestion.isAnswered) {
                    // Locked State
                    if (option === currentQuestion.correct_answer) {
                      optionClass = "border-green-500 bg-green-50"; // Always highlight correct
                    } else if (option === currentQuestion.userAnswer) {
                      optionClass = "border-red-500 bg-red-50"; // Highlight wrong if selected
                    } else {
                      optionClass = "border-gray-200 opacity-60"; // Fade others
                    }
                  } else {
                    // Selection State
                    if (option === selectedOption) {
                      optionClass = "border-indigo-600 bg-indigo-50 shadow-md";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(option)}
                      onDoubleClick={() => handleDoubleClick(option)}
                      disabled={currentQuestion.isAnswered}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionClass} ${currentQuestion.isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {String.fromCharCode(65 + idx)}. {option}
                      {currentQuestion.isAnswered && option === currentQuestion.correct_answer && (
                        <CheckCircle className="inline ml-2 text-green-600" size={16} />
                      )}
                      {currentQuestion.isAnswered && option === currentQuestion.userAnswer && option !== currentQuestion.correct_answer && (
                        <XCircle className="inline ml-2 text-red-600" size={16} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {currentQuestion.question_type === 'TRUE_FALSE' && (
              <div className="mt-4 flex gap-4">
                {['True', 'False'].map(opt => {
                  let btnClass = "border-gray-200 hover:border-indigo-500";
                  if (currentQuestion.isAnswered) {
                    if (opt === currentQuestion.correct_answer) btnClass = "border-green-500 bg-green-50";
                    else if (opt === currentQuestion.userAnswer) btnClass = "border-red-500 bg-red-50";
                    else btnClass = "border-gray-200 opacity-60";
                  } else if (selectedOption === opt) {
                    btnClass = "border-indigo-600 bg-indigo-50 shadow-md";
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(opt)}
                      disabled={currentQuestion.isAnswered}
                      className={`px-8 py-3 rounded-lg border-2 font-medium transition-all ${btnClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input Box */}
            {currentQuestion.question_type === 'FILL_BLANK' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled={currentQuestion.isAnswered}
                  value={selectedOption || ''}
                  onChange={(e) => handleSelect(e.target.value)}
                  className="border-2 p-3 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Type your answer here..."
                />
              </div>
            )}

            {/* Action Bar: Check Answer -> Show Explanation */}
            <div className="mt-6 flex items-center justify-between">
              {!currentQuestion.isAnswered ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={!selectedOption}
                  className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${selectedOption
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <CheckSquare size={18} />
                  Check Answer
                </button>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  {/* Feedback Message */}
                  <div className={`p-3 rounded-lg text-sm font-medium ${currentQuestion.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {currentQuestion.isCorrect ? "Correct! Well done." : "Incorrect. Don't worry, keep trying!"}
                  </div>

                  {!currentQuestion.showAnswer ? (
                    <button
                      onClick={handleShowAnswer}
                      className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 flex items-center gap-2 w-fit"
                    >
                      <HelpCircle size={16} />
                      Show Explanation
                    </button>
                  ) : (
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900 border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
                      <p className="font-bold mb-1">Answer: {currentQuestion.correct_answer}</p>
                      <p>{currentQuestion.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer / Navigation */}
      <div className="flex gap-4 mt-6">
        {onGenerateMore && (
          <button
            onClick={handleGenerateMoreClick}
            disabled={loadingMore}
            className="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            {loadingMore ? <Loader className="animate-spin" size={16} /> : <RotateCcw size={16} />}
            Generate More Questions
          </button>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${currentIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <ArrowLeft size={18} /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium transition-colors ${currentIndex === questions.length - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
          >
            Next Question <ArrowRight size={18} />
          </button>
        </div>

        {currentIndex === questions.length - 1 && (
          <div className="text-gray-500 text-sm py-2 italic ml-auto">
            End of questions
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizViewer;
