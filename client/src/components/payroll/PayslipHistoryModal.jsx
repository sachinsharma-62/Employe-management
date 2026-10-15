import { Download, Eye, History, Send } from 'lucide-react';
import Modal from '../Modal';
import Avatar from '../Avatar';
import { EmptyState, SectionLoading } from '../employees/profile/ui';
import {
  formatCurrency,
  formatDate,
  formatMonth,
  payrollStatusLabel,
  payrollStatusTone,
} from '../../utils/constants';

const toneClass = (tone) => `badge-soft badge-soft--${tone}`;

export default function PayslipHistoryModal({
  open,
  data,
  loading,
  canManage,
  onClose,
  onView,
  onDownload,
  onSend,
}) {
  const employee = data?.employee || {};
  const records = data?.records || [];
  const summary = data?.summary;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Payslip history"
      subtitle={employee.firstName ? `${employee.firstName} ${employee.lastName}` : 'Employee'}
      icon={History}
      size="lg"
      footer={
        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {loading ? (
        <SectionLoading label="Loading payslip history..." />
      ) : (
        <div className="stack-lg">
          <div className="payslip__head">
            {employee.firstName ? (
              <Avatar user={employee} size={44} />
            ) : (
              <span className="payroll-table__avatar-fallback" />
            )}
            <div className="payslip__head-info">
              <strong>
                {employee.firstName ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}
              </strong>
              <small>
                {employee.employeeId || '—'} · {employee.designation || '—'} ·{' '}
                {employee.department || '—'}
              </small>
            </div>
          </div>

          {summary && (
            <div className="payroll-report__stats">
              <div>
                <span>Payslips</span>
                <strong>{summary.total}</strong>
              </div>
              <div>
                <span>Months paid</span>
                <strong>{summary.paidMonths}</strong>
              </div>
              <div>
                <span>Total net paid</span>
                <strong>{formatCurrency(summary.totalNetPaid, summary.currency)}</strong>
              </div>
              <div>
                <span>Last sent</span>
                <strong>{summary.lastSentAt ? formatDate(summary.lastSentAt) : '—'}</strong>
              </div>
            </div>
          )}

          {records.length ? (
            <div className="table-responsive">
              <table className="table app-table align-middle mb-0 payroll-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Gross</th>
                    <th className="text-end">Net pay</th>
                    <th>Status</th>
                    <th>Sent</th>
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
                      <td className="text-end fw-semibold">
                        {formatCurrency(record.netSalary, record.currency)}
                      </td>
                      <td>
                        <span className={toneClass(payrollStatusTone(record.status))}>
                          {payrollStatusLabel(record.status)}
                        </span>
                      </td>
                      <td>{record.sentAt ? formatDate(record.sentAt) : '—'}</td>
                      <td>
                        <div className="payroll-table__actions">
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            title="View payslip"
                            onClick={() => onView(record)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            title="Download PDF"
                            onClick={() => onDownload(record)}
                          >
                            <Download size={15} />
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              className="btn btn-light btn-sm"
                              title="Send payslip"
                              onClick={() => onSend(record)}
                            >
                              <Send size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="No payslips yet"
              hint="Generate payroll to create payslips for this employee."
            />
          )}
        </div>
      )}
    </Modal>
  );
}
