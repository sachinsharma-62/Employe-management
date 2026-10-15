import { Mail, Pencil, Phone, Power, UserRound } from 'lucide-react';
import Avatar from '../Avatar';
import Modal from '../Modal';
import {
  employmentTypeLabel,
  formatDate,
  genderLabel,
  roleLabel,
} from '../../utils/constants';

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong className={value ? '' : 'detail-item--empty'}>{value || '—'}</strong>
    </div>
  );
}

export default function EmployeeViewModal({
  open,
  employee,
  canManage,
  currentUserId,
  onClose,
  onEdit,
  onToggleStatus,
  onOpenProfile,
}) {
  if (!employee) return null;

  const isSelf = employee._id === currentUserId;
  const manager = employee.manager;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Employee Details"
      subtitle={employee.employeeId || 'Employee profile'}
      icon={UserRound}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          {onOpenProfile && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => onOpenProfile(employee)}
            >
              <UserRound size={15} className="me-1" /> Full profile
            </button>
          )}
          {canManage && (
            <>
              <button
                type="button"
                className={`btn ${employee.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                onClick={() => onToggleStatus(employee)}
                disabled={isSelf}
              >
                <Power size={15} className="me-1" />
                {employee.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => onEdit(employee)}>
                <Pencil size={15} className="me-1" /> Edit
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="employee-view__hero">
        <Avatar user={employee} size={72} />
        <div>
          <h4>{employee.fullName}</h4>
          <p className="mb-1 text-muted">
            {employee.designation || 'No designation'} · {employee.department || 'No department'}
          </p>
          <span className={`status-dot ${employee.isActive ? 'status-dot--on' : 'status-dot--off'}`}>
            {employee.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className={`role-chip role-chip--${(employee.role || '').toLowerCase()} ms-2`}>
            {roleLabel(employee.role)}
          </span>
        </div>
      </div>

      <div className="employee-view__contact">
        <a href={`mailto:${employee.email}`} className="employee-view__chip">
          <Mail size={14} /> {employee.email}
        </a>
        {employee.phone && (
          <a href={`tel:${employee.phone}`} className="employee-view__chip">
            <Phone size={14} /> {employee.phone}
          </a>
        )}
      </div>

      <section className="form-section">
        <h4 className="form-section__title">Personal Information</h4>
        <div className="detail-grid">
          <Detail label="Gender" value={genderLabel(employee.gender)} />
          <Detail label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
          <Detail label="Blood Group" value={employee.bloodGroup} />
        </div>
      </section>

      <section className="form-section">
        <h4 className="form-section__title">Contact Information</h4>
        <div className="detail-grid">
          <Detail label="Work Email" value={employee.email} />
          <Detail label="Personal Email" value={employee.personalEmail} />
          <Detail label="Phone" value={employee.phone} />
          <Detail label="Alternate Phone" value={employee.alternatePhone} />
          <Detail label="Address" value={employee.address} />
          <Detail label="City" value={employee.city} />
          <Detail label="State" value={employee.state} />
          <Detail label="Country" value={employee.country} />
          <Detail label="Pincode" value={employee.pincode} />
        </div>
      </section>

      <section className="form-section">
        <h4 className="form-section__title">Employment Information</h4>
        <div className="detail-grid">
          <Detail label="Employee ID" value={employee.employeeId} />
          <Detail label="Joining Date" value={formatDate(employee.joiningDate)} />
          <Detail label="Department" value={employee.department} />
          <Detail label="Designation" value={employee.designation} />
          <Detail label="Manager" value={manager ? (manager.fullName || `${manager.firstName} ${manager.lastName}`) : '—'} />
          <Detail label="Employment Type" value={employmentTypeLabel(employee.employmentType)} />
          <Detail label="Work Location" value={employee.workLocation} />
          <Detail label="Status" value={employee.isActive ? 'Active' : 'Inactive'} />
        </div>
      </section>

      <section className="form-section">
        <h4 className="form-section__title">Emergency Contact</h4>
        <div className="detail-grid">
          <Detail label="Contact Name" value={employee.emergencyContact?.name} />
          <Detail label="Relationship" value={employee.emergencyContact?.relationship} />
          <Detail label="Phone" value={employee.emergencyContact?.phone} />
          <Detail label="Email" value={employee.emergencyContact?.email} />
          <Detail label="Address" value={employee.emergencyContact?.address} />
        </div>
      </section>
    </Modal>
  );
}
