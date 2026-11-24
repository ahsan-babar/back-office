import { Box, CircularProgress } from '@mui/material';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from '../config/constants';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress aria-label="Loading session" />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to={APP_ROUTES.SIGN_UP} replace />;
  }

  return <>{children}</>;
}
