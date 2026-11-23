import {
  Add as AddIcon,
  DeleteOutlined as DeleteOutlineIcon,
  EditOutlined as EditOutlinedIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { PAGINATION_CONFIG, UI_MESSAGES } from '../../config/constants';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { apiClient } from '../../services/apiClient';
import {
  CreateUserPayload,
  PaginatedUsersResponse,
  UpdateUserPayload,
  User,
} from '../../types/domain';
import { DeleteUserDialog } from './components/DeleteUserDialog';
import { UserFormModal } from './components/UserFormModal';

export function UsersDashboardPage() {
  const [page, setPage] = useState<number>(PAGINATION_CONFIG.DEFAULT_PAGE);
  const [data, setData] = useState<PaginatedUsersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getUsers(targetPage, PAGINATION_CONFIG.PAGE_SIZE);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : UI_MESSAGES.GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(page);
  }, [page, loadUsers]);

  const handleCreate = async (payload: CreateUserPayload) => {
    await apiClient.createUser(payload);
    if (page !== 1) {
      setPage(1);
    } else {
      await loadUsers(1);
    }
  };

  const handleUpdate = async (id: string, payload: UpdateUserPayload) => {
    await apiClient.updateUser(id, payload);
    await loadUsers(page);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      const remainingOnPage = (data?.items.length ?? 1) - 1;
      if (remainingOnPage <= 0 && page > 1) {
        setPage(page - 1);
      } else {
        await loadUsers(page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : UI_MESSAGES.GENERIC_ERROR);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
        >
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Users
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Showing up to {PAGINATION_CONFIG.PAGE_SIZE} users per page
              {data ? ` (${data.total} total)` : ''}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingUser(null);
              setFormOpen(true);
            }}
          >
            New User
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Logins</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : !data || data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No users found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {item.firstName} {item.lastName}
                    </TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">{item.loginsCounter}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit user">
                        <IconButton
                          aria-label={`Edit ${item.firstName} ${item.lastName}`}
                          size="small"
                          onClick={() => {
                            setEditingUser(item);
                            setFormOpen(true);
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete user">
                        <IconButton
                          aria-label={`Delete ${item.firstName} ${item.lastName}`}
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {data && data.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={data.totalPages}
              page={page}
              onChange={(_e, nextPage) => setPage(nextPage)}
              color="primary"
            />
          </Box>
        )}
      </Container>

      <UserFormModal
        open={formOpen}
        editingUser={editingUser}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <DeleteUserDialog
        targetUser={deleteTarget}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
}
