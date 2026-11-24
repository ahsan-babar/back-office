import { createTheme, CssBaseline, PaletteMode, ThemeProvider } from '@mui/material';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { THEME_STORAGE_KEY } from '../config/constants';

/**
 * Shape of the theme state and actions exposed to the React component tree.
 */
interface ThemeContextValue {
  /** Active Material UI color palette mode (`'light'` or `'dark'`). */
  mode: PaletteMode;
  /** Switches between `'light'` and `'dark'` modes and persists the selection to `localStorage`. */
  toggleTheme: () => void;
  /** Explicitly sets the color palette mode and persists it to `localStorage`. */
  setThemeMode: (mode: PaletteMode) => void;
}

const ThemeModeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Reads the persisted theme preference from `localStorage`, defaulting to `'light'`
 * when unset or invalid.
 *
 * @returns Initial {@link PaletteMode} for the application theme.
 */
function getInitialThemeMode(): PaletteMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : 'light';
}

/**
 * Top-level Material UI theme provider that manages persistent light/dark mode state,
 * generates the memoized MUI theme palette, and injects `<CssBaseline />`.
 *
 * @param props.children - Descendant UI components wrapped by the theme provider.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialThemeMode);

  const setThemeMode = useCallback((nextMode: PaletteMode) => {
    setMode(nextMode);
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: PaletteMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1e3a8a' : '#93c5fd',
          },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#0f172a',
            paper: mode === 'light' ? '#ffffff' : '#1e293b',
          },
        },
      }),
    [mode],
  );

  const value = useMemo(
    () => ({ mode, toggleTheme, setThemeMode }),
    [mode, toggleTheme, setThemeMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

/**
 * Custom hook providing type-safe access to {@link ThemeContextValue}.
 *
 * @throws {Error} When invoked outside of an {@link AppThemeProvider} tree.
 */
export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used inside an AppThemeProvider');
  }
  return ctx;
}
