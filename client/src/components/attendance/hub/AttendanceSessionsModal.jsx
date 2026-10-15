import { Clock3 } from 'lucide-react';
import Modal from '../../Modal';
import AttendanceSessionsTable from './AttendanceSessionsTable';
import { formatDate, attendanceStatusLabel } from '../../../utils/constants';
import { minutesToHM } from '../../../utils/attendanceHub';

export default function AttendanceSessionsModal({ open, record, use24 = true, onClose }) {
  if (!record) return null;

  const employee = record.employee || null;
  const sessions = record.sessions || [];
  const totalMinutes =
    record.workedMinutes != null
      ? record.workedMinutes
      : record.effectiveMinutes != null
      ? record.effectiveMinutes
      : sessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
  const firstCheckIn =
    record.firstCheckIn || record.checkInStr || sessions.find((s) => s.checkIn)?.checkIn || '';
  const lastCheckOut =
    record.lastCheckOut ||
    record.checkOutStr ||
    [...sessions].reverse().find((s) => s.checkOut)?.checkOut ||
    '';
  const name = employee
    ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
    : '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Daily attendance sessions"
      subtitle={`${name ? `${name} · ` : ''}${formatDate(record.date)}`}
      icon={Clock3}
    >
      <div className="hub-sessions-summary">
        <div>
          <span>Status</span>
          <strong>{attendanceStatusLabel(record.status)}</strong>
        </div>
        <div>
          <span>Sessions</span>
          <strong>{sessions.length}</strong>
        </div>
        <div>
          <span>First In</span>
          <strong>{firstCheckIn || '—'}</strong>
        </div>
        <div>
          <span>Last Out</span>
          <strong>{lastCheckOut || '—'}</strong>
        </div>
        <div>
          <span>Total Working</span>
          <strong>{minutesToHM(totalMinutes)}</strong>
        </div>
      </div>
      <AttendanceSessionsTable sessions={sessions} use24={use24} />
    </Modal>
  );
}
