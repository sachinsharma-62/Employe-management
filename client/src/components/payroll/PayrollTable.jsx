import {
  Download,
  Eye,
  History,
  MoreVertical,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react';
import Avatar from '../Avatar';
import {
  NEXT_PAYROLL_ACTION,
  formatCurrency,
  payrollStatusLabel,
  payrollStatusTone,
} from '../../utils/constants';

const toneClass = (tone) => `badge-soft badge-soft--${tone}`;

export default function PayrollTable({
  records,
  loading,
  busy,
  canManage,
  selected,
  onToggle,
  onToggleAll,
  onView,
  onEdit,
  onAdvance,
  onRevert,
  onDelete,
  onDownload,
  onSend,
  onHistory,
}) {
  const allSelected = records.length > 0 && records.every((r) => selected.has(r._id));

  if (!loading && records.length === 0) {
    return (
      <div className="dash-empty py-5">
        <span>No payroll records</span>
        <small>Generate payroll for this month or adjust your filters.</small>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table app-table align-middle mb-0 payroll-table">
        <thead>
          <tr>
            {canManage && (
              <th style={{ width: 34 }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Select all"
                />
              </th>
            )}
            <th>Employee</th>
            <th>Department</th>
            <th className="text-end">Gross</th>
            <th className="text-end">Earnings</th>
            <th className="text-end">Deductions</th>
            <th className="text-end">Net pay</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody className={loading ? 'is-loading' : ''}>
          {records.map((record) => {
            const employee = record.employee || {};
            const next = NEXT_PAYROLL_ACTION[record.status];
            const isBusy = busy === `action-${record._id}` || busy === `revert-${record._id}`;
            return (
              <tr key={record._id}>
                {canManage && (
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selected.has(record._id)}
                      onChange={() => onToggle(record._id)}
                      aria-label={`Select ${employee.firstName || 'employee'}`}
                    />
                  </td>
                )}
                <td>
                  <div className="payroll-table__employee">
                    {employee.firstName ? (
                      <Avatar user={employee} size={34} />
                    ) : (
                      <span className="payroll-table__avatar-fallback" />
                    )}
                    <div>
                      <strong>
                        {employee.firstName
                          ? `${employee.firstName} ${employee.lastName}`
                          : 'Unknown employee'}
                      </strong>
                      <small>{employee.employeeId || employee.email || ''}</small>
                    </div>
                  </div>
                </td>
                <td>{record.department || employee.department || '—'}</td>
                <td className="text-end">{formatCurrency(record.grossSalary, record.currency)}</td>
                <td className="text-end">{formatCurrency(record.totalEarnings, record.currency)}</td>
                <td className="text-end text-danger">
                  {formatCurrency(record.totalDeductions, record.currency)}
                </td>
                <td className="text-end fw-semibold">
                  {formatCurrency(record.netSalary, record.currency)}
                </td>
                <td>
                  <span className={toneClass(payrollStatusTone(record.status))}>
                    {payrollStatusLabel(record.status)}
                  </span>
                </td>
                <td>
                  <div className="payroll-table__actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      onClick={() => onView(record)}
                      title="View payslip"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      onClick={() => onDownload(record)}
                      disabled={busy === `download-${record._id}`}
                      title="Download PDF payslip"
                    >
                      <Download size={15} />
                    </button>
                    {canManage && next && (
                      <button
                        type="button"
                        className={`btn btn-sm btn-${next.tone}`}
                        onClick={() => onAdvance(record)}
                        disabled={isBusy}
                        title={next.label}
                      >
                        {next.label}
                      </button>
                    )}
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn btn-sm btn-light"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        disabled={isBusy}
                      >
                        <MoreVertical size={15} />
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button type="button" className="dropdown-item" onClick={() => onHistory(record)}>
                            <History size={14} className="me-2" /> Payslip history
                          </button>
                        </li>
                        <li>
                          <button type="button" className="dropdown-item" onClick={() => onDownload(record)}>
                            <Download size={14} className="me-2" /> Download PDF
                          </button>
                        </li>
                        {canManage && (
                          <>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => onSend(record)}
                                disabled={busy === `send-${record._id}`}
                              >
                                <Send size={14} className="me-2" />
                                {record.sentAt ? 'Resend payslip' : 'Send payslip'}
                              </button>
                            </li>
                          </>
                        )}
                        {canManage && record.status !== 'PAID' && (
                          <li>
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => onEdit(record)}
                            >
                              <Pencil size={14} className="me-2" /> Edit components
                            </button>
                          </li>
                        )}
                        {canManage && record.status !== 'DRAFT' && record.status !== 'PAID' && (
                          <li>
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => onRevert(record)}
                            >
                              <Undo2 size={14} className="me-2" /> Revert to draft
                            </button>
                          </li>
                        )}
                        {canManage && record.status === 'DRAFT' && (
                          <li>
                            <button
                              type="button"
                              className="dropdown-item text-danger"
                              onClick={() => onDelete(record)}
                            >
                              <Trash2 size={14} className="me-2" /> Delete
                            </button>
                          </li>
                        )}
                        {canManage && record.status === 'PAID' && (
                          <li>
                            <span className="dropdown-item disabled">
                              <RotateCcw size={14} className="me-2" /> Locked (paid)
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
