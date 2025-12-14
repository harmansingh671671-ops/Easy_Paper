import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * Renders text with LaTeX math formulas
 * Supports both inline ($...$) and block ($$...$$) math
 */
export const renderMath = (text) => {
  if (!text) return null;

  // Split text by LaTeX delimiters ($$...$$ for block, $...$ for inline)
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/);

  return (
    <>
      {parts.map((part, index) => {
        // Block math ($$...$$)
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return (
            <div key={index} className="my-2">
              <BlockMath math={math} />
            </div>
          );
        }
        
        // Inline math ($...$)
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return <InlineMath key={index} math={math} />;
        }
        
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

/**
 * Component wrapper for rendering math
 */
export const MathText = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {renderMath(children)}
    </div>
  );
};

export default MathText;