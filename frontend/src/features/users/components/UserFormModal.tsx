import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { PASSWORD_MIN_LENGTH, UI_MESSAGES } from '../../../config/constants';
import {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserStatus,
} from '../../../types/domain';

interface UserFormModalProps {
  open: boolean;
  editingUser: User | null;
  onClose: () => void;
  onCreate: (payload: CreateUserPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateUserPayload) => Promise<void>;
}

export function UserFormModal({
  open,
  editingUser,
  onClose,
  onCreate,
  onUpdate,
}: UserFormModalProps) {
  const isEditMode = Boolean(editingUser);
  const isNameLocked = Boolean(editingUser && editingUser.status === 'inactive');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingUser) {
      setFirstName(editingUser.firstName);
      setLastName(editingUser.lastName);
      setEmail(editingUser.email);
      setStatus(editingUser.status);
      setPassword('');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setStatus('active');
    }
  }, [open, editingUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: UpdateUserPayload = { email, status };
        if (!isNameLocked) {
          payload.firstName = firstName;
          payload.lastName = lastName;
        }
        await onUpdate(editingUser.id, payload);
      } else {
        await onCreate({ firstName, lastName, email, password, status });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : UI_MESSAGES.GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditMode ? 'Edit User' : 'Create User'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {isNameLocked && (
              <Alert severity="info">{UI_MESSAGES.INACTIVE_NAME_LOCK_HINT}</Alert>
            )}

            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isNameLocked}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isNameLocked}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />

            {!isEditMode && (
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText={`Minimum ${PASSWORD_MIN_LENGTH} characters`}
                required
                fullWidth
              />
            )}

            <FormControl fullWidth>
              <InputLabel id="user-status-label">Status</InputLabel>
              <Select
                labelId="user-status-label"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
