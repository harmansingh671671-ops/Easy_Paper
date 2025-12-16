import api from './api';

const questionService = {
  // Get all questions with filters
  getAllQuestions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (filters.page) params.append('page', filters.page);
      if (filters.page_size) params.append('page_size', filters.page_size);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.class_grade) params.append('class_grade', filters.class_grade);
      if (filters.topic) params.append('topic', filters.topic);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.question_type) params.append('question_type', filters.question_type);
      if (filters.is_starred !== undefined) params.append('is_starred', filters.is_starred);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/questions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  // Get single question by ID
  getQuestionById: async (id) => {
    try {
      const response = await api.get(`/questions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  },

  // Create new question
  createQuestion: async (questionData) => {
    try {
      const response = await api.post('/questions', questionData);
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },

  // Update question
  updateQuestion: async (id, questionData) => {
    try {
      const response = await api.put(`/questions/${id}`, questionData);
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  // Delete question
  deleteQuestion: async (id) => {
    try {
      await api.delete(`/questions/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  // Toggle star
  toggleStar: async (id) => {
    try {
      const response = await api.patch(`/questions/${id}/star`);
      return response.data;
    } catch (error) {
      console.error('Error toggling star:', error);
      throw error;
    }
  },

  // Get statistics
    getStatistics: async () => {
      try {
        const response = await api.get('/questions/stats/overview');
        return response.data;
      } catch (error) {
        console.error('Error fetching statistics:', error);
        throw error;
      }
    },
  
    // Generate PDF from question IDs
    generatePdf: async (questionIds, title = 'Question Paper') => {
      try {
        const response = await api.post(
          '/questions/generate-pdf',
          { question_ids: questionIds, title },
          { responseType: 'blob' } // Important for file downloads
        );
        return response.data;
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
      }
    },
  };
  
  export default questionService;
  