import { CalendarClock, RotateCcw, Search } from 'lucide-react';
import {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  DOCUMENT_VERIFICATION_STATUSES,
} from '../../utils/constants';

export default function DocumentFilters({ filters, employees, onFilter, onReset }) {
  return (
    <div className="doc-filters">
      <div className="doc-filters__group doc-filters__group--search">
        <label htmlFor="doc-search">Search</label>
        <div className="doc-search">
          <Search size={15} />
          <input
            id="doc-search"
            className="form-control form-control-sm"
            placeholder="Document name, file or type"
            value={filters.search}
            onChange={(event) => onFilter('search', event.target.value)}
          />
        </div>
      </div>

      {employees && (
        <div className="doc-filters__group">
          <label htmlFor="doc-employee">Employee</label>
          <select
            id="doc-employee"
            className="form-select form-select-sm"
            value={filters.employee}
            onChange={(event) => onFilter('employee', event.target.value)}
          >
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.firstName} {employee.lastName}
                {employee.employeeId ? ` (${employee.employeeId})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="doc-filters__group">
        <label htmlFor="doc-type">Type</label>
        <select
          id="doc-type"
          className="form-select form-select-sm"
          value={filters.documentType}
          onChange={(event) => onFilter('documentType', event.target.value)}
        >
          <option value="">All types</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="doc-filters__group">
        <label htmlFor="doc-verification">Verification</label>
        <select
          id="doc-verification"
          className="form-select form-select-sm"
          value={filters.verificationStatus}
          onChange={(event) => onFilter('verificationStatus', event.target.value)}
        >
          <option value="">All</option>
          {DOCUMENT_VERIFICATION_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div className="doc-filters__group">
        <label htmlFor="doc-status">Status</label>
        <select
          id="doc-status"
          className="form-select form-select-sm"
          value={filters.status}
          onChange={(event) => onFilter('status', event.target.value)}
        >
          <option value="">All</option>
          {DOCUMENT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div className="doc-filters__actions">
        <button
          type="button"
          className={`btn btn-sm ${filters.expiring ? 'btn-warning' : 'btn-outline-secondary'}`}
          onClick={() => onFilter('expiring', !filters.expiring)}
          title="Show documents expiring within 30 days"
        >
          <CalendarClock size={14} className="me-1" /> Expiring
        </button>
        <button type="button" className="btn btn-light btn-sm" onClick={onReset}>
          <RotateCcw size={14} className="me-1" /> Reset
        </button>
      </div>
    </div>
  );
}
