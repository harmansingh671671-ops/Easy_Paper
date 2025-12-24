import api from './api';

const aiService = {
  // Extract text from PDF
  extractPdfText: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/ai/extract-pdf-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw error;
    }
  },

  // Generate notes
  generateNotes: async (content, topic = null) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (topic) formData.append('topic', topic);
      
      const response = await api.post('/ai/generate-notes', formData);
      return response.data;
    } catch (error) {
      console.error('Error generating notes:', error);
      throw error;
    }
  },

  // Generate flashcards
  generateFlashcards: async (content, numCards = 10) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('num_cards', numCards);
      
      const response = await api.post('/ai/generate-flashcards', formData);
      return response.data;
    } catch (error) {
      console.error('Error generating flashcards:', error);
      throw error;
    }
  },

  // Generate quiz
  generateQuiz: async (content, numQuestions = 10, questionType = 'mixed') => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('num_questions', numQuestions);
      formData.append('question_type', questionType);
      
      const response = await api.post('/ai/generate-quiz', formData);
      return response.data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  },

  // Generate mind map
  generateMindMap: async (content, topic = null) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (topic) formData.append('topic', topic);
      
      const response = await api.post('/ai/generate-mindmap', formData);
      return response.data;
    } catch (error) {
      console.error('Error generating mind map:', error);
      throw error;
    }
  },

  // Generate lecture outline
  generateLectureOutline: async (topic, duration = 60, level = 'intermediate') => {
    try {
      const formData = new FormData();
      formData.append('topic', topic);
      formData.append('duration', duration);
      formData.append('level', level);
      
      const response = await api.post('/ai/generate-lecture-outline', formData);
      return response.data;
    } catch (error) {
      console.error('Error generating lecture outline:', error);
      throw error;
    }
  },

  // Process PDF - returns notes only (fastest)
  // Frontend should queue other features separately
  processPdf: async (file, topic = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (topic) formData.append('topic', topic);
      
      const response = await api.post('/ai/process-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  },
};

export default aiService;



