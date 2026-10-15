import { useEffect, useMemo, useState } from 'react';
import { Save, Wallet } from 'lucide-react';
import Modal from '../Modal';
import {
  PAYROLL_DEDUCTIONS,
  PAYROLL_EARNINGS,
  formatCurrency,
  toISODate,
} from '../../utils/constants';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const buildForm = (structure) => {
  const form = {};
  [...PAYROLL_EARNINGS, ...PAYROLL_DEDUCTIONS].forEach(({ key }) => {
    form[key] = structure?.[key] ?? 0;
  });
  form.effectiveFrom = structure?.effectiveFrom
    ? toISODate(new Date(structure.effectiveFrom))
    : toISODate();
  form.isActive = structure?.isActive ?? true;
  return form;
};

export default function SalaryStructureModal({ open, employee, structure, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => buildForm(structure));

  useEffect(() => {
    if (open) setForm(buildForm(structure));
  }, [open, structure]);

  const totals = useMemo(() => {
    const gross = ['basic', 'hra', 'conveyance', 'specialAllowance'].reduce(
      (sum, key) => sum + toNumber(form[key]),
      0
    );
    const deductions = PAYROLL_DEDUCTIONS.reduce((sum, { key }) => sum + toNumber(form[key]), 0);
    return { gross, deductions, net: gross - deductions, annual: gross * 12 };
  }, [form]);

  const change = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const payload = {};
    [...PAYROLL_EARNINGS, ...PAYROLL_DEDUCTIONS].forEach(({ key }) => {
      payload[key] = toNumber(form[key]);
    });
    payload.effectiveFrom = form.effectiveFrom;
    payload.isActive = form.isActive;
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Employee salary structure"
      subtitle={employee ? `${employee.firstName} ${employee.lastName} · ${employee.employeeId || ''}` : ''}
      icon={Wallet}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>
            <Save size={14} className="me-1" /> {saving ? 'Saving...' : 'Save structure'}
          </button>
        </div>
      }
    >
      <div className="row g-3">
        <div className="col-md-6">
          <h4 className="payroll-form__title">Earnings (monthly)</h4>
          {PAYROLL_EARNINGS.map(({ key, label }) => (
            <div className="payroll-form__row" key={key}>
              <label htmlFor={`structure-earning-${key}`}>{label}</label>
              <input
                id={`structure-earning-${key}`}
                type="number"
                min="0"
                className="form-control form-control-sm"
                value={form[key]}
                onChange={(event) => change(key, event.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="col-md-6">
          <h4 className="payroll-form__title">Deductions (monthly)</h4>
          {PAYROLL_DEDUCTIONS.map(({ key, label }) => (
            <div className="payroll-form__row" key={key}>
              <label htmlFor={`structure-deduction-${key}`}>{label}</label>
              <input
                id={`structure-deduction-${key}`}
                type="number"
                min="0"
                className="form-control form-control-sm"
                value={form[key]}
                onChange={(event) => change(key, event.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-md-6">
          <label className="form-label" htmlFor="structure-effective">
            Effective from
          </label>
          <input
            id="structure-effective"
            type="date"
            className="form-control form-control-sm"
            value={form.effectiveFrom}
            onChange={(event) => change('effectiveFrom', event.target.value)}
          />
        </div>
        <div className="col-md-6 d-flex align-items-end">
          <div className="form-check">
            <input
              id="structure-active"
              type="checkbox"
              className="form-check-input"
              checked={form.isActive}
              onChange={(event) => change('isActive', event.target.checked)}
            />
            <label className="form-check-label" htmlFor="structure-active">
              Active structure
            </label>
          </div>
        </div>
      </div>

      <div className="payroll-form__summary">
        <div>
          <span>Monthly gross</span>
          <strong>{formatCurrency(totals.gross)}</strong>
        </div>
        <div>
          <span>Monthly net</span>
          <strong>{formatCurrency(totals.net)}</strong>
        </div>
        <div>
          <span>Annual CTC</span>
          <strong>{formatCurrency(totals.annual)}</strong>
        </div>
      </div>
    </Modal>
  );
}
