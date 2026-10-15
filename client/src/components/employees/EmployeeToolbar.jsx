import { Download, Plus, RotateCcw, Search, X } from 'lucide-react';
import {
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
} from '../../utils/constants';

const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
  { value: 'joiningDate:desc', label: 'Newest first' },
  { value: 'joiningDate:asc', label: 'Oldest first' },
  { value: 'employeeId:asc', label: 'Employee ID' },
  { value: 'department:asc', label: 'Department' },
  { value: 'status:desc', label: 'Status' },
];

export default function EmployeeToolbar({
  search,
  onSearch,
  department,
  onDepartment,
  employmentType,
  onEmploymentType,
  status,
  onStatus,
  sort,
  onSort,
  canManage,
  onAdd,
  onExport,
  exporting,
  selectedCount,
  onBulk,
  onClearSelection,
  onReset,
}) {
  return (
    <div className="emp-toolbar">
      <div className="emp-toolbar__row">
        <div className="emp-toolbar__search">
          <Search size={15} />
          <input
            className="form-control"
            placeholder="Search by name, email, ID or phone..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select emp-toolbar__filter"
          value={department}
          onChange={(e) => onDepartment(e.target.value)}
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          className="form-select emp-toolbar__filter"
          value={employmentType}
          onChange={(e) => onEmploymentType(e.target.value)}
          aria-label="Filter by employment type"
        >
          <option value="">All types</option>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          className="form-select emp-toolbar__filter emp-toolbar__filter--sm"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          {EMPLOYEE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          className="form-select emp-toolbar__filter"
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          aria-label="Sort employees"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              Sort: {s.label}
            </option>
          ))}
        </select>

        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onReset} title="Reset filters">
          <RotateCcw size={15} />
        </button>

        {canManage && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm emp-toolbar__export"
            onClick={onExport}
            disabled={exporting}
          >
            {exporting ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <Download size={15} />
            )}
            <span className="d-none d-md-inline ms-1">Export</span>
          </button>
        )}

        {canManage && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onAdd}>
            <Plus size={15} className="me-1" /> Add employee
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="emp-bulk">
          <span className="emp-bulk__count">{selectedCount} selected</span>
          {canManage ? (
            <div className="emp-bulk__actions">
              <button type="button" className="btn btn-sm btn-outline-success" onClick={() => onBulk('activate')}>
                Activate
              </button>
              <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => onBulk('deactivate')}>
                Deactivate
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onBulk('delete')}>
                Delete
              </button>
            </div>
          ) : null}
          <button type="button" className="btn btn-sm btn-link text-muted ms-auto" onClick={onClearSelection}>
            <X size={14} className="me-1" /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
