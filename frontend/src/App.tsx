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
