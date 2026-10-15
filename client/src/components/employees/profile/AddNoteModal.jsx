import { useEffect, useState } from 'react';
import { StickyNote } from 'lucide-react';
import profileApi from '../../../api/profile.api';
import { useToast } from '../../../context/ToastContext';
import Modal from '../../Modal';

const VISIBILITIES = [
  { value: 'TEAM', label: 'Visible to team' },
  { value: 'HR', label: 'HR only' },
  { value: 'PRIVATE', label: 'Private' },
];

export default function AddNoteModal({ open, employeeId, onClose, onAdded }) {
  const toast = useToast();
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState('TEAM');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBody('');
    setVisibility('TEAM');
    setError('');
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) {
      setError('Note content is required');
      return;
    }

    setSaving(true);
    try {
      const res = await profileApi.addNote(employeeId, { body: body.trim(), visibility });
      toast.success(res.data.message || 'Note added');
      onAdded?.(res.data.note);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not add note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add note"
      subtitle="Record an internal note about this employee"
      icon={StickyNote}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-note-form" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              'Save note'
            )}
          </button>
        </div>
      }
    >
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <form id="add-note-form" onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="note-body">
            Note <span className="text-danger">*</span>
          </label>
          <textarea
            id="note-body"
            rows={5}
            className="form-control"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError('');
            }}
            placeholder="Write your note here..."
            maxLength={2000}
          />
          <div className="form-text text-end">{body.length}/2000</div>
        </div>
        <div>
          <label className="form-label" htmlFor="note-visibility">
            Visibility
          </label>
          <select
            id="note-visibility"
            className="form-select"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            {VISIBILITIES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
