import { BadgeIndianRupee, CalendarCheck, Download } from 'lucide-react';
import Modal from '../Modal';
import Avatar from '../Avatar';
import {
  PAYROLL_DEDUCTIONS,
  PAYROLL_EARNINGS,
  PAYROLL_WORKFLOW,
  formatCurrency,
  formatDate,
  formatMonthLong,
  payrollStatusLabel,
  payrollStatusTone,
} from '../../utils/constants';

const toneClass = (tone) => `badge-soft badge-soft--${tone}`;

const Timeline = ({ record }) => (
  <ol className="payroll-timeline">
    {PAYROLL_WORKFLOW.map((step) => {
      const active = PAYROLL_WORKFLOW.indexOf(step) <= PAYROLL_WORKFLOW.indexOf(record.status);
      return (
        <li key={step} className={`payroll-timeline__item ${active ? 'is-done' : ''}`}>
          <span className="payroll-timeline__dot" />
          <span className="payroll-timeline__label">{payrollStatusLabel(step)}</span>
        </li>
      );
    })}
  </ol>
);

export default function PayslipModal({ open, record, onClose, onDownload }) {
  if (!record) return null;
  const employee = record.employee || {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Payslip · ${formatMonthLong(record.month)}`}
      subtitle={employee.firstName ? `${employee.firstName} ${employee.lastName}` : 'Employee'}
      icon={BadgeIndianRupee}
      size="lg"
      footer={
        <div className="d-flex justify-content-between align-items-center">
          <span className={toneClass(payrollStatusTone(record.status))}>
            {payrollStatusLabel(record.status)}
          </span>
          <div className="d-flex gap-2">
            {onDownload && (
              <button type="button" className="btn btn-primary btn-sm" onClick={onDownload}>
                <Download size={15} className="me-1" />
                Download
              </button>
            )}
            <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="payslip">
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
              {employee.employeeId || '—'} · {record.department || employee.department || '—'}
            </small>
          </div>
          <div className="payslip__net">
            <span>Net pay</span>
            <strong>{formatCurrency(record.netSalary, record.currency)}</strong>
          </div>
        </div>

        <div className="payslip__columns">
          <div className="payslip__col">
            <h4>Earnings</h4>
            <ul>
              {PAYROLL_EARNINGS.map(({ key, label }) => (
                <li key={key}>
                  <span>{label}</span>
                  <strong>{formatCurrency(record[key], record.currency)}</strong>
                </li>
              ))}
            </ul>
            <div className="payslip__total">
              <span>Total earnings</span>
              <strong>{formatCurrency(record.totalEarnings, record.currency)}</strong>
            </div>
          </div>

          <div className="payslip__col">
            <h4>Deductions</h4>
            <ul>
              {PAYROLL_DEDUCTIONS.map(({ key, label }) => (
                <li key={key}>
                  <span>{label}</span>
                  <strong className="text-danger">{formatCurrency(record[key], record.currency)}</strong>
                </li>
              ))}
            </ul>
            <div className="payslip__total">
              <span>Total deductions</span>
              <strong className="text-danger">
                {formatCurrency(record.totalDeductions, record.currency)}
              </strong>
            </div>
          </div>
        </div>

        <div className="payslip__summary">
          <div>
            <span>Gross salary</span>
            <strong>{formatCurrency(record.grossSalary, record.currency)}</strong>
          </div>
          <div>
            <span>Net salary</span>
            <strong>{formatCurrency(record.netSalary, record.currency)}</strong>
          </div>
          <div>
            <span>Working days</span>
            <strong>{record.workingDays || 0}</strong>
          </div>
          <div>
            <span>Paid days</span>
            <strong>{record.paidDays ?? record.workingDays ?? 0}</strong>
          </div>
          <div>
            <span>Pay date</span>
            <strong className="d-inline-flex align-items-center gap-1">
              <CalendarCheck size={14} />
              {record.payDate ? formatDate(record.payDate) : 'Pending'}
            </strong>
          </div>
        </div>

        <div className="payslip__workflow">
          <h4>Approval workflow</h4>
          <Timeline record={record} />
        </div>

        {record.sentAt && (
          <p className="payslip__note">
            Emailed to {record.lastSentTo || 'employee'} on {formatDate(record.sentAt)}
          </p>
        )}

        {record.note && <p className="payslip__note">Note: {record.note}</p>}
      </div>
    </Modal>
  );
}
