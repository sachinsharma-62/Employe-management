import { useCallback, useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import attendanceApi from '../../api/attendance.api';
import { useToast } from '../../context/ToastContext';
import { SectionLoading } from '../employees/profile/ui';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SettingsPanel() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.settings();
      const s = res.data.settings || {};
      setForm({
        officeStart: s.officeStart || '09:30',
        officeEnd: s.officeEnd || '18:30',
        graceMinutes: s.graceMinutes ?? 15,
        requiredWorkHours: s.requiredWorkHours ?? 8,
        breakMinutes: s.breakMinutes ?? 60,
        breakThresholdHours: s.breakThresholdHours ?? 6,
        weekendDays: Array.isArray(s.weekendDays) ? s.weekendDays : [0, 6],
      });
    } catch (err) {
      toast.error(err.message || 'Could not load attendance rules');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const change = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const toggleWeekend = (day) =>
    setForm((f) => ({
      ...f,
      weekendDays: f.weekendDays.includes(day)
        ? f.weekendDays.filter((d) => d !== day)
        : [...f.weekendDays, day].sort((a, b) => a - b),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await attendanceApi.updateSettings(form);
      const s = res.data.settings || {};
      toast.success('Attendance rules updated');
      setForm((f) => ({ ...f, ...s }));
    } catch (err) {
      toast.error(err.message || 'Could not save attendance rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <SectionLoading label="Loading attendance rules..." />;

  return (
    <form className="stack-md" onSubmit={handleSubmit}>
      <div className="panel">
        <div className="panel__header">
          <h3>
            <SettingsIcon size={17} className="me-2" /> Office attendance rules
          </h3>
          <span className="panel__hint">Applies to every employee</span>
        </div>

        <div className="row g-3">
          <div className="col-6 col-md-3">
            <label className="form-label" htmlFor="officeStart">
              Office start time
            </label>
            <input
              id="officeStart"
              type="time"
              className="form-control"
              value={form.officeStart}
              onChange={(e) => change('officeStart', e.target.value)}
              required
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label" htmlFor="officeEnd">
              Office end time
            </label>
            <input
              id="officeEnd"
              type="time"
              className="form-control"
              value={form.officeEnd}
              onChange={(e) => change('officeEnd', e.target.value)}
              required
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label" htmlFor="graceMinutes">
              Grace period (minutes)
            </label>
            <input
              id="graceMinutes"
              type="number"
              min="0"
              max="180"
              className="form-control"
              value={form.graceMinutes}
              onChange={(e) => change('graceMinutes', Number(e.target.value))}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label" htmlFor="requiredWorkHours">
              Required working hours
            </label>
            <input
              id="requiredWorkHours"
              type="number"
              min="1"
              max="24"
              step="0.5"
              className="form-control"
              value={form.requiredWorkHours}
              onChange={(e) => change('requiredWorkHours', Number(e.target.value))}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label" htmlFor="breakMinutes">
              Break duration (minutes)
            </label>
            <input
              id="breakMinutes"
              type="number"
              min="0"
              max="240"
              className="form-control"
              value={form.breakMinutes}
              onChange={(e) => change('breakMinutes', Number(e.target.value))}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label" htmlFor="breakThresholdHours">
              Break applies after (hours)
            </label>
            <input
              id="breakThresholdHours"
              type="number"
              min="1"
              max="12"
              step="0.5"
              className="form-control"
              value={form.breakThresholdHours}
              onChange={(e) => change('breakThresholdHours', Number(e.target.value))}
            />
          </div>
          <div className="col-12">
            <label className="form-label d-block">Weekend days</label>
            <div className="d-flex flex-wrap gap-2">
              {WEEKDAYS.map((label, day) => (
                <button
                  key={label}
                  type="button"
                  className={`btn btn-sm ${
                    form.weekendDays.includes(day) ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  onClick={() => toggleWeekend(day)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            ) : (
              <Save size={15} className="me-1" />
            )}
            Save rules
          </button>
        </div>
      </div>

      <p className="text-muted small mb-0">
        Late arrival is calculated after the grace period. Short hours are the difference between
        the required and actual worked hours once the break is excluded.
      </p>
    </form>
  );
}
