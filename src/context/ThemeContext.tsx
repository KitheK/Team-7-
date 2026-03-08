import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { type ColorScheme, getColors } from '../constants/colors';

type ThemeValue = {
  isDark: boolean;
  toggle: () => void;
  c: ColorScheme;
};

const ThemeContext = createContext<ThemeValue>({
  isDark: true,
  toggle: () => {},
  c: getColors(true),
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const toggle = useCallback(() => setIsDark(d => !d), []);
  const c = useMemo(() => getColors(isDark), [isDark]);
  return (
    <ThemeContext.Provider value={{ isDark, toggle, c }}>
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
