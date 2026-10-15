import { CalendarClock, Clock, MapPin } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import { eventTypeLabel, eventTypeTone, fromISODate } from '../../utils/constants';

const countdown = (days) => {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return 'Past';
  return `in ${days} days`;
};

export default function UpcomingEvents({ events, loading }) {
  return (
    <div className="panel h-100">
      <div className="panel__header">
        <h3>
          <CalendarClock size={16} className="me-2" /> Upcoming events
        </h3>
      </div>

      {loading ? (
        <div className="event-empty">
          <span className="spinner-border spinner-border-sm" />{' '}
          <span className="ms-2">Loading…</span>
        </div>
      ) : events.length ? (
        <ul className="event-upcoming">
          {events.map((event) => (
            <li className="event-upcoming__item" key={event._id}>
              <div className="event-upcoming__date">
                <span>{event.dateISO.slice(8, 10)}</span>
                <small>
                  {new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(
                    fromISODate(event.dateISO)
                  )}
                </small>
              </div>
              <div className="event-upcoming__body">
                <strong>{event.name}</strong>
                <small>
                  <Clock size={12} /> {event.timeLabel}
                </small>
                <small>
                  <MapPin size={12} /> {event.location}
                </small>
              </div>
              <div className="event-upcoming__meta">
                <Badge tone={eventTypeTone(event.type)}>{eventTypeLabel(event.type)}</Badge>
                <span className="event-upcoming__countdown">{countdown(event.daysUntil)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="event-empty">
          <strong>No upcoming events</strong>
          <small>Nothing scheduled yet.</small>
        </div>
      )}
    </div>
  );
}
