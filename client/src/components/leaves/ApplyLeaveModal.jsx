import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Paperclip, X } from 'lucide-react';
import Modal from '../Modal';
import { formatFileSize, todayISODate } from '../../utils/constants';

const dayDiff = (from, to) => {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.round((end - start) / 86400000) + 1;
};

export default function ApplyLeaveModal({ open, onClose, onSubmit, types = [], balances = [] }) {
  const today = todayISODate();
  const [form, setForm] = useState({ type: '', fromDate: today, toDate: today, reason: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ type: types[0]?.code || '', fromDate: today, toDate: today, reason: '' });
      setFile(null);
      setError('');
      setSaving(false);
    }
  }, [open, types, today]);

  const selectedBalance = useMemo(
    () => balances.find((balance) => balance.type === form.type) || null,
    [balances, form.type]
  );
  const days = dayDiff(form.fromDate, form.toDate);

  const update = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.type) {
      setError('Please choose a leave type.');
      return;
    }
    if (!form.fromDate || !form.toDate) {
      setError('Please choose both start and end dates.');
      return;
    }
    if (form.toDate < form.fromDate) {
      setError('End date cannot be earlier than the start date.');
      return;
    }
    if (
      selectedBalance &&
      !selectedBalance.unlimited &&
      days > selectedBalance.available
    ) {
      setError(
        `Insufficient balance. You have ${selectedBalance.available} day(s) available but requested ${days}.`
      );
      return;
    }

    const payload = new FormData();
    payload.append('type', form.type);
    payload.append('fromDate', form.fromDate);
    payload.append('toDate', form.toDate);
    if (form.reason.trim()) payload.append('reason', form.reason.trim());
    if (file) payload.append('attachment', file);

    setSaving(true);
    const ok = await onSubmit(payload);
    setSaving(false);
    if (ok !== false) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Apply for leave"
      subtitle="Submit a leave request for approval"
      icon={CalendarPlus}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="leave-apply-form" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : 'Submit request'}
          </button>
        </div>
      }
    >
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <form id="leave-apply-form" onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="leave-type">
            Leave type <span className="text-danger">*</span>
          </label>
          <select
            id="leave-type"
            className="form-select"
            value={form.type}
            onChange={(event) => update('type', event.target.value)}
          >
            {types.length === 0 && <option value="">No leave types available</option>}
            {types.map((type) => (
              <option key={type.code} value={type.code}>
                {type.name}
                {type.totalDays > 0 ? ` (${type.totalDays} days/year)` : ' (no limit)'}
              </option>
            ))}
          </select>
          {selectedBalance && (
            <small className="leave-hint">
              {selectedBalance.unlimited
                ? 'No yearly limit for this leave type.'
                : `${selectedBalance.available} day(s) available of ${selectedBalance.entitlement}.`}
            </small>
          )}
        </div>

        <div className="row g-3">
          <div className="col-6">
            <label className="form-label" htmlFor="leave-from">
              Start date <span className="text-danger">*</span>
            </label>
            <input
              id="leave-from"
              type="date"
              className="form-control"
              value={form.fromDate}
              onChange={(event) => update('fromDate', event.target.value)}
            />
          </div>
          <div className="col-6">
            <label className="form-label" htmlFor="leave-to">
              End date <span className="text-danger">*</span>
            </label>
            <input
              id="leave-to"
              type="date"
              className="form-control"
              min={form.fromDate}
              value={form.toDate}
              onChange={(event) => update('toDate', event.target.value)}
            />
          </div>
        </div>

        {days > 0 && (
          <div className="leave-days-preview mt-3">
            <span>
              Duration: <strong>{days}</strong> day(s)
            </span>
          </div>
        )}

        <div className="mt-3">
          <label className="form-label" htmlFor="leave-reason">
            Reason
          </label>
          <textarea
            id="leave-reason"
            rows={3}
            maxLength={500}
            className="form-control"
            placeholder="Add a short reason for your leave"
            value={form.reason}
            onChange={(event) => update('reason', event.target.value)}
          />
        </div>

        <div className="mt-3">
          <label className="form-label" htmlFor="leave-file">
            Attachment
          </label>
          {file ? (
            <div className="leave-file-chip">
              <Paperclip size={14} />
              <span>
                {file.name} <small>({formatFileSize(file.size)})</small>
              </span>
              <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment">
                <X size={14} />
              </button>
            </div>
          ) : (
            <input
              id="leave-file"
              type="file"
              className="form-control"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          )}
          <small className="leave-hint d-block">Optional. PDF, DOC, TXT or image up to 5 MB.</small>
        </div>
      </form>
    </Modal>
  );
}
