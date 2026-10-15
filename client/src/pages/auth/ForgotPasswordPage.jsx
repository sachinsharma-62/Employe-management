import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react';
import authApi from '../../api/auth.api';
import { routePaths } from '../../utils/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSent(res.data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <div className="auth-card__header text-center">
          <div className="auth-icon-badge">
            <MailCheck size={24} />
          </div>
          <h2>Check your inbox</h2>
          <p>{sent.message}</p>
        </div>

        {sent.devResetUrl && (
          <div className="alert alert-info py-2">
            <strong className="d-block mb-1">Dev mode (SMTP not configured)</strong>
            <a href={sent.devResetUrl}>Open password reset link</a>
          </div>
        )}

        <Link to={routePaths.login} className="btn btn-outline-secondary w-100">
          <ArrowLeft size={16} className="me-1" /> Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="auth-card__header">
        <h2>Forgot password?</h2>
        <p>Enter your account email and we will send you a reset link.</p>
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="forgot-email" className="form-label">
            Email address
          </label>
          <input
            id="forgot-email"
            type="email"
            className="form-control"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Sending...
            </>
          ) : (
            <>
              Send reset link <ArrowRight size={16} className="ms-1" />
            </>
          )}
        </button>
      </form>

      <Link to={routePaths.login} className="auth-back-link">
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </>
  );
}
