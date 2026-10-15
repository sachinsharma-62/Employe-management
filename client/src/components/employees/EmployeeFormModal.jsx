import { useEffect, useRef, useState } from 'react';
import { Camera, Save, UserPlus } from 'lucide-react';
import employeeApi from '../../api/employee.api';
import { useToast } from '../../context/ToastContext';
import Avatar from '../Avatar';
import Modal from '../Modal';
import {
  ALL_ROLES,
  BLOOD_GROUPS,
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  GENDERS,
  WORK_LOCATIONS,
  roleLabel,
} from '../../utils/constants';

const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const blankForm = {
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  email: '',
  personalEmail: '',
  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  employeeId: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  department: '',
  designation: '',
  manager: '',
  employmentType: 'FULL_TIME',
  workLocation: '',
  role: 'EMPLOYEE',
  isActive: 'true',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  emergencyContactEmail: '',
  emergencyContactAddress: '',
};

const fromEmployee = (employee) => ({
  ...blankForm,
  firstName: employee.firstName || '',
  lastName: employee.lastName || '',
  gender: employee.gender || '',
  dateOfBirth: toDateInput(employee.dateOfBirth),
  bloodGroup: employee.bloodGroup || '',
  email: employee.email || '',
  personalEmail: employee.personalEmail || '',
  phone: employee.phone || '',
  alternatePhone: employee.alternatePhone || '',
  address: employee.address || '',
  city: employee.city || '',
  state: employee.state || '',
  country: employee.country || '',
  pincode: employee.pincode || '',
  employeeId: employee.employeeId || '',
  joiningDate: toDateInput(employee.joiningDate),
  department: employee.department || '',
  designation: employee.designation || '',
  manager: employee.manager?._id || employee.manager || '',
  employmentType: employee.employmentType || 'FULL_TIME',
  workLocation: employee.workLocation || '',
  role: employee.role || 'EMPLOYEE',
  isActive: employee.isActive ? 'true' : 'false',
  emergencyContactName: employee.emergencyContact?.name || '',
  emergencyContactRelationship: employee.emergencyContact?.relationship || '',
  emergencyContactPhone: employee.emergencyContact?.phone || '',
  emergencyContactEmail: employee.emergencyContact?.email || '',
  emergencyContactAddress: employee.emergencyContact?.address || '',
});

function Field({ label, name, value, onChange, error, type = 'text', options, as = 'input', required, disabled, placeholder, max }) {
  return (
    <div className="col-12 col-sm-6">
      <label className="form-label" htmlFor={`emp-${name}`}>
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {as === 'select' ? (
        <select
          id={`emp-${name}`}
          name={name}
          className={`form-select ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          id={`emp-${name}`}
          name={name}
          rows={2}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={`emp-${name}`}
          name={name}
          type={type}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={onChange}
          max={max}
          placeholder={placeholder}
        />
      )}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

const toOptions = (list) =>
  list.map((v) => (typeof v === 'string' ? { value: v, label: v } : v));

export default function EmployeeFormModal({
  open,
  employee,
  meta,
  canAssignRole,
  selfId,
  onClose,
  onSaved,
}) {
  const toast = useToast();
  const fileRef = useRef(null);
  const isEdit = Boolean(employee);

  const [form, setForm] = useState(blankForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(employee ? fromEmployee(employee) : blankForm);
    setFile(null);
    setPreview('');
    setErrors({});
    setFormError('');
  }, [open, employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setFormError('');
  };

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) {
      setFormError('Only PNG, JPG or WEBP images are allowed');
      return;
    }
    if (selected.size > 2 * 1024 * 1024) {
      setFormError('Image must be smaller than 2 MB');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');

    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email';
    if (form.personalEmail && !/^\S+@\S+\.\S+$/.test(form.personalEmail.trim())) {
      next.personalEmail = 'Enter a valid email';
    }
    if (Object.keys(next).length) {
      setErrors(next);
      setFormError('Please correct the highlighted fields.');
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (canAssignRole) data.append('role', form.role);
    if (file) data.append('avatar', file);

    setSaving(true);
    try {
      const res = isEdit
        ? await employeeApi.update(employee._id, data)
        : await employeeApi.create(data);
      if (res.data.temporaryPassword) {
        toast.success(`Employee created. Temporary password: ${res.data.temporaryPassword}`);
      } else {
        toast.success(res.data.message || 'Employee saved');
      }
      onSaved(res.data.employee);
    } catch (err) {
      if (err.status === 422 && err.errors) {
        const mapped = {};
        err.errors.forEach((item) => {
          mapped[item.field] = item.message;
        });
        setErrors(mapped);
        setFormError('Please correct the highlighted fields.');
      } else {
        setFormError(err.message || 'Could not save employee');
      }
    } finally {
      setSaving(false);
    }
  };

  const displayUser = preview ? { ...employee, avatar: '' } : employee;
  const managerOptions = (meta?.managers || [])
    .filter((m) => m._id !== (employee?._id || selfId))
    .map((m) => ({
      value: m._id,
      label: `${m.fullName || `${m.firstName} ${m.lastName}`}${m.designation ? ` · ${m.designation}` : ''}`,
    }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Employee' : 'Add Employee'}
      subtitle={isEdit ? employee?.fullName : 'Create a new employee record'}
      icon={UserPlus}
      size="xl"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="employee-form"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="me-1" /> {isEdit ? 'Save changes' : 'Create employee'}
              </>
            )}
          </button>
        </div>
      }
    >
      {formError && (
        <div className="alert alert-danger py-2" role="alert">
          {formError}
        </div>
      )}

      <form id="employee-form" onSubmit={handleSubmit} noValidate>
        <section className="form-section">
          <h4 className="form-section__title">Personal Information</h4>
          <div className="row g-3">
            <div className="col-12 col-sm-6 order-sm-last">
              <div className="employee-photo">
                {preview ? (
                  <img src={preview} alt="Preview" className="avatar avatar--lg" />
                ) : (
                  <Avatar user={displayUser || { firstName: form.firstName, lastName: form.lastName }} size={84} />
                )}
                <button
                  type="button"
                  className="profile-photo__btn"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera size={15} /> Upload photo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={handleFile}
                />
                <small className="text-muted">JPG, PNG or WEBP. Max 2 MB.</small>
              </div>
            </div>
            <Field label="First name" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} required />
            <Field label="Last name" name="lastName" value={form.lastName} onChange={handleChange} error={errors.lastName} required />
            <Field label="Gender" name="gender" value={form.gender} onChange={handleChange} error={errors.gender} as="select" options={toOptions(GENDERS)} />
            <Field label="Date of birth" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} error={errors.dateOfBirth} type="date" />
            <Field label="Blood group" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} error={errors.bloodGroup} as="select" options={toOptions(BLOOD_GROUPS)} />
          </div>
        </section>

        <section className="form-section">
          <h4 className="form-section__title">Contact Information</h4>
          <div className="row g-3">
            <Field label="Work email" name="email" value={form.email} onChange={handleChange} error={errors.email} type="email" required />
            <Field label="Personal email" name="personalEmail" value={form.personalEmail} onChange={handleChange} error={errors.personalEmail} type="email" />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+91 98765 43210" />
            <Field label="Alternate phone" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} error={errors.alternatePhone} />
            <Field label="City" name="city" value={form.city} onChange={handleChange} error={errors.city} />
            <Field label="State" name="state" value={form.state} onChange={handleChange} error={errors.state} />
            <Field label="Country" name="country" value={form.country} onChange={handleChange} error={errors.country} />
            <Field label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} error={errors.pincode} max={12} />
            <div className="col-12">
              <label className="form-label" htmlFor="emp-address">Address</label>
              <textarea
                id="emp-address"
                name="address"
                rows={2}
                className="form-control"
                value={form.address}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h4 className="form-section__title">Employment Information</h4>
          <div className="row g-3">
            <Field label="Employee ID" name="employeeId" value={form.employeeId} onChange={handleChange} error={errors.employeeId} placeholder="Auto-generated if empty" disabled={isEdit} />
            <Field label="Joining date" name="joiningDate" value={form.joiningDate} onChange={handleChange} error={errors.joiningDate} type="date" />
            <Field label="Department" name="department" value={form.department} onChange={handleChange} error={errors.department} as="select" options={toOptions(DEPARTMENTS)} />
            <Field label="Designation" name="designation" value={form.designation} onChange={handleChange} error={errors.designation} />
            <Field label="Manager" name="manager" value={form.manager} onChange={handleChange} error={errors.manager} as="select" options={managerOptions} />
            <Field label="Employment type" name="employmentType" value={form.employmentType} onChange={handleChange} error={errors.employmentType} as="select" options={EMPLOYMENT_TYPES} />
            <Field label="Work location" name="workLocation" value={form.workLocation} onChange={handleChange} error={errors.workLocation} as="select" options={toOptions(WORK_LOCATIONS)} />
            <Field label="Employee status" name="isActive" value={form.isActive} onChange={handleChange} as="select" options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
            <Field
              label="System role"
              name="role"
              value={form.role}
              onChange={handleChange}
              as="select"
              disabled={!canAssignRole}
              options={ALL_ROLES.map((r) => ({ value: r, label: roleLabel(r) }))}
            />
          </div>
        </section>

        <section className="form-section">
          <h4 className="form-section__title">Emergency Contact</h4>
          <div className="row g-3">
            <Field label="Contact name" name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} />
            <Field label="Relationship" name="emergencyContactRelationship" value={form.emergencyContactRelationship} onChange={handleChange} />
            <Field label="Phone" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} />
            <Field label="Email" name="emergencyContactEmail" value={form.emergencyContactEmail} onChange={handleChange} type="email" />
            <div className="col-12">
              <label className="form-label" htmlFor="emp-emergencyContactAddress">Address</label>
              <textarea
                id="emp-emergencyContactAddress"
                name="emergencyContactAddress"
                rows={2}
                className="form-control"
                value={form.emergencyContactAddress}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>
      </form>
    </Modal>
  );
}
