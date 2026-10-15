import { FilterX, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import {
  EVENT_TYPES,
  MONTHS_SHORT,
  eventTypeLabel,
  eventTypeTone,
} from '../../utils/constants';

const monthTitle = (key) => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${y}`;
};

export default function EventList({
  grouped,
  loading,
  busy,
  canManage,
  filters,
  onFilter,
  onReset,
  onNew,
  onEdit,
  onDelete,
}) {
  const monthKeys = Object.keys(grouped).sort();

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Event list</h3>
        {canManage && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onNew}>
            <Plus size={15} className="me-1" /> Create event
          </button>
        )}
      </div>

      <div className="event-filters">
        <div className="event-filters__search">
          <Search size={15} />
          <input
            className="form-control form-control-sm"
            placeholder="Search events"
            value={filters.search}
            onChange={(e) => onFilter('search', e.target.value)}
          />
        </div>
        <select
          className="form-select form-select-sm"
          value={filters.type}
          onChange={(e) => onFilter('type', e.target.value)}
        >
          <option value="">All types</option>
          {EVENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <input
          className="form-control form-control-sm event-filters__location"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => onFilter('location', e.target.value)}
        />
        {canManage && (
          <label className="event-filters__toggle">
            <input
              type="checkbox"
              className="form-check-input"
              checked={filters.includeInactive}
              onChange={(e) => onFilter('includeInactive', e.target.checked)}
            />
            Show inactive
          </label>
        )}
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onReset}>
          <FilterX size={14} className="me-1" /> Reset
        </button>
      </div>

      {loading ? (
        <div className="event-empty">
          <span className="spinner-border spinner-border-sm" />{' '}
          <span className="ms-2">Loading events…</span>
        </div>
      ) : monthKeys.length ? (
        <div className="event-list">
          {monthKeys.map((key) => (
            <div className="event-list__group" key={key}>
              <p className="event-list__month">
                {monthTitle(key)}
                <span>{grouped[key].length}</span>
              </p>
              <div className="table-responsive">
                <table className="table app-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Event</th>
                      <th>Type</th>
                      <th>Time</th>
                      <th>Location</th>
                      <th>Organizer</th>
                      <th>Participants</th>
                      <th>Status</th>
                      {canManage && <th className="text-end">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[key].map((event) => (
                      <tr key={event._id}>
                        <td>
                          <div className="event-date-cell">
                            <strong>{event.dateISO.slice(8, 10)}</strong>
                            <small>{event.dayName?.slice(0, 3)}</small>
                          </div>
                        </td>
                        <td>
                          <strong>{event.name}</strong>
                          {event.description && (
                            <small className="text-muted d-block event-desc-cell">
                              {event.description}
                            </small>
                          )}
                        </td>
                        <td>
                          <Badge tone={eventTypeTone(event.type)}>
                            {eventTypeLabel(event.type)}
                          </Badge>
                        </td>
                        <td>
                          <span className="event-time-cell">{event.timeLabel}</span>
                        </td>
                        <td>
                          <span className="event-location-cell">
                            <MapPin size={13} /> {event.location}
                          </span>
                        </td>
                        <td>{event.organizer?.fullName || '—'}</td>
                        <td>
                          <span className="event-count-pill">{event.participantCount}</span>
                        </td>
                        <td>
                          <Badge tone={event.isActive ? 'success' : 'secondary'}>
                            {event.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        {canManage && (
                          <td className="text-end">
                            <div className="event-actions">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => onEdit(event)}
                                disabled={busy === 'event'}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => onDelete(event)}
                                disabled={busy === 'event'}
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
            </div>
          ))}
        </div>
      ) : (
        <div className="event-empty">
          <strong>No events found</strong>
          <small>Adjust the filters or create an event to get started.</small>
        </div>
      )}
    </div>
  );
}
