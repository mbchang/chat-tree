import React from 'react';
import { BranchButtonProps } from '../types';

const BranchButton: React.FC<BranchButtonProps> = ({ messageId, onBranch }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onBranch(messageId);
      }}
      className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all duration-200 interactive-element opacity-60 hover:opacity-100"
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

