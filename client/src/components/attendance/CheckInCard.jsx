import { useEffect, useState } from 'react';
import { Clock3, LogIn, LogOut, Timer } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import { attendanceStatusLabel, attendanceStatusTone, formatDuration } from '../../utils/constants';

const parseTimeToDate = (isoDate, time) => {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  const [hh, mm] = String(time).split(':').map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
};

const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export default function CheckInCard({ today, busy, onCheckIn, onCheckOut }) {
  const [now, setNow] = useState(new Date());
  const [mode, setMode] = useState('OFFICE');
  const [note, setNote] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!today) return null;

  const [y, m, d] = today.date.split('-').map(Number);
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const clock = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const record = today.record;
  const busyCheckIn = busy === 'checkin';
  const busyCheckOut = busy === 'checkout';

  const checkInDate = record?.checkIn ? parseTimeToDate(today.date, record.checkIn) : null;
  const isRunning = Boolean(checkInDate && !record?.checkOut);
  const endDate = record?.checkOut ? parseTimeToDate(today.date, record.checkOut) : now;
  const sessionSeconds =
    checkInDate && endDate && endDate > checkInDate ? (endDate - checkInDate) / 1000 : 0;

  const handleCheckIn = () => {
    onCheckIn(mode);
  };

  const handleCheckOut = () => {
    onCheckOut(note.trim());
    setNote('');
  };

  return (
    <div className="att-today">
      <div className="att-today__clock">
        <Clock3 size={18} />
        <div>
          <strong>{clock}</strong>
          <small>{dateLabel}</small>
          {today.holiday && <small className="text-primary">Holiday · {today.holiday}</small>}
          {today.isWeekend && !today.holiday && <small className="text-muted">Weekend</small>}
        </div>
      </div>

      {record?.checkIn && (
        <div className={`att-today__timer ${isRunning ? 'is-running' : ''}`}>
          <Timer size={16} />
          <div>
            <strong>{formatClock(sessionSeconds)}</strong>
            <small>
              {isRunning
                ? `Working since ${record.checkIn}`
                : `Worked ${record.checkIn} – ${record.checkOut}`}
            </small>
          </div>
        </div>
      )}

      <div className="att-today__status">
        {record ? (
          <>
            <Badge tone={attendanceStatusTone(record.status)} className="me-2">
              {attendanceStatusLabel(record.status)}
            </Badge>
            <span className="att-today__meta">
              {record.workMode === 'WFH' ? 'Remote' : 'Office'}
              {record.checkIn && ` · In ${record.checkIn}`}
              {record.checkOut && ` · Out ${record.checkOut}`}
              {record.hoursWorked > 0 && ` · ${formatDuration(record.hoursWorked * 60)}`}
            </span>
          </>
        ) : (
          <span className="text-muted">You are not present yet — mark present to start your day</span>
        )}
      </div>

      <div className="att-today__actions">
        {today.canCheckIn && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="btn-group" role="group" aria-label="Work mode">
              <button
                type="button"
                className={`btn btn-sm ${mode === 'OFFICE' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setMode('OFFICE')}
              >
                Office
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'WFH' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setMode('WFH')}
              >
                Work from home
              </button>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCheckIn}
              disabled={busyCheckIn}
            >
              {busyCheckIn ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              ) : (
                <>
                  <LogIn size={15} className="me-1" /> Check in
                </>
              )}
            </button>
          </div>
        )}

        {today.canCheckOut && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <input
              type="text"
              className="form-control form-control-sm att-today__note"
              placeholder="Add a note (optional)"
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleCheckOut}
              disabled={busyCheckOut}
            >
              {busyCheckOut ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              ) : (
                <>
                  <LogOut size={15} className="me-1" /> Check out
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}