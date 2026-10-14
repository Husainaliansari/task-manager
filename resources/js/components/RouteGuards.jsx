import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

/** Pages for logged-in users only. Add `adminOnly` for admin pages. */
export function ProtectedRoute({ adminOnly = false, children }) {
  const { user, isReady, isAdmin } = useAuth();
  const location = useLocation();

  if (!isReady) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
}

/** Login and sign-up: people who are already logged in go straight to their tasks. */
export function GuestRoute({ children }) {
  const { user, isReady } = useAuth();

  if (!isReady) return <FullPageLoader />;
  if (user) return <Navigate to="/" replace />;

  return children;
}

function FullPageLoader() {
  return (
    <div className="page-loader">
      <Spinner label="Getting things ready…" />
    </div>
  );
}
