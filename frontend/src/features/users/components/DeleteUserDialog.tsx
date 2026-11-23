import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { UI_MESSAGES } from '../../../config/constants';
import { User } from '../../../types/domain';

interface DeleteUserDialogProps {
  targetUser: User | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteUserDialog({
  targetUser,
  deleting,
  onCancel,
  onConfirm,
}: DeleteUserDialogProps) {
  return (
    <Dialog open={Boolean(targetUser)} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{UI_MESSAGES.DELETE_USER_CONFIRM_TITLE}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {UI_MESSAGES.DELETE_USER_CONFIRM_BODY}
          {targetUser && (
            <>
              {' '}
              <strong>
                ({targetUser.firstName} {targetUser.lastName} — {targetUser.email})
              </strong>
            </>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
