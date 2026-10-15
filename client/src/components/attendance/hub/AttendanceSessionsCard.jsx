import { Clock3 } from 'lucide-react';
import AttendanceSessionsTable from './AttendanceSessionsTable';
import { minutesToHM } from '../../../utils/attendanceHub';

export default function AttendanceSessionsCard({ hub }) {
  const record = hub.record;
  const sessions = Array.isArray(record?.sessions) ? record.sessions : [];
  const totalMinutes =
    record?.workedMinutes != null
      ? record.workedMinutes
      : sessions.reduce((sum, session) => sum + (session.minutes || 0), 0);

  return (
    <section className="hub-card hub-sessionscard" aria-labelledby="hub-sessions-title">
      <header className="hub-card__head hub-sessionscard__head">
        <h3 id="hub-sessions-title">
          <Clock3 size={15} />
          Today&apos;s Clock In / Clock Out Sessions
        </h3>
        <span className="hub-muted">
          {sessions.length} session{sessions.length === 1 ? '' : 's'} · {minutesToHM(totalMinutes)}{' '}
          completed
        </span>
      </header>
      <AttendanceSessionsTable sessions={sessions} use24={hub.format24} />
    </section>
  );
}
