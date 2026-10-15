import { useEffect, useState } from 'react';
import { PartyPopper, Save } from 'lucide-react';
import { SectionLoading } from '../employees/profile/ui';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HolidaySettingsPanel({ holiday, busy, onSave }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (holiday) {
      setForm({
        weekendDays: Array.isArray(holiday.weekendDays) ? holiday.weekendDays : [0, 6],
        optionalHolidayLimit: holiday.optionalHolidayLimit ?? 0,
        showOptionalOnCalendar: Boolean(holiday.showOptionalOnCalendar),
      });
    }
  }, [holiday]);

  if (!form) return <SectionLoading label="Loading holiday settings..." />;

  const toggleWeekend = (day) =>
    setForm((f) => ({
      ...f,
      weekendDays: f.weekendDays.includes(day)
        ? f.weekendDays.filter((d) => d !== day)
        : [...f.weekendDays, day].sort((a, b) => a - b),
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      weekendDays: form.weekendDays,
      optionalHolidayLimit: Number(form.optionalHolidayLimit) || 0,
      showOptionalOnCalendar: form.showOptionalOnCalendar,
    });
  };

  return (
    <form className="stack-md" onSubmit={handleSubmit} noValidate>
      <div className="panel">
        <div className="panel__header">
          <h3>
            <PartyPopper size={17} className="me-2" /> Holiday calendar settings
          </h3>
          <span className="panel__hint">Weekends and optional-holiday rules</span>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
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
            <small className="text-muted d-block mt-1">
              Weekends are excluded when counting working days.
            </small>
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="h-optional">
              Optional holiday limit
            </label>
            <input
              id="h-optional"
              type="number"
              min="0"
              max="366"
              className="form-control"
              value={form.optionalHolidayLimit}
              onChange={(e) => setForm((f) => ({ ...f, optionalHolidayLimit: e.target.value }))}
            />
            <small className="text-muted d-block">0 means unlimited.</small>
          </div>
          <div className="col-md-3 d-flex align-items-end pb-2">
            <label className="form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                checked={form.showOptionalOnCalendar}
                onChange={(e) => setForm((f) => ({ ...f, showOptionalOnCalendar: e.target.checked }))}
              />
              <span className="form-check-label">Show optional holidays</span>
            </label>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary" disabled={busy === 'holiday'}>
            {busy === 'holiday' ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            ) : (
              <Save size={15} className="me-1" />
            )}
            Save holiday settings
          </button>
        </div>
      </div>

      <p className="text-muted small mb-0">
        Holiday entries (national and company) are managed from the Holidays tab in the sidebar. This
        section only holds the calendar-level policy.
      </p>
    </form>
  );
}