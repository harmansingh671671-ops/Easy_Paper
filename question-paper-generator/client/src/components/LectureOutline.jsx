import { useState } from 'react';
import { BookOpen, Clock, Target, Download, Copy } from 'lucide-react';

function LectureOutline({ outline, onGenerate }) {
  const [activeSection, setActiveSection] = useState(null);

  if (!outline) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600 mb-4">No lecture outline available</p>
        {onGenerate && (
          <button
            onClick={onGenerate}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate Outline
          </button>
        )}
      </div>
    );
  }

  const totalDuration = outline.sections?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
  const summaryDuration = outline.summary_duration || 5;
  const qaDuration = outline.qa_duration || 5;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="text-indigo-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">
            {outline.topic || 'Lecture Outline'}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>{totalDuration + summaryDuration + qaDuration} minutes</span>
        </div>
      </div>

      {/* Learning Objectives */}
      {outline.learning_objectives && outline.learning_objectives.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-blue-600" size={20} />
            <h3 className="font-semibold text-blue-900">Learning Objectives</h3>
          </div>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            {outline.learning_objectives.map((obj, idx) => (
              <li key={idx}>{obj}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sections */}
      {outline.sections && outline.sections.length > 0 && (
        <div className="space-y-4 mb-6">
          {outline.sections.map((section, idx) => (
            <div
              key={idx}
              className="border-2 border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setActiveSection(activeSection === idx ? null : idx)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{section.title}</span>
                  <span className="text-sm text-gray-500">
                    <Clock size={14} className="inline mr-1" />
                    {section.duration} min
                  </span>
                </div>
                <span className="text-gray-400">
                  {activeSection === idx ? '▼' : '▶'}
                </span>
              </button>

              {activeSection === idx && (
                <div className="p-4 bg-white space-y-4">
                  {/* Key Points */}
                  {section.key_points && section.key_points.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Key Points</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {section.key_points.map((point, pIdx) => (
                          <li key={pIdx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Activities */}
                  {section.activities && section.activities.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Activities</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {section.activities.map((activity, aIdx) => (
                          <li key={aIdx}>{activity}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Examples */}
                  {section.examples && section.examples.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Examples</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {section.examples.map((example, eIdx) => (
                          <li key={eIdx}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary and Q&A */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">Summary</h4>
          <p className="text-sm text-green-800">
            <Clock size={14} className="inline mr-1" />
            {summaryDuration} minutes
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">Q&A Session</h4>
          <p className="text-sm text-purple-800">
            <Clock size={14} className="inline mr-1" />
            {qaDuration} minutes
          </p>
        </div>
      </div>
    </div>
  );
}

export default LectureOutline;








