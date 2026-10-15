import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import Modal from '../Modal';
import { formatDate, leaveTypeLabel } from '../../utils/constants';

export default function LeaveDecisionModal({ open, mode, request, onClose, onSubmit, saving }) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  if (!request) return null;
  const approving = mode === 'approve';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={approving ? 'Approve leave' : 'Reject leave'}
      subtitle={`${request.employee?.firstName || ''} ${request.employee?.lastName || ''}`.trim()}
      icon={approving ? CheckCircle2 : XCircle}
      size="sm"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            form="leave-decision-form"
            className={`btn ${approving ? 'btn-success' : 'btn-danger'}`}
            disabled={saving}
          >
            {saving ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : approving ? (
              'Approve'
            ) : (
              'Reject'
            )}
          </button>
        </div>
      }
    >
      <div className="leave-decision-summary">
        <div>
          <small>Type</small>
          <strong>{leaveTypeLabel(request.type)}</strong>
        </div>
        <div>
          <small>Dates</small>
          <strong>
            {formatDate(request.fromDate)} → {formatDate(request.toDate)}
          </strong>
        </div>
        <div>
          <small>Days</small>
          <strong>{request.days}</strong>
        </div>
      </div>
      {request.reason && <p className="leave-decision-reason">“{request.reason}”</p>}

      <form
        id="leave-decision-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(note.trim());
        }}
      >
        <label className="form-label" htmlFor="leave-decision-note">
          Comment
        </label>
        <textarea
          id="leave-decision-note"
          rows={3}
          maxLength={300}
          className="form-control"
          placeholder={approving ? 'Add an optional comment' : 'Let the employee know why (optional)'}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </form>
    </Modal>
  );
}
