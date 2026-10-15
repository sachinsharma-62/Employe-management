import { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import Modal from '../Modal';
import { HOLIDAY_SCOPES, HOLIDAY_TYPES } from '../../utils/constants';

const emptyForm = {
  name: '',
  date: '',
  type: 'NATIONAL',
  optional: false,
  description: '',
  scope: 'ALL',
  locations: [],
  departments: [],
  isActive: true,
};

export default function HolidayFormModal({ open, initial, onClose, onSubmit, saving, meta }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const editing = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        ...emptyForm,
        ...initial,
        date: initial.dateISO || '',
        locations: initial.locations || [],
        departments: initial.departments || [],
      });
    } else {
      setForm({ ...emptyForm });
    }
    setError('');
  }, [open, initial]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleIn = (field, value) =>
    setForm((prev) => {
      const list = prev[field];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...prev, [field]: next };
    });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Holiday name is required.');
      return;
    }
    if (!form.date) {
      setError('Holiday date is required.');
      return;
    }
    if (form.scope === 'LOCATIONS' && form.locations.length === 0) {
      setError('Select at least one location.');
      return;
    }
    if (form.scope === 'DEPARTMENTS' && form.departments.length === 0) {
      setError('Select at least one department.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      date: form.date,
      type: form.type,
      optional: Boolean(form.optional),
      description: form.description.trim(),
      scope: form.scope,
      locations: form.scope === 'LOCATIONS' ? form.locations : [],
      departments: form.scope === 'DEPARTMENTS' ? form.departments : [],
      isActive: Boolean(form.isActive),
    };
    onSubmit(payload, initial?._id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit holiday' : 'Add holiday'}
      subtitle="Holiday name, date, type and who it applies to"
      icon={PartyPopper}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="holiday-form" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : 'Save'}
          </button>
        </div>
      }
    >
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <form id="holiday-form" onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="holiday-name">
              Holiday name <span className="text-danger">*</span>
            </label>
            <input
              id="holiday-name"
              className="form-control"
              maxLength={100}
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="holiday-date">
              Date <span className="text-danger">*</span>
            </label>
            <input
              id="holiday-date"
              type="date"
              className="form-control"
              value={form.date}
              onChange={(event) => update({ date: event.target.value })}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="holiday-type">
              Holiday type
            </label>
            <select
              id="holiday-type"
              className="form-select"
              value={form.type}
              onChange={(event) => update({ type: event.target.value })}
            >
              {HOLIDAY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="holiday-desc">
              Description
            </label>
            <input
              id="holiday-desc"
              className="form-control"
              maxLength={300}
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
            />
          </div>

          <div className="col-12">
            <div className="holiday-switch-row">
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form.optional}
                  onChange={(event) => update({ optional: event.target.checked })}
                />
                <span className="form-check-label">Optional holiday</span>
              </label>
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form.isActive}
                  onChange={(event) => update({ isActive: event.target.checked })}
                />
                <span className="form-check-label">Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section mt-4">
          <p className="form-section__title">Applies to</p>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="holiday-scope">
                Scope
              </label>
              <select
                id="holiday-scope"
                className="form-select"
                value={form.scope}
                onChange={(event) =>
                  update({ scope: event.target.value, locations: [], departments: [] })
                }
              >
                {HOLIDAY_SCOPES.map((scope) => (
                  <option key={scope.value} value={scope.value}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </div>

            {form.scope === 'LOCATIONS' && (
              <div className="col-md-8">
                <label className="form-label">Locations</label>
                <div className="holiday-check-grid">
                  {(meta.locations || []).length ? (
                    meta.locations.map((location) => (
                      <label className="form-check" key={location}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={form.locations.includes(location)}
                          onChange={() => toggleIn('locations', location)}
                        />
                        <span className="form-check-label">{location}</span>
                      </label>
                    ))
                  ) : (
                    <small className="holiday-hint">No locations configured yet.</small>
                  )}
                </div>
              </div>
            )}

            {form.scope === 'DEPARTMENTS' && (
              <div className="col-md-8">
                <label className="form-label">Departments</label>
                <div className="holiday-check-grid">
                  {(meta.departments || []).length ? (
                    meta.departments.map((department) => (
                      <label className="form-check" key={department}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={form.departments.includes(department)}
                          onChange={() => toggleIn('departments', department)}
                        />
                        <span className="form-check-label">{department}</span>
                      </label>
                    ))
                  ) : (
                    <small className="holiday-hint">No departments configured yet.</small>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}