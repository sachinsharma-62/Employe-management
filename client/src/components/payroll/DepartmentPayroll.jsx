import { Building2 } from 'lucide-react';
import { formatCurrency, formatMonthLong } from '../../utils/constants';

export default function DepartmentPayroll({ departments, month, loading }) {
  const max = departments.reduce((peak, dept) => Math.max(peak, dept.net), 0);

  return (
    <section className="panel">
      <div className="panel__header">
        <h3>
          <Building2 size={17} className="me-2" /> Department payroll
        </h3>
        <span className="panel__hint">{formatMonthLong(month)}</span>
      </div>

      {loading ? (
        <div className="dash-empty py-4">
          <span>Loading department breakdown...</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="dash-empty py-4">
          <span>No department data</span>
          <small>Generate payroll to see the department-wise split.</small>
        </div>
      ) : (
        <ul className="dept-payroll">
          {departments.map((dept) => (
            <li key={dept.department} className="dept-payroll__item">
              <div className="dept-payroll__head">
                <span className="dept-payroll__name">{dept.department}</span>
                <span className="dept-payroll__meta">
                  {dept.employees} emp · {dept.paid} paid
                </span>
                <strong>{formatCurrency(dept.net)}</strong>
              </div>
              <div className="dept-payroll__track">
                <span
                  className="dept-payroll__bar"
                  style={{ width: `${max ? Math.round((dept.net / max) * 100) : 0}%` }}
                />
              </div>
              <div className="dept-payroll__foot">
                <small>Gross {formatCurrency(dept.gross)}</small>
                <small>Deductions {formatCurrency(dept.deductions)}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
