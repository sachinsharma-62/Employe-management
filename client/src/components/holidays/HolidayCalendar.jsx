import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import { DAY_NAMES, fromISODate, holidayTypeLabel, todayISODate } from '../../utils/constants';

const WEEK_HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const LEGEND = [
  { label: 'National', tone: 'info' },
  { label: 'Company', tone: 'purple' },
  { label: 'Optional', tone: 'warning' },
];

const toneOf = (holiday) => {
  if (holiday.optional) return 'warning';
  return holiday.type === 'COMPANY' ? 'purple' : 'info';
};

export default function HolidayCalendar({
  year,
  month,
  monthKey,
  holidaysByDate,
  loading,
  onNavigate,
  onGoToday,
}) {
  const [selectedKey, setSelectedKey] = useState(null);

  const { cells, monthHolidayCount } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const list = [];
    for (let i = 0; i < leading; i += 1) list.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, month, d);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      list.push({ date, iso });
    }
    const count = Object.keys(holidaysByDate).filter((key) => key.startsWith(monthKey)).length;
    return { cells: list, monthHolidayCount: count };
  }, [year, month, monthKey, holidaysByDate]);

  const todayISO = todayISODate();
  const selected = selectedKey ? holidaysByDate[selectedKey] : null;

  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1)
  );

  return (
    <div className="holiday-calendar">
      <div className="holiday-calendar__nav">
        <button
          type="button"
          className="holiday-icon-btn"
          aria-label="Previous month"
          onClick={() => onNavigate(-1)}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="holiday-calendar__title">
          <strong>{monthLabel}</strong>
          <small>
            {monthHolidayCount} holiday{monthHolidayCount === 1 ? '' : 's'} this month
          </small>
        </div>
        <button
          type="button"
          className="holiday-icon-btn"
          aria-label="Next month"
          onClick={() => onNavigate(1)}
        >
          <ChevronRight size={16} />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm ms-1" onClick={onGoToday}>
          Today
        </button>
      </div>

      <div className="holiday-calendar__weekhead">
        {WEEK_HEAD.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={`holiday-calendar__grid ${loading ? 'is-loading' : ''}`}>
        {cells.map((cell, index) => {
          if (!cell) return <span key={`blank-${index}`} className="holiday-calendar__cell is-blank" />;
          const holiday = holidaysByDate[cell.iso];
          const isToday = cell.iso === todayISO;
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
          return (
            <button
              key={cell.iso}
              type="button"
              className={`holiday-calendar__cell ${
                holiday ? `is-${toneOf(holiday)}` : ''
              } ${isWeekend ? 'is-weekend' : ''} ${isToday ? 'is-today' : ''} ${
                selectedKey === cell.iso ? 'is-selected' : ''
              }`}
              onClick={() => setSelectedKey(cell.iso)}
              aria-label={`${cell.date.getDate()} ${holiday ? holiday.name : ''}`}
            >
              <span className="holiday-calendar__daynum">{cell.date.getDate()}</span>
              {holiday && (
                <>
                  <span className="holiday-calendar__dot" />
                  <span className="holiday-calendar__daylabel">{holiday.name}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="holiday-calendar__legend">
        {LEGEND.map((item) => (
          <span key={item.label} className="holiday-legend__item">
            <span className={`holiday-dot holiday-dot--${item.tone}`} />
            {item.label}
          </span>
        ))}
      </div>

      {selectedKey && (
        <div className="holiday-calendar__details">
          <div className="holiday-calendar__details-head">
            <strong>
              {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
                fromISODate(selectedKey)
              )}
            </strong>
            {selected ? (
              <Badge tone={toneOf(selected)}>{holidayTypeLabel(selected.type)}</Badge>
            ) : (
              <Badge tone="secondary">Working day</Badge>
            )}
          </div>
          {selected ? (
            <div className="holiday-calendar__details-body">
              <p className="holiday-calendar__details-name">
                <PartyPopper size={15} /> {selected.name}
                {selected.optional && <span className="holiday-tag">Optional</span>}
              </p>
              {selected.description && <p className="holiday-hint">{selected.description}</p>}
              <p className="holiday-hint">
                {DAY_NAMES[selected.dayOfWeek]}
                {selected.weekend ? ' · Weekend' : ''} · Applies to {selected.scopeLabel}
              </p>
            </div>
          ) : (
            <p className="holiday-hint">No holiday scheduled for this day.</p>
          )}
        </div>
      )}
    </div>
  );
}