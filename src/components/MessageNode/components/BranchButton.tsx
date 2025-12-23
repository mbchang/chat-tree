import React from 'react';
import { BranchButtonProps } from '../types';

const BranchButton: React.FC<BranchButtonProps> = ({ messageId, onBranch }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onBranch(messageId);
      }}
      className="ml-2 text-gray-400 hover:text-green-500 transition-colors duration-200 interactive-element"
      style={{ fontSize: '12px', padding: '2px' }}
      aria-label={`Branch from message ${messageId}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 3a1 1 0 100 2h4.586L9.293 10.293a1 1 0 001.414 1.414L16 6.414V11a1 1 0 102 0V4a1 1 0 00-1-1h-7z" />
      </svg>
    </button>
  );
};

export default BranchButton;

