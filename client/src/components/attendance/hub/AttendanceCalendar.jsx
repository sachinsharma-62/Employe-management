import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  formatLongDate,
  fromDateKey,
  minutesToClock,
  minutesToHM,
  monthLongLabel,
  toDateKey,
} from '../../../utils/attendanceHub';

const STATUS_META = {
  PRESENT: { label: 'Present', tone: 'teal' },
  LATE: { label: 'Late', tone: 'orange' },
  WFH: { label: 'Work from home', tone: 'blue' },
  HALF_DAY: { label: 'Half day', tone: 'orange' },
  ABSENT: { label: 'Absent', tone: 'red' },
  LEAVE: { label: 'On leave', tone: 'gray' },
  HOLIDAY: { label: 'Holiday', tone: 'blue' },
  WEEKLY_OFF: { label: 'Weekly off', tone: 'gray' },
};

const NON_WORKING = ['WEEKLY_OFF', 'ABSENT', 'HOLIDAY', 'LEAVE'];

const LEGEND = [
  { label: 'Present', tone: 'teal' },
  { label: 'Late', tone: 'orange' },
  { label: 'Absent', tone: 'red' },
  { label: 'Weekly off', tone: 'gray' },
];

const WEEK_HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AttendanceCalendar({ logs, month, onMonthChange, use24 }) {
  const [selectedKey, setSelectedKey] = useState(null);

  const recordByDate = useMemo(() => {
    const map = {};
    logs.forEach((log) => {
      map[log.date] = log;
    });
    return map;
  }, [logs]);

  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const leading = (new Date(year, mon - 1, 1).getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < leading; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, mon - 1, d));

  const todayKey = toDateKey(new Date());
  const selected = selectedKey ? recordByDate[selectedKey] : null;

  return (
    <div className="hub-calendar">
      <div className="hub-calendar__nav">
        <button
          type="button"
          className="hub-icon-btn"
          aria-label="Previous month"
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="hub-calendar__title">{monthLongLabel(month)}</span>
        <button
          type="button"
          className="hub-icon-btn"
          aria-label="Next month"
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="hub-calendar__weekhead">
        {WEEK_HEAD.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="hub-calendar__grid">
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} className="hub-calendar__cell is-blank" />;
          const key = toDateKey(date);
          const record = recordByDate[key];
          const meta = record ? STATUS_META[record.status] : null;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              className={`hub-calendar__cell ${meta ? `is-${meta.tone}` : ''} ${
                isToday ? 'is-today' : ''
              } ${selectedKey === key ? 'is-selected' : ''}`}
              onClick={() => setSelectedKey(key)}
              aria-label={`${formatLongDate(date)}${meta ? ` — ${meta.label}` : ''}`}
            >
              <span className="hub-calendar__daynum">{date.getDate()}</span>
              {meta && <span className="hub-calendar__daylabel">{meta.label}</span>}
            </button>
          );
        })}
      </div>

      <div className="hub-calendar__legend">
        {LEGEND.map((item) => (
          <span key={item.label} className="hub-legend__item">
            <span className={`hub-dot hub-dot--${item.tone}`} />
            {item.label}
          </span>
        ))}
      </div>

      {selectedKey && (
        <div className="hub-calendar__details">
          <div className="hub-calendar__details-head">
            <strong>{formatLongDate(fromDateKey(selectedKey))}</strong>
            {selected ? (
              <span className={`hub-badge hub-badge--${STATUS_META[selected.status].tone}`}>
                {STATUS_META[selected.status].label}
              </span>
            ) : (
              <span className="hub-badge hub-badge--muted">No record</span>
            )}
          </div>
          {selected && !NON_WORKING.includes(selected.status) && selected.checkIn != null ? (
            <div className="hub-calendar__details-grid">
              <span>Check-in: {minutesToClock(selected.checkIn, use24)}</span>
              <span>
                Check-out:
                {selected.checkOut != null ? ` ${minutesToClock(selected.checkOut, use24)}` : ' —'}
              </span>
              <span>Effective: {minutesToHM(selected.effectiveMinutes)}</span>
              <span>Break: {minutesToHM(selected.breakMinutes)}</span>
            </div>
          ) : (
            <p className="hub-muted">
              {!selected
                ? 'No attendance record available for this day.'
                : selected.status === 'WEEKLY_OFF'
                  ? 'Weekly off — no attendance expected.'
                  : selected.status === 'ABSENT'
                    ? 'Marked absent for this day.'
                    : selected.status === 'HOLIDAY'
                      ? `Holiday${selected.holiday ? ` — ${selected.holiday}` : ''}.`
                      : selected.status === 'LEAVE'
                        ? 'On approved leave for this day.'
                        : 'No attendance record available for this day.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
