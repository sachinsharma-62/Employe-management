import { useEffect, useState } from 'react';
import { minutesToClock, minutesToHM } from '../../../utils/attendanceHub';

const toMin = (value) => {
  if (!value) return null;
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

export default function AttendanceSessionsTable({ sessions = [], use24 = true }) {
  const [now, setNow] = useState(() => new Date());
  const hasOpen = sessions.some((session) => session.checkIn && !session.checkOut);

  useEffect(() => {
    if (!hasOpen) return undefined;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [hasOpen]);

  if (sessions.length === 0) {
    return (
      <div className="hub-empty">
        <p>No clock in / clock out sessions recorded yet.</p>
      </div>
    );
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const completedTotal = sessions.reduce((sum, session) => sum + (session.minutes || 0), 0);

  return (
    <div className="hub-table-wrap">
      <table className="hub-table hub-table--sessions">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">CLOCK IN</th>
            <th scope="col">CLOCK OUT</th>
            <th scope="col">DURATION</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session, index) => {
            const open = session.checkIn && !session.checkOut;
            const inMin = toMin(session.checkIn);
            const outMin = toMin(session.checkOut);
            const minutes = open
              ? inMin != null
                ? Math.max(0, nowMin - inMin)
                : null
              : session.minutes != null
              ? session.minutes
              : inMin != null && outMin != null
              ? Math.max(0, outMin - inMin)
              : null;

            return (
              <tr key={`${session.checkIn}-${index}`} className={open ? 'is-open' : ''}>
                <td className="hub-table__index">{index + 1}</td>
                <td className="text-nowrap">
                  {inMin != null ? minutesToClock(inMin, use24) : '—'}
                </td>
                <td className="text-nowrap">
                  {open ? (
                    <span className="hub-badge hub-badge--warning">In progress</span>
                  ) : outMin != null ? (
                    minutesToClock(outMin, use24)
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {minutes != null ? minutesToHM(minutes) : '—'}
                  {open && <span className="hub-muted"> (live)</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Total completed working time</td>
            <td>{minutesToHM(completedTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
