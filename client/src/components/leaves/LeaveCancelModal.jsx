import { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import Modal from '../Modal';
import { formatDate, leaveTypeLabel } from '../../utils/constants';

export default function LeaveCancelModal({ open, request, onClose, onSubmit, saving }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!request) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel leave request"
      subtitle={`${leaveTypeLabel(request.type)} · ${formatDate(request.fromDate)} → ${formatDate(request.toDate)}`}
      icon={XCircle}
      size="sm"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Keep request
          </button>
          <button
            type="submit"
            form="leave-cancel-form"
            className="btn btn-danger"
            disabled={saving}
          >
            {saving ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : 'Cancel leave'}
          </button>
        </div>
      }
    >
      <p className="mb-3 text-muted">
        This will withdraw your leave request. Any approved days are returned to your balance.
      </p>
      <form
        id="leave-cancel-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(reason.trim());
        }}
      >
        <label className="form-label" htmlFor="leave-cancel-reason">
          Reason (optional)
        </label>
        <textarea
          id="leave-cancel-reason"
          rows={3}
          maxLength={300}
          className="form-control"
          placeholder="Why are you cancelling this request?"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </form>
    </Modal>
  );
}
