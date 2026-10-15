import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';

export default function PublicOnlyRoute() {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader label="Loading..." />;

  if (isAuthenticated) {
    const next = new URLSearchParams(location.search).get('next');
    return <Navigate to={next && next.startsWith('/') ? next : '/dashboard'} replace />;
  }

  return <Outlet />;
}
