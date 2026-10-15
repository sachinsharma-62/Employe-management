import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import { formatCurrency, formatMonth, formatMonthLong } from '../../utils/constants';

const CHART_COLORS = ['#4f46e5', '#0891b2', '#16a34a', '#f59e0b', '#7c3aed', '#e11d48', '#0d9488', '#2563eb'];

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  fontSize: 12,
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
};

const compact = (value) => `₹${Math.round(Number(value) / 1000)}k`;

export default function PayrollReports({ report, loading, month, onDownload }) {
  const trend = report?.trend || [];
  const departments = report?.departments || [];
  const summary = report?.summary;

  return (
    <div className="stack-lg">
      <div className="panel payroll-report__head">
        <div>
          <h3>
            <BarChart3 size={17} className="me-2" /> Salary report
          </h3>
          <p className="mb-0 text-muted small">
            Payroll analytics for {formatMonthLong(month)}
          </p>
        </div>
        <button type="button" className="btn btn-light btn-sm" onClick={onDownload}>
          <Download size={14} className="me-1" /> Download report
        </button>
      </div>

      {summary && (
        <div className="payroll-report__stats">
          <div>
            <span>Total earnings</span>
            <strong>{formatCurrency(summary.totalEarnings)}</strong>
          </div>
          <div>
            <span>Total deductions</span>
            <strong className="text-danger">{formatCurrency(summary.totalDeductions)}</strong>
          </div>
          <div>
            <span>Net payout</span>
            <strong>{formatCurrency(summary.totalNet)}</strong>
          </div>
          <div>
            <span>Payslips</span>
            <strong>{summary.total}</strong>
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-lg-7">
          <section className="panel h-100">
            <div className="panel__header">
              <h3>Payroll trend</h3>
              <span className="panel__hint">Last 6 months</span>
            </div>
            {loading ? (
              <div className="dash-empty py-5">
                <span>Loading report...</span>
              </div>
            ) : (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={11} />
                    <YAxis tickFormatter={compact} fontSize={11} width={48} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={formatMonth}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="gross" name="Gross" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deductions" name="Deductions" fill="#fecdd3" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="net" name="Net pay" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>

        <div className="col-lg-5">
          <section className="panel h-100">
            <div className="panel__header">
              <h3>Net pay by department</h3>
            </div>
            {loading ? (
              <div className="dash-empty py-5">
                <span>Loading...</span>
              </div>
            ) : departments.length === 0 ? (
              <div className="dash-empty py-5">
                <span>No department data</span>
              </div>
            ) : (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departments}
                      dataKey="net"
                      nameKey="department"
                      innerRadius={54}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {departments.map((dept, index) => (
                        <Cell key={dept.department} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      </div>

      {departments.length > 0 && (
        <section className="panel">
          <div className="panel__header">
            <h3>Department summary</h3>
          </div>
          <div className="table-responsive">
            <table className="table app-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Department</th>
                  <th className="text-end">Employees</th>
                  <th className="text-end">Gross</th>
                  <th className="text-end">Net</th>
                  <th style={{ width: '30%' }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => {
                  const totalNet = departments.reduce((sum, d) => sum + d.net, 0);
                  const share = totalNet ? Math.round((dept.net / totalNet) * 100) : 0;
                  return (
                    <tr key={dept.department}>
                      <td className="fw-semibold">{dept.department}</td>
                      <td className="text-end">{dept.employees}</td>
                      <td className="text-end">{formatCurrency(dept.gross)}</td>
                      <td className="text-end fw-semibold">{formatCurrency(dept.net)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="dept-payroll__track flex-grow-1">
                            <span
                              className="dept-payroll__bar"
                              style={{
                                width: `${share}%`,
                                background: CHART_COLORS[index % CHART_COLORS.length],
                              }}
                            />
                          </div>
                          <small className="text-muted">{share}%</small>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
