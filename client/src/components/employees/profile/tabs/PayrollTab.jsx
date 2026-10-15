import { Download, Wallet } from 'lucide-react';
import profileApi from '../../../../api/profile.api';
import {
  formatCurrency,
  formatDate,
  formatMonth,
  payrollStatusLabel,
  payrollStatusTone,
} from '../../../../utils/constants';
import { Badge, EmptyState, SectionLoading, StatTile } from '../ui';
import useEmployeeData from '../useEmployeeData';

export default function PayrollTab({ employeeId }) {
  const { data, loading, error } = useEmployeeData(employeeId, profileApi.payroll);

  if (loading) return <SectionLoading label="Loading payroll..." />;
  if (error) return <div className="alert alert-danger py-2">{error}</div>;

  const records = data?.records || [];
  const summary = data?.summary;

  return (
    <div className="stack-lg">
      {summary && (
        <div className="profile-stat-grid">
          <StatTile
            label="Latest net pay"
            value={
              summary.latest
                ? formatCurrency(summary.latest.netSalary ?? summary.latest.netPay, summary.currency)
                : '—'
            }
            hint={summary.latest ? formatMonth(summary.latest.month) : ''}
            tone="green"
            icon={Wallet}
          />
          <StatTile
            label="Months paid"
            value={summary.totalPaidMonths}
            hint="On record"
            tone="cyan"
            icon={Download}
          />
          <StatTile
            label="Total net paid"
            value={formatCurrency(summary.totalNetPaid, summary.currency)}
            tone="indigo"
            icon={Wallet}
          />
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <h3>Payroll history</h3>
          <span className="panel__hint">{records.length} payslip(s)</span>
        </div>

        {records.length ? (
          <div className="table-responsive">
            <table className="table app-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="text-end">Gross</th>
                  <th className="text-end">Total earnings</th>
                  <th className="text-end">Deductions</th>
                  <th className="text-end">Net pay</th>
                  <th>Status</th>
                  <th>Pay date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td className="fw-semibold">{formatMonth(record.month)}</td>
                    <td className="text-end">
                      {formatCurrency(record.grossSalary, record.currency)}
                    </td>
                    <td className="text-end">
                      {formatCurrency(record.totalEarnings, record.currency)}
                    </td>
                    <td className="text-end text-danger">
                      {formatCurrency(record.totalDeductions, record.currency)}
                    </td>
                    <td className="text-end fw-semibold">
                      {formatCurrency(record.netSalary, record.currency)}
                    </td>
                    <td>
                      <Badge tone={payrollStatusTone(record.status)}>
                        {payrollStatusLabel(record.status)}
                      </Badge>
                    </td>
                    <td>{formatDate(record.payDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Wallet} title="No payroll records" hint="Salary records will appear here." />
        )}
      </div>
    </div>
  );
}
