import { CalendarDays, List } from 'lucide-react';

export default function AttendanceFilters({
  rangeLabel,
  month,
  months,
  onSelectMonth,
  view,
  onViewChange,
}) {
  return (
    <div className="hub-toolbar">
      <span className="hub-toolbar__label">{rangeLabel}</span>

      <div className="hub-toolbar__chips">
        {months.map((option) => (
          <button
            key={option.key}
            type="button"
            title={option.long}
            className={`hub-chip ${month === option.key ? 'is-active' : ''}`}
            onClick={() => onSelectMonth(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="hub-toolbar__views">
        <button
          type="button"
          className={`hub-icon-btn ${view === 'list' ? 'is-active' : ''}`}
          aria-label="List view"
          aria-pressed={view === 'list'}
          onClick={() => onViewChange('list')}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          className={`hub-icon-btn ${view === 'calendar' ? 'is-active' : ''}`}
          aria-label="Calendar view"
          aria-pressed={view === 'calendar'}
          onClick={() => onViewChange('calendar')}
        >
          <CalendarDays size={16} />
        </button>
      </div>
    </div>
  );
}
