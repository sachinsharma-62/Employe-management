import {
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  FileText,
  MapPin,
  Plus,
  Star,
  Target,
  TrendingUp,
  UserRound,
  Wallet,
} from 'lucide-react';
import { formatDate, formatMonth, roleLabel } from '../../../../utils/constants';
import { InfoRow, SectionLoading, StatTile } from '../ui';

const ACTIVITY_TONES = {
  profile: 'indigo',
  employment: 'cyan',
  document: 'purple',
  note: 'amber',
  goal: 'green',
};

export default function OverviewTab({
  employee,
  summary,
  recentActivity,
  notes = [],
  onAddNote,
  onGoTo,
}) {
  if (!summary) return <SectionLoading label="Loading overview..." />;

  const managerName = employee.manager
    ? employee.manager.fullName ||
      `${employee.manager.firstName || ''} ${employee.manager.lastName || ''}`.trim()
    : '';

  const leaveBalance = summary.leave.balances.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="stack-lg">
      <div className="profile-stat-grid">
        <StatTile
          label="Attendance"
          value={`${summary.attendance.percentage}%`}
          hint={`${summary.attendance.counts.PRESENT} present · ${summary.attendance.counts.WFH} WFH`}
          tone="green"
          icon={CalendarCheck}
        />
        <StatTile
          label="Leave balance"
          value={`${leaveBalance} days`}
          hint={`${summary.leave.pending} request(s) pending`}
          tone="amber"
          icon={CalendarDays}
        />
        <StatTile
          label="Goals"
          value={`${summary.goals.completed}/${summary.goals.total}`}
          hint={`${summary.goals.avgProgress}% avg progress`}
          tone="indigo"
          icon={Target}
        />
        <StatTile
          label="Avg rating"
          value={summary.performance.avgRating || '—'}
          hint={`${summary.performance.reviews} review(s)`}
          tone="purple"
          icon={Star}
        />
        <StatTile
          label="Documents"
          value={summary.documents}
          hint="Uploaded files"
          tone="cyan"
          icon={FileText}
        />
        <StatTile
          label="Assets"
          value={summary.assetsAssigned}
          hint="Currently assigned"
          tone="blue"
          icon={Briefcase}
        />
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="panel h-100">
            <div className="panel__header">
              <h3>
                <UserRound size={17} className="me-2" /> Employment snapshot
              </h3>
            </div>
            <div className="profile-info">
              <InfoRow icon={Building2} label="Department" value={employee.department} />
              <InfoRow icon={Briefcase} label="Designation" value={employee.designation} />
              <InfoRow icon={UserRound} label="Manager" value={managerName} />
              <InfoRow
                icon={CalendarDays}
                label="Joining date"
                value={formatDate(employee.joiningDate)}
              />
              <InfoRow icon={MapPin} label="Work location" value={employee.workLocation} />
              <InfoRow icon={Wallet} label="Current role" value={roleLabel(employee.role)} />
              {summary.payroll && (
                <InfoRow
                  icon={Wallet}
                  label="Last payroll"
                  value={`${formatMonth(summary.payroll.month)} · ${summary.payroll.status}`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="panel h-100">
            <div className="panel__header">
              <h3>
                <TrendingUp size={17} className="me-2" /> Recent activity
              </h3>
              <button
                type="button"
                className="profile-link"
                onClick={() => onGoTo('activity')}
              >
                View all
              </button>
            </div>
            {recentActivity?.length ? (
              <ul className="profile-timeline">
                {recentActivity.map((item) => (
                  <li key={item._id} className="profile-timeline__item">
                    <span
                      className={`profile-timeline__dot profile-timeline__dot--${
                        ACTIVITY_TONES[item.type] || 'indigo'
                      }`}
                    />
                    <div>
                      <strong>{item.action}</strong>
                      <p>{item.description}</p>
                      <small>{formatDate(item.createdAt)}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mb-0">No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Notes</h3>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onAddNote}>
            <Plus size={15} className="me-1" /> Add note
          </button>
        </div>
        {notes.length ? (
          <ul className="note-list">
            {notes.slice(0, 4).map((note) => {
              const author = note.author;
              const authorName = author
                ? author.fullName || `${author.firstName} ${author.lastName}`
                : 'System';
              return (
                <li className="note-item" key={note._id}>
                  <div className="note-item__head">
                    <strong>{authorName}</strong>
                    <small>{formatDate(note.createdAt)}</small>
                  </div>
                  <p>{note.body}</p>
                  <span className="note-item__tag">{note.visibility}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted mb-0">No notes added yet.</p>
        )}
      </div>
    </div>
  );
}
