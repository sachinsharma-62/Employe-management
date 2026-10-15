import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import {
  eventTypeColor,
  eventTypeLabel,
  eventTypeTone,
  fromISODate,
  todayISODate,
} from '../../utils/constants';

const WEEK_HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MAX_CHIPS = 2;

export default function EventCalendar({
  year,
  month,
  monthKey,
  eventsByDate,
  loading,
  onNavigate,
  onGoToday,
}) {
  const [selectedKey, setSelectedKey] = useState(null);

  const { cells, monthCount } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const list = [];
    for (let i = 0; i < leading; i += 1) list.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, month, d);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      list.push({ date, iso });
    }
    const count = Object.entries(eventsByDate)
      .filter(([key]) => key.startsWith(monthKey))
      .reduce((sum, [, list_]) => sum + list_.length, 0);
    return { cells: list, monthCount: count };
  }, [year, month, monthKey, eventsByDate]);

  const todayISO = todayISODate();
  const selected = selectedKey ? eventsByDate[selectedKey] || [] : [];

  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1)
  );

  return (
    <div className="event-calendar">
      <div className="event-calendar__nav">
        <button
          type="button"
          className="event-icon-btn"
          aria-label="Previous month"
          onClick={() => onNavigate(-1)}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="event-calendar__title">
          <strong>{monthLabel}</strong>
          <small>
            {monthCount} event{monthCount === 1 ? '' : 's'} this month
          </small>
        </div>
        <button
          type="button"
          className="event-icon-btn"
          aria-label="Next month"
          onClick={() => onNavigate(1)}
        >
          <ChevronRight size={16} />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm ms-1" onClick={onGoToday}>
          Today
        </button>
      </div>

      <div className="event-calendar__weekhead">
        {WEEK_HEAD.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={`event-calendar__grid ${loading ? 'is-loading' : ''}`}>
        {cells.map((cell, index) => {
          if (!cell) return <span key={`blank-${index}`} className="event-calendar__cell is-blank" />;
          const dayEvents = eventsByDate[cell.iso] || [];
          const isToday = cell.iso === todayISO;
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
          return (
            <button
              key={cell.iso}
              type="button"
              className={`event-calendar__cell ${dayEvents.length ? 'has-events' : ''} ${
                isWeekend ? 'is-weekend' : ''
              } ${isToday ? 'is-today' : ''} ${selectedKey === cell.iso ? 'is-selected' : ''}`}
              onClick={() => setSelectedKey(cell.iso)}
              aria-label={`${cell.date.getDate()}${dayEvents.length ? `, ${dayEvents.length} events` : ''}`}
            >
              <span className="event-calendar__daynum">{cell.date.getDate()}</span>
              {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                <span
                  key={event._id}
                  className="event-calendar__chip"
                  style={{ '--event-color': eventTypeColor(event.type) }}
                >
                  {event.name}
                </span>
              ))}
              {dayEvents.length > MAX_CHIPS && (
                <span className="event-calendar__more">+{dayEvents.length - MAX_CHIPS} more</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedKey && (
        <div className="event-calendar__details">
          <div className="event-calendar__details-head">
            <strong>
              {new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' }).format(
                fromISODate(selectedKey)
              )}
            </strong>
            <Badge tone="secondary">{selected.length} event(s)</Badge>
          </div>
          {selected.length ? (
            <ul className="event-calendar__details-list">
              {selected.map((event) => (
                <li key={event._id} className="event-calendar__details-item">
                  <span
                    className="event-calendar__details-dot"
                    style={{ background: eventTypeColor(event.type) }}
                  />
                  <div className="event-calendar__details-body">
                    <div className="event-calendar__details-name">
                      <strong>{event.name}</strong>
                      <Badge tone={eventTypeTone(event.type)}>{eventTypeLabel(event.type)}</Badge>
                    </div>
                    <div className="event-calendar__details-meta">
                      <span>
                        <Clock size={12} /> {event.timeLabel}
                      </span>
                      <span>
                        <MapPin size={12} /> {event.location}
                      </span>
                      <span>
                        <Users size={12} /> {event.participantCount} participants
                      </span>
                    </div>
                    {event.organizer?.fullName && (
                      <small className="event-hint">Organizer: {event.organizer.fullName}</small>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="event-hint">No events scheduled for this day.</p>
          )}
        </div>
      )}
    </div>
  );
}
