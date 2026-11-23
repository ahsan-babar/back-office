import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
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
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
