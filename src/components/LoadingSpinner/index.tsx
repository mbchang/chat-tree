import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center">
    <div className="relative">
      <div className="w-5 h-5 border-2 border-slate-200 rounded-full"></div>
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
  </div>
);

export default LoadingSpinner;
