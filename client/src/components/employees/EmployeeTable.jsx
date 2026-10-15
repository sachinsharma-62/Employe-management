import { useEffect, useRef } from 'react';
import { Eye, Mail, Pencil, Phone, Power, Trash2 } from 'lucide-react';
import Avatar from '../Avatar';
import { employmentTypeLabel, formatDate } from '../../utils/constants';

const COLUMNS = [
  { key: 'employeeId', label: 'Employee ID', sortable: true },
  { key: 'name', label: 'Employee', sortable: true },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'designation', label: 'Designation', sortable: true },
  { key: 'manager', label: 'Manager', sortable: false },
  { key: 'joiningDate', label: 'Joining Date', sortable: true },
  { key: 'employmentType', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export default function EmployeeTable({
  employees,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  someSelected,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onOpenProfile,
  canManage,
  currentUserId,
}) {
  const headerRef = useRef(null);

  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  const renderSortIcon = (key) => {
    if (sortBy !== key) return null;
    return <span className="emp-table__sort">{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle app-table emp-table mb-0">
        <thead>
          <tr>
            <th className="emp-table__check">
              <input
                ref={headerRef}
                type="checkbox"
                className="form-check-input"
                checked={allSelected}
                onChange={onToggleSelectAll}
                aria-label="Select all employees"
              />
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? 'emp-table__th--sortable' : ''}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
              >
                {col.label}
                {renderSortIcon(col.key)}
              </th>
            ))}
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && employees.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length + 2} className="text-center text-muted py-5">
                Loading employees...
              </td>
            </tr>
          ) : employees.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length + 2} className="text-center text-muted py-5">
                No employees found
              </td>
            </tr>
          ) : (
            employees.map((emp) => {
              const isSelf = emp._id === currentUserId;
              return (
                <tr key={emp._id} className={selectedIds.includes(emp._id) ? 'is-selected' : ''}>
                  <td className="emp-table__check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedIds.includes(emp._id)}
                      onChange={() => onToggleSelect(emp._id)}
                      aria-label={`Select ${emp.fullName}`}
                    />
                  </td>
                  <td>
                    <span className="emp-table__id">{emp.employeeId || '—'}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="emp-table__person"
                      onClick={() => (onOpenProfile ? onOpenProfile(emp) : onView(emp))}
                      title="Open profile"
                    >
                      <Avatar user={emp} size={34} />
                      <span>
                        <strong>{emp.fullName}</strong>
                        <small>{emp.role?.replace('_', ' ')}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <a href={`mailto:${emp.email}`} className="emp-table__link">
                      <Mail size={13} /> {emp.email}
                    </a>
                  </td>
                  <td>
                    {emp.phone ? (
                      <a href={`tel:${emp.phone}`} className="emp-table__link">
                        <Phone size={13} /> {emp.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{emp.department || '—'}</td>
                  <td>{emp.designation || '—'}</td>
                  <td>
                    {emp.manager
                      ? emp.manager.fullName || `${emp.manager.firstName} ${emp.manager.lastName}`
                      : '—'}
                  </td>
                  <td>{formatDate(emp.joiningDate)}</td>
                  <td>
                    <span className="emp-type-chip">{employmentTypeLabel(emp.employmentType)}</span>
                  </td>
                  <td>
                    <span className={`status-dot ${emp.isActive ? 'status-dot--on' : 'status-dot--off'}`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="emp-actions">
                      <button
                        type="button"
                        className="emp-actions__btn"
                        onClick={() => onView(emp)}
                        title="View"
                      >
                        <Eye size={15} />
                      </button>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            className="emp-actions__btn"
                            onClick={() => onEdit(emp)}
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="emp-actions__btn"
                            onClick={() => onToggleStatus(emp)}
                            disabled={isSelf}
                            title={emp.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            className="emp-actions__btn emp-actions__btn--danger"
                            onClick={() => onDelete(emp)}
                            disabled={isSelf}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
