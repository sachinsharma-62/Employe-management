import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import Modal from '../Modal';
import { CANDIDATE_SOURCES, CANDIDATE_STAGES, toISODate } from '../../utils/constants';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  job: '',
  stage: 'APPLIED',
  source: 'LINKEDIN',
  appliedAt: toISODate(),
  notes: '',
  isActive: true,
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : toISODate(date);
};

export default function CandidateFormModal({ open, initial, meta, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const editing = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        ...emptyForm,
        ...initial,
        job: initial.job?._id || initial.job || '',
        appliedAt: toDateInput(initial.appliedAt),
      });
    } else {
      setForm({ ...emptyForm });
    }
    setError('');
  }, [open, initial]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Candidate name is required.');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      job: form.job || '',
      stage: form.stage,
      source: form.source,
      appliedAt: form.appliedAt || undefined,
      notes: form.notes.trim(),
      isActive: Boolean(form.isActive),
    };
    onSubmit(payload, initial?._id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit candidate' : 'Add candidate'}
      subtitle="Contact details, applied role and pipeline stage"
      icon={UserPlus}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="candidate-form" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : 'Save'}
          </button>
        </div>
      }
    >
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <form id="candidate-form" onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="cand-first">
              First name <span className="text-danger">*</span>
            </label>
            <input
              id="cand-first"
              className="form-control"
              maxLength={60}
              value={form.firstName}
              onChange={(event) => update({ firstName: event.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="cand-last">
              Last name <span className="text-danger">*</span>
            </label>
            <input
              id="cand-last"
              className="form-control"
              maxLength={60}
              value={form.lastName}
              onChange={(event) => update({ lastName: event.target.value })}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="cand-email">
              Email <span className="text-danger">*</span>
            </label>
            <input
              id="cand-email"
              type="email"
              className="form-control"
              maxLength={120}
              value={form.email}
              onChange={(event) => update({ email: event.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="cand-phone">
              Phone
            </label>
            <input
              id="cand-phone"
              className="form-control"
              maxLength={30}
              value={form.phone}
              onChange={(event) => update({ phone: event.target.value })}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="cand-job">
              Applying for
            </label>
            <select
              id="cand-job"
              className="form-select"
              value={form.job}
              onChange={(event) => update({ job: event.target.value })}
            >
              <option value="">— Select a job —</option>
              {(meta.jobs || []).map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} · {job.department}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="cand-stage">
              Stage
            </label>
            <select
              id="cand-stage"
              className="form-select"
              value={form.stage}
              onChange={(event) => update({ stage: event.target.value })}
            >
              {CANDIDATE_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="cand-source">
              Source
            </label>
            <select
              id="cand-source"
              className="form-select"
              value={form.source}
              onChange={(event) => update({ source: event.target.value })}
            >
              {CANDIDATE_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="cand-applied">
              Applied on
            </label>
            <input
              id="cand-applied"
              type="date"
              className="form-control"
              value={form.appliedAt}
              onChange={(event) => update({ appliedAt: event.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="cand-active">
              Status
            </label>
            <select
              id="cand-active"
              className="form-select"
              value={form.isActive ? 'true' : 'false'}
              onChange={(event) => update({ isActive: event.target.value === 'true' })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="cand-notes">
              Notes
            </label>
            <textarea
              id="cand-notes"
              className="form-control"
              rows="3"
              maxLength={2000}
              value={form.notes}
              onChange={(event) => update({ notes: event.target.value })}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}