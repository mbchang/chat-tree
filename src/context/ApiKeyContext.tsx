'use client';

import React, { createContext, useState, ReactNode } from 'react';

interface ApiKeyContextProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const ApiKeyContext = createContext<ApiKeyContextProps>({
  apiKey: '',
  setApiKey: () => {},
});

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [apiKey, setApiKey] = useState('');

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
};
