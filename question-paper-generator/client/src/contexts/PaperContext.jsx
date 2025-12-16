import React, { createContext, useContext, useState } from 'react';

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

  return (
    <PaperContext.Provider
      value={{
        paperQuestions,
        addToPaper,
        removeFromPaper,
        clearPaper,
        isInPaper,
        getTotalMarks,
        reorderQuestions
      }}
    >
      {children}
    </PaperContext.Provider>
  );
};