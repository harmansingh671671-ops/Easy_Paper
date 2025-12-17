import React, { createContext, useContext, useState } from 'react';
import questionService from '../services/questionService';

const PaperContext = createContext();

export const usePaper = () => {
  const context = useContext(PaperContext);
  if (!context) {
    throw new Error('usePaper must be used within PaperProvider');
  }
  return context;
};
  
export const PaperProvider = ({ children }) => {
  const [paperQuestions, setPaperQuestions] = useState([]);
  const reorderQuestions = (startIndex, endIndex) => {
    const result = Array.from(paperQuestions);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setPaperQuestions(result);
  };
  const addToPaper = (question) => {
    // Check if already in Paper
    if (paperQuestions.find(item => item.id === question.id)) {
      alert('Question already in Paper!');
      return;
    }
    
    setPaperQuestions([...paperQuestions, question]);
  };

  const removeFromPaper = (questionId) => {
    setPaperQuestions(paperQuestions.filter(item => item.id !== questionId));
  };

  const clearPaper = () => {
    setPaperQuestions([]);
  };

  const isInPaper = (questionId) => {
    return paperQuestions.some(item => item.id === questionId);
  };

  const getTotalMarks = () => {
    return paperQuestions.reduce((total, item) => total + item.marks, 0);
  };

  const updateQuestionMarks = async (questionId, newMarks) => {
    try {
      // Optimistically update the UI
      const updatedQuestions = paperQuestions.map(q => 
        q.id === questionId ? { ...q, marks: newMarks } : q
      );
      setPaperQuestions(updatedQuestions);

      // Persist the change to the backend
      await questionService.updateQuestion(questionId, { marks: newMarks });
    } catch (error) {
      console.error('Failed to update marks:', error);
      // Optionally, revert the change in UI
      // For now, we'll just log the error
    }
  };

  return (
    <PaperContext.Provider
      value={{
        paperQuestions,
        addToPaper,
        removeFromPaper,
        clearPaper,
        isInPaper,
        getTotalMarks,
        reorderQuestions,
        updateQuestionMarks,
      }}
    >
      {children}
    </PaperContext.Provider>
  );
};