import { CalendarClock, PartyPopper } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import { holidayTypeLabel, holidayTypeTone, fromISODate } from '../../utils/constants';

const countdown = (days) => {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return 'Past';
  return `in ${days} days`;
};

export default function UpcomingHolidays({ holidays, loading }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>
          <CalendarClock size={16} className="me-2" /> Upcoming holidays
        </h3>
      </div>

      {loading ? (
        <div className="holiday-empty">
          <span className="spinner-border spinner-border-sm" />{' '}
          <span className="ms-2">Loading…</span>
        </div>
      ) : holidays.length ? (
        <ul className="holiday-upcoming">
          {holidays.map((holiday) => (
            <li className="holiday-upcoming__item" key={holiday._id}>
              <div className="holiday-upcoming__date">
                <span>{holiday.dateISO.slice(8, 10)}</span>
                <small>
                  {new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(
                    fromISODate(holiday.dateISO)
                  )}
                </small>
              </div>
              <div className="holiday-upcoming__body">
                <strong>{holiday.name}</strong>
                <small>
                  <PartyPopper size={12} /> {holiday.dayName}
                  {holiday.optional ? ' · Optional' : ''}
                </small>
              </div>
              <div className="holiday-upcoming__meta">
                <Badge tone={holidayTypeTone(holiday.type)}>
                  {holidayTypeLabel(holiday.type)}
                </Badge>
                <span className="holiday-upcoming__countdown">{countdown(holiday.daysUntil)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="holiday-empty">
          <strong>No upcoming holidays</strong>
          <small>You are all caught up.</small>
        </div>
      )}
    </div>
  );
}