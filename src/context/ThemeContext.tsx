import React, { createContext, useContext } from 'react';
import { type ColorScheme, getColors } from '../constants/colors';

type ThemeValue = {
  c: ColorScheme;
};

const ThemeContext = createContext<ThemeValue>({ c: getColors() });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const c = getColors();
  return (
    <ThemeContext.Provider value={{ c }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors(): ColorScheme {
  return useContext(ThemeContext).c;
}
