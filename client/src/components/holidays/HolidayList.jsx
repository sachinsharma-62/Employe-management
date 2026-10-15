import { FilterX, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import {
  HOLIDAY_TYPES,
  MONTHS_SHORT,
  holidayScopeLabel,
  holidayTypeLabel,
  holidayTypeTone,
} from '../../utils/constants';

const monthTitle = (key) => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${y}`;
};

const scopeSummary = (holiday) => {
  if (holiday.scope === 'LOCATIONS') {
    return holiday.locations?.length ? holiday.locations.join(', ') : 'Locations';
  }
  if (holiday.scope === 'DEPARTMENTS') {
    return holiday.departments?.length ? holiday.departments.join(', ') : 'Departments';
  }
  return 'All employees';
};

export default function HolidayList({
  grouped,
  loading,
  busy,
  canManage,
  filters,
  meta,
  onFilter,
  onReset,
  onNew,
  onEdit,
  onDelete,
}) {
  const monthKeys = Object.keys(grouped).sort();

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Holiday list</h3>
        {canManage && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onNew}>
            <Plus size={15} className="me-1" /> Add holiday
          </button>
        )}
      </div>

      <div className="holiday-filters">
        <div className="holiday-filters__search">
          <Search size={15} />
          <input
            className="form-control form-control-sm"
            placeholder="Search holidays"
            value={filters.search}
            onChange={(event) => onFilter('search', event.target.value)}
          />
        </div>
        <select
          className="form-select form-select-sm"
          value={filters.type}
          onChange={(event) => onFilter('type', event.target.value)}
        >
          <option value="">All types</option>
          {HOLIDAY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          value={filters.location}
          onChange={(event) => onFilter('location', event.target.value)}
        >
          <option value="">All locations</option>
          {(meta.locations || []).map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          value={filters.department}
          onChange={(event) => onFilter('department', event.target.value)}
        >
          <option value="">All departments</option>
          {(meta.departments || []).map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          value={filters.optional}
          onChange={(event) => onFilter('optional', event.target.value)}
        >
          <option value="">Mandatory & optional</option>
          <option value="true">Optional only</option>
          <option value="false">Mandatory only</option>
        </select>
        {canManage && (
          <label className="holiday-filters__toggle">
            <input
              type="checkbox"
              className="form-check-input"
              checked={filters.includeInactive}
              onChange={(event) => onFilter('includeInactive', event.target.checked)}
            />
            Show inactive
          </label>
        )}
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onReset}>
          <FilterX size={14} className="me-1" /> Reset
        </button>
      </div>

      {loading ? (
        <div className="holiday-empty">
          <span className="spinner-border spinner-border-sm" />{' '}
          <span className="ms-2">Loading holidays…</span>
        </div>
      ) : monthKeys.length ? (
        <div className="holiday-list">
          {monthKeys.map((key) => (
            <div className="holiday-list__group" key={key}>
              <p className="holiday-list__month">
                {monthTitle(key)}
                <span>{grouped[key].length}</span>
              </p>
              <div className="table-responsive">
                <table className="table app-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Holiday</th>
                      <th>Type</th>
                      <th>Optional</th>
                      <th>Applies to</th>
                      <th>Status</th>
                      {canManage && <th className="text-end">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[key].map((holiday) => (
                      <tr key={holiday._id}>
                        <td>
                          <div className="holiday-date-cell">
                            <strong>{holiday.dateISO.slice(8, 10)}</strong>
                            <small>{holiday.dayName?.slice(0, 3)}</small>
                          </div>
                        </td>
                        <td>
                          <strong>{holiday.name}</strong>
                          {holiday.description && (
                            <small className="text-muted d-block holiday-reason-cell">
                              {holiday.description}
                            </small>
                          )}
                        </td>
                        <td>
                          <Badge tone={holidayTypeTone(holiday.type)}>
                            {holidayTypeLabel(holiday.type)}
                          </Badge>
                        </td>
                        <td>
                          {holiday.optional ? (
                            <Badge tone="warning">Optional</Badge>
                          ) : (
                            <span className="text-muted">No</span>
                          )}
                        </td>
                        <td>
                          <span className="holiday-scope-label">
                            {holidayScopeLabel(holiday.scope)}
                          </span>
                          <small className="text-muted d-block holiday-reason-cell">
                            {scopeSummary(holiday)}
                          </small>
                        </td>
                        <td>
                          <Badge tone={holiday.isActive ? 'success' : 'secondary'}>
                            {holiday.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        {canManage && (
                          <td className="text-end">
                            <div className="holiday-actions">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => onEdit(holiday)}
                                disabled={busy === 'holiday'}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => onDelete(holiday)}
                                disabled={busy === 'holiday'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="holiday-empty">
          <strong>No holidays found</strong>
          <small>Adjust the filters or add a holiday to get started.</small>
        </div>
      )}
    </div>
  );
}