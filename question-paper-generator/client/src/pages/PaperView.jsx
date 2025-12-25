import { useState } from 'react';
import { Trash2, GripVertical, Download, ArrowLeft, Loader2, Save } from 'lucide-react';
import { usePaper } from '../contexts/PaperContext';
import { renderMath } from '../utils/mathRenderer';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import questionService from '../services/questionService';
import teacherService from '../services/teacherService';
import { useProfile } from '../App';

const PaperView = ({ onBack }) => {
  const { paperQuestions, removeFromPaper, clearPaper, getTotalMarks, reorderQuestions, updateQuestionMarks } = usePaper();
  const { profile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);

  // Paper Metadata State
  const [paperDetails, setPaperDetails] = useState({
    title: '',
    duration: '', // Changed default to empty as requested
    instructions: 'All questions are compulsory.' // Changed default as requested
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = paperQuestions.findIndex(q => q.id === active.id);
      const newIndex = paperQuestions.findIndex(q => q.id === over.id);
      reorderQuestions(oldIndex, newIndex);
    }
  };

  const handleSaveAndGenerate = async () => {
    if (!paperDetails.title) {
      alert("Please enter a paper title");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create Paper in DB (if Teacher)
      // We check if teacherService is available or based on profile, but sticking to existing pattern
      if (profile?.role === 'teacher') {
        const paperData = {
          title: paperDetails.title,
          category: profile.category,
          questions: paperQuestions.map(q => ({ id: q.id, marks: q.marks })),
          total_marks: getTotalMarks(),
          duration_minutes: parseInt(paperDetails.duration || 0),
          instructions: paperDetails.instructions
        };

        await teacherService.createPaper(
          paperData.title,
          paperData.category,
          paperData.total_marks,
          paperData.duration_minutes,
          paperData.instructions,
          paperData.questions
        );
      }

      // 2. Generate PDF
      const questionIds = paperQuestions.map(q => q.id);
      // We also want to pass metadata to PDF generator if backend supports it, 
      // otherwise it just uses IDs.
      // Assuming generatePdf can take an object or we use the existing simple one.
      // Checking questionService.generatePdf signature... it takes (questionIds, title).
      // Let's update it to pass full metadata if possible, or just title.
      // Based on previous code in TeacherPaperCreator: 
      // await questionService.generatePdf({ title, question_ids });

      let pdfBlob;
      // Heuristic: check if backend supports object payload or just IDs.
      // Existing usage in PaperView was `generatePdf(questionIds, "My Question Paper")`
      // TeacherPaperCreator used `generatePdf({ title, question_ids })`
      // Let's try the object format which seems more robust for metadata
      try {
        pdfBlob = await questionService.generatePdf({
          title: paperDetails.title,
          question_ids: questionIds,
          duration: parseInt(paperDetails.duration || 0), // Safe parse
          instructions: paperDetails.instructions,
          total_marks: getTotalMarks()
        });
      } catch (e) {
        // Fallback to simple signature if object one fails immediately (though likely same endpoint)
        pdfBlob = await questionService.generatePdf(questionIds, paperDetails.title);
      }

      // 3. Download
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paperDetails.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert(profile?.role === 'teacher' ? 'Paper saved and downloaded!' : 'Paper downloaded!');

      // Optional: Clear paper or go back?
      // clearPaper(); 
      // onBack();

    } catch (error) {
      console.error(error);
      alert('Failed to process paper. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const SortableQuestion = ({ question, index }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const [currentMarks, setCurrentMarks] = useState(question.marks);

    const handleMarksChange = (e) => {
      setCurrentMarks(parseInt(e.target.value, 10));
    };

    const handleMarksBlur = () => {
      if (currentMarks !== question.marks && currentMarks > 0) {
        updateQuestionMarks(question.id, currentMarks);
      } else if (currentMarks <= 0) {
        setCurrentMarks(question.marks);
      }
    };

    return (
      <div ref={setNodeRef} style={style} className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="text-gray-400" size={20} />
            <span className="text-lg font-bold text-gray-700">Q{index + 1}.</span>
          </div>

          <div className="flex-1">
            <div className="flex gap-2 mb-3 items-center">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-semibold">
                {question.subject}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                {question.question_type}
              </span>
              <input
                type="number"
                value={currentMarks}
                onChange={handleMarksChange}
                onBlur={handleMarksBlur}
                className="w-16 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
              />
              <span className="text-xs text-gray-500">marks</span>
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
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  if (paperQuestions.length === 0) {
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

  const groupedByType = paperQuestions.reduce((acc, q) => {
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

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Question Paper</h1>
              <p className="text-gray-600 mt-1">
                {paperQuestions.length} questions • Total: {getTotalMarks()} marks
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearPaper}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <Trash2 size={18} />
                Clear
              </button>
              <button
                onClick={handleSaveAndGenerate}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 shadow-sm"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? 'Processing...' : (profile?.role === 'teacher' ? 'Save & Download' : 'Download PDF')}
              </button>
            </div>
          </div>

          {/* Paper Metadata Inputs */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paper Title</label>
              <input
                type="text"
                value={paperDetails.title}
                onChange={(e) => setPaperDetails({ ...paperDetails, title: e.target.value })}
                placeholder="e.g. Mathematics Final Exam"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={paperDetails.duration}
                onChange={(e) => setPaperDetails({ ...paperDetails, duration: e.target.value })}
                placeholder="e.g. 180"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                value={paperDetails.instructions}
                onChange={(e) => setPaperDetails({ ...paperDetails, instructions: e.target.value })}
                placeholder="Enter instructions for students..."
                rows="2"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
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

        {/* Questions List with Drag & Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={paperQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {paperQuestions.map((question, index) => (
                <SortableQuestion key={question.id} question={question} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default PaperView;
