import { CalendarDays, Download, Paperclip, Plus, XCircle } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import {
  formatDate,
  formatDateTime,
  leaveStatusLabel,
  leaveStatusTone,
  leaveTypeLabel,
} from '../../utils/constants';
import LeaveBalanceGrid from './LeaveBalanceGrid';

export default function MyLeavePanel({ balances, requests, busy, onApply, onCancel }) {
  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel__header">
          <h3>Leave balance</h3>
          <button type="button" className="btn btn-primary btn-sm" onClick={onApply}>
            <Plus size={15} className="me-1" /> Apply leave
          </button>
        </div>
        <LeaveBalanceGrid balances={balances} />
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Leave history</h3>
          <span className="panel__hint">{requests.length} record(s)</span>
        </div>

        {requests.length ? (
          <div className="table-responsive">
            <table className="table app-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Attachment</th>
                  <th>Decision</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const cancellable =
                    request.status === 'PENDING' || request.status === 'APPROVED';
                  return (
                    <tr key={request._id}>
                      <td>
                        <Badge tone="indigo">{leaveTypeLabel(request.type)}</Badge>
                      </td>
                      <td>{formatDate(request.fromDate)}</td>
                      <td>{formatDate(request.toDate)}</td>
                      <td>{request.days}</td>
                      <td>
                        <Badge tone={leaveStatusTone(request.status)}>
                          {leaveStatusLabel(request.status)}
                        </Badge>
                      </td>
                      <td className="text-muted leave-reason-cell">{request.reason || '—'}</td>
                      <td>
                        {request.hasAttachment ? (
                          <a
                            className="leave-attachment"
                            href={request.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            title={request.attachment.name}
                          >
                            <Paperclip size={13} />
                            <Download size={13} />
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="leave-decision-cell">
                        {request.decisionNote ? (
                          <>
                            <span>{request.decisionNote}</span>
                            {request.decidedBy && (
                              <small className="text-muted d-block">
                                {request.decidedBy.firstName} {request.decidedBy.lastName} ·{' '}
                                {formatDateTime(request.decidedAt)}
                              </small>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-end">
                        {cancellable ? (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onCancel(request)}
                            disabled={busy === `cancel-${request._id}`}
                          >
                            <XCircle size={14} className="me-1" /> Cancel
                          </button>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="leave-empty">
            <CalendarDays size={26} />
            <strong>No leave requests yet</strong>
            <small>Your leave applications will appear here.</small>
          </div>
        )}
      </div>
    </div>
  );
}
