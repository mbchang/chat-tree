'use client';

import React from 'react';
import { ApiKeyProvider } from '@/context/ApiKeyContext';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return <ApiKeyProvider>{children}</ApiKeyProvider>;
};

export default Providers;
