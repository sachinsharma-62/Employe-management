import { useState } from 'react';
import { BadgeIndianRupee, Download, Eye, Wallet } from 'lucide-react';
import useMyPayslips from '../../hooks/useMyPayslips';
import PayslipModal from '../../components/payroll/PayslipModal';
import { Badge, EmptyState, SectionLoading, StatTile } from '../../components/employees/profile/ui';
import {
  formatCurrency,
  formatDate,
  formatMonth,
  formatMonthLong,
  payrollStatusLabel,
  payrollStatusTone,
} from '../../utils/constants';

export default function MyPayslipsPage() {
  const { records, summary, loading, error, downloading, downloadPayslip } = useMyPayslips();
  const [view, setView] = useState(null);

  return (
    <div className="hub stack-lg payroll-page">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <BadgeIndianRupee size={18} />
        </span>
        <div>
          <h1>My Payslips</h1>
          <p>View and download your monthly salary payslips</p>
        </div>
      </header>

      {error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <SectionLoading label="Loading your payslips..." />
      ) : (
        <>
          <div className="profile-stat-grid">
            <StatTile
              label="Latest net pay"
              value={
                summary?.latest
                  ? formatCurrency(summary.latest.netSalary, summary.latest.currency)
                  : '—'
              }
              hint={summary?.latest ? formatMonthLong(summary.latest.month) : 'No payslips yet'}
              tone="green"
              icon={Wallet}
            />
            <StatTile
              label="Months on record"
              value={records.length}
              hint={`${summary?.totalPaidMonths || 0} paid`}
              tone="cyan"
              icon={BadgeIndianRupee}
            />
            <StatTile
              label="Total net paid"
              value={formatCurrency(summary?.totalNetPaid, summary?.currency)}
              tone="indigo"
              icon={Wallet}
            />
          </div>

          <section className="panel">
            <div className="panel__header">
              <h3>Payslip history</h3>
              <span className="panel__hint">{records.length} payslip(s)</span>
            </div>

            {records.length ? (
              <div className="table-responsive">
                <table className="table app-table align-middle mb-0 payroll-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="text-end">Gross</th>
                      <th className="text-end">Earnings</th>
                      <th className="text-end">Deductions</th>
                      <th className="text-end">Net pay</th>
                      <th>Status</th>
                      <th>Pay date</th>
                      <th className="text-end">Actions</th>
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
                        <td>{record.payDate ? formatDate(record.payDate) : '—'}</td>
                        <td>
                          <div className="payroll-table__actions">
                            <button
                              type="button"
                              className="btn btn-light btn-sm"
                              title="View payslip"
                              onClick={() => setView(record)}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-light btn-sm"
                              title="Download payslip"
                              disabled={downloading === record._id}
                              onClick={() => downloadPayslip(record)}
                            >
                              <Download size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={BadgeIndianRupee}
                title="No payslips yet"
                hint="Your payslips will appear here once payroll is generated and approved."
              />
            )}
          </section>
        </>
      )}

      <PayslipModal
        open={Boolean(view)}
        record={view}
        onClose={() => setView(null)}
        onDownload={() => view && downloadPayslip(view)}
      />
    </div>
  );
}
