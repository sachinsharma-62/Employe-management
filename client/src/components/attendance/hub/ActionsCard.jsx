import { useEffect, useState } from 'react';
import { BriefcaseBusiness, FileText, House, LogIn, LogOut } from 'lucide-react';
import DigitalClock from './DigitalClock';
import StatusBadge from './StatusBadge';
import { useToast } from '../../../context/ToastContext';
import { formatLongDate, minutesToClock, minutesToHM } from '../../../utils/attendanceHub';

const toMin = (value) => {
  if (!value) return null;
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const secondsToClock = (seconds) => {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function ActionsCard({ hub, onShortcut }) {
  const toast = useToast();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { record, clockedIn, busy, user } = hub;
  const sessions = Array.isArray(record?.sessions) ? record.sessions : [];
  const completedMinutes = sessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
  const openSession = record?.openSession || sessions.find((s) => s.checkIn && !s.checkOut) || null;
  const firstCheckIn = record?.firstCheckIn || sessions.find((s) => s.checkIn)?.checkIn || '';
  const lastCheckOut =
    record?.lastCheckOut || [...sessions].reverse().find((s) => s.checkOut)?.checkOut || '';
  const totalMinutes = record?.workedMinutes != null ? record.workedMinutes : completedMinutes;

  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const openInMin = openSession ? toMin(openSession.checkIn) : null;
  const liveSeconds = openInMin != null ? Math.max(0, nowSeconds - openInMin * 60) : 0;

  const statusLabel = clockedIn ? 'Clocked In' : lastCheckOut ? 'Clocked Out' : 'Not Clocked In';
  const statusTone = clockedIn ? 'teal' : lastCheckOut ? 'muted' : 'warning';

  const button = clockedIn ? (
    <button
      type="button"
      className="hub-btn hub-btn--block hub-btn--danger"
      onClick={() => hub.clockOut('')}
      disabled={busy === 'checkout'}
    >
      <LogOut size={16} />
      {busy === 'checkout' ? 'Clocking out…' : 'Web Clock-out'}
    </button>
  ) : (
    <button
      type="button"
      className="hub-btn hub-btn--block hub-btn--primary"
      onClick={() => hub.clockIn('OFFICE')}
      disabled={busy === 'checkin'}
    >
      <LogIn size={16} />
      {busy === 'checkin' ? 'Clocking in…' : 'Web Clock-in'}
    </button>
  );

  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : '';

  return (
    <section className="hub-card" aria-labelledby="hub-actions-title">
      <header className="hub-card__head">
        <h3 id="hub-actions-title">Actions</h3>
        <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
      </header>

      <div className="hub-actions__who">
        <strong>{displayName}</strong>
        <span className="hub-muted">
          {user?.employeeId ? `${user.employeeId} · ` : ''}
          {formatLongDate(now)}
        </span>
      </div>

      <div className="hub-actions__clockwrap">
        <DigitalClock use24={hub.format24} />
      </div>

      {button}

      {openSession && (
        <div className="hub-actions__live">
          <span className="hub-dot is-online" />
          Ongoing session since{' '}
          {openInMin != null ? minutesToClock(openInMin, hub.format24) : '—'}
          <strong className="hub-actions__live-timer">{secondsToClock(liveSeconds)}</strong>
          <span className="hub-muted">not counted until clock-out</span>
        </div>
      )}

      <div className="hub-actions__grid">
        <div className="hub-actions__stat">
          <span className="hub-actions__stat-label">Total Working</span>
          <span className="hub-actions__stat-value hub-actions__stat-value--teal">
            {minutesToHM(totalMinutes)}
          </span>
        </div>
        <div className="hub-actions__stat">
          <span className="hub-actions__stat-label">Sessions</span>
          <span className="hub-actions__stat-value">{sessions.length}</span>
        </div>
        <div className="hub-actions__stat">
          <span className="hub-actions__stat-label">First Clock-in</span>
          <span className="hub-actions__stat-value">
            {firstCheckIn ? minutesToClock(toMin(firstCheckIn), hub.format24) : '—'}
          </span>
        </div>
        <div className="hub-actions__stat">
          <span className="hub-actions__stat-label">Last Clock-out</span>
          <span className="hub-actions__stat-value">
            {lastCheckOut ? minutesToClock(toMin(lastCheckOut), hub.format24) : '—'}
          </span>
        </div>
      </div>

      <div className="hub-actions__shortcuts">
        <button type="button" className="hub-shortcut" onClick={() => onShortcut?.('Work From Home')}>
          <House size={15} />
          <span>Work From Home</span>
        </button>
        <button type="button" className="hub-shortcut" onClick={() => onShortcut?.('On Duty')}>
          <BriefcaseBusiness size={15} />
          <span>On Duty</span>
        </button>
        <button
          type="button"
          className="hub-shortcut"
          onClick={() => toast.info('Attendance policy: flexible 9:30 AM - 6:30 PM, weekly off on Sat & Sun.')}
        >
          <FileText size={15} />
          <span>Attendance Policy</span>
        </button>
      </div>
    </section>
  );
}
