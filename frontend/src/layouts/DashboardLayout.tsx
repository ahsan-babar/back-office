import { Logout as LogoutIcon } from '@mui/icons-material';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggleButton } from '../components/ThemeToggleButton'

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
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.firstName} {user.lastName}
            </Typography>
          )}
          <ThemeToggleButton />
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => void signOut()}
          >
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>
      {children}
    </Box>
  );
}
