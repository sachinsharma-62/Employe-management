import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import Modal from '../../Modal';
import { ATTENDANCE_STATUSES, todayISODate } from '../../../utils/constants';

const REQUESTABLE = ['PRESENT', 'WFH', 'HALF_DAY', 'LATE', 'LEAVE'];

const PRESET_STATUS = {
  'Work From Home': 'WFH',
  'On Duty': 'PRESENT',
  Leave: 'LEAVE',
};

export default function RequestModal({ open, onClose, onSubmit, presetType }) {
  const today = todayISODate();
  const [form, setForm] = useState({
    date: today,
    requestedStatus: 'PRESENT',
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (presetType && typeof presetType === 'object') {
        setForm({
          date: presetType.date || today,
          requestedStatus:
            presetType.requestedStatus ||
            (['ABSENT', 'NOT_CLOCKED_IN'].includes(presetType.status) ? 'PRESENT' : presetType.status || 'PRESENT'),
          requestedCheckIn: presetType.requestedCheckIn || presetType.checkInStr || '',
          requestedCheckOut: presetType.requestedCheckOut || presetType.checkOutStr || '',
          reason: presetType.reason || '',
        });
      } else {
        setForm({
          date: today,
          requestedStatus: PRESET_STATUS[presetType] || 'PRESENT',
          requestedCheckIn: '',
          requestedCheckOut: '',
          reason: '',
        });
      }
      setError('');
      setSaving(false);
    }
  }, [open, presetType, today]);

  const update = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.date) {
      setError('Please choose a date.');
      return;
    }
    if (form.date > today) {
      setError('You cannot raise a request for a future date.');
      return;
    }
    if (form.reason.trim().length < 5) {
      setError('Please add a reason (at least 5 characters).');
      return;
    }
    if (
      form.requestedCheckIn &&
      form.requestedCheckOut &&
      form.requestedCheckOut <= form.requestedCheckIn
    ) {
      setError('Check-out time must be after check-in time.');
      return;
    }

    setSaving(true);
    const ok = await onSubmit({
      date: form.date,
      requestedStatus: form.requestedStatus,
      requestedCheckIn: form.requestedCheckIn || undefined,
      requestedCheckOut: form.requestedCheckOut || undefined,
      reason: form.reason.trim(),
    });
    setSaving(false);
    if (ok !== false) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attendance regularization"
      subtitle="Raise a correction request — HR will review and update your attendance"
      icon={ClipboardList}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="hub-request-form" className="btn btn-primary" disabled={saving}>
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
      <form id="hub-request-form" onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="hub-req-date">
            Date <span className="text-danger">*</span>
          </label>
          <input
            id="hub-req-date"
            type="date"
            className="form-control"
            max={today}
            value={form.date}
            onChange={(event) => update('date', event.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="hub-req-status">
            Correct status to <span className="text-danger">*</span>
          </label>
          <select
            id="hub-req-status"
            className="form-select"
            value={form.requestedStatus}
            onChange={(event) => update('requestedStatus', event.target.value)}
          >
            {REQUESTABLE.map((value) => (
              <option key={value} value={value}>
                {ATTENDANCE_STATUSES.find((s) => s.value === value)?.label || value}
              </option>
            ))}
          </select>
        </div>

        <div className="row g-3">
          <div className="col-6">
            <label className="form-label" htmlFor="hub-req-in">
              Correct check-in
            </label>
            <input
              id="hub-req-in"
              type="time"
              className="form-control"
              value={form.requestedCheckIn}
              onChange={(event) => update('requestedCheckIn', event.target.value)}
            />
          </div>
          <div className="col-6">
            <label className="form-label" htmlFor="hub-req-out">
              Correct check-out
            </label>
            <input
              id="hub-req-out"
              type="time"
              className="form-control"
              value={form.requestedCheckOut}
              onChange={(event) => update('requestedCheckOut', event.target.value)}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="form-label" htmlFor="hub-req-reason">
            Reason <span className="text-danger">*</span>
          </label>
          <textarea
            id="hub-req-reason"
            rows={3}
            maxLength={500}
            className="form-control"
            placeholder="e.g. I was present but forgot to check in"
            value={form.reason}
            onChange={(event) => update('reason', event.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
