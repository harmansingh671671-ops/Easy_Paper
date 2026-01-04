import api from './api';
import { supabase } from '../lib/supabaseClient';

const aiService = {
  // Get next untitled topic name
  getNextUntitledTopic: async () => {
    try {
      const response = await api.get('/ai/get-next-untitled');
      return response.data.topic;
    } catch (error) {
      console.error('Error fetching untitled topic:', error);
      return null;
    }
  },

  // Extract text from PDF
  extractPdfText: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/ai/extract-pdf-text', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw error;
    }
  },

  // Save notes directly (for streaming)
  saveNotes: async (content, topic) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('topic', topic);

      const response = await api.post('/ai/save-notes', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  },

  // Generate notes
  generateNotes: async (content, topic = null, save_topic = null) => {
    try {
      const formData = new FormData();
      // Ensure content is stringified if it's an array (images)
      const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;
      formData.append('content', contentStr);
      if (topic) formData.append('topic', topic);
      if (save_topic) formData.append('save_topic', save_topic);

      const response = await api.post('/ai/generate-notes', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error generating notes:', error);
      throw error;
    }
  },

  // Generate flashcards
  generateFlashcards: async (content, numCards = 10, topic = null, save_topic = null) => {
    try {
      const formData = new FormData();
      const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;
      formData.append('content', contentStr);
      formData.append('num_cards', numCards);
      if (topic) formData.append('topic', topic);
      if (save_topic) formData.append('save_topic', save_topic);

      const response = await api.post('/ai/generate-flashcards', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error generating flashcards:', error);
      throw error;
    }
  },

  // Generate quiz
  generateQuiz: async (content, numQuestions = 10, questionType = 'mixed', topic = null, save_topic = null) => {
    try {
      const formData = new FormData();
      const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;
      formData.append('content', contentStr);
      formData.append('num_questions', numQuestions);
      formData.append('question_type', questionType);
      if (topic) formData.append('topic', topic);
      if (save_topic) formData.append('save_topic', save_topic);

      const response = await api.post('/ai/generate-quiz', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  },

  // Generate mind map
  generateMindMap: async (content, topic = null, save_topic = null) => {
    try {
      const formData = new FormData();
      const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;
      formData.append('content', contentStr);
      if (topic) formData.append('topic', topic);
      if (save_topic) formData.append('save_topic', save_topic);

      const response = await api.post('/ai/generate-mindmap', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error generating mind map:', error);
      throw error;
    }
  },

  // Get user history
  getHistory: async () => {
    try {
      const response = await api.get('/history/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching history:', error);
      // Return empty array on error to allow graceful degradation
      return [];
    }
  },

  // Get full content for a specific history topic
  getTopicContent: async (topic) => {
    try {
      const response = await api.get('/history/content', {
        params: { topic }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching topic content:', error);
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

      const response = await api.post('/ai/generate-lecture-outline', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error generating lecture outline:', error);
      throw error;
    }
  },

  // Process PDF - returns notes only (fastest)
  // Frontend should queue other features separately
  // Process PDF with Streaming Response (NDJSON)
  processPdf: async (file, topic = null, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (topic) formData.append('topic', topic);

      // Get Auth Token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      // Determine base URL from env or default
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      // Use native fetch to handle streaming
      const response = await fetch(`${BASE_URL}/ai/process-pdf`, {
        method: 'POST',
        body: formData,
        headers: {
          // Let browser set Content-Type for FormData
          // Add auth header if needed (assuming stored in local storage or managed elsewhere, 
          // but for now relying on cookie/implicit or adding simple token if standard)
          'Authorization': `Bearer ${token} `
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to process PDF');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Split by newlines to handle NDJSON
        const lines = buffer.split('\n');

        // Process all complete lines
        buffer = lines.pop(); // Keep the last partial line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.error) {
              throw new Error(data.error);
            }
            if (onProgress) {
              onProgress(data);
            }
          } catch (e) {
            console.error("Error parsing stream line:", e);
          }
        }
      }

      // Return final state? Streaming functions usually just resolve when done.
      return { success: true };

    } catch (error) {
      console.error('Error processing PDF stream:', error);
      throw error;
    }
  },
};

export default aiService;



