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

/**
 * Props for {@link DeleteUserDialog}.
 */
interface DeleteUserDialogProps {
  /** User scheduled for deletion, or `null` when the confirmation dialog is closed. */
  targetUser: User | null;
  /** `true` while the `DELETE /api/users/:id` request is in flight, disabling action buttons. */
  deleting: boolean;
  /** Callback invoked when the operator cancels or dismisses the dialog. */
  onCancel: () => void;
  /** Async handler invoked when the operator confirms permanent user deletion. */
  onConfirm: () => Promise<void>;
}

/**
 * Confirmation modal prompting the operator before permanently deleting a user account
 * and revoking all of their active sessions.
 *
 * @param props - Target user details, loading state, and confirmation/cancel handlers.
 */
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
