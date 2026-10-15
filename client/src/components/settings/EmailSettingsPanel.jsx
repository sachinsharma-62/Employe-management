import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, Save, Send } from 'lucide-react';
import { SectionLoading } from '../employees/profile/ui';

export default function EmailSettingsPanel({ email, busy, onSave, onTest }) {
  const [form, setForm] = useState(null);
  const [testState, setTestState] = useState({ busy: false, ok: false, message: '', error: '' });

  useEffect(() => {
    if (email) {
      setForm({
        enabled: Boolean(email.enabled),
        host: email.host || '',
        port: email.port ?? 587,
        secure: Boolean(email.secure),
        user: email.user || '',
        pass: '',
        from: email.from || '',
      });
      setTestState({ busy: false, ok: false, message: '', error: '' });
    }
  }, [email]);

  if (!form) return <SectionLoading label="Loading email settings..." />;

  const change = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setTestState((s) => ({ ...s, ok: false, message: '', error: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, pass: form.pass || undefined });
  };

  const handleTest = async () => {
    if (!form.host.trim() || !form.user.trim() || !form.pass.trim()) {
      setTestState({ busy: false, ok: false, message: '', error: 'Enter host, user and password to test.' });
      return;
    }
    setTestState((s) => ({ ...s, busy: true, message: '', error: '' }));
    const result = await onTest({ ...form, pass: form.pass || undefined });
    setTestState({
      busy: false,
      ok: result.ok,
      message: result.ok ? result.message : '',
      error: result.ok ? '' : result.message,
    });
  };

  return (
    <form className="panel" onSubmit={handleSubmit} noValidate>
      <div className="panel__header">
        <h3>
          <Mail size={17} className="me-2" /> Email (SMTP) settings
        </h3>
        <span className="panel__hint">Used for all outgoing employee notifications</span>
      </div>

      <div className="row g-3">
        <div className="col-12">
          <label className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              checked={form.enabled}
              onChange={(e) => change('enabled', e.target.checked)}
            />
            <span className="form-check-label">Send email notifications</span>
          </label>
        </div>
        <div className="col-md-8">
          <label className="form-label" htmlFor="e-host">
            SMTP host
          </label>
          <input
            id="e-host"
            className="form-control"
            placeholder="smtp.example.com"
            value={form.host}
            onChange={(e) => change('host', e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label" htmlFor="e-port">
            Port
          </label>
          <input
            id="e-port"
            type="number"
            min="1"
            max="65535"
            className="form-control"
            value={form.port}
            onChange={(e) => change('port', Number(e.target.value))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="e-user">
            Username / sender address
          </label>
          <input
            id="e-user"
            type="email"
            className="form-control"
            value={form.user}
            onChange={(e) => change('user', e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="e-pass">
            Password / app password
          </label>
          <input
            id="e-pass"
            type="password"
            className="form-control"
            placeholder="Unchanged if left blank"
            value={form.pass}
            onChange={(e) => change('pass', e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="e-secure">
            Connection
          </label>
          <div>
            <label className="form-check form-switch">
              <input
                id="e-secure"
                type="checkbox"
                className="form-check-input"
                checked={form.secure}
                onChange={(e) => change('secure', e.target.checked)}
              />
              <span className="form-check-label">Use SSL / TLS</span>
            </label>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="e-from">
            Default from address
          </label>
          <input
            id="e-from"
            type="email"
            className="form-control"
            placeholder="noreply@yourcompany.com"
            value={form.from}
            onChange={(e) => change('from', e.target.value)}
          />
        </div>
      </div>

      {testState.message && (
        <div className="alert alert-success py-2 mb-0 mt-3" role="alert">
          <CheckCircle2 size={15} className="me-1" /> {testState.message}
        </div>
      )}
      {testState.error && (
        <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">
          {testState.error}
        </div>
      )}

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={testState.busy || busy === 'email'}
          onClick={handleTest}
        >
          {testState.busy ? (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          ) : (
            <Send size={15} className="me-1" />
          )}
          Test connection
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy === 'email' || testState.busy}>
          {busy === 'email' ? (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          ) : (
            <Save size={15} className="me-1" />
          )}
          Save email settings
        </button>
      </div>
    </form>
  );
}