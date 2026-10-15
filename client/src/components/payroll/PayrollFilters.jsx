import { CalendarPlus, Download, RotateCcw, Search } from 'lucide-react';
import { DEPARTMENTS, PAYROLL_STATUSES } from '../../utils/constants';

export default function PayrollFilters({
  filters,
  onChange,
  onReset,
  monthOptions,
  canManage,
  onGenerate,
  onDownload,
  generating,
}) {
  return (
    <div className="panel payroll-filters">
      <div className="payroll-filters__grid">
        <div className="payroll-filters__group">
          <label htmlFor="payroll-month">Payroll month</label>
          <input
            id="payroll-month"
            type="month"
            className="form-control form-control-sm"
            list="payroll-month-options"
            value={filters.month}
            onChange={(event) => onChange('month', event.target.value)}
          />
          <datalist id="payroll-month-options">
            {monthOptions.map((month) => (
              <option key={month} value={month} />
            ))}
          </datalist>
        </div>

        <div className="payroll-filters__group">
          <label htmlFor="payroll-department">Department</label>
          <select
            id="payroll-department"
            className="form-select form-select-sm"
            value={filters.department}
            onChange={(event) => onChange('department', event.target.value)}
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="payroll-filters__group">
          <label htmlFor="payroll-status">Status</label>
          <select
            id="payroll-status"
            className="form-select form-select-sm"
            value={filters.status}
            onChange={(event) => onChange('status', event.target.value)}
          >
            <option value="">All statuses</option>
            {PAYROLL_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="payroll-filters__group payroll-filters__group--search">
          <label htmlFor="payroll-search">Search</label>
          <div className="payroll-search">
            <Search size={15} />
            <input
              id="payroll-search"
              type="search"
              className="form-control form-control-sm"
              placeholder="Name, email or employee ID"
              value={filters.search}
              onChange={(event) => onChange('search', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="payroll-filters__actions">
        <button type="button" className="btn btn-light btn-sm" onClick={onReset}>
          <RotateCcw size={14} className="me-1" /> Reset
        </button>
        <button type="button" className="btn btn-light btn-sm" onClick={onDownload}>
          <Download size={14} className="me-1" /> Salary report
        </button>
        {canManage && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onGenerate}
            disabled={generating}
          >
            <CalendarPlus size={14} className="me-1" />
            {generating ? 'Generating...' : 'Generate payroll'}
          </button>
        )}
      </div>
    </div>
  );
}
