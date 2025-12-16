import React, { useState } from 'react';
import Modal from 'react-modal';
import { X } from 'lucide-react';
import questionService from '../services/questionService';

const CreateQuestionModal = ({ isOpen, onRequestClose, onQuestionCreated }) => {
  const [formData, setFormData] = useState({
    question_text: '',
    subject: 'Mathematics',
    class_grade: '12',
    difficulty: 'EASY',
    marks: 1,
    question_type: 'MCQ',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    answer_text: '',
    detailed_solution: '',
    source: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
  const classes = ['8', '9', '10', '11', '12'];
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  const types = ['MCQ', 'LONG', 'TRUE_FALSE', 'FILL_BLANK'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const newQuestion = await questionService.createQuestion(formData);
      onQuestionCreated(newQuestion);
      onRequestClose();
    } catch (err) {
      setError('Failed to create question. Please check the fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Create New Question"
      className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto my-12"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Question</h2>
        <button onClick={onRequestClose} className="p-2 hover:bg-gray-100 rounded-full">
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select id="subject" name="subject" value={formData.subject} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="class_grade" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select id="class_grade" name="class_grade" value={formData.class_grade} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="question_type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select id="question_type" name="question_type" value={formData.question_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="marks" className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
            <input type="number" id="marks" name="marks" value={formData.marks} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        
        <div>
          <label htmlFor="question_text" className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
          <textarea id="question_text" name="question_text" value={formData.question_text} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3"></textarea>
        </div>
        
        {formData.question_type === 'MCQ' && (
          <div className="grid grid-cols-2 gap-4">
            {['a', 'b', 'c', 'd'].map(opt => (
              <div key={opt}>
                <label htmlFor={`option_${opt}`} className="block text-sm font-medium text-gray-700 mb-1">Option {opt.toUpperCase()}</label>
                <input type="text" id={`option_${opt}`} name={`option_${opt}`} value={formData[`option_${opt}`]} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="answer_text" className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
          <input type="text" id="answer_text" name="answer_text" value={formData.answer_text} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label htmlFor="detailed_solution" className="block text-sm font-medium text-gray-700 mb-1">Detailed Solution</label>
          <textarea id="detailed_solution" name="detailed_solution" value={formData.detailed_solution} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3"></textarea>
        </div>
        
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <input type="text" id="source" name="source" value={formData.source} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onRequestClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
            {isSubmitting ? 'Creating...' : 'Create Question'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateQuestionModal;