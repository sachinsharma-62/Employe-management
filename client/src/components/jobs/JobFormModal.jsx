import { useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react';
import Modal from '../Modal';
import { JOB_STATUSES, JOB_TYPES, toISODate } from '../../utils/constants';

const emptyForm = {
  title: '',
  department: '',
  location: '',
  jobType: 'FULL_TIME',
  openings: 1,
  status: 'OPEN',
  minExperience: '',
  maxExperience: '',
  salaryRange: '',
  skillsText: '',
  closesOn: '',
  description: '',
  requirements: '',
  isActive: true,
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : toISODate(date);
};

export default function JobFormModal({ open, initial, meta, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const editing = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        ...emptyForm,
        ...initial,
        skillsText: (initial.skills || []).join(', '),
        closesOn: toDateInput(initial.closesOn),
      });
    } else {
      setForm({ ...emptyForm });
    }
    setError('');
  }, [open, initial]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Job title is required.');
      return;
    }
    const skills = form.skillsText
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    const payload = {
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      jobType: form.jobType,
      openings: Math.max(0, Number(form.openings) || 0),
      status: form.status,
      minExperience: form.minExperience === '' ? undefined : Number(form.minExperience),
      maxExperience: form.maxExperience === '' ? undefined : Number(form.maxExperience),
      salaryRange: form.salaryRange.trim(),
      skills,
      closesOn: form.closesOn || undefined,
      description: form.description.trim(),
      requirements: form.requirements.trim(),
      isActive: Boolean(form.isActive),
    };
    onSubmit(payload, initial?._id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit job posting' : 'Post a job'}
      subtitle="Role details, requirements and recruit pipeline status"
      icon={Briefcase}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="job-form" className="btn btn-primary" disabled={saving}>
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

      <form id="job-form" onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label" htmlFor="job-title">
              Job title <span className="text-danger">*</span>
            </label>
            <input
              id="job-title"
              className="form-control"
              maxLength={120}
              value={form.title}
              onChange={(event) => update({ title: event.target.value })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="job-openings">
              Openings
            </label>
            <input
              id="job-openings"
              type="number"
              min="0"
              max="500"
              className="form-control"
              value={form.openings}
              onChange={(event) => update({ openings: event.target.value })}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label" htmlFor="job-department">
              Department
            </label>
            <input
              id="job-department"
              className="form-control"
              maxLength={60}
              list="job-departments"
              value={form.department}
              onChange={(event) => update({ department: event.target.value })}
            />
            <datalist id="job-departments">
              {(meta.departments || []).map((dept) => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="job-location">
              Location
            </label>
            <input
              id="job-location"
              className="form-control"
              maxLength={60}
              list="job-locations"
              value={form.location}
              onChange={(event) => update({ location: event.target.value })}
            />
            <datalist id="job-locations">
              {(meta.locations || []).map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="job-type">
              Job type
            </label>
            <select
              id="job-type"
              className="form-select"
              value={form.jobType}
              onChange={(event) => update({ jobType: event.target.value })}
            >
              {JOB_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label" htmlFor="job-status">
              Status
            </label>
            <select
              id="job-status"
              className="form-select"
              value={form.status}
              onChange={(event) => update({ status: event.target.value })}
            >
              {JOB_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="job-salary">
              Salary range
            </label>
            <input
              id="job-salary"
              className="form-control"
              maxLength={80}
              placeholder="e.g. ₹18L – ₹28L"
              value={form.salaryRange}
              onChange={(event) => update({ salaryRange: event.target.value })}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label" htmlFor="job-expr-min">
              Min experience
            </label>
            <input
              id="job-expr-min"
              type="number"
              min="0"
              max="60"
              className="form-control"
              value={form.minExperience}
              onChange={(event) => update({ minExperience: event.target.value })}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="job-expr-max">
              Max experience
            </label>
            <input
              id="job-expr-max"
              type="number"
              min="0"
              max="60"
              className="form-control"
              value={form.maxExperience}
              onChange={(event) => update({ maxExperience: event.target.value })}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="job-closes">
              Closes on
            </label>
            <input
              id="job-closes"
              type="date"
              className="form-control"
              value={form.closesOn}
              onChange={(event) => update({ closesOn: event.target.value })}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="job-skills">
              Skills
            </label>
            <input
              id="job-skills"
              className="form-control"
              placeholder="Comma separated"
              value={form.skillsText}
              onChange={(event) => update({ skillsText: event.target.value })}
            />
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="job-desc">
              Description
            </label>
            <textarea
              id="job-desc"
              className="form-control"
              rows="3"
              maxLength={2000}
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="job-req">
              Requirements
            </label>
            <textarea
              id="job-req"
              className="form-control"
              rows="3"
              maxLength={2000}
              value={form.requirements}
              onChange={(event) => update({ requirements: event.target.value })}
            />
          </div>

          <div className="col-12">
            <label className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={form.isActive}
                onChange={(event) => update({ isActive: event.target.checked })}
              />
              <span className="form-check-label">Active posting</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}