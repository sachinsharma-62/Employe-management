import { useEffect, useState } from 'react';
import { PencilLine } from 'lucide-react';
import Modal from '../Modal';
import { useToast } from '../../context/ToastContext';
import attendanceApi from '../../api/attendance.api';
import { ATTENDANCE_MODES, ATTENDANCE_STATUSES } from '../../utils/constants';

export default function EditAttendanceModal({ open, record, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!record) {
      setForm(null);
      return;
    }
    setForm({
      status: record.status,
      workMode: record.workMode || 'OFFICE',
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      hoursWorked: record.hoursWorked ?? 0,
      note: record.note || '',
    });
    setError('');
    setSaving(false);
  }, [record]);

  if (!record) return null;

  const current = form || {
    status: 'PRESENT',
    workMode: 'OFFICE',
    checkIn: '',
    checkOut: '',
    hoursWorked: 0,
    note: '',
  };

  const employee = record.employee || {};
  const prettyDate = new Date(record.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleChange = (name, value) => {
    setForm((f) => ({ ...(f || current), [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await attendanceApi.update(record._id, {
        ...current,
        checkIn: current.checkIn || undefined,
        checkOut: current.checkOut || undefined,
      });
      toast.success('Attendance updated');
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not update attendance');
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit attendance"
      subtitle={`${employee.firstName || ''} ${employee.lastName || ''} · ${prettyDate}`}
      icon={PencilLine}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="edit-attendance-form" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      }
    >
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <form id="edit-attendance-form" onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-6">
            <label className="form-label" htmlFor="edit-status">
              Status
            </label>
            <select
              id="edit-status"
              className="form-select"
              value={current.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {ATTENDANCE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label" htmlFor="edit-mode">
              Work mode
            </label>
            <select
              id="edit-mode"
              className="form-select"
              value={current.workMode}
              onChange={(e) => handleChange('workMode', e.target.value)}
            >
              {ATTENDANCE_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label" htmlFor="edit-in">
              Check in
            </label>
            <input
              id="edit-in"
              type="time"
              className="form-control"
              value={current.checkIn}
              onChange={(e) => handleChange('checkIn', e.target.value)}
            />
          </div>
          <div className="col-6">
            <label className="form-label" htmlFor="edit-out">
              Check out
            </label>
            <input
              id="edit-out"
              type="time"
              className="form-control"
              value={current.checkOut}
              onChange={(e) => handleChange('checkOut', e.target.value)}
            />
          </div>
          <div className="col-6">
            <label className="form-label" htmlFor="edit-hours">
              Hours worked
            </label>
            <input
              id="edit-hours"
              type="number"
              className="form-control"
              min="0"
              max="24"
              step="0.25"
              value={current.hoursWorked}
              onChange={(e) => handleChange('hoursWorked', Number(e.target.value))}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="form-label" htmlFor="edit-note">
            Note
          </label>
          <textarea
            id="edit-note"
            rows={2}
            className="form-control"
            maxLength={300}
            value={current.note}
            onChange={(e) => handleChange('note', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}