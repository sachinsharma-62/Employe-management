import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import leaveApi from '../../api/leave.api';
import { useToast } from '../../context/ToastContext';
import LeaveTypeModal from '../leaves/LeaveTypeModal';
import { SectionLoading } from '../employees/profile/ui';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function LeaveSettingsPanel({ leave, busy, onSave, canManage }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [types, setTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, initial: null });
  const [typeSaving, setTypeSaving] = useState(false);
  const [deleting, setDeleting] = useState('');

  useEffect(() => {
    if (leave) {
      setForm({
        advanceNoticeDays: leave.advanceNoticeDays ?? 2,
        maxConsecutiveDays: leave.maxConsecutiveDays ?? 30,
        renewalMonth: leave.renewalMonth ?? 0,
        allowHalfDayRequests: Boolean(leave.allowHalfDayRequests),
        allowLeaveOnWeekends: Boolean(leave.allowLeaveOnWeekends),
      });
    }
  }, [leave]);

  const loadTypes = useCallback(async () => {
    setTypesLoading(true);
    try {
      const res = await leaveApi.types(true);
      setTypes(res.data.types || []);
    } catch (err) {
      toast.error(err.message || 'Could not load leave types');
    } finally {
      setTypesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  if (!form) return <SectionLoading label="Loading leave policy..." />;

  const change = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      advanceNoticeDays: Number(form.advanceNoticeDays) || 0,
      maxConsecutiveDays: Number(form.maxConsecutiveDays) || 1,
      renewalMonth: Number(form.renewalMonth) || 0,
      allowHalfDayRequests: form.allowHalfDayRequests,
      allowLeaveOnWeekends: form.allowLeaveOnWeekends,
    });
  };

  const handleTypeSave = async (payload, id) => {
    setTypeSaving(true);
    try {
      if (id) {
        await leaveApi.updateType(id, payload);
        toast.success('Leave type updated');
      } else {
        await leaveApi.createType(payload);
        toast.success('Leave type created');
      }
      setModal({ open: false, initial: null });
      await loadTypes();
    } catch (err) {
      toast.error(err.message || 'Could not save leave type');
    } finally {
      setTypeSaving(false);
    }
  };

  const handleTypeDelete = async (type) => {
    if (!window.confirm(`Delete the "${type.name}" leave type?`)) return;
    setDeleting(type._id);
    try {
      await leaveApi.removeType(type._id);
      toast.success('Leave type deleted');
      await loadTypes();
    } catch (err) {
      toast.error(err.message || 'Could not delete leave type');
    } finally {
      setDeleting('');
    }
  };

  return (
    <div className="stack-md">
      <form className="panel" onSubmit={handleSubmit} noValidate>
        <div className="panel__header">
          <h3>
            <CalendarDays size={17} className="me-2" /> Leave policy
          </h3>
          <span className="panel__hint">Global rules every employee follows</span>
        </div>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label" htmlFor="l-advance">
              Advance notice (days)
            </label>
            <input
              id="l-advance"
              type="number"
              min="0"
              max="60"
              className="form-control"
              value={form.advanceNoticeDays}
              onChange={(e) => change('advanceNoticeDays', Number(e.target.value))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="l-max">
              Max consecutive days
            </label>
            <input
              id="l-max"
              type="number"
              min="1"
              max="366"
              className="form-control"
              value={form.maxConsecutiveDays}
              onChange={(e) => change('maxConsecutiveDays', Number(e.target.value))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="l-renewal">
              Balance renewal month
            </label>
            <select
              id="l-renewal"
              className="form-select"
              value={form.renewalMonth}
              onChange={(e) => change('renewalMonth', Number(e.target.value))}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={form.allowHalfDayRequests}
                onChange={(e) => change('allowHalfDayRequests', e.target.checked)}
              />
              <span className="form-check-label">Allow half-day leave requests</span>
            </label>
          </div>
          <div className="col-md-6">
            <label className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={form.allowLeaveOnWeekends}
                onChange={(e) => change('allowLeaveOnWeekends', e.target.checked)}
              />
              <span className="form-check-label">Allow leave on weekends</span>
            </label>
          </div>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary" disabled={busy === 'leave'}>
            {busy === 'leave' ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            ) : (
              <Save size={15} className="me-1" />
            )}
            Save policy
          </button>
        </div>
      </form>

      <div className="panel">
        <div className="panel__header">
          <h3>Leave types</h3>
          {canManage && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setModal({ open: true, initial: null })}
            >
              <Plus size={15} className="me-1" /> Add leave type
            </button>
          )}
        </div>
        {typesLoading ? (
          <SectionLoading label="Loading leave types..." />
        ) : types.length ? (
          <div className="table-responsive">
            <table className="table app-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Yearly days</th>
                  <th>Carry forward</th>
                  <th>Encashment</th>
                  <th>Applies to</th>
                  <th>Status</th>
                  {canManage && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {types.map((type) => (
                  <tr key={type._id}>
                    <td>
                      <strong>{type.name}</strong>
                      <small className="text-muted d-block">{type.code}</small>
                    </td>
                    <td>{type.totalDays || 'Unlimited'}</td>
                    <td>{type.carryForward ? `${type.carryForwardLimit || 'All'} days` : 'No'}</td>
                    <td>{type.encashable ? 'Yes' : 'No'}</td>
                    <td>{type.applicableScope === 'ALL' ? 'All employees' : type.applicableScope}</td>
                    <td>
                      <span className={`status-dot ${type.isActive ? 'status-dot--on' : 'status-dot--off'}`}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="text-end">
                        <div className="event-actions d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setModal({ open: true, initial: type })}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={deleting === type._id}
                            onClick={() => handleTypeDelete(type)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted small mb-0">No leave types have been configured yet.</p>
        )}
      </div>

      <LeaveTypeModal
        open={modal.open}
        initial={modal.initial}
        saving={typeSaving}
        onClose={() => setModal({ open: false, initial: null })}
        onSubmit={handleTypeSave}
      />
    </div>
  );
}