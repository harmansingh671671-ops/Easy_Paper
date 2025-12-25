import api from './api';

const studentService = {
  // Notes
  createNote: async (title, content, sourcePdfName) => {
    const response = await api.post('/student/notes', {
      title,
      content,
      source_pdf_name: sourcePdfName
    });
    return response.data;
  },

  getNotes: async () => {
    const response = await api.get('/student/notes');
    return response.data;
  },

  // Flashcards
  createFlashcards: async (deckTitle, cards, sourcePdfName) => {
    const response = await api.post('/student/flashcards', {
      deck_title: deckTitle,
      cards,
      source_pdf_name: sourcePdfName
    });
    return response.data;
  },

  getFlashcards: async () => {
    const response = await api.get('/student/flashcards');
    return response.data;
  },

  // Quizzes
  createQuiz: async (title, questions, sourcePdfName) => {
    const response = await api.post('/student/quizzes', {
      title,
      questions,
      source_pdf_name: sourcePdfName
    });
    return response.data;
  },

  getQuizzes: async () => {
    const response = await api.get('/student/quizzes');
    return response.data;
  },

  // Mind Maps
  createMindMap: async (title, data, sourcePdfName) => {
    const response = await api.post('/student/mindmaps', {
      title,
      data,
      source_pdf_name: sourcePdfName
    });
    return response.data;
  },

  getMindMaps: async () => {
    const response = await api.get('/student/mindmaps');
    return response.data;
  }
};

export default studentService;
