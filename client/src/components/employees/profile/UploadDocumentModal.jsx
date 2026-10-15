import { useEffect, useRef, useState } from 'react';
import { FileUp, Upload } from 'lucide-react';
import profileApi from '../../../api/profile.api';
import { useToast } from '../../../context/ToastContext';
import Modal from '../../Modal';
import { DOCUMENT_TYPES, formatFileSize } from '../../../utils/constants';

const blank = { title: '', documentType: 'OTHER', expiryDate: '' };

export default function UploadDocumentModal({ open, employeeId, onClose, onUploaded }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(blank);
    setFile(null);
    setError('');
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10 MB');
      return;
    }
    setFile(selected);
    setError('');
    if (!form.title.trim()) {
      setForm((f) => ({ ...f, title: selected.name.replace(/\.[^.]+$/, '') }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Document title is required');
      return;
    }
    if (!file) {
      setError('Please attach a file to upload');
      return;
    }

    const data = new FormData();
    data.append('title', form.title.trim());
    data.append('documentType', form.documentType);
    if (form.expiryDate) data.append('expiryDate', form.expiryDate);
    data.append('file', file);

    setSaving(true);
    try {
      const res = await profileApi.uploadDocument(employeeId, data);
      toast.success(res.data.message || 'Document uploaded');
      onUploaded?.(res.data.document);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not upload document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload document"
      subtitle="Attach a file to this employee profile"
      icon={FileUp}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="upload-document-form" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <>
                <Upload size={15} className="me-1" /> Upload
              </>
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
      <form id="upload-document-form" onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="doc-title">
            Document title <span className="text-danger">*</span>
          </label>
          <input
            id="doc-title"
            name="title"
            className="form-control"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Signed Offer Letter"
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="doc-category">
            Document type
          </label>
          <select
            id="doc-category"
            name="documentType"
            className="form-select"
            value={form.documentType}
            onChange={handleChange}
          >
            {DOCUMENT_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="doc-expiry">
            Expiry date
          </label>
          <input
            id="doc-expiry"
            name="expiryDate"
            type="date"
            className="form-control"
            value={form.expiryDate}
            onChange={handleChange}
          />
        </div>
        <div className="mb-1">
          <label className="form-label">File</label>
          <button
            type="button"
            className="doc-dropzone"
            onClick={() => fileRef.current?.click()}
          >
            <FileUp size={22} />
            {file ? (
              <>
                <strong>{file.name}</strong>
                <small>{formatFileSize(file.size)} · click to replace</small>
              </>
            ) : (
              <>
                <strong>Choose a file</strong>
                <small>PDF, DOC, XLS, TXT or image · Max 10 MB</small>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" hidden onChange={handleFile} />
        </div>
      </form>
    </Modal>
  );
}
