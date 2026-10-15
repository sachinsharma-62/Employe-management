import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Modal from '../Modal';

export default function DocumentVerifyModal({ open, record, saving, onClose, onSubmit }) {
  const [decision, setDecision] = useState('VERIFIED');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setDecision('VERIFIED');
      setReason('');
    }
  }, [open]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      status: decision,
      rejectionReason: decision === 'REJECTED' ? reason.trim() : '',
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verify document"
      subtitle={record?.title}
      icon={ShieldCheck}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="document-verify-form"
            className={`btn ${decision === 'REJECTED' ? 'btn-danger' : 'btn-success'}`}
            disabled={saving}
          >
            {saving ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : decision === 'REJECTED' ? (
              'Reject document'
            ) : (
              'Approve document'
            )}
          </button>
        </div>
      }
    >
      <form id="document-verify-form" onSubmit={handleSubmit}>
        <div className="doc-verify__options">
          <label className={`doc-verify__option ${decision === 'VERIFIED' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name="decision"
              value="VERIFIED"
              checked={decision === 'VERIFIED'}
              onChange={() => setDecision('VERIFIED')}
            />
            <div>
              <strong>Approve</strong>
              <small>Mark this document as verified</small>
            </div>
          </label>
          <label className={`doc-verify__option ${decision === 'REJECTED' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name="decision"
              value="REJECTED"
              checked={decision === 'REJECTED'}
              onChange={() => setDecision('REJECTED')}
            />
            <div>
              <strong>Reject</strong>
              <small>Ask the employee to upload a corrected copy</small>
            </div>
          </label>
        </div>

        {decision === 'REJECTED' && (
          <div className="mt-3">
            <label className="form-label" htmlFor="reject-reason">
              Reason
            </label>
            <textarea
              id="reject-reason"
              className="form-control"
              rows="3"
              maxLength={300}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain what needs to be corrected"
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
