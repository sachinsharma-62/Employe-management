import { useEffect, useRef, useState } from 'react';
import { FileUp, Upload } from 'lucide-react';
import Modal from '../Modal';
import { DOCUMENT_TYPES, formatFileSize } from '../../utils/constants';

const blank = { title: '', documentType: 'OTHER', expiryDate: '', employee: '' };

export default function DocumentUploadModal({
  open,
  employees,
  defaultEmployee = '',
  saving,
  onClose,
  onSubmit,
}) {
  const fileRef = useRef(null);
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({ ...blank, employee: defaultEmployee });
    setFile(null);
    setError('');
  }, [open, defaultEmployee]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10 MB');
      return;
    }
    setFile(selected);
    setError('');
    if (!form.title.trim()) {
      setForm((prev) => ({ ...prev, title: selected.name.replace(/\.[^.]+$/, '') }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Document name is required');
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
    if (employees && form.employee) data.append('employee', form.employee);
    data.append('file', file);

    onSubmit(data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload document"
      subtitle="Attach an employee document and set its details"
      icon={FileUp}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="document-upload-form"
            className="btn btn-primary"
            disabled={saving}
          >
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
      <form id="document-upload-form" onSubmit={handleSubmit} noValidate>
        {employees && (
          <div className="mb-3">
            <label className="form-label" htmlFor="doc-employee-select">
              Employee
            </label>
            <select
              id="doc-employee-select"
              name="employee"
              className="form-select"
              value={form.employee}
              onChange={handleChange}
            >
              <option value="">— Select employee —</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.firstName} {employee.lastName}
                  {employee.employeeId ? ` (${employee.employeeId})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label" htmlFor="doc-name">
            Document name <span className="text-danger">*</span>
          </label>
          <input
            id="doc-name"
            name="title"
            className="form-control"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Aadhaar Card"
          />
        </div>

        <div className="row g-3">
          <div className="col-sm-7">
            <label className="form-label" htmlFor="doc-type-select">
              Document type
            </label>
            <select
              id="doc-type-select"
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
          <div className="col-sm-5">
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
        </div>

        <div className="mt-3">
          <label className="form-label">File</label>
          <button type="button" className="doc-dropzone" onClick={() => fileRef.current?.click()}>
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
