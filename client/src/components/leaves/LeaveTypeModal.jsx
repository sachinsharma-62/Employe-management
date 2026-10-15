import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Modal from '../Modal';
import leaveApi from '../../api/leave.api';
import { ALL_ROLES, DEPARTMENTS, LEAVE_TYPES, ROLE_LABELS, leaveTypeLabel } from '../../utils/constants';

const COLORS = ['indigo', 'green', 'amber', 'cyan', 'purple', 'secondary'];

const emptyForm = {
  code: 'CASUAL',
  name: '',
  description: '',
  totalDays: 0,
  carryForward: false,
  carryForwardLimit: 0,
  encashable: false,
  applicableScope: 'ALL',
  applicableRoles: [],
  applicableDepartments: [],
  applicableEmployees: [],
  color: 'indigo',
  isActive: true,
};

export default function LeaveTypeModal({ open, initial, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');

  const editing = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        ...emptyForm,
        ...initial,
        applicableRoles: initial.applicableRoles || [],
        applicableDepartments: initial.applicableDepartments || [],
        applicableEmployees: (initial.applicableEmployees || []).map(String),
      });
    } else {
      setForm({ ...emptyForm });
    }
    setError('');
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    leaveApi
      .balances({})
      .then((res) => {
        if (!active) return;
        setEmployees(
          (res.data.employees || []).map((row) => ({
            id: String(row.employee._id),
            name: `${row.employee.firstName} ${row.employee.lastName}`,
            department: row.employee.department,
          }))
        );
      })
      .catch(() => {
        if (active) setEmployees([]);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleIn = (field, value) =>
    setForm((prev) => {
      const list = prev[field];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...prev, [field]: next };
    });

  const availableCodes = useMemo(
    () => LEAVE_TYPES.map((type) => type.value),
    []
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!editing && !availableCodes.includes(form.code)) {
      setError('Please choose a valid leave code.');
      return;
    }
    if (!form.name.trim()) {
      setError('Leave name is required.');
      return;
    }
    if (Number(form.totalDays) < 0) {
      setError('Total days cannot be negative.');
      return;
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      totalDays: Number(form.totalDays) || 0,
      carryForwardLimit: form.carryForward ? Number(form.carryForwardLimit) || 0 : 0,
    };
    if (editing) delete payload.code;
    onSubmit(payload, initial?._id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit leave type' : 'New leave type'}
      subtitle="Configure entitlement, carry forward, encashment and applicability"
      icon={SlidersHorizontal}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="leave-type-form" className="btn btn-primary" disabled={saving}>
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
      <form id="leave-type-form" onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label" htmlFor="lt-code">
              Leave code <span className="text-danger">*</span>
            </label>
            <select
              id="lt-code"
              className="form-select"
              value={form.code}
              disabled={editing}
              onChange={(event) => {
                const code = event.target.value;
                update({ code, name: leaveTypeLabel(code) });
              }}
            >
              {LEAVE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.value}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <label className="form-label" htmlFor="lt-name">
              Leave name <span className="text-danger">*</span>
            </label>
            <input
              id="lt-name"
              className="form-control"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="lt-color">
              Colour
            </label>
            <select
              id="lt-color"
              className="form-select"
              value={form.color}
              onChange={(event) => update({ color: event.target.value })}
            >
              {COLORS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="lt-desc">
              Description
            </label>
            <input
              id="lt-desc"
              className="form-control"
              maxLength={300}
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
            />
          </div>
        </div>

        <div className="form-section mt-4">
          <p className="form-section__title">Entitlement</p>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label" htmlFor="lt-total">
                Total yearly days
              </label>
              <input
                id="lt-total"
                type="number"
                min="0"
                max="366"
                className="form-control"
                value={form.totalDays}
                onChange={(event) => update({ totalDays: event.target.value })}
              />
              <small className="leave-hint d-block">0 means no yearly limit.</small>
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="lt-cf-limit">
                Carry forward limit
              </label>
              <input
                id="lt-cf-limit"
                type="number"
                min="0"
                max="366"
                className="form-control"
                disabled={!form.carryForward}
                value={form.carryForwardLimit}
                onChange={(event) => update({ carryForwardLimit: event.target.value })}
              />
              <small className="leave-hint d-block">0 means carry all unused days.</small>
            </div>
            <div className="col-md-4">
              <div className="leave-switch-row">
                <label className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={form.carryForward}
                    onChange={(event) => update({ carryForward: event.target.checked })}
                  />
                  <span className="form-check-label">Carry forward</span>
                </label>
                <label className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={form.encashable}
                    onChange={(event) => update({ encashable: event.target.checked })}
                  />
                  <span className="form-check-label">Encashment</span>
                </label>
                <label className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={form.isActive}
                    onChange={(event) => update({ isActive: event.target.checked })}
                  />
                  <span className="form-check-label">Active</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section mt-4">
          <p className="form-section__title">Applicable employees</p>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="lt-scope">
                Applies to
              </label>
              <select
                id="lt-scope"
                className="form-select"
                value={form.applicableScope}
                onChange={(event) =>
                  update({
                    applicableScope: event.target.value,
                    applicableRoles: [],
                    applicableDepartments: [],
                    applicableEmployees: [],
                  })
                }
              >
                <option value="ALL">All employees</option>
                <option value="ROLES">Specific roles</option>
                <option value="DEPARTMENTS">Specific departments</option>
                <option value="EMPLOYEES">Specific employees</option>
              </select>
            </div>

            {form.applicableScope === 'ROLES' && (
              <div className="col-md-8">
                <label className="form-label">Roles</label>
                <div className="leave-check-grid">
                  {ALL_ROLES.map((role) => (
                    <label className="form-check" key={role}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={form.applicableRoles.includes(role)}
                        onChange={() => toggleIn('applicableRoles', role)}
                      />
                      <span className="form-check-label">{ROLE_LABELS[role] || role}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {form.applicableScope === 'DEPARTMENTS' && (
              <div className="col-md-8">
                <label className="form-label">Departments</label>
                <div className="leave-check-grid">
                  {DEPARTMENTS.map((department) => (
                    <label className="form-check" key={department}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={form.applicableDepartments.includes(department)}
                        onChange={() => toggleIn('applicableDepartments', department)}
                      />
                      <span className="form-check-label">{department}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {form.applicableScope === 'EMPLOYEES' && (
              <div className="col-md-8">
                <label className="form-label" htmlFor="lt-employees">
                  Employees
                </label>
                <select
                  id="lt-employees"
                  className="form-select leave-multi"
                  multiple
                  value={form.applicableEmployees}
                  onChange={(event) =>
                    update({
                      applicableEmployees: Array.from(event.target.selectedOptions, (o) => o.value),
                    })
                  }
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                      {employee.department ? ` · ${employee.department}` : ''}
                    </option>
                  ))}
                </select>
                <small className="leave-hint d-block">Hold Ctrl/Cmd to select multiple employees.</small>
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
