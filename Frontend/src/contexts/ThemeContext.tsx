import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { darkTheme, lightTheme } from '@/styles/theme';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: typeof lightTheme | typeof darkTheme;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useLocalStorage<ThemeMode>('theme', 'system');
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Determine the current theme based on system preferences
  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    // Set the initial theme
    const currentTheme = themeMode === 'system' ? systemTheme : themeMode;
    const isDark = currentTheme === 'dark';
    
    // Update the theme
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(currentTheme);
    
    // Update meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        isDark ? darkTheme.colors.background : lightTheme.colors.background
      );
    }
    
    // Update state
    setIsDarkMode(isDark);
    setIsMounted(true);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove(newTheme === 'dark' ? 'light' : 'dark');
        root.classList.add(newTheme);
        setIsDarkMode(newTheme === 'dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Don't render the app until we've determined the theme
  if (!isMounted) {
    return null;
  }

  const toggleTheme = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isDarkMode,
        toggleTheme,
        setThemeMode,
      }}
    >
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook to use theme values in styled-components
export const useThemeValue = <T,>(selector: (theme: typeof lightTheme) => T): T => {
  const { theme } = useTheme();
  return selector(theme);
};
