import { useState } from 'react';
import { Coffee, Clock3 } from 'lucide-react';
import {
  WEEKDAY_TABS,
  minutesToClock,
  minutesToHM,
  parseClock,
} from '../../../utils/attendanceHub';

export default function TimingsCard({ hub }) {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDay());

  const settings = hub.settings || {
    officeStart: '09:30',
    officeEnd: '18:30',
    breakMinutes: 60,
    weekendDays: [0, 6],
  };
  const weekendDays = settings.weekendDays || [0, 6];
  const isWeekendDay = weekendDays.includes(selectedDay);
  const schedule = isWeekendDay
    ? null
    : { start: settings.officeStart, end: settings.officeEnd, breakMinutes: settings.breakMinutes };
  const isToday = selectedDay === today.getDay();

  const heading =
    WEEKDAY_TABS.find((day) => day.key === selectedDay)?.name || 'Today';
  const displayHeading = isToday ? 'Today' : heading;

  let totalMinutes = 0;
  let breakMinutes = 0;
  if (schedule) {
    const start = parseClock(schedule.start);
    const end = parseClock(schedule.end);
    totalMinutes = end - start;
    breakMinutes = schedule.breakMinutes;
  }
  const workMinutes = Math.max(0, totalMinutes - breakMinutes);
  const workPct = totalMinutes ? (workMinutes / totalMinutes) * 100 : 0;

  return (
    <section className="hub-card" aria-labelledby="hub-timings-title">
      <header className="hub-card__head">
        <h3 id="hub-timings-title">Timings</h3>
      </header>

      <div className="hub-weekdays" role="tablist" aria-label="Select weekday">
        {WEEKDAY_TABS.map((day) => (
          <button
            key={day.name}
            type="button"
            role="tab"
            aria-selected={selectedDay === day.key}
            aria-label={day.name}
            className={`hub-weekday ${selectedDay === day.key ? 'is-active' : ''}`}
            onClick={() => setSelectedDay(day.key)}
          >
            {day.label}
          </button>
        ))}
      </div>

      {schedule ? (
        <>
          <p className="hub-timings__label">
            {displayHeading} ({minutesToClock(parseClock(schedule.start), hub.format24)} -{' '}
            {minutesToClock(parseClock(schedule.end), hub.format24)})
          </p>

          <div className="hub-timings__bar" aria-hidden="true">
            <span className="hub-timings__work" style={{ width: `${workPct}%` }} />
            <span className="hub-timings__break" style={{ width: `${100 - workPct}%` }} />
          </div>

          <div className="hub-timings__meta">
            <div className="hub-timings__item">
              <Clock3 size={15} />
              <div>
                <span className="hub-timings__value">{minutesToHM(workMinutes)}</span>
                <span className="hub-timings__caption">Scheduled work time</span>
              </div>
            </div>
            <div className="hub-timings__item">
              <Coffee size={15} />
              <div>
                <span className="hub-timings__value">{minutesToHM(breakMinutes)}</span>
                <span className="hub-timings__caption">Break duration</span>
              </div>
            </div>
            <div className="hub-timings__item">
              <Clock3 size={15} />
              <div>
                <span className="hub-timings__value">{minutesToHM(totalMinutes)}</span>
                <span className="hub-timings__caption">Total duration</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="hub-timings__off">
          <span className="hub-badge hub-badge--muted">W-OFF</span>
          <p>{displayHeading} is a weekly off. No scheduled working hours.</p>
        </div>
      )}
    </section>
  );
}
