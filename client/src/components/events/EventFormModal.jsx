import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Search } from 'lucide-react';
import Modal from '../Modal';
import { useAuth } from '../../context/AuthContext';
import { EVENT_TYPES } from '../../utils/constants';

const initialsOf = (person) => {
  const source = person?.fullName || `${person?.firstName || ''} ${person?.lastName || ''}`.trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) || '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
};

const emptyForm = {
  name: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  location: '',
  type: 'MEETING',
  description: '',
  organizer: '',
  participants: [],
  isPublic: false,
  isActive: true,
};

const personId = (person) => {
  if (!person) return '';
  if (typeof person === 'string') return person;
  return person._id || person.id || '';
};

export default function EventFormModal({ open, initial, onClose, onSubmit, saving, employees = [] }) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const editing = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    if (initial) {
      setForm({
        ...emptyForm,
        ...initial,
        date: initial.dateISO || '',
        organizer: personId(initial.organizer) || personId(user),
        participants: (initial.participants || []).map(personId).filter(Boolean),
      });
    } else {
      setForm({ ...emptyForm, organizer: personId(user) });
    }
    setError('');
  }, [open, initial, user]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleParticipant = (id) =>
    setForm((prev) => {
      const participants = prev.participants.includes(id)
        ? prev.participants.filter((item) => item !== id)
        : [...prev.participants, id];
      return { ...prev, participants };
    });

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) =>
      `${employee.fullName} ${employee.department} ${employee.email}`.toLowerCase().includes(query)
    );
  }, [employees, search]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError('Event name is required.');
    if (!form.date) return setError('Event date is required.');
    if (!form.location.trim()) return setError('Location is required.');
    if (!form.startTime || !form.endTime) return setError('Start and end times are required.');
    if (form.endTime <= form.startTime) return setError('End time must be after the start time.');
    if (!form.organizer) return setError('Select an organizer.');

    const payload = {
      name: form.name.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location.trim(),
      description: form.description.trim(),
      type: form.type,
      organizer: form.organizer,
      participants: form.participants,
      isPublic: Boolean(form.isPublic),
      isActive: Boolean(form.isActive),
    };
    return onSubmit(payload, initial?._id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit event' : 'Create event'}
      subtitle="Schedule an event, pick the organizer and invite participants"
      icon={CalendarPlus}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="event-form" className="btn btn-primary" disabled={saving}>
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

      <form id="event-form" onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label" htmlFor="event-name">
              Event name <span className="text-danger">*</span>
            </label>
            <input
              id="event-name"
              className="form-control"
              maxLength={200}
              placeholder="e.g. Quarterly all-hands"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="event-type">
              Event type
            </label>
            <select
              id="event-type"
              className="form-select"
              value={form.type}
              onChange={(e) => update({ type: e.target.value })}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label" htmlFor="event-date">
              Date <span className="text-danger">*</span>
            </label>
            <input
              id="event-date"
              type="date"
              className="form-control"
              value={form.date}
              onChange={(e) => update({ date: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="event-start">
              Start time <span className="text-danger">*</span>
            </label>
            <input
              id="event-start"
              type="time"
              className="form-control"
              value={form.startTime}
              onChange={(e) => update({ startTime: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="event-end">
              End time <span className="text-danger">*</span>
            </label>
            <input
              id="event-end"
              type="time"
              className="form-control"
              value={form.endTime}
              onChange={(e) => update({ endTime: e.target.value })}
            />
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="event-location">
              Location <span className="text-danger">*</span>
            </label>
            <input
              id="event-location"
              className="form-control"
              maxLength={500}
              placeholder="Room, building or meeting link"
              value={form.location}
              onChange={(e) => update({ location: e.target.value })}
            />
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="event-desc">
              Description
            </label>
            <textarea
              id="event-desc"
              className="form-control"
              rows={2}
              maxLength={2000}
              placeholder="Agenda, notes or context for attendees"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="event-organizer">
              Organizer <span className="text-danger">*</span>
            </label>
            <select
              id="event-organizer"
              className="form-select"
              value={form.organizer}
              onChange={(e) => update({ organizer: e.target.value })}
            >
              <option value="">Select organizer</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                  {employee.department ? ` · ${employee.department}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <div className="event-switch-row">
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form.isPublic}
                  onChange={(e) => update({ isPublic: e.target.checked })}
                />
                <span className="form-check-label">Visible to everyone</span>
              </label>
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form.isActive}
                  onChange={(e) => update({ isActive: e.target.checked })}
                />
                <span className="form-check-label">Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section mt-4">
          <div className="d-flex align-items-center justify-content-between">
            <p className="form-section__title mb-0">Participants ({form.participants.length})</p>
            <div className="event-participant-search">
              <Search size={14} />
              <input
                className="form-control form-control-sm"
                placeholder="Search employees"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="event-participant-grid">
            {filteredEmployees.length ? (
              filteredEmployees.map((employee) => {
                const checked = form.participants.includes(employee.id);
                return (
                  <label
                    key={employee.id}
                    className={`event-participant ${checked ? 'is-checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={checked}
                      onChange={() => toggleParticipant(employee.id)}
                    />
                    {employee.avatar ? (
                      <img className="event-participant__avatar" src={employee.avatar} alt="" />
                    ) : (
                      <span className="event-participant__avatar event-participant__avatar--initials">
                        {initialsOf(employee)}
                      </span>
                    )}
                    <span className="event-participant__body">
                      <strong>{employee.fullName}</strong>
                      <small>{employee.department || employee.email}</small>
                    </span>
                  </label>
                );
              })
            ) : (
              <small className="event-hint">No employees match your search.</small>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
