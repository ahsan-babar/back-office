import {
  DarkModeOutlined as DarkModeIcon,
  LightModeOutlined as LightModeIcon,
} from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useThemeMode } from '../hooks/useThemeMode';

interface ThemeToggleButtonProps {
  color?: 'inherit' | 'default' | 'primary';
}

export function ThemeToggleButton({ color = 'inherit' }: ThemeToggleButtonProps) {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
      <IconButton
        color={color}
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}  