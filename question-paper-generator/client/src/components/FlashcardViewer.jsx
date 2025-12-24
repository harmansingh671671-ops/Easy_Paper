import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle } from 'lucide-react';

function FlashcardViewer({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studied, setStudied] = useState(new Set());

  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  const progress = ((currentIndex + 1) / totalCards) * 100;

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkStudied = () => {
    setStudied(new Set([...studied, currentIndex]));
    handleNext();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudied(new Set());
  };

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <p className="text-gray-600">No flashcards available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span className="text-sm text-gray-500">
            {studied.size} studied
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="relative">
        <div
          className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] flex items-center justify-center cursor-pointer transform transition-transform hover:scale-105"
          onClick={handleFlip}
        >
          <div className="text-center w-full">
            {!isFlipped ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">Question</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentCard.front || currentCard.question}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">Answer</p>
                <p className="text-xl text-gray-700">
                  {currentCard.back || currentCard.answer}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <button
            onClick={handleFlip}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            title="Flip card"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleMarkStudied}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle size={20} />
            Mark as Studied
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === totalCards - 1}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default FlashcardViewer;








