import { useState } from 'react';
import { Eye, Plus } from 'lucide-react';
import StatusBadge from './StatusBadge';
import Modal from '../../Modal';
import { attendanceStatusLabel, formatDate } from '../../../utils/constants';
import { REQUEST_STATUS_LABELS } from '../../../utils/attendanceHub';

const STATUS_TONE = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'muted',
};

export default function AttendanceRequestsTable({ requests, onNewRequest }) {
  const [detail, setDetail] = useState(null);

  return (
    <div className="hub-requests">
      <div className="hub-requests__head">
        <span className="hub-muted">{requests.length} requests</span>
        <button type="button" className="hub-btn hub-btn--primary" onClick={() => onNewRequest()}>
          <Plus size={15} />
          Regularization
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="hub-empty">
          <p>
            No regularization requests yet. Spot a mistake in your attendance? Raise a request and
            HR will review it.
          </p>
        </div>
      ) : (
        <div className="hub-table-wrap">
          <table className="hub-table">
            <thead>
              <tr>
                <th scope="col">DATE</th>
                <th scope="col">CHANGE</th>
                <th scope="col">REASON</th>
                <th scope="col">SUBMITTED</th>
                <th scope="col">STATUS</th>
                <th scope="col" className="hub-table__logcol">VIEW</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="hub-strong">{formatDate(request.date)}</td>
                  <td className="text-nowrap">
                    {attendanceStatusLabel(request.currentStatus)} →{' '}
                    {attendanceStatusLabel(request.requestedStatus)}
                  </td>
                  <td className="hub-reason" title={request.reason}>
                    {request.reason}
                  </td>
                  <td className="hub-muted">{formatDate(request.submittedAt)}</td>
                  <td>
                    <StatusBadge tone={STATUS_TONE[request.status] || 'muted'}>
                      {REQUEST_STATUS_LABELS[request.status] || request.status}
                    </StatusBadge>
                  </td>
                  <td className="hub-table__logcol">
                    <button
                      type="button"
                      className="hub-icon-btn"
                      aria-label="View request details"
                      onClick={() => setDetail(request)}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Regularization request"
        subtitle={detail ? formatDate(detail.date) : ''}
        size="md"
        footer={
          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
        }
      >
        {detail && (
          <dl className="hub-detail-list">
            <div>
              <dt>Date</dt>
              <dd>{formatDate(detail.date)}</dd>
            </div>
            <div>
              <dt>Change requested</dt>
              <dd>
                {attendanceStatusLabel(detail.currentStatus)} →{' '}
                {attendanceStatusLabel(detail.requestedStatus)}
              </dd>
            </div>
            {detail.requestedCheckIn && (
              <div>
                <dt>Correct check-in</dt>
                <dd>{detail.requestedCheckIn}</dd>
              </div>
            )}
            {detail.requestedCheckOut && (
              <div>
                <dt>Correct check-out</dt>
                <dd>{detail.requestedCheckOut}</dd>
              </div>
            )}
            <div>
              <dt>Submitted</dt>
              <dd>{formatDate(detail.submittedAt)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge tone={STATUS_TONE[detail.status] || 'muted'}>
                  {REQUEST_STATUS_LABELS[detail.status] || detail.status}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt>Reason</dt>
              <dd>{detail.reason}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
