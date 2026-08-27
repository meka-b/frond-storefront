import React, { useState, useRef } from 'react';

/**
 * React Aria inspired accessible Tooltip component
 * Displays contextual SEO information, alt-text preview, and tips on hover or keyboard focus.
 */
export default function AriaTooltip({ content, children, position = 'top', className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && content && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none px-2.5 py-1.5 rounded-md bg-[#1D2A1C] text-[#FDFBF7] text-[11px] font-normal leading-tight shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 border border-white/10 ${positionClasses[position] || positionClasses.top}`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-[#1D2A1C] rotate-45 border-white/10 ${
              position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1 border-t border-l'
                : 'top-full left-1/2 -translate-x-1/2 -translate-y-1 border-b border-r'
            }`}
          />
        </div>
      )}
    </div>
  );
}
