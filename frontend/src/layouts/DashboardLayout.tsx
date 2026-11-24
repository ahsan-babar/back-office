import { Logout as LogoutIcon } from '@mui/icons-material';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { ReactNode,  } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { APP_ROUTES } from '../config/constants'

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogOut = async () => {
    await signOut();
    navigate(APP_ROUTES.SIGN_IN);
  };


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
            onClick={() => void handleLogOut()}
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
