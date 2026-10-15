import { CalendarCheck } from 'lucide-react';
import profileApi from '../../../../api/profile.api';
import {
  attendanceStatusLabel,
  attendanceStatusTone,
  formatDate,
} from '../../../../utils/constants';
import { Badge, EmptyState, SectionLoading, StatTile } from '../ui';
import useEmployeeData from '../useEmployeeData';

export default function AttendanceTab({ employeeId }) {
  const { data, loading, error } = useEmployeeData(employeeId, profileApi.attendance);

  if (loading) return <SectionLoading label="Loading attendance..." />;
  if (error) return <div className="alert alert-danger py-2">{error}</div>;

  const summary = data?.summary;
  const records = data?.records || [];

  return (
    <div className="stack-lg">
      {summary && (
        <div className="profile-stat-grid">
          <StatTile
            label="Attendance"
            value={`${summary.percentage}%`}
            tone="green"
            icon={CalendarCheck}
          />
          <StatTile label="Present" value={summary.counts.PRESENT} tone="green" />
          <StatTile label="Work from home" value={summary.counts.WFH} tone="cyan" />
          <StatTile label="Late" value={summary.counts.LATE} tone="amber" />
          <StatTile label="Absent" value={summary.counts.ABSENT} tone="rose" />
          <StatTile label="On leave" value={summary.counts.LEAVE} tone="amber" />
          <StatTile label="Half day" value={summary.counts.HALF_DAY} tone="purple" />
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <h3>Attendance log</h3>
          <span className="panel__hint">{records.length} recent record(s)</span>
        </div>

        {records.length ? (
          <div className="table-responsive">
            <table className="table app-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Hours</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <Badge tone={attendanceStatusTone(record.status)}>
                        {attendanceStatusLabel(record.status)}
                      </Badge>
                    </td>
                    <td>{record.checkIn || '—'}</td>
                    <td>{record.checkOut || '—'}</td>
                    <td>{record.hoursWorked ? `${record.hoursWorked}h` : '—'}</td>
                    <td className="text-muted">{record.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={CalendarCheck} title="No attendance records" hint="Attendance data will appear here." />
        )}
      </div>
    </div>
  );
}
