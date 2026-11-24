import { Logout as LogoutIcon } from '@mui/icons-material';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { useAuth } from '../hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Back-Office Administration
          </Typography>
          {user && (
            <Typography variant="body1" sx={{ mr: 2, fontWeight: 500 }}>
              Hello {user.firstName}
            </Typography>
          )}
          <ThemeToggleButton />
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => void signOut()}
            sx={{ ml: 1 }}
          >
            Log Out
          </Button>
        </Toolbar>
      </AppBar>
      {children}
    </Box>
  );
}
