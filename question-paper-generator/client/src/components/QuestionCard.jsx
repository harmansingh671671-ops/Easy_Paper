import React, { useState } from 'react';
import { Star, Plus, Check } from 'lucide-react';
import { renderMath } from '../utils/mathRenderer';
import { usePaper } from '../contexts/PaperContext';

const QuestionCard = ({ question, onToggleStar }) => {
  const { addToPaper, isInPaper } = usePaper();
  const [showSolution, setShowSolution] = useState(false);
  const inPaper = isInPaper(question.id);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'MCQ': return 'bg-blue-100 text-blue-800';
      case 'LONG': return 'bg-purple-100 text-purple-800';
      case 'TRUE_FALSE': return 'bg-pink-100 text-pink-800';
      case 'FILL_BLANK': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCardClick = (e) => {
    // Prevent card click from triggering when clicking on a button or the solution toggle
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    addToPaper(question);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
            {question.subject}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(question.question_type)}`}>
            {question.question_type}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
            Class {question.class_grade}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
          {question.source && (
            <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs">
                📚 {question.source}
            </span>
        )}
        </div>
        <span className="text-sm font-bold text-gray-700 whitespace-nowrap ml-2">
          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
        </span>
      </div>

      {/* Question Text */}
      <div className="text-gray-800 font-medium mb-4">
        {renderMath(question.question_text)}
      </div>

      {/* Question Body - Polymorphic Based on Type */}
      {question.question_type === 'MCQ' && (
        <div className="space-y-2 mb-4">
          {['a', 'b', 'c', 'd'].map((opt) => {
            const optionKey = `option_${opt}`;
            const optionValue = question[optionKey];
            if (!optionValue) return null;
            
            return (
              <div
                key={opt}
                className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-indigo-600 min-w-[28px]">
                  {opt.toUpperCase()}.
                </span>
                <div className="flex-1">
                  {renderMath(optionValue)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {question.question_type === 'TRUE_FALSE' && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 p-3 border-2 border-green-200 bg-green-50 rounded-lg text-center font-semibold text-green-700">
            ✓ True
          </div>
          <div className="flex-1 p-3 border-2 border-red-200 bg-red-50 rounded-lg text-center font-semibold text-red-700">
            ✗ False
          </div>
        </div>
      )}

      {question.question_type === 'FILL_BLANK' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500 italic">
          Answer space for fill in the blank
        </div>
      )}

      {question.question_type === 'LONG' && question.detailed_solution && (
        <div className="mb-4">
          <button
            onClick={(e) => { e.stopPropagation(); setShowSolution(!showSolution); }}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showSolution ? '▼ Hide Solution' : '▶ Show Solution'}
          </button>
          {showSolution && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm text-gray-700">
                {renderMath(question.detailed_solution)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Answer (shown for all except LONG without answer_text) */}
      {question.answer_text && (
        <div className="mb-4 pt-3 border-t border-gray-200">
          <span className="text-sm font-semibold text-green-700">Answer: </span>
          <span className="text-sm text-green-600">
            {renderMath(question.answer_text)}
          </span>
        </div>
      )}

      {/* Footer - Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleStar(question.id); }}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
            question.is_starred
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Star size={16} fill={question.is_starred ? 'currentColor' : 'none'} />
          <span className="text-sm font-medium">
            {question.is_starred ? 'Starred' : 'Star'}
          </span>
        </button>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
            inPaper
              ? 'bg-green-100 text-green-700'
              : 'bg-indigo-100 text-indigo-700'
          }`}
        >
          {inPaper ? (
            <>
              <Check size={18} />
              <span>In Paper</span>
            </>
          ) : (
            <>
              <Plus size={18} />
              <span>Add to Paper</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;