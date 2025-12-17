import React from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const MathText = ({ text }) => {
  // This regex finds all occurrences of text between dollar signs ($...$)
  const parts = text.split(/(\$.*?\$)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          // If the part is a math expression, render it using InlineMath
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        }
        // Otherwise, render it as plain text
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default MathText;
