import React, { createContext, useContext } from 'react';
import { useWindowDimensions, Platform } from 'react-native';

export const MOBILE_BREAKPOINT = 768;

type LayoutValue = {
  isMobile: boolean;
  isNative: boolean;
  width: number;
};

const LayoutContext = createContext<LayoutValue>({
  isMobile: false,
  isNative: false,
  width: 1024,
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  const isMobile = isNative || width < MOBILE_BREAKPOINT;
  return (
    <LayoutContext.Provider value={{ isMobile, isNative, width }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
