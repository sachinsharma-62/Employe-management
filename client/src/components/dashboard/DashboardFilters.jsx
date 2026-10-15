import { CalendarRange, RefreshCw } from 'lucide-react';

export default function DashboardFilters({ value, onChange, departments, onRefresh, loading }) {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="dash-filters panel">
      <div className="dash-filters__group">
        <label htmlFor="dash-date">
          <CalendarRange size={14} /> As of date
        </label>
        <input
          id="dash-date"
          type="date"
          className="form-control form-control-sm"
          value={value.date}
          onChange={(e) => update({ date: e.target.value })}
        />
      </div>

      <div className="dash-filters__group">
        <label htmlFor="dash-month">Month</label>
        <input
          id="dash-month"
          type="month"
          className="form-control form-control-sm"
          value={value.month}
          onChange={(e) => update({ month: e.target.value })}
        />
      </div>

      <div className="dash-filters__group">
        <label htmlFor="dash-dept">Department</label>
        <select
          id="dash-dept"
          className="form-select form-select-sm"
          value={value.department}
          onChange={(e) => update({ department: e.target.value })}
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-sm dash-filters__refresh"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw size={15} className={loading ? 'spin me-1' : 'me-1'} />
        Refresh
      </button>
    </div>
  );
}
