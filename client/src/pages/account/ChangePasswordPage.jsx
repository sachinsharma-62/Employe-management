import { useState } from 'react';
import { KeyRound, Save } from 'lucide-react';
import authApi from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import PasswordInput from '../../components/PasswordInput';
import PasswordRules from '../../components/PasswordRules';

export default function ChangePasswordPage() {
  const toast = useToast();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const rulesPassed =
    form.newPassword.length >= 8 &&
    form.newPassword.length <= 64 &&
    /[a-z]/.test(form.newPassword) &&
    /[A-Z]/.test(form.newPassword) &&
    /\d/.test(form.newPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
    setDone(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.currentPassword) {
      setError('Enter your current password');
      return;
    }
    if (!rulesPassed) {
      setError('New password does not meet the requirements');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError('New password must be different from the current password');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword(
        form.currentPassword,
        form.newPassword,
        form.confirmPassword
      );
      toast.success(res.data.message || 'Password changed');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setDone(true);
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setError(err.errors[0]?.message || 'Please check the fields');
      } else {
        setError(err.message || 'Could not change password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack-lg">
      <div className="panel panel--narrow">
        <div className="panel__header">
          <h3>Change password</h3>
          <span className="panel__hint">
            Other devices are signed out after a password change
          </span>
        </div>

        <div className="auth-icon-badge auth-icon-badge--start mb-3">
          <KeyRound size={20} />
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}
        {done && (
          <div className="alert alert-success py-2" role="alert">
            Password updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label" htmlFor="currentPassword">
              Current password
            </label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="newPassword">
              New password
            </label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
            <PasswordRules password={form.newPassword} />
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
              <div className="invalid-feedback d-block">Passwords do not match</div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Updating...
              </>
            ) : (
              <>
                <Save size={16} className="me-1" /> Update password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
