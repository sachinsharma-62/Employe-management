import { ShieldCheck } from 'lucide-react';
import { ROLE_LABELS, ROLES } from '../../utils/constants';

const MATRIX = [
  {
    module: 'Dashboard',
    view: 'All roles',
    manage: ROLES.SUPER_ADMIN,
  },
  {
    module: 'Employees',
    view: 'Super Admin, HR Admin, Manager',
    manage: 'Super Admin, HR Admin',
  },
  {
    module: 'Organization (departments, designations, locations)',
    view: 'Super Admin, HR Admin, Manager',
    manage: 'Super Admin, HR Admin',
  },
  {
    module: 'Attendance rules & corrections',
    view: 'All roles',
    manage: 'Super Admin, HR Admin',
  },
  {
    module: 'Leave — types & approvals',
    view: 'Super Admin, HR Admin',
    manage: 'Super Admin, HR Admin',
  },
  {
    module: 'Holidays',
    view: 'All roles',
    manage: 'Super Admin, HR Admin',
  },
  {
    module: 'Events',
    view: 'All roles',
    manage: 'Super Admin, HR Admin, Manager',
  },
  {
    module: 'Payroll',
    view: 'Super Admin, HR Admin, Manager',
    manage: 'Super Admin, HR Admin',
  },
  {
    module: 'Documents',
    view: 'Super Admin, HR Admin, Manager',
    manage: 'Super Admin, HR Admin',
  },
  {
    module: 'Settings',
    view: 'Super Admin, HR Admin, Manager',
    manage: 'Super Admin, HR Admin',
  },
  {
    module: 'Role changes',
    view: '—',
    manage: 'Super Admin only',
  },
];

export default function RolesSettingsPanel() {
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>
          <ShieldCheck size={17} className="me-2" /> Role permissions
        </h3>
        <span className="panel__hint">Where each role can view and manage data</span>
      </div>

      <div className="d-flex align-items-start gap-3 roles-legend">
        <span className="roles-legend__item">
          <span className="role-chip role-chip--manage" /> Manages
        </span>
        <span className="roles-legend__item">
          <span className="role-chip role-chip--view" /> View only
        </span>
      </div>

      <div className="table-responsive">
        <table className="table app-table align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: '34%' }}>Module</th>
              <th>Can view</th>
              <th>Can manage</th>
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row) => (
              <tr key={row.module}>
                <td>
                  <strong>{row.module}</strong>
                </td>
                <td className="text-muted">{row.view}</td>
                <td>
                  <span className="role-chip role-chip--manage">{row.manage}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted small mt-3 mb-0">
        Super Admin can also change any employee's role from their profile. Permissions for{' '}
        {Object.values(ROLE_LABELS).join(', ')} are enforced on every API route.
      </p>
    </div>
  );
}