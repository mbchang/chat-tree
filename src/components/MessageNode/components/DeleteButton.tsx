import React, { useState } from 'react';
import { DeleteButtonProps } from '../types';

const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="absolute -top-2 -right-2 z-10 cursor-pointer transition-opacity duration-200 interactive-element"
      style={{ opacity: isHovering ? '1' : '0.3' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
    >
      <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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

