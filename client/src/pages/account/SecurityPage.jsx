import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  CalendarClock,
  KeyRound,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
} from 'lucide-react';
import authApi from '../../api/auth.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageLoader from '../../components/PageLoader';
import { formatDateTime, roleLabel } from '../../utils/constants';

export default function SecurityPage() {
  const { user, logoutAll } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [security, setSecurity] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    authApi
      .securityInfo()
      .then((res) => {
        if (active) setSecurity(res.data.security);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load security info');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      await logoutAll();
      toast.success('Signed out from all devices');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not sign out');
      setSigningOut(false);
    }
  };

  if (loading) return <PageLoader label="Loading security settings..." />;

  return (
    <div className="stack-lg">
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="panel">
        <div className="panel__header">
          <h3>Account security</h3>
          <span className="panel__hint">
            <ShieldCheck size={14} className="me-1" />
            Protected with JWT
          </span>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6 col-xl-4">
            <div className="security-card">
              <span className="security-card__icon security-card__icon--indigo">
                <Activity size={18} />
              </span>
              <div>
                <small>Last login</small>
                <strong>{formatDateTime(security?.lastLoginAt)}</strong>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <div className="security-card">
              <span className="security-card__icon security-card__icon--green">
                <KeyRound size={18} />
              </span>
              <div>
                <small>Password changed</small>
                <strong>{formatDateTime(security?.passwordChangedAt)}</strong>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <div className="security-card">
              <span className="security-card__icon security-card__icon--cyan">
                <MonitorSmartphone size={18} />
              </span>
              <div>
                <small>Active sessions</small>
                <strong>{security?.activeSessions ?? '—'}</strong>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <div className="security-card">
              <span className="security-card__icon security-card__icon--amber">
                <CalendarClock size={18} />
              </span>
              <div>
                <small>Account created</small>
                <strong>{formatDateTime(security?.accountCreated)}</strong>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <div className="security-card">
              <span className="security-card__icon security-card__icon--purple">
                <ShieldCheck size={18} />
              </span>
              <div>
                <small>Your role</small>
                <strong>{roleLabel(security?.role)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Security actions</h3>
        </div>
        <div className="d-flex flex-column flex-md-row gap-3">
          <Link to="/account/change-password" className="btn btn-outline-primary">
            <KeyRound size={16} className="me-1" /> Change password
          </Link>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleSignOutAll}
            disabled={signingOut}
          >
            {signingOut ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut size={16} className="me-1" /> Sign out from all devices
              </>
            )}
          </button>
        </div>
        <p className="text-muted small mt-3 mb-0">
          Signed in as <strong>{user?.email}</strong>. Access tokens expire after 15 minutes and
          are renewed automatically while you are active.
        </p>
      </div>
    </div>
  );
}
