import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import Modal from '../Modal';
import { useToast } from '../../context/ToastContext';
import attendanceApi from '../../api/attendance.api';
import { Badge } from '../employees/profile/ui';
import { attendanceCorrectionStatusTone, attendanceStatusLabel, attendanceStatusTone } from '../../utils/constants';

export default function ReviewCorrectionModal({ open, correction, onClose, onDecided }) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    setNote('');
    setBusy('');
  }, [correction]);

  if (!correction) return null;

  const employee = correction.employee || {};
  const prettyDate = formatISODate(correction.date);
  const hasTimes = correction.requestedCheckIn || correction.requestedCheckOut;

  const decide = async (action) => {
    setBusy(action);
    try {
      if (action === 'approve') {
        await attendanceApi.approveCorrection(correction._id, { note });
        toast.success('Correction approved');
      } else {
        await attendanceApi.rejectCorrection(correction._id, { note });
        toast.success('Correction rejected');
      }
      onDecided();
    } catch (err) {
      toast.error(err.message || 'Could not process the correction');
      setBusy('');
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => (busy ? null : onClose())}
      title="Review correction request"
      subtitle={`${employee.firstName || ''} ${employee.lastName || ''}`}
      icon={ClipboardCheck}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => decide('reject')}
            disabled={Boolean(busy)}
          >
            {busy === 'reject' ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              'Reject'
            )}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => decide('approve')}
            disabled={Boolean(busy)}
          >
            {busy === 'approve' ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              'Approve'
            )}
          </button>
        </div>
      }
    >
      <div className="stack-md">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Badge tone="secondary">{prettyDate}</Badge>
          <span className="d-flex align-items-center gap-2">
            <Badge tone={attendanceStatusTone(correction.currentStatus)} className="me-1">
              {attendanceStatusLabel(correction.currentStatus)}
            </Badge>
            →
            <Badge tone={attendanceStatusTone(correction.requestedStatus)}>
              {attendanceStatusLabel(correction.requestedStatus)}
            </Badge>
          </span>
        </div>

        {hasTimes && (
          <p className="mb-0">
            {correction.requestedCheckIn && (
              <span className="me-3">
                In: <strong>{correction.requestedCheckIn}</strong>
              </span>
            )}
            {correction.requestedCheckOut && (
              <span>
                Out: <strong>{correction.requestedCheckOut}</strong>
              </span>
            )}
          </p>
        )}

        <div className="alert alert-light py-2 mb-0">
          <p className="mb-0">{correction.reason}</p>
        </div>

        <div>
          <label className="form-label" htmlFor="review-note">
            Decision note
          </label>
          <textarea
            id="review-note"
            rows={2}
            className="form-control"
            maxLength={300}
            placeholder="Optional note for the employee"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {correction.status !== 'PENDING' && (
          <Badge tone={attendanceCorrectionStatusTone(correction.status)}>
            Already {correction.status.toLowerCase()}
          </Badge>
        )}
      </div>
    </Modal>
  );
}

const formatISODate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};