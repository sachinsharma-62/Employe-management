import { useMemo, useState } from 'react';
import { Info, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { initials, roleLabel } from '../../../utils/constants';
import {
  RANGE_OPTIONS,
  computeStats,
  filterLogsByRange,
  minutesToHM,
  rangeBounds,
} from '../../../utils/attendanceHub';

export default function AttendanceStatsCard({ hub }) {
  const { user } = useAuth();
  const [custom, setCustom] = useState(() => hub.statsCustom || { from: '', to: '' });

  const bounds = useMemo(
    () => rangeBounds(hub.statsRange, hub.statsRange === 'custom' ? custom : null),
    [hub.statsRange, custom]
  );

  const employeeStats = useMemo(
    () => computeStats(filterLogsByRange(hub.logs, bounds.from, bounds.to)),
    [hub.logs, bounds]
  );

  const teamStats = useMemo(
    () => computeStats(filterLogsByRange(hub.teamLogs, bounds.from, bounds.to)),
    [hub.teamLogs, bounds]
  );

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You';

  const handleRange = (value) => {
    if (value === 'custom') {
      hub.setStatsRange('custom', custom);
    } else {
      hub.setStatsRange(value);
    }
  };

  const handleCustom = (name, value) => {
    const next = { ...custom, [name]: value };
    setCustom(next);
    hub.setStatsRange('custom', next);
  };

  return (
    <section className="hub-card" aria-labelledby="hub-stats-title">
      <header className="hub-card__head">
        <h3 id="hub-stats-title">Attendance Stats</h3>
        <div className="hub-card__tools">
          <select
            className="hub-select"
            aria-label="Statistics date range"
            value={hub.statsRange}
            onChange={(event) => handleRange(event.target.value)}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span
            className="hub-icon-btn hub-icon-btn--muted"
            role="img"
            aria-label="Average working hours and on-time arrival over the selected range"
            title="Averages are calculated over the selected date range."
          >
            <Info size={15} />
          </span>
        </div>
      </header>

      {hub.statsRange === 'custom' && (
        <div className="hub-stats__custom">
          <label>
            <span>From</span>
            <input
              type="date"
              className="hub-input"
              value={custom.from}
              max={custom.to || undefined}
              onChange={(event) => handleCustom('from', event.target.value)}
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="date"
              className="hub-input"
              value={custom.to}
              min={custom.from || undefined}
              onChange={(event) => handleCustom('to', event.target.value)}
            />
          </label>
        </div>
      )}

      <div className="hub-stats__row">
        <div className="hub-stats__identity">
          <span className="hub-avatar" aria-hidden="true">{initials(user)}</span>
          <div className="hub-stats__names">
            <strong>{fullName}</strong>
            <small>{roleLabel(user?.role)}</small>
          </div>
        </div>
        <div className="hub-stats__metrics">
          <div className="hub-stat">
            <span className="hub-stat__value">{minutesToHM(employeeStats.avgMinutes)}</span>
            <span className="hub-stat__label">avg hours/day</span>
          </div>
          <div className="hub-stat">
            <span className="hub-stat__value hub-stat__value--teal">{employeeStats.onTimePct}%</span>
            <span className="hub-stat__label">on-time arrival</span>
          </div>
        </div>
      </div>

      <div className="hub-divider" />

      <div className="hub-stats__row">
        <div className="hub-stats__identity">
          <span className="hub-avatar hub-avatar--team" aria-hidden="true">
            <Users size={16} />
          </span>
          <div className="hub-stats__names">
            <strong>My Team</strong>
            <small>{teamStats.days ? `${teamStats.days} working days` : 'No team data'}</small>
          </div>
        </div>
        <div className="hub-stats__metrics">
          <div className="hub-stat">
            <span className="hub-stat__value">
              {teamStats.days ? minutesToHM(teamStats.avgMinutes) : '—'}
            </span>
            <span className="hub-stat__label">avg hours/day</span>
          </div>
          <div className="hub-stat">
            <span className="hub-stat__value hub-stat__value--teal">
              {teamStats.days ? `${teamStats.onTimePct}%` : '—'}
            </span>
            <span className="hub-stat__label">on-time arrival</span>
          </div>
        </div>
      </div>
    </section>
  );
}
