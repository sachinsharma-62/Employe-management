import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, Menu, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import GlobalSearch from './GlobalSearch';
import { roleLabel } from '../utils/constants';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/users': 'Employees',
  '/organization': 'Organization',
  '/attendance-hub': 'Attendance Hub',
  '/account/profile': 'My Profile',
  '/account/security': 'Account Security',
  '/account/change-password': 'Change Password',
  '/settings': 'Company Settings',
  '/search': 'Search',
  '/jobs': 'Jobs',
  '/candidates': 'Candidates',
};

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const title = location.pathname.startsWith('/employees/')
    ? 'Employee Profile'
    : location.pathname.startsWith('/jobs/')
      ? 'Job Details'
      : location.pathname.startsWith('/candidates/')
        ? 'Candidate Profile'
        : TITLES[location.pathname] || 'Office EMS';

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__menu d-lg-none"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <h1 className="topbar__title">{title}</h1>

      <GlobalSearch />

      <div className="topbar__actions">
        <div className="dropdown">
          <button
            className="topbar__user dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <Avatar user={user} size={34} />
            <span className="topbar__user-info d-none d-md-block">
              <strong>{user?.fullName}</strong>
              <small>{roleLabel(user?.role)}</small>
            </span>
          </button>

          <ul className="dropdown-menu dropdown-menu-end shadow-sm mt-2">
            <li className="dropdown-header px-3 py-2">
              <div className="fw-semibold text-truncate">{user?.fullName}</div>
              <small className="text-muted">{user?.email}</small>
            </li>
            <li>
              <Link className="dropdown-item d-flex align-items-center gap-2" to="/account/profile">
                <UserRound size={15} /> My Profile
              </Link>
            </li>
            <li>
              <Link
                className="dropdown-item d-flex align-items-center gap-2"
                to="/account/security"
              >
                <ShieldCheck size={15} /> Account Security
              </Link>
            </li>
            <li>
              <Link
                className="dropdown-item d-flex align-items-center gap-2"
                to="/account/change-password"
              >
                <KeyRound size={15} /> Change Password
              </Link>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button
                className="dropdown-item d-flex align-items-center gap-2 text-danger"
                onClick={handleLogout}
              >
                <LogOut size={15} /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
