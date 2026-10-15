import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import Modal from '../Modal';
import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from '../../utils/constants';

const buildForm = (record) => ({
  title: record?.title || '',
  documentType: record?.documentType || 'OTHER',
  status: record?.status || 'ACTIVE',
  expiryDate: record?.expiryDate ? String(record.expiryDate).slice(0, 10) : '',
});

export default function DocumentEditModal({ open, record, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(buildForm(record));
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(buildForm(record));
      setError('');
    }
  }, [open, record]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Document name is required');
      return;
    }
    onSubmit({
      title: form.title.trim(),
      documentType: form.documentType,
      status: form.status,
      expiryDate: form.expiryDate || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit document"
      subtitle={record?.fileName}
      icon={Pencil}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="document-edit-form"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              'Save changes'
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
      <form id="document-edit-form" onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="edit-doc-name">
            Document name
          </label>
          <input
            id="edit-doc-name"
            name="title"
            className="form-control"
            value={form.title}
            onChange={handleChange}
          />
        </div>
        <div className="row g-3">
          <div className="col-sm-6">
            <label className="form-label" htmlFor="edit-doc-type">
              Document type
            </label>
            <select
              id="edit-doc-type"
              name="documentType"
              className="form-select"
              value={form.documentType}
              onChange={handleChange}
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm-6">
            <label className="form-label" htmlFor="edit-doc-status">
              Status
            </label>
            <select
              id="edit-doc-status"
              name="status"
              className="form-select"
              value={form.status}
              onChange={handleChange}
            >
              {DOCUMENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="form-label" htmlFor="edit-doc-expiry">
            Expiry date
          </label>
          <input
            id="edit-doc-expiry"
            name="expiryDate"
            type="date"
            className="form-control"
            value={form.expiryDate}
            onChange={handleChange}
          />
        </div>
      </form>
    </Modal>
  );
}
