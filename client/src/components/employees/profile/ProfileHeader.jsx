import {
  Briefcase,
  Building2,
  CalendarDays,
  Download,
  Mail,
  Pencil,
  Phone,
  StickyNote,
  Upload,
} from 'lucide-react';
import Avatar from '../../Avatar';
import { formatDate, roleLabel } from '../../../utils/constants';

export default function ProfileHeader({
  employee,
  isSelf,
  canManage,
  onEdit,
  onDownload,
  onUpload,
  onAddNote,
  downloading,
}) {
  return (
    <div className="panel emp-profile__header">
      <div className="emp-profile__identity">
        <Avatar user={employee} size={96} className="emp-profile__avatar" />
        <div className="emp-profile__identity-body">
          <div className="emp-profile__name-row">
            <h2>{employee.fullName}</h2>
            <span
              className={`status-dot ${employee.isActive ? 'status-dot--on' : 'status-dot--off'}`}
            >
              {employee.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="emp-profile__role">
            {employee.designation || 'No designation'}
            {employee.department ? ` · ${employee.department}` : ''}
            {isSelf ? ' (You)' : ''}
          </p>
          <div className="emp-profile__meta">
            <span className="emp-profile__id">{employee.employeeId || 'No employee ID'}</span>
            <span className={`role-chip role-chip--${(employee.role || '').toLowerCase()}`}>
              {roleLabel(employee.role)}
            </span>
          </div>
          <div className="emp-profile__chips">
            <span className="emp-profile__chip">
              <Building2 size={14} /> {employee.department || 'No department'}
            </span>
            <span className="emp-profile__chip">
              <Briefcase size={14} /> {employee.designation || 'No designation'}
            </span>
            <span className="emp-profile__chip">
              <CalendarDays size={14} /> Joined {formatDate(employee.joiningDate)}
            </span>
            {employee.email && (
              <a href={`mailto:${employee.email}`} className="emp-profile__chip">
                <Mail size={14} /> {employee.email}
              </a>
            )}
            {employee.phone && (
              <a href={`tel:${employee.phone}`} className="emp-profile__chip">
                <Phone size={14} /> {employee.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="emp-profile__actions">
        {canManage && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onEdit}>
            <Pencil size={15} className="me-1" /> Edit profile
          </button>
        )}
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onDownload}
          disabled={downloading}
        >
          {downloading ? (
            <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />
          ) : (
            <Download size={15} className="me-1" />
          )}
          Download profile
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onUpload}>
          <Upload size={15} className="me-1" /> Upload documents
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onAddNote}>
          <StickyNote size={15} className="me-1" /> Add notes
        </button>
      </div>
    </div>
  );
}
