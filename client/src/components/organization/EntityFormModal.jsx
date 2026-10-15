import { useEffect, useState } from 'react';
import { Award, Building2, MapPin, Save, Users } from 'lucide-react';
import organizationApi from '../../api/organization.api';
import { useToast } from '../../context/ToastContext';
import Modal from '../Modal';
import { LOCATION_TYPES } from '../../utils/constants';

const KIND_ICONS = {
  department: Building2,
  designation: Award,
  team: Users,
  location: MapPin,
};

const KIND_ACTIONS = {
  department: { create: organizationApi.createDepartment, update: organizationApi.updateDepartment },
  designation: {
    create: organizationApi.createDesignation,
    update: organizationApi.updateDesignation,
  },
  team: { create: organizationApi.createTeam, update: organizationApi.updateTeam },
  location: { create: organizationApi.createLocation, update: organizationApi.updateLocation },
};

const BLANKS = {
  department: { name: '', code: '', head: '', description: '', isActive: true },
  designation: { title: '', department: '', description: '', isActive: true },
  team: { name: '', department: '', manager: '', description: '', isActive: true },
  location: {
    name: '',
    type: 'HEAD_OFFICE',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    isActive: true,
  },
};

const FIELDS = {
  department: [
    {
      name: 'name',
      label: 'Department name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Engineering',
      maxLength: 60,
    },
    { name: 'code', label: 'Code', type: 'text', placeholder: 'e.g. ENG', maxLength: 20 },
    { name: 'head', label: 'Department head', type: 'manager', hint: 'Leave empty to assign later' },
    { name: 'description', label: 'Description', type: 'textarea', maxLength: 500 },
  ],
  designation: [
    {
      name: 'title',
      label: 'Designation title',
      type: 'text',
      required: true,
      placeholder: 'e.g. Senior Engineer',
      maxLength: 60,
    },
    { name: 'department', label: 'Department mapping', type: 'department' },
    { name: 'description', label: 'Description', type: 'textarea', maxLength: 500 },
  ],
  team: [
    {
      name: 'name',
      label: 'Team name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Platform Team',
      maxLength: 60,
    },
    { name: 'department', label: 'Department', type: 'department' },
    { name: 'manager', label: 'Team manager', type: 'manager' },
    { name: 'description', label: 'Description', type: 'textarea', maxLength: 500 },
  ],
  location: [
    {
      name: 'name',
      label: 'Location name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Head Office',
      maxLength: 60,
    },
    { name: 'type', label: 'Type', type: 'locationType' },
    { name: 'address', label: 'Address', type: 'text', maxLength: 200 },
    { name: 'city', label: 'City', type: 'text', maxLength: 60 },
    { name: 'state', label: 'State', type: 'text', maxLength: 60 },
    { name: 'country', label: 'Country', type: 'text', maxLength: 60 },
    { name: 'pincode', label: 'Pincode', type: 'text', maxLength: 12 },
  ],
};

const fromEntity = {
  department: (e) => ({
    name: e.name || '',
    code: e.code || '',
    head: e.head?._id || e.head || '',
    description: e.description || '',
    isActive: e.isActive,
  }),
  designation: (e) => ({
    title: e.title || '',
    department: e.department?._id || e.department || '',
    description: e.description || '',
    isActive: e.isActive,
  }),
  team: (e) => ({
    name: e.name || '',
    department: e.department?._id || e.department || '',
    manager: e.manager?._id || e.manager || '',
    description: e.description || '',
    isActive: e.isActive,
  }),
  location: (e) => ({
    name: e.name || '',
    type: e.type || 'HEAD_OFFICE',
    address: e.address || '',
    city: e.city || '',
    state: e.state || '',
    country: e.country || '',
    pincode: e.pincode || '',
    isActive: e.isActive,
  }),
};

export default function EntityFormModal({
  kind,
  entity,
  departments = [],
  managers = [],
  onClose,
  onSaved,
}) {
  const toast = useToast();
  const editing = Boolean(entity);
  const Icon = KIND_ICONS[kind];
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!kind) {
      setForm(null);
      return;
    }
    setForm(entity ? fromEntity[kind](entity) : { ...BLANKS[kind] });
    setError('');
    setSaving(false);
  }, [kind, entity]);

  if (!kind) return null;

  const current = form || { ...BLANKS[kind] };

  const handleChange = (name, value) => {
    setForm((f) => ({ ...(f || BLANKS[kind]), [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = FIELDS[kind].filter((f) => f.required);
    const missing = required.find((f) => !String(current[f.name] || '').trim());
    if (missing) {
      setError(`${missing.label} is required`);
      return;
    }

    const payload = { ...current };
    for (const field of FIELDS[kind]) {
      if (field.type === 'text' || field.type === 'textarea') {
        payload[field.name] = String(payload[field.name] || '').trim();
      }
    }

    setSaving(true);
    try {
      const action = editing
        ? KIND_ACTIONS[kind].update(entity._id, payload)
        : KIND_ACTIONS[kind].create(payload);
      const res = await action;
      toast.success(res.data.message || 'Saved successfully');
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save');
      setSaving(false);
    }
  };

  const renderControl = (field) => {
    const value = current[field.name] || '';
    const required = field.required ? <span className="text-danger"> *</span> : null;
    const id = `org-${kind}-${field.name}`;

    if (field.type === 'textarea') {
      return (
        <div className="mb-3" key={field.name}>
          <label className="form-label" htmlFor={id}>
            {field.label}
            {required}
          </label>
          <textarea
            id={id}
            rows={3}
            className="form-control"
            maxLength={field.maxLength}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        </div>
      );
    }

    if (field.type === 'manager') {
      return (
        <div className="mb-3" key={field.name}>
          <label className="form-label" htmlFor={id}>
            {field.label}
          </label>
          <select
            id={id}
            className="form-select"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          >
            <option value="">{field.hint || 'Not assigned'}</option>
            {managers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.fullName}
                {m.designation ? ` · ${m.designation}` : ''}
              </option>
            ))}
          </select>
          {field.hint && <div className="form-text">{field.hint}</div>}
        </div>
      );
    }

    if (field.type === 'department') {
      return (
        <div className="mb-3" key={field.name}>
          <label className="form-label" htmlFor={id}>
            {field.label}
          </label>
          <select
            id={id}
            className="form-select"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          >
            <option value="">No department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'locationType') {
      return (
        <div className="mb-3" key={field.name}>
          <label className="form-label" htmlFor={id}>
            {field.label}
          </label>
          <select
            id={id}
            className="form-select"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="mb-3" key={field.name}>
        <label className="form-label" htmlFor={id}>
          {field.label}
          {required}
        </label>
        <input
          id={id}
          type="text"
          className="form-control"
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
        />
      </div>
    );
  };

  return (
    <Modal
      open={Boolean(kind)}
      onClose={onClose}
      title={`${editing ? 'Edit' : 'Add'} ${kind}`}
      subtitle={editing ? entity?.name || entity?.title || 'Update details' : `Create a new ${kind}`}
      icon={Icon}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="entity-form" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <>
                <Save size={15} className="me-1" /> {editing ? 'Save changes' : 'Create'}
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
      <form id="entity-form" onSubmit={handleSubmit} noValidate>
        {FIELDS[kind].map(renderControl)}

        <div className="mb-2">
          <label className="form-label" htmlFor={`org-${kind}-isActive`}>
            Status
          </label>
          <select
            id={`org-${kind}-isActive`}
            className="form-select"
            value={current.isActive ? 'true' : 'false'}
            onChange={(e) => handleChange('isActive', e.target.value === 'true')}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}