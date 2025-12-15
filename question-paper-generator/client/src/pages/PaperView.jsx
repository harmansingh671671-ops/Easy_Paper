import React, { useState } from 'react';
import { Trash2, GripVertical, Download, ArrowLeft } from 'lucide-react';
import { usePaper } from '../contexts/PaperContext';
import { renderMath } from '../utils/mathRenderer';

const PaperView = ({ onBack }) => {
  const { paperItems, removeFromPaper, clearPaper, getTotalMarks } = usePaper();

  if (questionslength === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Library</span>
          </button>
          
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Questions in Paper</h2>
            <p className="text-gray-600 mb-6">Add questions from the library to create your paper</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Browse Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const groupedByType = questions.reduce((acc, q) => {
    if (!acc[q.question_type]) acc[q.question_type] = [];
    acc[q.question_type].push(q);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Library</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Question Paper</h1>
              <p className="text-gray-600 mt-1">
                {questions.length} questions • Total: {getTotalMarks()} marks
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearPaper}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <Trash2 size={18} />
                Clear All
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Download size={18} />
                Generate PDF
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(groupedByType).map(([type, questions]) => (
            <div key={type} className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">{type.replace('_', ' ')}</p>
              <p className="text-2xl font-bold text-indigo-600">{questions.length}</p>
              <p className="text-xs text-gray-500">
                {questions.reduce((sum, q) => sum + q.marks, 0)} marks
              </p>
            </div>
          ))}
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="text-gray-400 cursor-move" size={20} />
                  <span className="text-lg font-bold text-gray-700">Q{index + 1}.</span>
                </div>

                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-semibold">
                      {question.subject}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                      {question.question_type}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                      {question.marks} marks
                    </span>
                  </div>

                  <div className="text-gray-800">
                    {renderMath(question.question_text)}
                  </div>

                  {question.question_type === 'MCQ' && (
                    <div className="mt-3 space-y-1">
                      {['a', 'b', 'c', 'd'].map((opt) => {
                        const val = question[`option_${opt}`];
                        if (!val) return null;
                        return (
                          <div key={opt} className="flex gap-2 text-sm">
                            <span className="font-bold text-indigo-600">{opt.toUpperCase()}.</span>
                            {renderMath(val)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeFromPaper(question.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaperView;