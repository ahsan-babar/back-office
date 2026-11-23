import { Navigate, Route, Routes } from 'react-router-dom';
import { APP_ROUTES } from '../config/constants';
import { SignInPage } from '../features/auth/SignInPage';
import { SignUpPage } from '../features/auth/SignUpPage';
import { UsersDashboardPage } from '../features/users/UsersDashboardPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={APP_ROUTES.SIGN_IN} element={<SignInPage />} />
      <Route path={APP_ROUTES.SIGN_UP} element={<SignUpPage />} />
      <Route
        path={APP_ROUTES.USERS}
        element={
          <ProtectedRoute>
            <UsersDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={APP_ROUTES.USERS} replace />} />
    </Routes>
  );
}