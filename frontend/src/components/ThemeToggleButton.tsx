import {
  DarkModeOutlined as DarkModeIcon,
  LightModeOutlined as LightModeIcon,
} from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useThemeMode } from '../hooks/useThemeMode';

/**
 * Props for {@link ThemeToggleButton}.
 */
interface ThemeToggleButtonProps {
  /** Material UI icon button color variant (defaults to `'inherit'`). */
  color?: 'inherit' | 'default' | 'primary';
}

/**
 * Accessible icon button with a descriptive tooltip that toggles the application's
 * persisted color scheme between light and dark modes via {@link useThemeMode}.
 *
 * @param props - Optional MUI `IconButton` color variant.
 */
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