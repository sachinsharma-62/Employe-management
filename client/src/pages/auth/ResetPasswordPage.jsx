import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import authApi from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import PasswordInput from '../../components/PasswordInput';
import PasswordRules from '../../components/PasswordRules';
import { routePaths } from '../../utils/constants';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rulesPassed = /^.{8,64}$/.test(form.newPassword) && /[a-z]/.test(form.newPassword)
    && /[A-Z]/.test(form.newPassword) && /\d/.test(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rulesPassed) {
      setError('Please meet all password requirements');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(
        token,
        form.newPassword,
        form.confirmPassword
      );
      toast.success(res.data.message || 'Password reset successful');
      navigate(routePaths.login, { replace: true });
    } catch (err) {
      setError(err.message || 'Reset failed. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card__header">
        <div className="auth-icon-badge">
          <KeyRound size={22} />
        </div>
        <h2>Set a new password</h2>
        <p>Choose a strong password you have not used before.</p>
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="new-password" className="form-label">
            New password
          </label>
          <PasswordInput
            id="new-password"
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
          <PasswordRules password={form.newPassword} />
        </div>

        <div className="mb-3">
          <label htmlFor="confirm-password" className="form-label">
            Confirm password
          </label>
          <PasswordInput
            id="confirm-password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />
          {form.confirmPassword && form.confirmPassword !== form.newPassword && (
            <div className="invalid-feedback d-block">Passwords do not match</div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 btn-lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Updating...
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      <Link to={routePaths.login} className="auth-back-link">
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </>
  );
}
