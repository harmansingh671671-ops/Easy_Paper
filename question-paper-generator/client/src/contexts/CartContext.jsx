import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (question) => {
    // Check if already in cart
    if (cartItems.find(item => item.id === question.id)) {
      alert('Question already in cart!');
      return;
    }
    
    setCartItems([...cartItems, question]);
  };

  const removeFromCart = (questionId) => {
    setCartItems(cartItems.filter(item => item.id !== questionId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (questionId) => {
    return cartItems.some(item => item.id === questionId);
  };

  const getTotalMarks = () => {
    return cartItems.reduce((total, item) => total + item.marks, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        getTotalMarks,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};