import { Check, Download, Paperclip, RefreshCw, Search, X } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import {
  DEPARTMENTS,
  LEAVE_STATUSES,
  LEAVE_TYPES,
  formatDate,
  formatDateTime,
  leaveStatusLabel,
  leaveStatusTone,
  leaveTypeLabel,
} from '../../utils/constants';

export default function LeaveRequestsPanel({
  requests,
  summary,
  pagination,
  filters,
  setFilters,
  loading,
  busy,
  onApprove,
  onReject,
}) {
  const update = (patch) => setFilters((prev) => ({ ...prev, ...patch, page: patch.page || 1 }));

  const reset = () =>
    setFilters({ status: '', type: '', search: '', department: '', page: 1, limit: 20 });

  const counts = summary?.counts || {};

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Leave requests</h3>
        <span className="panel__hint">{pagination?.total ?? requests.length} total</span>
      </div>

      <div className="leave-summary-chips">
        <span className="leave-chip leave-chip--pending">Pending {counts.PENDING || 0}</span>
        <span className="leave-chip leave-chip--approved">Approved {counts.APPROVED || 0}</span>
        <span className="leave-chip leave-chip--rejected">Rejected {counts.REJECTED || 0}</span>
        <span className="leave-chip leave-chip--cancelled">Cancelled {counts.CANCELLED || 0}</span>
      </div>

      <div className="users-toolbar">
        <div className="users-toolbar__search">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search employee"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
          />
        </div>
        <select
          className="form-select users-toolbar__filter"
          value={filters.status}
          onChange={(event) => update({ status: event.target.value })}
        >
          <option value="">All statuses</option>
          {LEAVE_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          className="form-select users-toolbar__filter"
          value={filters.type}
          onChange={(event) => update({ type: event.target.value })}
        >
          <option value="">All types</option>
          {LEAVE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select
          className="form-select users-toolbar__filter"
          value={filters.department}
          onChange={(event) => update({ department: event.target.value })}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-outline-secondary" onClick={reset}>
          <RefreshCw size={14} className="me-1" /> Reset
        </button>
      </div>

      {loading ? (
        <div className="leave-empty">
          <span className="spinner-border spinner-border-sm" /> <span className="ms-2">Loading requests…</span>
        </div>
      ) : requests.length ? (
        <>
          <div className="table-responsive">
            <table className="table app-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Attachment</th>
                  <th>Comment</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const employee = request.employee || {};
                  const pending = request.status === 'PENDING';
                  return (
                    <tr key={request._id}>
                      <td>
                        <div className="leave-employee">
                          <strong>
                            {employee.firstName} {employee.lastName}
                          </strong>
                          <small className="text-muted">
                            {employee.designation || employee.employeeId || employee.email || ''}
                          </small>
                        </div>
                      </td>
                      <td>
                        <Badge tone="indigo">{leaveTypeLabel(request.type)}</Badge>
                      </td>
                      <td>{formatDate(request.fromDate)}</td>
                      <td>{formatDate(request.toDate)}</td>
                      <td>{request.days}</td>
                      <td className="text-muted">{formatDate(request.appliedAt)}</td>
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
                        {pending ? (
                          <div className="leave-actions">
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => onApprove(request)}
                              disabled={busy === `decide-${request._id}`}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => onReject(request)}
                              disabled={busy === `decide-${request._id}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
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

          {pagination && pagination.pages > 1 && (
            <div className="users-pagination">
              <small className="text-muted">
                Page {pagination.page} of {pagination.pages}
              </small>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="leave-empty">
          <strong>No leave requests found</strong>
          <small>Try adjusting the filters above.</small>
        </div>
      )}
    </div>
  );
}
