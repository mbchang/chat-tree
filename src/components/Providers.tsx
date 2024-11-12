'use client';

import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return <>{children}</>;
};

export default Providers;
