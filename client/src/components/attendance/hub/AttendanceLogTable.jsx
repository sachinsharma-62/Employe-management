import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  LogIn,
  LogOut,
  MapPin,
} from 'lucide-react';
import ActionMenu from './ActionMenu';
import AttendanceTimeline from './AttendanceTimeline';
import { formatDateLabel, fromDateKey, minutesToClock, minutesToHM } from '../../../utils/attendanceHub';

const effectiveTone = (minutes) => {
  if (minutes >= 480) return 'green';
  if (minutes >= 360) return 'yellow';
  return 'orange';
};

function ArrivalCell({ record }) {
  if (['WEEKLY_OFF', 'HOLIDAY', 'LEAVE'].includes(record.status)) {
    return <span className="hub-muted">—</span>;
  }
  if (record.status === 'ABSENT' || record.status === 'NOT_CLOCKED_IN') {
    return (
      <span className="hub-arrival hub-arrival--absent">
        <AlertTriangle size={14} />
        {record.status === 'NOT_CLOCKED_IN' ? 'Not clocked in' : 'Absent'}
      </span>
    );
  }
  if (record.lateMinutes > 0) {
    return (
      <span className="hub-arrival hub-arrival--late">
        <Clock size={14} />
        {record.lateMinutes}m late
      </span>
    );
  }
  return (
    <span className="hub-arrival hub-arrival--ontime">
      <CheckCircle2 size={14} />
      On time
    </span>
  );
}

function LogCell({ record, onView, onRegularise, use24 = true }) {
  const formattedIn = record.checkInStr
    ? record.checkInStr
    : record.checkIn != null
    ? minutesToClock(record.checkIn, use24)
    : 'Not recorded';

  const formattedOut = record.checkOutStr
    ? record.checkOutStr
    : record.checkOut != null
    ? minutesToClock(record.checkOut, use24)
    : 'Not recorded';

  let triggerIcon = <CheckCircle2 size={16} className="text-success" />;
  if (record.pendingCorrection) {
    triggerIcon = <AlertTriangle size={16} className="text-warning" />;
  } else if (record.status === 'ABSENT' || record.status === 'NOT_CLOCKED_IN') {
    triggerIcon = <AlertTriangle size={16} className="text-danger" />;
  } else if (['WEEKLY_OFF', 'HOLIDAY', 'LEAVE'].includes(record.status)) {
    triggerIcon = <Clock size={16} className="text-secondary" />;
  }

  const items = [
    { label: `Clock in: ${formattedIn}`, icon: LogIn, disabled: true },
    { label: `Clock out: ${formattedOut}`, icon: LogOut, disabled: true },
  ];

  if (!['WEEKLY_OFF', 'HOLIDAY'].includes(record.status)) {
    items.push({
      label: 'Regularise attendance',
      icon: ClipboardList,
      onClick: () => onRegularise?.(record),
    });
  }

  items.push({
    label: 'View details',
    icon: Eye,
    onClick: () => onView?.(record),
  });

  return (
    <ActionMenu
      label={`Attendance log for ${record.date}`}
      trigger={<span className="hub-logstate">{triggerIcon}</span>}
      items={items}
    />
  );
}

export default function AttendanceLogTable({
  records,
  visibleCount,
  onLoadMore,
  onViewDay,
  onRegularise,
  use24 = true,
}) {
  const visible = records.slice(0, visibleCount);
  const hasMore = visibleCount < records.length;

  if (records.length === 0) {
    return (
      <div className="hub-empty">
        <p>No attendance records for the selected range.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hub-table-wrap">
        <table className="hub-table">
          <thead>
            <tr>
              <th scope="col">DATE</th>
              <th scope="col">ATTENDANCE VISUAL</th>
              <th scope="col">EFFECTIVE HOURS</th>
              <th scope="col">BREAK TAKEN</th>
              <th scope="col">GROSS HOURS</th>
              <th scope="col">ARRIVAL</th>
              <th scope="col" className="hub-table__logcol">LOG</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((record) => {
              const weeklyOff = record.status === 'WEEKLY_OFF';
              const tone = effectiveTone(record.effectiveMinutes);
              return (
                <tr
                  key={record.id}
                  className={weeklyOff ? 'is-weekoff' : ''}
                  onDoubleClick={() => onViewDay?.(record)}
                >
                  <td>
                    <div className="hub-date">
                      <span className="hub-date__day">{formatDateLabel(fromDateKey(record.date))}</span>
                      {weeklyOff && <span className="hub-badge hub-badge--muted">W-OFF</span>}
                      {record.isToday && <span className="hub-badge hub-badge--primary ms-1">Today</span>}
                    </div>
                    {weeklyOff && <span className="hub-date__sub">Full day Weekly-off</span>}
                  </td>
                  <td>
                    <div className="hub-timeline-cell">
                      <AttendanceTimeline record={record} />
                      {record.location && (
                        <span className="hub-location" title={record.location}>
                          <MapPin size={13} />
                          {record.location}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="hub-hours">
                      {record.effectiveMinutes > 0 && (
                        <span className={`hub-dot hub-dot--${tone}`} />
                      )}
                      {weeklyOff || record.effectiveMinutes === 0
                        ? '—'
                        : minutesToHM(record.effectiveMinutes)}
                    </span>
                  </td>
                  <td>
                    <span className="hub-muted">
                      {weeklyOff || record.breakMinutes === 0
                        ? '—'
                        : minutesToHM(record.breakMinutes)}
                    </span>
                  </td>
                  <td>
                    <span className="hub-hours">
                      {weeklyOff || record.grossMinutes === 0
                        ? '—'
                        : minutesToHM(record.grossMinutes)}
                    </span>
                  </td>
                  <td>
                    <ArrivalCell record={record} />
                  </td>
                  <td className="hub-table__logcol">
                    <LogCell record={record} onView={onViewDay} onRegularise={onRegularise} use24={use24} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore ? (
        <div className="hub-loadmore">
          <button type="button" className="hub-btn hub-btn--ghost" onClick={onLoadMore}>
            Load more
          </button>
          <span className="hub-muted">
            Showing {visible.length} of {records.length}
          </span>
        </div>
      ) : (
        <div className="hub-loadmore">
          <span className="hub-muted">{records.length} records</span>
        </div>
      )}
    </>
  );
}
