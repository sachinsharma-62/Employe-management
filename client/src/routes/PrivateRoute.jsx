import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';

export default function PrivateRoute() {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader label="Checking your session..." />;

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
