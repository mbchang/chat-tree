import React, { useState } from 'react';
import { DeleteButtonProps } from '../types';

const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="absolute -top-3 -right-3 z-10 cursor-pointer transition-all duration-200 interactive-element"
      style={{
        opacity: isHovering ? '1' : '0.5',
        transform: isHovering ? 'scale(1.1)' : 'scale(1)',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
    >
      <div
        className="bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full w-7 h-7 flex items-center justify-center shadow-md border border-slate-200 hover:border-red-200 transition-all duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
    </div>
  );
};

export default DeleteButton;

