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
  const [PaperItems, setPaperItems] = useState([]);

  const addToPaper = (question) => {
    // Check if already in Paper
    if (PaperItems.find(item => item.id === question.id)) {
      alert('Question already in Paper!');
      return;
    }
    
    setPaperItems([...PaperItems, question]);
  };

  const removeFromPaper = (questionId) => {
    setPaperItems(PaperItems.filter(item => item.id !== questionId));
  };

  const clearPaper = () => {
    setPaperItems([]);
  };

  const isInPaper = (questionId) => {
    return PaperItems.some(item => item.id === questionId);
  };

  const getTotalMarks = () => {
    return PaperItems.reduce((total, item) => total + item.marks, 0);
  };

  return (
    <PaperContext.Provider
      value={{
        PaperItems,
        addToPaper,
        removeFromPaper,
        clearPaper,
        isInPaper,
        getTotalMarks,
      }}
    >
      {children}
    </PaperContext.Provider>
  );
};