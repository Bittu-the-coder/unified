'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type FontOption = 'inter' | 'roboto' | 'dm-sans' | 'plus-jakarta' | 'outfit' | 'raleway';

interface FontContextType {
  font: FontOption;
  setFont: (font: FontOption) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<FontOption>('inter');

  useEffect(() => {
    const saved = localStorage.getItem('unified-font') as FontOption;
    if (saved) {
      setFontState(saved);
      document.body.setAttribute('data-font', saved);
    } else {
      document.body.setAttribute('data-font', 'inter');
    }
  }, []);

  const setFont = (newFont: FontOption) => {
    setFontState(newFont);
    localStorage.setItem('unified-font', newFont);
    document.body.setAttribute('data-font', newFont);
  };

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}
