import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail, Server, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PasswordInput from '../../components/PasswordInput';
import { routePaths } from '../../utils/constants';
import { getBaseUrl } from '../../api/client';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@office.com', password: 'Super@1234' },
  { label: 'HR Admin', email: 'hr@office.com', password: 'Hr@12345' },
  { label: 'Manager', email: 'manager@office.com', password: 'Manager@123' },
  { label: 'Employee', email: 'employee@office.com', password: 'Employee@123' },
];

const showDemo = String(import.meta.env.VITE_SHOW_DEMO_LOGIN ?? 'true') === 'true';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const next = new URLSearchParams(location.search).get('next') || routePaths.dashboard;

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(() => localStorage.getItem('ems_custom_api_url') || '');

  const handleSaveCustomUrl = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) {
      localStorage.removeItem('ems_custom_api_url');
      toast.info('Reset API URL to default.');
    } else {
      localStorage.setItem('ems_custom_api_url', customUrl.trim());
      toast.success('Backend API URL saved! Retrying...');
    }
    setFormError('');
    setShowServerConfig(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => ({ ...fe, [name]: '' }));
    setFormError('');
  };

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email';
    if (!form.password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(next, { replace: true });
    } catch (err) {
      if (err.status === 422 && err.errors) {
        const mapped = {};
        err.errors.forEach((item) => {
          mapped[item.field] = item.message;
        });
        setFieldErrors(mapped);
        setFormError('Please correct the highlighted fields.');
      } else {
        setFormError(err.message || 'Unable to log in');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    setFieldErrors({});
    setFormError('');
  };

  return (
    <>
      <div className="auth-card__header">
        <h2>Welcome back</h2>
        <p>Sign in to your account to continue</p>
      </div>

      {formError && (
        <div className="alert alert-danger py-2 d-flex flex-column gap-2" role="alert">
          <div className="d-flex align-items-start gap-2">
            <LockKeyhole size={16} className="mt-1 flex-shrink-0" />
            <span>{formError}</span>
          </div>
          {(formError.includes('Unable to reach server') || formError.includes('timed out')) && (
            <div className="mt-2 pt-2 border-top border-danger-subtle small">
              <p className="mb-1 text-dark fw-semibold">Troubleshooting:</p>
              <ul className="ps-3 mb-2 text-dark">
                <li>
                  <strong>Render Sleep (Free Tier):</strong> Render spins down when idle and takes ~30-50s to wake up.{' '}
                  <a
                    href={`${getBaseUrl().replace(/\/api\/?$/, '')}/health`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-decoration-underline"
                  >
                    Click to wake backend / check health
                  </a>.
                </li>
                <li>
                  <strong>MongoDB Atlas:</strong> Make sure IP <code>0.0.0.0/0</code> is added in Atlas Network Access.
                </li>
              </ul>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setShowServerConfig(!showServerConfig)}
              >
                <Server size={14} className="me-1" />
                {showServerConfig ? 'Hide Server Settings' : 'Configure Backend URL'}
              </button>
            </div>
          )}
        </div>
      )}

      {showServerConfig && (
        <div className="card p-3 mb-3 border bg-light shadow-sm">
          <h6 className="fw-bold mb-1 d-flex align-items-center gap-1">
            <Server size={16} /> Backend Server URL
          </h6>
          <p className="text-muted small mb-2">
            Current target: <code>{getBaseUrl()}</code>
          </p>
          <div className="input-group mb-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="https://your-backend.onrender.com"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleSaveCustomUrl}
            >
              Save & Apply
            </button>
          </div>
          <small className="text-muted">
            Tip: You can also set <code>VITE_API_URL</code> in Vercel Environment Variables.
          </small>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <div className="input-icon-group">
            <Mail size={16} className="input-icon-group__icon" />
            <input
              id="email"
              name="email"
              type="email"
              className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
          </div>
          {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <label htmlFor="password" className="form-label mb-0">
              Password
            </label>
            <Link to={routePaths.forgot} className="auth-link">
              Forgot password?
            </Link>
          </div>
          <div className="mt-1">
            <PasswordInput
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              invalid={Boolean(fieldErrors.password)}
              placeholder="Enter your password"
            />
          </div>
          {fieldErrors.password && (
            <div className="invalid-feedback d-block">{fieldErrors.password}</div>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-100 btn-lg mt-2" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight size={16} className="ms-1" />
            </>
          )}
        </button>
      </form>

      {showDemo && (
        <div className="demo-box">
          <p className="demo-box__title">Demo accounts (click to fill)</p>
          <div className="demo-box__list">
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.email} type="button" onClick={() => fillDemo(account)}>
                <span>{account.label}</span>
                <small>{account.email}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center mt-3 pt-2">
        <button
          type="button"
          onClick={() => setShowServerConfig((prev) => !prev)}
          className="btn btn-link btn-sm text-muted text-decoration-none p-0"
        >
          <Server size={12} className="me-1" />
          Server: <code>{getBaseUrl()}</code>
        </button>
      </div>
    </>
  );
}
