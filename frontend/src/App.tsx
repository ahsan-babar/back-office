import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { AppThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './routes/AppRoutes';

const theme = createTheme({
  palette: {
    primary: { main: '#1e3a8a' },
    background: { default: '#f8fafc' },
  },
});

/**
 * Root application component composing global providers in dependency order:
 * 1. {@link AppThemeProvider} — Manages persisted light/dark palette mode, MUI `ThemeProvider`, and `CssBaseline`.
 * 2. {@link AuthProvider} — Manages session hydration, sign-in/sign-up, logout, and global `401` handling.
 * 3. {@link AppRoutes} — Declares public (`/signin`, `/signup`) and session-guarded (`/users`) routes.
 */
export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AppThemeProvider>
    </ThemeProvider>
  );
}

export default App;
