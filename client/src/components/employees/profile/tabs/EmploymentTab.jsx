import { Detail } from '../ui';
import { employmentTypeLabel, formatDate, roleLabel } from '../../../../utils/constants';

export default function EmploymentTab({ employee }) {
  const manager = employee.manager;
  const managerName = manager
    ? manager.fullName || `${manager.firstName || ''} ${manager.lastName || ''}`.trim()
    : '';

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Employment</h3>
        <span className="panel__hint">{employee.employeeId}</span>
      </div>

      <section className="form-section">
        <h4 className="form-section__title">Position</h4>
        <div className="detail-grid">
          <Detail label="Employee ID" value={employee.employeeId} />
          <Detail label="Designation" value={employee.designation} />
          <Detail label="Department" value={employee.department} />
          <Detail label="System role" value={roleLabel(employee.role)} />
          <Detail label="Manager" value={managerName} />
          <Detail label="Work location" value={employee.workLocation} />
        </div>
      </section>

      <section className="form-section">
        <h4 className="form-section__title">Employment details</h4>
        <div className="detail-grid">
          <Detail label="Joining date" value={formatDate(employee.joiningDate)} />
          <Detail label="Employment type" value={employmentTypeLabel(employee.employmentType)} />
          <Detail label="Status" value={employee.isActive ? 'Active' : 'Inactive'} />
          <Detail label="Record created" value={formatDate(employee.createdAt)} />
          <Detail label="Last updated" value={formatDate(employee.updatedAt)} />
        </div>
      </section>
    </div>
  );
}
